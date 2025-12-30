import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import crypto from "crypto";
import { logError } from "@/lib/logger";

// Authorization code expiration (10 minutes)
const CODE_EXPIRY_MS = 10 * 60 * 1000;

/**
 * SECURITY: Generate a cryptographically secure authorization code
 * The code returned to the client is random bytes (hex encoded)
 * We store only the SHA256 hash in the database
 */
function generateAuthorizationCode(): { code: string; codeHash: string } {
  const codeBytes = crypto.randomBytes(32);
  const code = codeBytes.toString("hex");
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");
  return { code, codeHash };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, redirectUri, scopes } = body;

    if (!clientId || !redirectUri) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    // Verify client exists
    const client = await prisma.oAuthClient.findFirst({
      where: {
        id: clientId,
        isActive: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "invalid_client" }, { status: 400 });
    }

    // Verify redirect URI
    if (!client.redirectUris.includes(redirectUri)) {
      return NextResponse.json(
        { error: "invalid_redirect_uri" },
        { status: 400 },
      );
    }

    // Validate scopes
    const validScopes = (scopes || []).filter((s: string) =>
      client.scopes.includes(s),
    );

    // SECURITY: Generate cryptographically secure authorization code
    const { code, codeHash } = generateAuthorizationCode();

    // Store the hash in the database (one-time use)
    await prisma.oAuthAuthorizationCode.create({
      data: {
        code: codeHash,
        clientId: client.id,
        userId: session.user.id,
        redirectUri,
        scopes: validScopes,
        expiresAt: new Date(Date.now() + CODE_EXPIRY_MS),
      },
    });

    // Clean up expired codes (non-blocking)
    prisma.oAuthAuthorizationCode
      .deleteMany({
        where: { expiresAt: { lt: new Date() } },
      })
      .catch(() => {});

    return NextResponse.json({ code });
  } catch (error) {
    logError(error, { context: "oauth", operation: "grant" });
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
