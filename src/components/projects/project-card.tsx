"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
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

interface Project {
  id: number;
  name: string;
  platform: string;
  privacy: number;
  usersCount: number;
  sessionsCount: number;
  favoritedAt: Date | null;
  domains: { domain: string }[];
}

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const t = useTranslations();

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

  const platformLabels = {
    web: { label: t("projects.platformOptions.web"), icon: Globe },
    mobile: { label: t("projects.platformOptions.mobile"), icon: Smartphone },
    both: { label: t("projects.platformOptions.both"), icon: Monitor },
  };

  const privacy = privacyLabels[project.privacy as keyof typeof privacyLabels];
  const platform =
    platformLabels[project.platform as keyof typeof platformLabels];
  const PrivacyIcon = privacy.icon;
  const PlatformIcon = platform.icon;

  const handleCardClick = () => {
    router.push(`/projects/${project.id}/stats`);
  };

  const primaryDomain = project.domains[0]?.domain || null;

  return (
    <Card
      className="relative group hover:border-primary/50 transition-colors cursor-pointer"
      onClick={handleCardClick}
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
                {primaryDomain || t("projects.noDomains")}
              </CardDescription>
            </div>
          </div>
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <ProjectFavoriteButton
              projectId={project.id}
              isFavorite={!!project.favoritedAt}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
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
                      href={`https://${primaryDomain}`}
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={privacy.variant}>
              <PrivacyIcon className="h-3 w-3 mr-1" />
              {privacy.label}
            </Badge>
            <Badge variant="outline">
              <PlatformIcon className="h-3 w-3 mr-1" />
              {platform.label}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="flex items-center gap-1 text-sm font-medium">
                <Users className="h-3 w-3 text-muted-foreground" />
                {project.usersCount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("stats.visitors")}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 text-sm font-medium">
                <Activity className="h-3 w-3 text-muted-foreground" />
                {project.sessionsCount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("stats.sessions")}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      {project.favoritedAt && (
        <div className="absolute top-2 left-2">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        </div>
      )}
    </Card>
  );
}
