import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { GoalForm } from "@/components/goals/goal-form";

interface NewGoalPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewGoalPage({ params }: NewGoalPageProps) {
  const { id } = await params;
  const session = await auth();
  const t = await getTranslations("goals");
  const locale = await getLocale();

  if (!session?.user?.id) {
    return null;
  }

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    notFound();
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: session.user.id,
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}/goals`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t("addNew")}</h1>
          <p className="text-muted-foreground">{t("addNewDescription")}</p>
        </div>
      </div>

      {/* Form */}
      <GoalForm projectId={projectId} locale={locale} />
    </div>
  );
}
