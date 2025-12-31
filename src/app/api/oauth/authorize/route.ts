import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");
    const redirectUri = searchParams.get("redirect_uri");
    const responseType = searchParams.get("response_type");
    const scope = searchParams.get("scope");
    const state = searchParams.get("state");

    // Validate required parameters
    if (!clientId) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "Missing client_id" },
        { status: 400 },
      );
    }

    if (!redirectUri) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "Missing redirect_uri" },
        { status: 400 },
      );
    }

    if (responseType !== "code") {
      return NextResponse.json(
        {
          error: "unsupported_response_type",
          error_description: "Only code response type is supported",
        },
        { status: 400 },
      );
    }

    // Find client
    const client = await prisma.oAuthClient.findUnique({
      where: { clientId },
    });

    if (!client || !client.isActive) {
      return NextResponse.json(
        {
          error: "invalid_client",
          error_description: "Client not found or inactive",
        },
        { status: 400 },
      );
    }

    // Validate redirect URI
    if (!client.redirectUris.includes(redirectUri)) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "Invalid redirect_uri" },
        { status: 400 },
      );
    }

    // Parse and validate scopes
    const requestedScopes = scope ? scope.split(" ") : [];
    const validScopes = requestedScopes.filter((s) =>
      client.scopes.includes(s),
    );

    if (requestedScopes.length > 0 && validScopes.length === 0) {
      return NextResponse.json(
        {
          error: "invalid_scope",
          error_description: "No valid scopes requested",
        },
        { status: 400 },
      );
    }

    // Redirect to authorization page
    const authUrl = new URL("/oauth/authorize", request.url);
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", validScopes.join(" "));
    if (state) {
      authUrl.searchParams.set("state", state);
    }

    return NextResponse.redirect(authUrl);
  } catch (error) {
    logError(error, { context: "oauth", operation: "authorize" });
    return NextResponse.json(
      { error: "server_error", error_description: "Internal server error" },
      { status: 500 },
    );
  }
}
