"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendReportNowAction } from "@/lib/actions/scheduled-reports";
import { toast } from "sonner";

interface ReportSendButtonProps {
  reportId: number;
  locale: string;
}

export function ReportSendButton({ reportId, locale }: ReportSendButtonProps) {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);

  async function handleSend() {
    setIsSending(true);
    const result = await sendReportNowAction(reportId, locale);

    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.error);
    }

    setIsSending(false);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleSend} disabled={isSending} className="gap-1">
      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      {locale === "fr" ? "Envoyer" : "Send"}
    </Button>
  );
}
