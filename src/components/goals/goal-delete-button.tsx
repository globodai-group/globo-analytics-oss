"use client";

import { DeleteResourceDialog } from "@/components/shared/delete-resource-dialog";
import { deleteGoalAction } from "@/lib/actions/goals";

interface GoalDeleteButtonProps {
  goalId: number;
  goalName: string;
  locale: string;
}

export function GoalDeleteButton({
  goalId,
  goalName,
  locale,
}: GoalDeleteButtonProps) {
  return (
    <DeleteResourceDialog
      resourceId={goalId}
      resourceName={goalName}
      resourceType="goal"
      deleteAction={deleteGoalAction}
      locale={locale}
      triggerType="dropdown"
    />
  );
}
