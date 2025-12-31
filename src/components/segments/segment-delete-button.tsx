"use client";

import { DeleteResourceDialog } from "@/components/shared/delete-resource-dialog";
import { deleteSegmentAction } from "@/lib/actions/segments";

interface SegmentDeleteButtonProps {
  segmentId: number;
  segmentName: string;
  locale: string;
}

export function SegmentDeleteButton({
  segmentId,
  segmentName,
  locale,
}: SegmentDeleteButtonProps) {
  return (
    <DeleteResourceDialog
      resourceId={segmentId}
      resourceName={segmentName}
      resourceType="segment"
      deleteAction={deleteSegmentAction}
      locale={locale}
      triggerType="dropdown"
    />
  );
}
