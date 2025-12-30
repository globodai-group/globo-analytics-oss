"use client";

import { useState } from "react";
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
import { Loader2, Copy, Check, AlertCircle } from "lucide-react";
import { startTotpSetupAction, verifyTotpSetupAction } from "@/lib/actions/tfa";
import { toast } from "sonner";
import Image from "next/image";

interface TotpSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (recoveryCodes?: string[]) => void;
  locale: string;
}

type Step = "loading" | "scan" | "verify";

export function TotpSetupDialog({ open, onOpenChange, onComplete, locale }: TotpSetupDialogProps) {
  const [step, setStep] = useState<Step>("loading");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const t = {
    title: locale === "fr" ? "Configurer l'authentification TOTP" : "Set up TOTP Authentication",
    description:
      locale === "fr"
        ? "Scannez ce QR code avec votre application d'authentification"
        : "Scan this QR code with your authenticator app",
    step1:
      locale === "fr"
        ? "1. Téléchargez une application d'authentification comme Google Authenticator, Authy ou Microsoft Authenticator"
        : "1. Download an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator",
    step2:
      locale === "fr"
        ? "2. Scannez le QR code ci-dessous avec votre application"
        : "2. Scan the QR code below with your app",
    step3:
      locale === "fr"
        ? "3. Entrez le code à 6 chiffres affiché dans l'application"
        : "3. Enter the 6-digit code shown in the app",
    cantScan:
      locale === "fr"
        ? "Impossible de scanner ? Entrez cette clé manuellement :"
        : "Can't scan? Enter this key manually:",
    copySecret: locale === "fr" ? "Copier la clé" : "Copy key",
    copied: locale === "fr" ? "Copié !" : "Copied!",
    verificationCode: locale === "fr" ? "Code de vérification" : "Verification code",
    verificationCodePlaceholder: "000000",
    verify: locale === "fr" ? "Vérifier" : "Verify",
    cancel: locale === "fr" ? "Annuler" : "Cancel",
    continue: locale === "fr" ? "Continuer" : "Continue",
    loading: locale === "fr" ? "Chargement..." : "Loading...",
  };

  async function handleOpen(isOpen: boolean) {
    if (isOpen) {
      setStep("loading");
      setCode("");
      setError(null);

      const result = await startTotpSetupAction(locale);

      if (result.success && result.data) {
        setQrCode(result.data.qrCode);
        setSecret(result.data.secret);
        setRecoveryCodes(result.data.recoveryCodes);
        setStep("scan");
      } else {
        setError(result.error || "Failed to start setup");
        toast.error(result.error);
        onOpenChange(false);
      }
    }
    onOpenChange(isOpen);
  }

  async function handleVerify() {
    if (code.length !== 6) {
      setError(locale === "fr" ? "Le code doit contenir 6 chiffres" : "Code must be 6 digits");
      return;
    }

    setIsVerifying(true);
    setError(null);

    const result = await verifyTotpSetupAction(code, locale);

    setIsVerifying(false);

    if (result.success) {
      toast.success(
        locale === "fr" ? "Authentification TOTP activée !" : "TOTP authentication enabled!"
      );
      onComplete(recoveryCodes);
    } else {
      setError(result.error || "Verification failed");
    }
  }

  function copySecret() {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        {step === "loading" && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">{t.loading}</span>
          </div>
        )}

        {step === "scan" && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>{t.step1}</p>
              <p>{t.step2}</p>
              <p>{t.step3}</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center py-4">
              {qrCode && (
                <Image src={qrCode} alt="QR Code" width={200} height={200} className="rounded-lg" />
              )}
            </div>

            {/* Manual entry */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t.cantScan}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
                  {secret}
                </code>
                <Button variant="outline" size="sm" onClick={copySecret}>
                  {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Verification code input */}
            <div className="space-y-2">
              <Label htmlFor="code">{t.verificationCode}</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder={t.verificationCodePlaceholder}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-widest"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t.cancel}
              </Button>
              <Button onClick={handleVerify} disabled={isVerifying || code.length !== 6}>
                {isVerifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t.verify}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
