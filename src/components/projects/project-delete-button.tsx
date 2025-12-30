"use client";

import { useLocale } from "next-intl";
import { DeleteResourceDialog } from "@/components/shared/delete-resource-dialog";
import { deleteProjectAction } from "@/lib/actions/projects";

interface ProjectDeleteButtonProps {
  projectId: number;
  projectName: string;
}

export function ProjectDeleteButton({ projectId, projectName }: ProjectDeleteButtonProps) {
  const locale = useLocale();

  return (
    <DeleteResourceDialog
      resourceId={projectId}
      resourceName={projectName}
      resourceType="project"
      deleteAction={deleteProjectAction}
      locale={locale}
      triggerType="button"
    />
  );
}
