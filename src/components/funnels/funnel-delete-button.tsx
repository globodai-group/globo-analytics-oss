"use client";

import { DeleteResourceDialog } from "@/components/shared/delete-resource-dialog";
import { deleteFunnelAction } from "@/lib/actions/funnels";

interface FunnelDeleteButtonProps {
  funnelId: number;
  funnelName: string;
  locale: string;
}

export function FunnelDeleteButton({ funnelId, funnelName, locale }: FunnelDeleteButtonProps) {
  return (
    <DeleteResourceDialog
      resourceId={funnelId}
      resourceName={funnelName}
      resourceType="funnel"
      deleteAction={deleteFunnelAction}
      locale={locale}
      triggerType="icon"
    />
  );
}
