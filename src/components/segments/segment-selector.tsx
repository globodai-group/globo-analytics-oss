"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, X, Plus, Settings } from "lucide-react";
import { useSegment } from "@/contexts/segment-context";

interface SegmentSelectorProps {
  projectId: number;
}

export function SegmentSelector({ projectId }: SegmentSelectorProps) {
  const locale = useLocale();
  const {
    activeSegment,
    activeSegmentId,
    segments,
    loading,
    setActiveSegmentId,
    clearSegment,
    loadSegments,
  } = useSegment();

  // Load segments when projectId changes
  useEffect(() => {
    loadSegments(projectId);
  }, [projectId, loadSegments]);

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Filter className="h-4 w-4" />
        {locale === "fr" ? "Chargement..." : "Loading..."}
      </Button>
    );
  }

  // No segments available
  if (segments.length === 0) {
    return (
      <Link href={`/projects/${projectId}/segments/new`}>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">
            {locale === "fr" ? "Créer un segment" : "Create segment"}
          </span>
          <span className="sm:hidden">{locale === "fr" ? "Segment" : "Segment"}</span>
        </Button>
      </Link>
    );
  }

  // Active segment badge
  if (activeSegment) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Badge
          variant="secondary"
          className="gap-1.5 sm:gap-2 py-1 sm:py-1.5 px-2 sm:px-3 bg-primary/10 text-primary hover:bg-primary/20 text-xs max-w-[120px] sm:max-w-none"
        >
          <Filter className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
          <span className="truncate">{activeSegment.name}</span>
          <button
            onClick={clearSegment}
            className="ml-0.5 sm:ml-1 hover:bg-primary/20 rounded-full p-0.5 shrink-0"
            title={locale === "fr" ? "Supprimer le filtre" : "Remove filter"}
          >
            <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </button>
        </Badge>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <div className="space-y-3">
              <p className="text-sm font-medium">
                {locale === "fr" ? "Changer de segment" : "Change segment"}
              </p>
              <Select
                value={activeSegmentId?.toString() || ""}
                onValueChange={(value) => setActiveSegmentId(value ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {segments.map((segment) => (
                    <SelectItem key={segment.id} value={segment.id.toString()}>
                      {segment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Link href={`/projects/${projectId}/segments`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    {locale === "fr" ? "Gérer" : "Manage"}
                  </Button>
                </Link>
                <Link href={`/projects/${projectId}/segments/new`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-1">
                    <Plus className="h-3 w-3" />
                    {locale === "fr" ? "Nouveau" : "New"}
                  </Button>
                </Link>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Segment selector dropdown
  return (
    <div className="flex items-center gap-2">
      <Select
        value=""
        onValueChange={(value) => setActiveSegmentId(value ? parseInt(value) : null)}
      >
        <SelectTrigger className="w-auto min-w-[100px] sm:min-w-[160px] h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
            <span className="hidden sm:inline">
              <SelectValue
                placeholder={locale === "fr" ? "Appliquer un segment" : "Apply segment"}
              />
            </span>
            <span className="sm:hidden">
              <SelectValue placeholder={locale === "fr" ? "Segment" : "Segment"} />
            </span>
          </div>
        </SelectTrigger>
        <SelectContent>
          {segments.map((segment) => (
            <SelectItem key={segment.id} value={segment.id.toString()}>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                {segment.name}
              </div>
            </SelectItem>
          ))}
          <div className="border-t mt-1 pt-1">
            <Link href={`/projects/${projectId}/segments/new`}>
              <div className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded cursor-pointer">
                <Plus className="h-4 w-4" />
                {locale === "fr" ? "Créer un segment" : "Create segment"}
              </div>
            </Link>
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}
