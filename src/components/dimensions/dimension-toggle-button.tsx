"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleCustomDimensionActiveAction } from "@/lib/actions/custom-dimensions";
import { toast } from "sonner";

interface DimensionToggleButtonProps {
  dimensionId: number;
  isActive: boolean;
}

export function DimensionToggleButton({
  dimensionId,
  isActive,
}: DimensionToggleButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleToggle() {
    setIsLoading(true);
    const result = await toggleCustomDimensionActiveAction(dimensionId);

    if (result.success) {
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
      className={
        isActive
          ? "text-green-600 hover:text-green-700"
          : "text-muted-foreground"
      }
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isActive ? (
        <Eye className="h-4 w-4" />
      ) : (
        <EyeOff className="h-4 w-4" />
      )}
    </Button>
  );
}
