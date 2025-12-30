"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toggleGoalActiveAction } from "@/lib/actions/goals";
import { toast } from "sonner";

interface GoalToggleButtonProps {
  goalId: number;
  isActive: boolean;
}

export function GoalToggleButton({ goalId, isActive }: GoalToggleButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const result = await toggleGoalActiveAction(goalId);
      if (result.success) {
        toast.success(isActive ? "Goal deactivated" : "Goal activated");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenuItem
      onSelect={(e) => e.preventDefault()}
      onClick={handleToggle}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : isActive ? (
        <ToggleRight className="h-4 w-4 mr-2" />
      ) : (
        <ToggleLeft className="h-4 w-4 mr-2" />
      )}
      {isActive ? "Deactivate" : "Activate"}
    </DropdownMenuItem>
  );
}
