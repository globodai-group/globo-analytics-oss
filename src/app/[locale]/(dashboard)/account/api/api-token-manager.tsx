"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, RefreshCw, Loader2, AlertTriangle, Check } from "lucide-react";
import { regenerateApiTokenAction } from "@/lib/actions/account";

interface ApiTokenManagerProps {
  hasToken: boolean;
  locale: string;
}

export function ApiTokenManager({ hasToken, locale }: ApiTokenManagerProps) {
  const t = useTranslations("account.api");
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleRegenerate() {
    setIsLoading(true);
    try {
      const result = await regenerateApiTokenAction();

      if (result.success && result.token) {
        setToken(result.token);
        toast.success(
          locale === "fr" ? "Token généré avec succès" : "Token generated successfully"
        );
      } else {
        toast.error(result.error || "Failed to generate token");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!token) return;

    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      {/* Warning */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{t("regenerateWarning")}</AlertDescription>
      </Alert>

      {/* Token Display */}
      {token && (
        <div className="space-y-2">
          <Label>{t("token")}</Label>
          <div className="flex gap-2">
            <Input value={token} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {locale === "fr"
              ? "Copiez ce token maintenant. Il ne sera plus visible après."
              : "Copy this token now. It won't be visible again."}
          </p>
        </div>
      )}

      {/* Status */}
      {!token && (
        <div className="text-sm text-muted-foreground">
          {hasToken ? (
            <p>
              {locale === "fr"
                ? "Vous avez déjà un token API. Régénérez-le si nécessaire."
                : "You already have an API token. Regenerate it if needed."}
            </p>
          ) : (
            <p>
              {locale === "fr"
                ? "Vous n'avez pas encore de token API."
                : "You don't have an API token yet."}
            </p>
          )}
        </div>
      )}

      {/* Generate/Regenerate Button */}
      <Button onClick={handleRegenerate} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        {hasToken ? t("generateNew") : locale === "fr" ? "Générer un token" : "Generate token"}
      </Button>
    </div>
  );
}
