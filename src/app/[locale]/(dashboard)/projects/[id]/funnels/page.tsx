import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { features } from "@/lib/env";
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
import { ArrowLeft, Plus, GitBranch, ArrowRight, EyeOff } from "lucide-react";
import { FunnelDeleteButton } from "@/components/funnels/funnel-delete-button";
import { AISuggestions } from "@/components/ai/ai-suggestions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FunnelsPage({ params }: PageProps) {
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
      funnels: {
        orderBy: { createdAt: "desc" },
        include: {
          steps: { orderBy: { position: "asc" } },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}/stats`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <Link href={`/projects/${projectId}/funnels/new`}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("addNew")}
          </Button>
        </Link>
      </div>

      {/* AI Suggestions */}
      {features.hasAI && (
        <div className="mb-6">
          <AISuggestions projectId={projectId} type="funnels" />
        </div>
      )}

      {project.funnels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <GitBranch className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("noFunnels")}</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              {t("noFunnelsDescription")}
            </p>
            <Link href={`/projects/${projectId}/funnels/new`}>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t("addNew")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {project.funnels.map((funnel) => (
            <Card
              key={funnel.id}
              className="hover:border-primary/30 transition-colors"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{funnel.name}</CardTitle>
                      {!funnel.isActive && (
                        <Badge variant="secondary" className="gap-1">
                          <EyeOff className="h-3 w-3" />
                          {t("inactive")}
                        </Badge>
                      )}
                    </div>
                    {funnel.description && (
                      <CardDescription>{funnel.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/projects/${projectId}/funnels/${funnel.id}`}>
                      <Button variant="outline" size="sm">
                        {t("viewAnalysis")}
                      </Button>
                    </Link>
                    <FunnelDeleteButton
                      funnelId={funnel.id}
                      funnelName={funnel.name}
                      locale={locale}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 flex-wrap">
                  {funnel.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted">
                        <span className="text-xs font-medium text-muted-foreground">
                          {step.position}
                        </span>
                        <span className="text-sm font-medium">{step.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {t(`stepTypes.${step.type}`)}
                        </Badge>
                      </div>
                      {index < funnel.steps.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {funnel.steps.length} {t("steps")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
