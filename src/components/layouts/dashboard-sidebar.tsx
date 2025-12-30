"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Globe,
  LayoutDashboard,
  Key,
  FolderKanban,
  ArrowLeft,
  BarChart3,
  Target,
  Users,
  GitBranch,
  Share2,
  Workflow,
  Search,
  ShoppingCart,
  Settings,
  Bell,
  FileText,
  ScrollText,
  Video,
  TrendingUp,
  MonitorSmartphone,
  ChevronDown,
  Zap,
  MousePointer,
  Megaphone,
  Cog,
  type LucideIcon,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { APP_VERSION } from "@/lib/version";

const mainNavItems = [
  {
    titleKey: "dashboard.title",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    titleKey: "websites.title",
    href: "/websites",
    icon: Globe,
  },
  {
    titleKey: "projects.title",
    href: "/projects",
    icon: FolderKanban,
  },
];

// Quick access items shown at the top (always visible)
const quickAccessItems = [
  { titleKey: "projects.stats.title", href: "/stats", icon: BarChart3 },
  { titleKey: "projects.realtime.title", href: "/stats/realtime", icon: Zap },
];

// Navigation groups with collapsible sections
interface NavGroup {
  titleKey: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  items: { titleKey: string; href: string; icon: LucideIcon }[];
}

const navGroups: NavGroup[] = [
  {
    titleKey: "nav.audience",
    icon: Users,
    defaultOpen: true,
    items: [
      { titleKey: "projects.segments.title", href: "/segments", icon: Users },
      { titleKey: "projects.technology.title", href: "/technology", icon: MonitorSmartphone },
    ],
  },
  {
    titleKey: "nav.behavior",
    icon: MousePointer,
    items: [
      { titleKey: "projects.pages.title", href: "/pages", icon: FileText },
      { titleKey: "projects.flow.title", href: "/stats/flow", icon: Workflow },
      { titleKey: "projects.search.title", href: "/stats/search", icon: Search },
      { titleKey: "projects.content.title", href: "/stats/content", icon: ScrollText },
      { titleKey: "projects.videos.title", href: "/stats/videos", icon: Video },
    ],
  },
  {
    titleKey: "nav.acquisition",
    icon: Megaphone,
    items: [
      { titleKey: "projects.acquisition.title", href: "/acquisition", icon: TrendingUp },
      { titleKey: "projects.attribution.title", href: "/attribution", icon: Share2 },
    ],
  },
  {
    titleKey: "nav.conversion",
    icon: Target,
    items: [
      { titleKey: "projects.goals.title", href: "/goals", icon: Target },
      { titleKey: "projects.funnels.title", href: "/funnels", icon: GitBranch },
      { titleKey: "projects.ecommerce.title", href: "/stats/ecommerce", icon: ShoppingCart },
    ],
  },
  {
    titleKey: "nav.configure",
    icon: Cog,
    items: [
      { titleKey: "projects.alerts.title", href: "/alerts", icon: Bell },
      { titleKey: "projects.reports.title", href: "/reports", icon: FileText },
      { titleKey: "projects.settings.title", href: "/settings", icon: Settings },
    ],
  },
];

// NavGroup component for collapsible sections
function NavGroupSection({
  group,
  projectId,
  pathname,
  t,
}: {
  group: NavGroup;
  projectId: string;
  pathname: string;
  t: ReturnType<typeof useTranslations>;
}) {
  // Check if any item in this group is active
  const hasActiveItem = group.items.some((item) =>
    pathname.includes(`/projects/${projectId}${item.href}`)
  );

  const [isOpen, setIsOpen] = useState(group.defaultOpen || hasActiveItem);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-1">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
        <span className="flex items-center gap-3">
          <group.icon className="h-4 w-4" />
          {t(group.titleKey)}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-4 space-y-1">
        {group.items.map((item) => {
          const fullHref = `/projects/${projectId}${item.href}`;
          const isActive = pathname.includes(`/projects/${projectId}${item.href}`);
          return (
            <Link
              key={item.href}
              href={fullHref}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 min-h-[40px] text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.titleKey)}
            </Link>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const t = useTranslations();

  // Detect if we're in a project context
  const projectMatch = pathname.match(/\/projects\/(\d+)/);
  const projectId = projectMatch ? projectMatch[1] : null;
  const isInProject = !!projectId;

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r bg-card lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          <span className="font-bold">GloboAnalytics</span>
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3 py-4">
          {isInProject && projectId ? (
            <>
              {/* Back to projects link */}
              <Link
                href="/projects"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 min-h-[44px] text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("projects.backToList")}
              </Link>

              {/* Quick access items */}
              <div className="space-y-1 mb-4">
                {quickAccessItems.map((item) => {
                  const fullHref = `/projects/${projectId}${item.href}`;
                  const isActive =
                    pathname === fullHref ||
                    (item.href === "/stats" &&
                      pathname.includes(`/projects/${projectId}/stats`) &&
                      !pathname.includes("/stats/"));
                  return (
                    <Link
                      key={item.href}
                      href={fullHref}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 min-h-[44px] text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {t(item.titleKey)}
                    </Link>
                  );
                })}
              </div>

              {/* Grouped navigation */}
              <div className="space-y-2">
                {navGroups.map((group) => (
                  <NavGroupSection
                    key={group.titleKey}
                    group={group}
                    projectId={projectId}
                    pathname={pathname}
                    t={t}
                  />
                ))}
              </div>
            </>
          ) : (
            /* Main navigation when not in a project */
            <div className="space-y-1">
              {mainNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 min-h-[44px] text-sm font-medium transition-colors",
                    pathname === item.href || pathname.startsWith(item.href + "/")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.titleKey)}
                </Link>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom section with API link and version */}
      <div className="border-t px-3 py-4 space-y-2">
        <Link
          href="/account/api"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 min-h-[44px] text-sm font-medium transition-colors",
            pathname === "/account/api"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Key className="h-4 w-4" />
          {t("account.api.title")}
        </Link>
        <div className="px-3 py-1 text-xs text-muted-foreground/60">v{APP_VERSION}</div>
      </div>
    </aside>
  );
}
