import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, TrendingDown, Target } from "lucide-react";
import { getFunnelAnalysisAction } from "@/lib/actions/funnels";
import { FunnelChart } from "@/components/funnels/funnel-chart";
import { ProjectDateRangePicker } from "@/components/analytics/project-date-range-picker";

interface PageProps {
  params: Promise<{ id: string; funnelId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

interface FunnelStep {
  position: number;
  name: string;
  visitors: number;
  dropOff: number;
  dropOffRate: number;
  conversionRate: number;
}

interface FunnelAnalysis {
  funnel: {
    id: number;
    name: string;
    description: string | null;
    isActive: boolean;
  };
  steps: FunnelStep[];
  summary: {
    totalEntrants: number;
    totalConversions: number;
    overallConversionRate: number;
    totalDropOff: number;
  };
}

export default async function FunnelDetailPage({ params, searchParams }: PageProps) {
  const { id, funnelId } = await params;
  const { from, to } = await searchParams;
  const projectId = parseInt(id);
  const funnelIdNum = parseInt(funnelId);
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("funnels");

  if (!session?.user) {
    redirect("/login");
  }

  const funnel = await prisma.funnel.findFirst({
    where: { id: funnelIdNum },
    include: {
      project: true,
      steps: { orderBy: { position: "asc" } },
    },
  });

  if (!funnel || funnel.project.userId !== session.user.id) {
    notFound();
  }

  // Default date range: last 30 days
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(now.getDate() - 30);

  const dateRange = {
    from: from ? new Date(from) : defaultFrom,
    to: to ? new Date(to) : now,
  };

  const analysisResult = await getFunnelAnalysisAction(funnelIdNum, dateRange, locale);
  const analysis = analysisResult.success ? (analysisResult.data as FunnelAnalysis) : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-start sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href={`/projects/${projectId}/funnels`} className="shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold truncate">{funnel.name}</h1>
            {funnel.description && (
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {funnel.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <ProjectDateRangePicker projectId={projectId} />
        </div>
      </div>

      {/* Summary Cards */}
      {analysis && (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalEntrants")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analysis.summary.totalEntrants.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalConversions")}</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analysis.summary.totalConversions.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("conversionRate")}</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysis.summary.overallConversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {t("totalDropOff")}: {analysis.summary.totalDropOff.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>{t("funnelVisualization")}</CardTitle>
          <CardDescription>{t("funnelVisualizationDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {analysis ? (
            <FunnelChart steps={analysis.steps} locale={locale} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">{t("noData")}</div>
          )}
        </CardContent>
      </Card>

      {/* Step Details Table */}
      {analysis && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t("stepDetails")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">{t("step")}</th>
                    <th className="text-right py-3 px-4 font-medium">{t("visitors")}</th>
                    <th className="text-right py-3 px-4 font-medium">{t("dropOff")}</th>
                    <th className="text-right py-3 px-4 font-medium">{t("dropOffRate")}</th>
                    <th className="text-right py-3 px-4 font-medium">{t("conversionRate")}</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.steps.map((step: FunnelStep) => (
                    <tr key={step.position} className="border-b">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {step.position}
                          </span>
                          <span className="font-medium">{step.name}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">{step.visitors.toLocaleString()}</td>
                      <td className="text-right py-3 px-4 text-destructive">
                        {step.position > 1 ? `-${step.dropOff.toLocaleString()}` : "-"}
                      </td>
                      <td className="text-right py-3 px-4">
                        {step.position > 1 ? `${step.dropOffRate}%` : "-"}
                      </td>
                      <td className="text-right py-3 px-4 font-medium text-green-600">
                        {step.conversionRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
