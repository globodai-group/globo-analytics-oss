"use client";

import { useState } from "react";
import { clientLogger } from "@/lib/client-logger";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Key, AlertCircle, Fingerprint } from "lucide-react";
import {
  startPasskeyRegistrationAction,
  completePasskeyRegistrationAction,
} from "@/lib/actions/tfa";
import { startRegistration } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/types";
import { toast } from "sonner";

interface PasskeySetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (recoveryCodes?: string[]) => void;
  locale: string;
}

type Step = "name" | "registering" | "error";

export function PasskeySetupDialog({
  open,
  onOpenChange,
  onComplete,
  locale,
}: PasskeySetupDialogProps) {
  const [step, setStep] = useState<Step>("name");
  const [passkeyName, setPasskeyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const t = {
    title: locale === "fr" ? "Ajouter une clé de sécurité" : "Add a Security Key",
    description:
      locale === "fr"
        ? "Utilisez Touch ID, Face ID, Windows Hello ou une clé de sécurité USB"
        : "Use Touch ID, Face ID, Windows Hello, or a USB security key",
    nameLabel: locale === "fr" ? "Nom de la clé (optionnel)" : "Key name (optional)",
    namePlaceholder: locale === "fr" ? "ex: MacBook Pro Touch ID" : "e.g., MacBook Pro Touch ID",
    nameHint:
      locale === "fr"
        ? "Donnez un nom à cette clé pour l'identifier facilement"
        : "Give this key a name to easily identify it",
    continue: locale === "fr" ? "Continuer" : "Continue",
    cancel: locale === "fr" ? "Annuler" : "Cancel",
    registering:
      locale === "fr"
        ? "Suivez les instructions de votre navigateur..."
        : "Follow your browser's instructions...",
    registeringHint:
      locale === "fr"
        ? "Utilisez votre empreinte digitale, reconnaissance faciale ou clé de sécurité"
        : "Use your fingerprint, face recognition, or security key",
    tryAgain: locale === "fr" ? "Réessayer" : "Try again",
    success: locale === "fr" ? "Clé ajoutée avec succès !" : "Key added successfully!",
  };

  async function handleOpen(isOpen: boolean) {
    if (isOpen) {
      setStep("name");
      setPasskeyName("");
      setError(null);
    }
    onOpenChange(isOpen);
  }

  async function handleStartRegistration() {
    setIsRegistering(true);
    setError(null);

    try {
      // Get registration options from the server
      const optionsResult = await startPasskeyRegistrationAction(locale);

      if (!optionsResult.success || !optionsResult.data) {
        throw new Error(optionsResult.error || "Failed to get registration options");
      }

      const { options, challenge } = optionsResult.data;

      setStep("registering");

      // Start the WebAuthn registration in the browser
      const registration = await startRegistration({
        optionsJSON: options as PublicKeyCredentialCreationOptionsJSON,
      });

      // Send the registration response to the server
      const verifyResult = await completePasskeyRegistrationAction(
        registration,
        challenge,
        passkeyName || "Passkey",
        locale
      );

      if (!verifyResult.success) {
        throw new Error(verifyResult.error || "Verification failed");
      }

      toast.success(t.success);
      onComplete(verifyResult.data?.recoveryCodes);
    } catch (err) {
      clientLogger.error("Passkey registration error:", err);
      setError(
        err instanceof Error
          ? err.message
          : locale === "fr"
            ? "Échec de l'enregistrement"
            : "Registration failed"
      );
      setStep("error");
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t.title}
          </DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        {step === "name" && (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="passkeyName">{t.nameLabel}</Label>
              <Input
                id="passkeyName"
                placeholder={t.namePlaceholder}
                value={passkeyName}
                onChange={(e) => setPasskeyName(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">{t.nameHint}</p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t.cancel}
              </Button>
              <Button onClick={handleStartRegistration} disabled={isRegistering}>
                {isRegistering && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t.continue}
              </Button>
            </div>
          </div>
        )}

        {step === "registering" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 animate-pulse">
              <Fingerprint className="h-10 w-10 text-primary" />
            </div>
            <p className="text-center font-medium">{t.registering}</p>
            <p className="text-center text-sm text-muted-foreground">{t.registeringHint}</p>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-4 pt-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t.cancel}
              </Button>
              <Button onClick={() => setStep("name")}>{t.tryAgain}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
