"use client";

import { useState } from "react";
import { clientLogger } from "@/lib/client-logger";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface OAuthAuthorizeFormProps {
  clientId: number;
  clientPublicId: string;
  redirectUri: string;
  scopes: string[];
  state?: string;
  locale: string;
}

export function OAuthAuthorizeForm({
  clientId,
  clientPublicId,
  redirectUri,
  scopes,
  state,
  locale,
}: OAuthAuthorizeFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthorize = async () => {
    setIsLoading(true);

    try {
      // Generate authorization code
      const response = await fetch("/api/oauth/authorize/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          redirectUri,
          scopes,
        }),
      });

      const data = await response.json();

      if (data.code) {
        // Redirect back to client with authorization code
        const url = new URL(redirectUri);
        url.searchParams.set("code", data.code);
        if (state) {
          url.searchParams.set("state", state);
        }
        window.location.href = url.toString();
      } else {
        clientLogger.error("Failed to get authorization code");
      }
    } catch (error) {
      clientLogger.error("Authorization error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeny = () => {
    // Redirect back to client with error
    const url = new URL(redirectUri);
    url.searchParams.set("error", "access_denied");
    url.searchParams.set("error_description", "User denied the request");
    if (state) {
      url.searchParams.set("state", state);
    }
    window.location.href = url.toString();
  };

  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        className="flex-1"
        onClick={handleDeny}
        disabled={isLoading}
      >
        {locale === "fr" ? "Refuser" : "Deny"}
      </Button>
      <Button className="flex-1" onClick={handleAuthorize} disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {locale === "fr" ? "Autoriser" : "Authorize"}
      </Button>
    </div>
  );
}
