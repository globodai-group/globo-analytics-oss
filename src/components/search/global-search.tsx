"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban,
  FileText,
  Zap,
  Users,
  Target,
  GitBranch,
  Loader2,
  ArrowRight,
  LayoutDashboard,
  Settings,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { globalSearch } from "@/lib/algolia/search";
import type { GroupedSearchResults, SearchContext } from "@/lib/algolia/types";

interface GlobalSearchProps {
  userId: string;
  projectId?: number;
  projectName?: string;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function GlobalSearch({ userId, projectId, projectName }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GroupedSearchResults | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations("search");

  const debouncedQuery = useDebounce(query, 200);

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search when query changes
  useEffect(() => {
    if (!open) return;

    const context: SearchContext = {
      userId,
      projectId,
    };

    startTransition(async () => {
      if (debouncedQuery.trim()) {
        const searchResults = await globalSearch({
          query: debouncedQuery,
          context,
          hitsPerPage: 5,
        });
        setResults(searchResults);
      } else {
        setResults(null);
      }
    });
  }, [debouncedQuery, open, userId, projectId]);

  // Reset on close
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setQuery("");
      setResults(null);
    }
  }, []);

  // Navigate to result
  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  // Quick actions for empty state
  const quickActions = projectId
    ? [
        {
          icon: BarChart3,
          label: t("quickActions.viewStats"),
          href: `/projects/${projectId}/stats`,
        },
        {
          icon: Zap,
          label: t("quickActions.realtime"),
          href: `/projects/${projectId}/stats/realtime`,
        },
        {
          icon: Target,
          label: t("quickActions.goals"),
          href: `/projects/${projectId}/goals`,
        },
        {
          icon: Settings,
          label: t("quickActions.settings"),
          href: `/projects/${projectId}/settings`,
        },
      ]
    : [
        {
          icon: LayoutDashboard,
          label: t("quickActions.dashboard"),
          href: "/dashboard",
        },
        {
          icon: FolderKanban,
          label: t("quickActions.projects"),
          href: "/projects",
        },
        {
          icon: Settings,
          label: t("quickActions.account"),
          href: "/account",
        },
      ];

  const hasResults =
    results &&
    (results.projects.length > 0 ||
      results.pages.length > 0 ||
      results.events.length > 0 ||
      results.segments.length > 0 ||
      results.goals.length > 0 ||
      results.funnels.length > 0);

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t("title")}
      description={t("description")}
    >
      <CommandInput
        placeholder={
          projectId && projectName
            ? t("placeholderProject", { name: projectName })
            : t("placeholder")
        }
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[400px]">
        {isPending && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isPending && !query && (
          <>
            {/* Context indicator */}
            {projectId && projectName && (
              <div className="px-3 py-2 border-b">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FolderKanban className="h-3 w-3" />
                  <span>{t("searchingIn")}</span>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {projectName}
                  </Badge>
                </div>
              </div>
            )}

            {/* Quick actions */}
            <CommandGroup heading={t("quickActions.title")}>
              {quickActions.map((action) => (
                <CommandItem
                  key={action.href}
                  onSelect={() => handleSelect(action.href)}
                  className="cursor-pointer"
                >
                  <action.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{action.label}</span>
                  <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {!isPending && query && !hasResults && <CommandEmpty>{t("noResults")}</CommandEmpty>}

        {!isPending && hasResults && results && (
          <>
            {/* Projects */}
            {results.projects.length > 0 && (
              <CommandGroup heading={t("categories.projects")}>
                {results.projects.map(({ hit }) => (
                  <CommandItem
                    key={hit.objectID}
                    onSelect={() =>
                      handleSelect(`/projects/${hit.objectID.replace("project_", "")}/stats`)
                    }
                    className="cursor-pointer"
                  >
                    <FolderKanban className="h-4 w-4 text-blue-500" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate font-medium">{hit.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{hit.domain}</span>
                    </div>
                    {hit.totalPageviews !== undefined && hit.totalPageviews > 0 && (
                      <Badge variant="outline" className="text-xs ml-2">
                        {hit.totalPageviews.toLocaleString()} views
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.projects.length > 0 && results.pages.length > 0 && <CommandSeparator />}

            {/* Pages */}
            {results.pages.length > 0 && (
              <CommandGroup heading={t("categories.pages")}>
                {results.pages.map(({ hit }) => (
                  <CommandItem
                    key={hit.objectID}
                    onSelect={() =>
                      handleSelect(
                        `/projects/${hit.projectId}/pages?url=${encodeURIComponent(hit.url)}`
                      )
                    }
                    className="cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-green-500" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate font-medium">{hit.title}</span>
                      <span className="text-xs text-muted-foreground truncate">{hit.url}</span>
                    </div>
                    <Badge variant="outline" className="text-xs ml-2">
                      {hit.pageviews.toLocaleString()}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(results.projects.length > 0 || results.pages.length > 0) &&
              results.events.length > 0 && <CommandSeparator />}

            {/* Events */}
            {results.events.length > 0 && (
              <CommandGroup heading={t("categories.events")}>
                {results.events.map(({ hit }) => (
                  <CommandItem
                    key={hit.objectID}
                    onSelect={() =>
                      handleSelect(
                        `/projects/${hit.projectId}/stats?event=${encodeURIComponent(hit.eventName)}`
                      )
                    }
                    className="cursor-pointer"
                  >
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate font-medium">{hit.eventName}</span>
                      {hit.eventCategory && (
                        <span className="text-xs text-muted-foreground">{hit.eventCategory}</span>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs ml-2">
                      {hit.count.toLocaleString()}x
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Segments */}
            {results.segments.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={t("categories.segments")}>
                  {results.segments.map(({ hit }) => (
                    <CommandItem
                      key={hit.objectID}
                      onSelect={() =>
                        handleSelect(
                          `/projects/${hit.projectId}/segments/${hit.objectID.replace("segment_", "")}`
                        )
                      }
                      className="cursor-pointer"
                    >
                      <Users className="h-4 w-4 text-purple-500" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="truncate font-medium">{hit.name}</span>
                        {hit.description && (
                          <span className="text-xs text-muted-foreground truncate">
                            {hit.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {/* Goals */}
            {results.goals.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={t("categories.goals")}>
                  {results.goals.map(({ hit }) => (
                    <CommandItem
                      key={hit.objectID}
                      onSelect={() =>
                        handleSelect(
                          `/projects/${hit.projectId}/goals/${hit.objectID.replace("goal_", "")}`
                        )
                      }
                      className="cursor-pointer"
                    >
                      <Target className="h-4 w-4 text-red-500" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="truncate font-medium">{hit.name}</span>
                        <span className="text-xs text-muted-foreground">{hit.goalType}</span>
                      </div>
                      {hit.conversionRate !== undefined && (
                        <Badge variant="outline" className="text-xs ml-2">
                          {hit.conversionRate.toFixed(1)}%
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {/* Funnels */}
            {results.funnels.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={t("categories.funnels")}>
                  {results.funnels.map(({ hit }) => (
                    <CommandItem
                      key={hit.objectID}
                      onSelect={() =>
                        handleSelect(
                          `/projects/${hit.projectId}/funnels/${hit.objectID.replace("funnel_", "")}`
                        )
                      }
                      className="cursor-pointer"
                    >
                      <GitBranch className="h-4 w-4 text-orange-500" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="truncate font-medium">{hit.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {hit.stepCount} {t("steps")}
                        </span>
                      </div>
                      {hit.conversionRate !== undefined && (
                        <Badge variant="outline" className="text-xs ml-2">
                          {hit.conversionRate.toFixed(1)}%
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {/* Result count footer */}
            <div className="px-3 py-2 border-t text-xs text-muted-foreground">
              {t("resultCount", { count: results.totalHits })}
            </div>
          </>
        )}
      </CommandList>

      {/* Keyboard hints footer */}
      <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              ↑↓
            </kbd>
            {t("hints.navigate")}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              ↵
            </kbd>
            {t("hints.select")}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              esc
            </kbd>
            {t("hints.close")}
          </span>
        </div>
        <a
          href="https://www.algolia.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
        >
          <span>Search by</span>
          <span className="font-semibold">Algolia</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </CommandDialog>
  );
}
