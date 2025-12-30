"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface TrackingCodeCopyProps {
  code: string;
}

export function TrackingCodeCopy({ code }: TrackingCodeCopyProps) {
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(locale === "fr" ? "Code copié !" : "Code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(
        locale === "fr" ? "Erreur lors de la copie" : "Error copying code",
      );
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm">
          <code>{code}</code>
        </pre>
      </div>
      <Button onClick={handleCopy} variant="outline" className="w-full">
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            {locale === "fr" ? "Copié !" : "Copied!"}
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 mr-2" />
            {locale === "fr" ? "Copier le code" : "Copy code"}
          </>
        )}
      </Button>
    </div>
  );
}
