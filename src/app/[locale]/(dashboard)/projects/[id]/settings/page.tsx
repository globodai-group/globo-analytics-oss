import { notFound } from "next/navigation";
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
import {
  ArrowLeft,
  Settings,
  Globe,
  Trash2,
  SlidersHorizontal,
  Shield,
} from "lucide-react";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectDeleteButton } from "@/components/projects/project-delete-button";

interface ProjectSettingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectSettingsPage({
  params,
}: ProjectSettingsPageProps) {
  const { id } = await params;
  const session = await auth();
  const t = await getTranslations();

  if (!session?.user?.id) {
    return null;
  }

  const project = await prisma.project.findFirst({
    where: {
      id: parseInt(id),
      userId: session.user.id,
    },
    include: {
      domains: true,
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/projects/${project.id}/stats`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t("projects.settings.title")}</h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href={`/projects/${project.id}/domains`} className="block">
          <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-4 w-4 shrink-0" />
                <span>{t("projects.domains")}</span>
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {project.domains.length}{" "}
                {project.domains.length === 1 ? "domain" : "domains"}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href={`/projects/${project.id}/tracking`} className="block">
          <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4 shrink-0" />
                <span>{t("projects.trackingCode")}</span>
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {t("projects.trackingCodeDescription")}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link
          href={`/projects/${project.id}/settings/dimensions`}
          className="block"
        >
          <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <SlidersHorizontal className="h-4 w-4 shrink-0" />
                <span>{t("dimensions.title")}</span>
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {t("dimensions.subtitle")}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link
          href={`/projects/${project.id}/settings/consent`}
          className="block"
        >
          <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 shrink-0" />
                <span>{t("consent.title")}</span>
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {t("consent.subtitle")}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Edit Form */}
      <ProjectForm
        project={{
          id: project.id,
          name: project.name,
          platform: project.platform,
          privacy: project.privacy,
          excludeBots: project.excludeBots,
          sessionTimeout: project.sessionTimeout,
          engagementThreshold: project.engagementThreshold,
        }}
      />

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            {t("projects.dangerZone")}
          </CardTitle>
          <CardDescription>
            {t("projects.dangerZoneDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectDeleteButton
            projectId={project.id}
            projectName={project.name}
          />
        </CardContent>
      </Card>
    </div>
  );
}
