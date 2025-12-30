"use client";

import { usePathname } from "next/navigation";
import { GlobalSearch } from "./global-search";

interface GlobalSearchWrapperProps {
  userId: string;
}

export function GlobalSearchWrapper({ userId }: GlobalSearchWrapperProps) {
  const pathname = usePathname();

  // Extract project context from URL
  const projectMatch = pathname.match(/\/projects\/(\d+)/);
  const projectId = projectMatch ? parseInt(projectMatch[1]) : undefined;

  // Extract project name from URL segments (best effort)
  // In a real app, you might want to fetch this from context or pass it down
  const projectName = projectId ? `Project ${projectId}` : undefined;

  return <GlobalSearch userId={userId} projectId={projectId} projectName={projectName} />;
}
