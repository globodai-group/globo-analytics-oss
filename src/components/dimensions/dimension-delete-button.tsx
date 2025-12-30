"use client";

import { DeleteResourceDialog } from "@/components/shared/delete-resource-dialog";
import { deleteCustomDimensionAction } from "@/lib/actions/custom-dimensions";

interface DimensionDeleteButtonProps {
  dimensionId: number;
  dimensionName: string;
  locale: string;
}

export function DimensionDeleteButton({
  dimensionId,
  dimensionName,
  locale,
}: DimensionDeleteButtonProps) {
  return (
    <DeleteResourceDialog
      resourceId={dimensionId}
      resourceName={dimensionName}
      resourceType="dimension"
      deleteAction={deleteCustomDimensionAction}
      locale={locale}
      triggerType="icon"
    />
  );
}
