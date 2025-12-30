import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { FunnelForm } from "@/components/funnels/funnel-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewFunnelPage({ params }: PageProps) {
  const { id } = await params;
  const projectId = parseInt(id);
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("funnels");

  if (!session?.user) {
    redirect("/login");
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: {
      goals: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/projects/${projectId}/funnels`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t("addNew")}</h1>
          <p className="text-muted-foreground">{t("addNewDescription")}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("funnelDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <FunnelForm
            projectId={projectId}
            locale={locale}
            goals={project.goals.map((g) => ({ id: g.id, name: g.name }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
