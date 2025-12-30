"use client";

import { ReactNode } from "react";
import { SegmentProvider } from "@/contexts/segment-context";

interface DashboardProvidersProps {
  children: ReactNode;
}

export function DashboardProviders({ children }: DashboardProvidersProps) {
  return <SegmentProvider>{children}</SegmentProvider>;
}
