"use client";

import { DeleteResourceDialog } from "@/components/shared/delete-resource-dialog";
import { deleteReportAction } from "@/lib/actions/scheduled-reports";

interface ReportDeleteButtonProps {
  reportId: number;
  reportName?: string;
  locale: string;
}

export function ReportDeleteButton({
  reportId,
  reportName = "Report",
  locale,
}: ReportDeleteButtonProps) {
  return (
    <DeleteResourceDialog
      resourceId={reportId}
      resourceName={reportName}
      resourceType="report"
      deleteAction={deleteReportAction}
      locale={locale}
      triggerType="icon"
    />
  );
}
