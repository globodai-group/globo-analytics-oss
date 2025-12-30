import { notFound, redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ReportForm } from "@/components/reports/report-form";

interface NewReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewReportPage({ params }: NewReportPageProps) {
  const { id } = await params;
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user?.id) {
    redirect("/login");
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

  // Get segments for dropdown
  const segments = await prisma.segment.findMany({
    where: {
      projectId,
      OR: [{ userId: session.user.id }, { isShared: true }],
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/projects/${project.id}/reports`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {locale === "fr" ? "Nouveau Rapport" : "New Report"}
          </h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "fr" ? "Configuration du rapport" : "Report Configuration"}
          </CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Configurez les paramètres de votre rapport programmé."
              : "Configure your scheduled report settings."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportForm projectId={project.id} segments={segments} locale={locale} />
        </CardContent>
      </Card>
    </div>
  );
}
