import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, LogIn, LogOut, Activity } from "lucide-react";
import { getUserFlowAnalysisAction } from "@/lib/actions/user-flow";
import { ProjectDateRangePicker } from "@/components/analytics/project-date-range-picker";
import { UserFlowChart } from "@/components/user-flow/user-flow-chart";
import { Progress } from "@/components/ui/progress";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string; entry?: string }>;
}

interface FlowNode {
  id: string;
  name: string;
  value: number;
}

interface FlowLink {
  source: string;
  target: string;
  value: number;
}

interface UserFlowData {
  nodes: FlowNode[];
  links: FlowLink[];
  topEntryPages: { page: string; count: number }[];
  topExitPages: { page: string; count: number }[];
  totalSessions: number;
}

export default async function UserFlowPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { from, to, entry } = await searchParams;
  const projectId = parseInt(id);
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("userFlow");

  if (!session?.user) {
    redirect("/login");
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });

  if (!project) {
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

  const result = await getUserFlowAnalysisAction(projectId, dateRange, locale, {
    entryPage: entry,
    maxDepth: 5,
  });
  const data = result.success ? (result.data as UserFlowData) : null;

  const totalEntryCount = data?.topEntryPages.reduce((sum, p) => sum + p.count, 0) || 1;
  const totalExitCount = data?.topExitPages.reduce((sum, p) => sum + p.count, 0) || 1;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-start sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href={`/projects/${projectId}/stats`} className="shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold truncate">{t("title")}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <div className="flex justify-end">
          <ProjectDateRangePicker projectId={projectId} />
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalSessions")}</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalSessions.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("uniquePages")}</CardTitle>
              <LogIn className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.nodes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("transitions")}</CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.links.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Flow Visualization */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("flowVisualization")}</CardTitle>
          <CardDescription>{t("flowVisualizationDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {data && data.links.length > 0 ? (
            <UserFlowChart nodes={data.nodes} links={data.links} locale={locale} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">{t("noData")}</div>
          )}
        </CardContent>
      </Card>

      {/* Entry and Exit Pages */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Entry Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-green-500" />
              {t("topEntryPages")}
            </CardTitle>
            <CardDescription>{t("topEntryPagesDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {data && data.topEntryPages.length > 0 ? (
              <div className="space-y-3">
                {data.topEntryPages.map((page, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate max-w-[250px]" title={page.page}>
                        {page.page || "/"}
                      </span>
                      <span className="font-medium">{page.count.toLocaleString()}</span>
                    </div>
                    <Progress value={(page.count / totalEntryCount) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">{t("noData")}</div>
            )}
          </CardContent>
        </Card>

        {/* Top Exit Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-red-500" />
              {t("topExitPages")}
            </CardTitle>
            <CardDescription>{t("topExitPagesDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {data && data.topExitPages.length > 0 ? (
              <div className="space-y-3">
                {data.topExitPages.map((page, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate max-w-[250px]" title={page.page}>
                        {page.page || "/"}
                      </span>
                      <span className="font-medium">{page.count.toLocaleString()}</span>
                    </div>
                    <Progress value={(page.count / totalExitCount) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">{t("noData")}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
