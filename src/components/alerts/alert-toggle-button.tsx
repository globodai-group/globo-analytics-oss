"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Power, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleAlertAction } from "@/lib/actions/alerts";
import { toast } from "sonner";

interface AlertToggleButtonProps {
  alertId: number;
  isActive: boolean;
  locale: string;
}

export function AlertToggleButton({
  alertId,
  isActive,
  locale,
}: AlertToggleButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleToggle() {
    setIsLoading(true);
    const result = await toggleAlertAction(alertId, locale);

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
      size="icon"
      onClick={handleToggle}
      disabled={isLoading}
      className={isActive ? "text-primary" : "text-muted-foreground"}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Power className="h-4 w-4" />
      )}
    </Button>
  );
}
