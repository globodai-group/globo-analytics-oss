"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Power, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleReportAction } from "@/lib/actions/scheduled-reports";
import { toast } from "sonner";

interface ReportToggleButtonProps {
  reportId: number;
  isActive: boolean;
  locale: string;
}

export function ReportToggleButton({ reportId, isActive, locale }: ReportToggleButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleToggle() {
    setIsLoading(true);
    const result = await toggleReportAction(reportId, locale);

    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.error);
    }

    setIsLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className={isActive ? "text-primary" : "text-muted-foreground"}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
    </Button>
  );
}
