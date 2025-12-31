"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface RecoveryCodesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codes: string[];
  locale: string;
}

export function RecoveryCodesDialog({
  open,
  onOpenChange,
  codes,
  locale,
}: RecoveryCodesDialogProps) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const t = {
    title: locale === "fr" ? "Codes de récupération" : "Recovery Codes",
    description:
      locale === "fr"
        ? "Sauvegardez ces codes dans un endroit sûr. Ils vous permettront d'accéder à votre compte si vous perdez vos appareils d'authentification."
        : "Save these codes in a safe place. They will allow you to access your account if you lose your authentication devices.",
    warning:
      locale === "fr"
        ? "Ces codes ne seront plus affichés. Assurez-vous de les sauvegarder maintenant !"
        : "These codes will not be shown again. Make sure to save them now!",
    copy: locale === "fr" ? "Copier tous les codes" : "Copy all codes",
    copied: locale === "fr" ? "Copié !" : "Copied!",
    download: locale === "fr" ? "Télécharger" : "Download",
    confirm:
      locale === "fr"
        ? "J'ai sauvegardé mes codes de récupération"
        : "I have saved my recovery codes",
    done: locale === "fr" ? "Terminé" : "Done",
  };

  function copyToClipboard() {
    const text = codes.join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t.copied);
  }

  function downloadCodes() {
    const text = `GloboAnalytics - Recovery Codes
========================

${codes.join("\n")}

Important: Keep these codes safe and secure.
Each code can only be used once.
`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "globorank-recovery-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleClose(isOpen: boolean) {
    if (!isOpen && !confirmed) {
      return; // Don't allow closing until confirmed
    }
    if (!isOpen) {
      setConfirmed(false);
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <Alert
          variant="destructive"
          className="bg-yellow-50 border-yellow-200 text-yellow-800"
        >
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {t.warning}
          </AlertDescription>
        </Alert>

        {/* Recovery Codes Grid */}
        <div className="grid grid-cols-2 gap-2 py-4">
          {codes.map((code, index) => (
            <div
              key={index}
              className="font-mono text-sm bg-muted px-3 py-2 rounded text-center"
            >
              {code}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={copyToClipboard}
          >
            {copied ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? t.copied : t.copy}
          </Button>
          <Button variant="outline" className="flex-1" onClick={downloadCodes}>
            <Download className="h-4 w-4 mr-2" />
            {t.download}
          </Button>
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-col">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">{t.confirm}</span>
          </label>
          <Button
            onClick={() => onOpenChange(false)}
            disabled={!confirmed}
            className="w-full"
          >
            {t.done}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
