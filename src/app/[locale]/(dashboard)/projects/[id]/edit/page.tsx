import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProjectForm } from "@/components/projects/project-form";

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({
  params,
}: EditProjectPageProps) {
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
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t("projects.edit")}</h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
      </div>

      {/* Form */}
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
    </div>
  );
}
