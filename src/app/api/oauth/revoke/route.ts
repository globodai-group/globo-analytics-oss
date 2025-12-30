import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logError } from "@/lib/logger";

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

    const { token, token_type_hint, client_id, client_secret } = body;

    if (!token) {
      // RFC 7009: Return 200 even if token is missing
      return new NextResponse(null, { status: 200, headers: corsHeaders });
    }

    // Validate client credentials if provided
    if (client_id && client_secret) {
      const client = await prisma.oAuthClient.findUnique({
        where: { clientId: client_id },
      });

      if (!client || !client.isActive) {
        return NextResponse.json(
          { error: "invalid_client" },
          { status: 401, headers: corsHeaders }
        );
      }

      const secretValid = await bcrypt.compare(client_secret, client.clientSecret);
      if (!secretValid) {
        return NextResponse.json(
          { error: "invalid_client" },
          { status: 401, headers: corsHeaders }
        );
      }
    }

    // Try to find and delete the token
    if (token_type_hint === "refresh_token" || !token_type_hint) {
      const refreshResult = await prisma.oAuthToken.deleteMany({
        where: { refreshToken: token },
      });

      if (refreshResult.count > 0) {
        return new NextResponse(null, { status: 200, headers: corsHeaders });
      }
    }

    if (token_type_hint === "access_token" || !token_type_hint) {
      const accessResult = await prisma.oAuthToken.deleteMany({
        where: { accessToken: token },
      });

      if (accessResult.count > 0) {
        return new NextResponse(null, { status: 200, headers: corsHeaders });
      }
    }

    // RFC 7009: Return 200 even if token not found (might already be revoked)
    return new NextResponse(null, { status: 200, headers: corsHeaders });
  } catch (error) {
    logError(error, { context: "oauth", operation: "revoke" });
    return NextResponse.json({ error: "server_error" }, { status: 500, headers: corsHeaders });
  }
}
