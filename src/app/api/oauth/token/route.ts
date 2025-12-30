import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { logError } from "@/lib/logger";

// Token expiration times
const ACCESS_TOKEN_EXPIRY = 3600; // 1 hour in seconds
// Note: Refresh token expiry is managed by database/token cleanup cron

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type");
    let body: Record<string, string>;

    if (contentType?.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries()) as Record<string, string>;
    } else {
      body = await request.json();
    }

    const { grant_type, code, redirect_uri, client_id, client_secret, refresh_token } = body;

    if (!grant_type) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "Missing grant_type" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate client credentials
    if (!client_id || !client_secret) {
      return NextResponse.json(
        { error: "invalid_client", error_description: "Missing client credentials" },
        { status: 401, headers: corsHeaders }
      );
    }

    const client = await prisma.oAuthClient.findUnique({
      where: { clientId: client_id },
    });

    if (!client || !client.isActive) {
      return NextResponse.json(
        { error: "invalid_client", error_description: "Client not found or inactive" },
        { status: 401, headers: corsHeaders }
      );
    }

    const secretValid = await bcrypt.compare(client_secret, client.clientSecret);
    if (!secretValid) {
      return NextResponse.json(
        { error: "invalid_client", error_description: "Invalid client secret" },
        { status: 401, headers: corsHeaders }
      );
    }

    if (grant_type === "authorization_code") {
      return handleAuthorizationCode(client, code, redirect_uri);
    } else if (grant_type === "refresh_token") {
      return handleRefreshToken(client, refresh_token);
    } else {
      return NextResponse.json(
        { error: "unsupported_grant_type", error_description: "Unsupported grant type" },
        { status: 400, headers: corsHeaders }
      );
    }
  } catch (error) {
    logError(error, { context: "oauth", operation: "token" });
    return NextResponse.json(
      { error: "server_error", error_description: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

async function handleAuthorizationCode(
  client: { id: number; userId: string; redirectUris: string[] },
  code: string | undefined,
  redirectUri: string | undefined
) {
  if (!code) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing authorization code" },
      { status: 400, headers: corsHeaders }
    );
  }

  // SECURITY: Hash the code to look up in database
  // We store only hashes, never the actual codes
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");

  // Find the authorization code in the database
  const authCode = await prisma.oAuthAuthorizationCode.findUnique({
    where: { code: codeHash },
  });

  // SECURITY: Check if code exists
  if (!authCode) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Invalid authorization code" },
      { status: 400, headers: corsHeaders }
    );
  }

  // SECURITY: Check if code was already used (one-time use)
  if (authCode.usedAt) {
    // Code reuse detected - this could be an attack
    // Revoke all tokens for this authorization to prevent replay attacks
    await prisma.oAuthToken.deleteMany({
      where: { clientId: authCode.clientId, userId: authCode.userId },
    });
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Authorization code already used" },
      { status: 400, headers: corsHeaders }
    );
  }

  // Verify expiration
  if (new Date() > authCode.expiresAt) {
    await prisma.oAuthAuthorizationCode.delete({ where: { id: authCode.id } });
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Authorization code expired" },
      { status: 400, headers: corsHeaders }
    );
  }

  // Verify redirect URI matches
  if (redirectUri && redirectUri !== authCode.redirectUri) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Redirect URI mismatch" },
      { status: 400, headers: corsHeaders }
    );
  }

  // Verify client ID matches
  if (authCode.clientId !== client.id) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Client ID mismatch" },
      { status: 400, headers: corsHeaders }
    );
  }

  // SECURITY: Mark code as used (one-time use enforcement)
  await prisma.oAuthAuthorizationCode.update({
    where: { id: authCode.id },
    data: { usedAt: new Date() },
  });

  // Generate tokens
  const accessToken = `gra_${crypto.randomBytes(32).toString("hex")}`;
  const refreshToken = `grr_${crypto.randomBytes(32).toString("hex")}`;

  const accessTokenExpiry = new Date(Date.now() + ACCESS_TOKEN_EXPIRY * 1000);

  // Store tokens
  await prisma.oAuthToken.create({
    data: {
      clientId: client.id,
      userId: authCode.userId,
      accessToken,
      refreshToken,
      scopes: authCode.scopes,
      expiresAt: accessTokenExpiry,
    },
  });

  return NextResponse.json(
    {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: ACCESS_TOKEN_EXPIRY,
      refresh_token: refreshToken,
      scope: authCode.scopes.join(" "),
    },
    { headers: corsHeaders }
  );
}

async function handleRefreshToken(client: { id: number }, refreshToken: string | undefined) {
  if (!refreshToken) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing refresh token" },
      { status: 400, headers: corsHeaders }
    );
  }

  const token = await prisma.oAuthToken.findUnique({
    where: { refreshToken },
  });

  if (!token || token.clientId !== client.id) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Invalid refresh token" },
      { status: 400, headers: corsHeaders }
    );
  }

  // Generate new access token
  const newAccessToken = `gra_${crypto.randomBytes(32).toString("hex")}`;
  const newRefreshToken = `grr_${crypto.randomBytes(32).toString("hex")}`;
  const accessTokenExpiry = new Date(Date.now() + ACCESS_TOKEN_EXPIRY * 1000);

  // Update token
  await prisma.oAuthToken.update({
    where: { id: token.id },
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: accessTokenExpiry,
    },
  });

  return NextResponse.json(
    {
      access_token: newAccessToken,
      token_type: "Bearer",
      expires_in: ACCESS_TOKEN_EXPIRY,
      refresh_token: newRefreshToken,
      scope: token.scopes.join(" "),
    },
    { headers: corsHeaders }
  );
}
