import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SegmentForm } from "@/components/segments/segment-form";

interface NewSegmentPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewSegmentPage({ params }: NewSegmentPageProps) {
  const { id } = await params;
  const session = await auth();
  const t = await getTranslations("segments");
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}/segments`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t("addNew")}</h1>
          <p className="text-muted-foreground">
            {locale === "fr"
              ? "Définissez les conditions pour filtrer vos données"
              : "Define conditions to filter your data"}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
        <SegmentForm projectId={projectId} locale={locale} />
      </div>
    </div>
  );
}
