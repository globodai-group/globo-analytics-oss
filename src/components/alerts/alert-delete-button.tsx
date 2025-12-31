"use client";

import { DeleteResourceDialog } from "@/components/shared/delete-resource-dialog";
import { deleteAlertAction } from "@/lib/actions/alerts";

interface AlertDeleteButtonProps {
  alertId: number;
  alertName: string;
  locale: string;
}

export function AlertDeleteButton({
  alertId,
  alertName,
  locale,
}: AlertDeleteButtonProps) {
  return (
    <DeleteResourceDialog
      resourceId={alertId}
      resourceName={alertName}
      resourceType="alert"
      deleteAction={deleteAlertAction}
      locale={locale}
      triggerType="icon"
    />
  );
}
