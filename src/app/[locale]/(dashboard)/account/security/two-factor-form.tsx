"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, ShieldCheck } from "lucide-react";
import { toggle2FAAction } from "@/lib/actions/account";

interface TwoFactorFormProps {
  enabled: boolean;
  locale: string;
}

export function TwoFactorForm({ enabled, locale }: TwoFactorFormProps) {
  const t = useTranslations("account.security");
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [isLoading, setIsLoading] = useState(false);

  async function handleToggle(checked: boolean) {
    setIsLoading(true);
    try {
      const result = await toggle2FAAction(checked);

      if (result.success) {
        setIsEnabled(checked);
        toast.success(
          checked
            ? locale === "fr"
              ? "2FA activé"
              : "2FA enabled"
            : locale === "fr"
              ? "2FA désactivé"
              : "2FA disabled",
        );
      } else {
        toast.error(result.error || "Failed to update 2FA");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between max-w-md">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            isEnabled ? "bg-green-100 dark:bg-green-900" : "bg-muted"
          }`}
        >
          {isEnabled ? (
            <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
            <Shield className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div>
          <Label htmlFor="2fa-toggle" className="font-medium">
            {t("twoFactor")}
          </Label>
          <p className="text-sm text-muted-foreground">
            {isEnabled
              ? locale === "fr"
                ? "Votre compte est protégé par 2FA"
                : "Your account is protected with 2FA"
              : locale === "fr"
                ? "Ajoutez une couche de sécurité supplémentaire"
                : "Add an extra layer of security"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        <Switch
          id="2fa-toggle"
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
