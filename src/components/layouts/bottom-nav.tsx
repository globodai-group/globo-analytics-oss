"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  User,
  MoreHorizontal,
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
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Main navigation items (always visible)
 */
const mainNavItems = [
  {
    shortLabel: "Home",
    labelFr: "Accueil",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    shortLabel: "Projects",
    labelFr: "Projets",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    shortLabel: "Account",
    labelFr: "Compte",
    href: "/account/profile",
    icon: User,
  },
];

/**
 * Project-specific navigation items (shown in More sheet when in project)
 */
const projectNavItems = [
  {
    label: "Statistics",
    labelFr: "Statistiques",
    href: "/stats",
    icon: BarChart3,
    primary: true,
  },
  {
    label: "Acquisition",
    labelFr: "Acquisition",
    href: "/acquisition",
    icon: TrendingUp,
  },
  {
    label: "Goals",
    labelFr: "Objectifs",
    href: "/goals",
    icon: Target,
  },
  {
    label: "Segments",
    labelFr: "Segments",
    href: "/segments",
    icon: Users,
  },
  {
    label: "Technology",
    labelFr: "Technologie",
    href: "/technology",
    icon: MonitorSmartphone,
  },
  {
    label: "Pages",
    labelFr: "Pages",
    href: "/pages",
    icon: FileText,
  },
  {
    label: "Funnels",
    labelFr: "Entonnoirs",
    href: "/funnels",
    icon: GitBranch,
  },
  {
    label: "Attribution",
    labelFr: "Attribution",
    href: "/attribution",
    icon: Share2,
  },
  {
    label: "User Flow",
    labelFr: "Flux utilisateur",
    href: "/stats/flow",
    icon: Workflow,
  },
  {
    label: "Site Search",
    labelFr: "Recherche",
    href: "/stats/search",
    icon: Search,
  },
  {
    label: "E-commerce",
    labelFr: "E-commerce",
    href: "/stats/ecommerce",
    icon: ShoppingCart,
  },
  {
    label: "Content",
    labelFr: "Contenu",
    href: "/stats/content",
    icon: ScrollText,
  },
  {
    label: "Videos",
    labelFr: "Vidéos",
    href: "/stats/videos",
    icon: Video,
  },
  {
    label: "Alerts",
    labelFr: "Alertes",
    href: "/alerts",
    icon: Bell,
  },
  {
    label: "Reports",
    labelFr: "Rapports",
    href: "/reports",
    icon: FileText,
  },
  {
    label: "Settings",
    labelFr: "Paramètres",
    href: "/settings",
    icon: Settings,
  },
];

/**
 * Bottom navigation component for mobile devices
 *
 * Features:
 * - Fixed at bottom of screen
 * - Hidden on desktop (lg:hidden)
 * - Touch-friendly targets (44px minimum)
 * - Safe area inset for iPhone notch
 * - Project-specific "More" menu when in project context
 */
export function BottomNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Detect project context from pathname
  const projectMatch = pathname.match(/\/projects\/(\d+)/);
  const projectId = projectMatch ? projectMatch[1] : null;
  const isInProject = !!projectId;

  // Build navigation items based on context
  const navItems = isInProject
    ? [
        mainNavItems[0], // Home
        mainNavItems[1], // Projects
        {
          shortLabel: "Stats",
          labelFr: "Stats",
          href: `/projects/${projectId}/stats`,
          icon: BarChart3,
          isProjectLink: true,
        },
        {
          shortLabel: "More",
          labelFr: "Plus",
          href: "#more",
          icon: MoreHorizontal,
          isMoreButton: true,
        },
        mainNavItems[2], // Account
      ]
    : mainNavItems;

  return (
    <>
      <nav
        data-slot="bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t lg:hidden safe-area-bottom"
      >
        <ul className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isMoreButton = "isMoreButton" in item && item.isMoreButton;

            // Check if active
            const isActive =
              !isMoreButton &&
              (pathname === item.href ||
                pathname.startsWith(item.href + "/") ||
                ("isProjectLink" in item && pathname.includes(item.href)));

            const Icon = item.icon;
            const label = locale === "fr" && "labelFr" in item ? item.labelFr : item.shortLabel;

            if (isMoreButton) {
              return (
                <li key="more" className="flex-1">
                  <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger asChild>
                      <button
                        className={cn(
                          "flex flex-col items-center justify-center gap-1",
                          "w-full h-16 min-h-[64px]",
                          "transition-colors duration-200",
                          "touch-target",
                          "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10px] font-medium leading-none">{label}</span>
                      </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
                      <SheetHeader className="pb-4">
                        <SheetTitle className="flex items-center justify-between">
                          <span>
                            {locale === "fr" ? "Navigation projet" : "Project Navigation"}
                          </span>
                          <button
                            onClick={() => setSheetOpen(false)}
                            className="p-2 hover:bg-muted rounded-full"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </SheetTitle>
                      </SheetHeader>
                      <ScrollArea className="h-[calc(70vh-80px)]">
                        <div className="grid grid-cols-3 gap-3 pb-8">
                          {projectNavItems.map((navItem) => {
                            const fullHref = `/projects/${projectId}${navItem.href}`;
                            const isNavActive = pathname.includes(fullHref);
                            const NavIcon = navItem.icon;
                            const navLabel = locale === "fr" ? navItem.labelFr : navItem.label;

                            return (
                              <Link
                                key={navItem.href}
                                href={fullHref}
                                onClick={() => setSheetOpen(false)}
                                className={cn(
                                  "flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-colors",
                                  "min-h-[88px]",
                                  isNavActive
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted/50 hover:bg-muted text-foreground"
                                )}
                              >
                                <NavIcon className="h-6 w-6" />
                                <span className="text-xs font-medium text-center leading-tight">
                                  {navLabel}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </SheetContent>
                  </Sheet>
                </li>
              );
            }

            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1",
                    "w-full h-16 min-h-[64px]",
                    "transition-colors duration-200",
                    "touch-target",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
                  <span className="text-[10px] font-medium leading-none">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
