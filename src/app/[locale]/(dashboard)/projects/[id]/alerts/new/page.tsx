import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { AlertForm } from "@/components/alerts/alert-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewAlertPage({ params }: PageProps) {
  const { id } = await params;
  const projectId = parseInt(id);
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("alerts");

  if (!session?.user) {
    redirect("/login");
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/projects/${projectId}/alerts`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t("addNew")}</h1>
          <p className="text-muted-foreground">
            {locale === "fr"
              ? "Configurez une nouvelle alerte pour ce projet"
              : "Configure a new alert for this project"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("name")}</CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Définissez les conditions qui déclencheront cette alerte"
              : "Define the conditions that will trigger this alert"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertForm projectId={projectId} locale={locale} />
        </CardContent>
      </Card>
    </div>
  );
}
