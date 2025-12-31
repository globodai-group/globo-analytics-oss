import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban,
  Plus,
  Star,
  Lock,
  Unlock,
  MoreHorizontal,
  ExternalLink,
  Settings,
  BarChart3,
  Globe,
  Smartphone,
  Monitor,
  Users,
  Activity,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectFavoriteButton } from "@/components/projects/project-favorite-button";
import { ProjectDeleteButton } from "@/components/projects/project-delete-button";

export default async function ProjectsPage() {
  const session = await auth();
  const t = await getTranslations();

  if (!session?.user?.id) {
    return null;
  }

  const projects = await prisma.project.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      domains: {
        where: { type: "primary" },
        take: 1,
      },
      _count: {
        select: {
          visitors: true,
          projectSessions: true,
        },
      },
    },
    orderBy: [{ favoritedAt: "desc" }, { createdAt: "desc" }],
  });

  const privacyLabels = {
    0: {
      label: t("projects.privacyOptions.public"),
      icon: Unlock,
      variant: "secondary" as const,
    },
    1: {
      label: t("projects.privacyOptions.private"),
      icon: Lock,
      variant: "default" as const,
    },
    2: {
      label: t("projects.privacyOptions.password"),
      icon: Lock,
      variant: "outline" as const,
    },
  };

  const platformIcons = {
    web: Globe,
    mobile: Smartphone,
    both: Monitor,
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
            {t("projects.title")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {projects.length === 0
              ? t("projects.noProjects")
              : `${projects.length} ${projects.length === 1 ? "project" : "projects"}`}
          </p>
        </div>
        <Link href="/projects/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            {t("projects.addNew")}
          </Button>
        </Link>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {t("projects.noProjects")}
            </h2>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {t("projects.startTracking")}
            </p>
            <Link href="/projects/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("projects.addNew")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const privacy =
              privacyLabels[project.privacy as keyof typeof privacyLabels];
            const PrivacyIcon = privacy.icon;
            const PlatformIcon =
              platformIcons[project.platform as keyof typeof platformIcons] ||
              Globe;
            const primaryDomain = project.domains[0];

            return (
              <Card
                key={project.id}
                className="relative group hover:border-primary/50 transition-colors"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FolderKanban className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base truncate">
                          {project.name}
                        </CardTitle>
                        <CardDescription className="truncate">
                          {primaryDomain?.domain || t("projects.noDomains")}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 relative z-10">
                      <ProjectFavoriteButton
                        projectId={project.id}
                        isFavorite={!!project.favoritedAt}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 touch-target"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/projects/${project.id}/stats`}>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              {t("dashboard.viewStats")}
                            </Link>
                          </DropdownMenuItem>
                          {primaryDomain && (
                            <DropdownMenuItem asChild>
                              <a
                                href={`https://${primaryDomain.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                {t("projects.visitSite")}
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/projects/${project.id}/settings`}>
                              <Settings className="h-4 w-4 mr-2" />
                              {t("projects.settings.title")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/projects/${project.id}/domains`}>
                              <Globe className="h-4 w-4 mr-2" />
                              {t("projects.domains")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <ProjectDeleteButton
                            projectId={project.id}
                            projectName={project.name}
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={privacy.variant}>
                        <PrivacyIcon className="h-3 w-3 mr-1" />
                        {privacy.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <PlatformIcon className="h-3 w-3 mr-1" />
                        {t(`projects.platformOptions.${project.platform}`)}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {project._count.visitors.toLocaleString()}{" "}
                        {t("stats.visitors")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {project._count.projectSessions.toLocaleString()}{" "}
                        {t("stats.sessions")}
                      </span>
                    </div>
                  </div>
                </CardContent>
                {project.favoritedAt && (
                  <div className="absolute top-2 left-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                )}
                <Link
                  href={`/projects/${project.id}/stats`}
                  className="absolute inset-0 z-0"
                  aria-label={`View ${project.name} stats`}
                />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
