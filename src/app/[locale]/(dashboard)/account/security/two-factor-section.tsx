"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Shield, Smartphone, Key, Check, Plus, RefreshCw, Copy, AlertTriangle } from "lucide-react";
import { TotpSetupDialog } from "./totp-setup-dialog";
import { PasskeySetupDialog } from "./passkey-setup-dialog";
import { PasskeyList } from "./passkey-list";
import { RecoveryCodesDialog } from "./recovery-codes-dialog";
import {
  disableTotpAction,
  setDefault2FAMethodAction,
  regenerateRecoveryCodesAction,
} from "@/lib/actions/tfa";
import { toast } from "sonner";

interface TwoFactorSectionProps {
  enabled: boolean;
  defaultMethod: string | null;
  totpEnabled: boolean;
  passkeyCount: number;
  recoveryCodesCount: number;
  locale: string;
}

export function TwoFactorSection({
  enabled,
  defaultMethod,
  totpEnabled,
  passkeyCount,
  recoveryCodesCount,
  locale,
}: TwoFactorSectionProps) {
  const router = useRouter();
  const [showMethodDialog, setShowMethodDialog] = useState(false);
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [showPasskeySetup, setShowPasskeySetup] = useState(false);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [isDisablingTotp, setIsDisablingTotp] = useState(false);
  const [isRegeneratingCodes, setIsRegeneratingCodes] = useState(false);
  const [newRecoveryCodes, setNewRecoveryCodes] = useState<string[]>([]);

  const t = {
    twoFactor: locale === "fr" ? "Authentification à deux facteurs" : "Two-Factor Authentication",
    twoFactorDescription:
      locale === "fr"
        ? "Ajoutez une couche de sécurité supplémentaire à votre compte"
        : "Add an extra layer of security to your account",
    enabled: locale === "fr" ? "Activé" : "Enabled",
    disabled: locale === "fr" ? "Désactivé" : "Disabled",
    default: locale === "fr" ? "Par défaut" : "Default",
    setupMethod: locale === "fr" ? "Configurer une méthode" : "Set up a method",
    authenticatorApp: locale === "fr" ? "Application d'authentification" : "Authenticator App",
    authenticatorAppDesc:
      locale === "fr"
        ? "Utilisez Google Authenticator, Authy ou une autre application"
        : "Use Google Authenticator, Authy, or another app",
    passkey: locale === "fr" ? "Clé de sécurité / Passkey" : "Security Key / Passkey",
    passkeyDesc:
      locale === "fr"
        ? "Utilisez Touch ID, Face ID, Windows Hello ou une clé de sécurité USB"
        : "Use Touch ID, Face ID, Windows Hello, or a USB security key",
    recoveryCodes: locale === "fr" ? "Codes de récupération" : "Recovery Codes",
    recoveryCodesDesc:
      locale === "fr"
        ? "Codes de secours pour accéder à votre compte si vous perdez vos appareils"
        : "Backup codes to access your account if you lose your devices",
    codesRemaining: locale === "fr" ? "codes restants" : "codes remaining",
    viewCodes: locale === "fr" ? "Voir les codes" : "View codes",
    regenerateCodes: locale === "fr" ? "Régénérer" : "Regenerate",
    configure: locale === "fr" ? "Configurer" : "Configure",
    disable: locale === "fr" ? "Désactiver" : "Disable",
    setAsDefault: locale === "fr" ? "Définir par défaut" : "Set as default",
    addPasskey: locale === "fr" ? "Ajouter une clé" : "Add a key",
    chooseMethod: locale === "fr" ? "Choisir une méthode" : "Choose a method",
    chooseMethodDesc:
      locale === "fr"
        ? "Sélectionnez comment vous souhaitez sécuriser votre compte"
        : "Select how you want to secure your account",
    passkeyCount:
      locale === "fr"
        ? `${passkeyCount} clé${passkeyCount > 1 ? "s" : ""} configurée${passkeyCount > 1 ? "s" : ""}`
        : `${passkeyCount} key${passkeyCount > 1 ? "s" : ""} configured`,
    warning: locale === "fr" ? "Attention" : "Warning",
    lowRecoveryCodes:
      locale === "fr"
        ? "Il vous reste peu de codes de récupération. Pensez à en régénérer."
        : "You have few recovery codes left. Consider regenerating them.",
  };

  async function handleDisableTotp() {
    setIsDisablingTotp(true);
    const result = await disableTotpAction(locale);
    setIsDisablingTotp(false);

    if (result.success) {
      toast.success(locale === "fr" ? "TOTP désactivé" : "TOTP disabled");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleSetDefaultMethod(method: "totp" | "passkey") {
    const result = await setDefault2FAMethodAction(method, locale);

    if (result.success) {
      toast.success(locale === "fr" ? "Méthode par défaut mise à jour" : "Default method updated");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleRegenerateRecoveryCodes() {
    setIsRegeneratingCodes(true);
    const result = await regenerateRecoveryCodesAction(locale);
    setIsRegeneratingCodes(false);

    if (result.success && result.data?.recoveryCodes) {
      setNewRecoveryCodes(result.data.recoveryCodes);
      setShowRecoveryCodes(true);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  function handleTotpSetupComplete(codes?: string[]) {
    setShowTotpSetup(false);
    if (codes && codes.length > 0) {
      setNewRecoveryCodes(codes);
      setShowRecoveryCodes(true);
    }
    router.refresh();
  }

  function handlePasskeySetupComplete(codes?: string[]) {
    setShowPasskeySetup(false);
    if (codes && codes.length > 0) {
      setNewRecoveryCodes(codes);
      setShowRecoveryCodes(true);
    }
    router.refresh();
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>{t.twoFactor}</CardTitle>
                <CardDescription>{t.twoFactorDescription}</CardDescription>
              </div>
            </div>
            <Badge variant={enabled ? "default" : "secondary"}>
              {enabled ? t.enabled : t.disabled}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Authenticator App */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{t.authenticatorApp}</p>
                  {totpEnabled && (
                    <Badge variant="outline" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      {t.enabled}
                    </Badge>
                  )}
                  {totpEnabled && defaultMethod === "totp" && (
                    <Badge variant="default" className="text-xs">
                      {t.default}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{t.authenticatorAppDesc}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {totpEnabled ? (
                <>
                  {defaultMethod !== "totp" && passkeyCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefaultMethod("totp")}
                    >
                      {t.setAsDefault}
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDisableTotp}
                    disabled={isDisablingTotp}
                  >
                    {t.disable}
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setShowTotpSetup(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t.configure}
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Passkeys */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{t.passkey}</p>
                  {passkeyCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      {t.passkeyCount}
                    </Badge>
                  )}
                  {passkeyCount > 0 && defaultMethod === "passkey" && (
                    <Badge variant="default" className="text-xs">
                      {t.default}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{t.passkeyDesc}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {passkeyCount > 0 && defaultMethod !== "passkey" && totpEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetDefaultMethod("passkey")}
                >
                  {t.setAsDefault}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowPasskeySetup(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t.addPasskey}
              </Button>
            </div>
          </div>

          {/* Passkey List */}
          {passkeyCount > 0 && (
            <div className="ml-13 pl-13">
              <PasskeyList locale={locale} />
            </div>
          )}

          {enabled && (
            <>
              <Separator />

              {/* Recovery Codes */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Copy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{t.recoveryCodes}</p>
                    <p className="text-sm text-muted-foreground">{t.recoveryCodesDesc}</p>
                    <p className="text-sm font-medium mt-1">
                      {recoveryCodesCount} {t.codesRemaining}
                    </p>
                    {recoveryCodesCount <= 2 && recoveryCodesCount > 0 && (
                      <div className="flex items-center gap-2 mt-2 text-yellow-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">{t.lowRecoveryCodes}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateRecoveryCodes}
                    disabled={isRegeneratingCodes}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${isRegeneratingCodes ? "animate-spin" : ""}`}
                    />
                    {t.regenerateCodes}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Add Method Button (if no methods configured) */}
          {!enabled && (
            <div className="flex justify-center pt-4">
              <Button onClick={() => setShowMethodDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t.setupMethod}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Method Selection Dialog */}
      <Dialog open={showMethodDialog} onOpenChange={setShowMethodDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.chooseMethod}</DialogTitle>
            <DialogDescription>{t.chooseMethodDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <button
              className="w-full flex items-center gap-4 p-4 rounded-lg border hover:bg-muted transition-colors text-left"
              onClick={() => {
                setShowMethodDialog(false);
                setShowTotpSetup(true);
              }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{t.authenticatorApp}</p>
                <p className="text-sm text-muted-foreground">{t.authenticatorAppDesc}</p>
              </div>
            </button>
            <button
              className="w-full flex items-center gap-4 p-4 rounded-lg border hover:bg-muted transition-colors text-left"
              onClick={() => {
                setShowMethodDialog(false);
                setShowPasskeySetup(true);
              }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{t.passkey}</p>
                <p className="text-sm text-muted-foreground">{t.passkeyDesc}</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* TOTP Setup Dialog */}
      <TotpSetupDialog
        open={showTotpSetup}
        onOpenChange={setShowTotpSetup}
        onComplete={handleTotpSetupComplete}
        locale={locale}
      />

      {/* Passkey Setup Dialog */}
      <PasskeySetupDialog
        open={showPasskeySetup}
        onOpenChange={setShowPasskeySetup}
        onComplete={handlePasskeySetupComplete}
        locale={locale}
      />

      {/* Recovery Codes Dialog */}
      <RecoveryCodesDialog
        open={showRecoveryCodes}
        onOpenChange={setShowRecoveryCodes}
        codes={newRecoveryCodes}
        locale={locale}
      />
    </>
  );
}
