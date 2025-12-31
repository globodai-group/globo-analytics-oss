"use client";

import { useLocale } from "next-intl";
import { DeleteResourceDialog } from "@/components/shared/delete-resource-dialog";
import { deleteWebsiteAction } from "@/lib/actions/websites";

interface WebsiteDeleteButtonProps {
  websiteId: number;
  websiteName: string;
}

export function WebsiteDeleteButton({
  websiteId,
  websiteName,
}: WebsiteDeleteButtonProps) {
  const locale = useLocale();

  return (
    <DeleteResourceDialog
      resourceId={websiteId}
      resourceName={websiteName}
      resourceType="website"
      deleteAction={deleteWebsiteAction}
      locale={locale}
      triggerType="dropdown"
    />
  );
}
