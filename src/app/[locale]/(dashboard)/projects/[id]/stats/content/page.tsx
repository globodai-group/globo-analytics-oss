import { redirect, notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  FileText,
  Clock,
  MousePointer,
  TrendingUp,
  Eye,
  ArrowDownToLine,
  Gauge,
} from "lucide-react";
import {
  getContentOverviewAction,
  getPagePerformanceAction,
  getScrollDepthStatsAction,
  getTimeOnPageStatsAction,
} from "@/lib/actions/content-performance";

interface ContentStatsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContentStatsPage({
  params,
}: ContentStatsPageProps) {
  const { id } = await params;
  const projectId = parseInt(id);
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user?.id) {
    redirect("/login");
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

  // Default to last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const dateRange = { startDate, endDate };

  const [overviewResult, pagesResult, scrollResult, timeResult] =
    await Promise.all([
      getContentOverviewAction(projectId, dateRange),
      getPagePerformanceAction(projectId, dateRange, 20),
      getScrollDepthStatsAction(projectId, dateRange),
      getTimeOnPageStatsAction(projectId, dateRange),
    ]);

  const overview = overviewResult.data;
  const pages = pagesResult.data || [];
  const scrollStats = scrollResult.data || [];
  const timeStats = timeResult.data || [];

  const t = {
    title: locale === "fr" ? "Performance du Contenu" : "Content Performance",
    subtitle:
      locale === "fr"
        ? "Analysez l'engagement des visiteurs avec votre contenu"
        : "Analyze visitor engagement with your content",
    back: locale === "fr" ? "Retour aux stats" : "Back to Stats",
    overview: locale === "fr" ? "Vue d'ensemble" : "Overview",
    pageviews: locale === "fr" ? "Pages vues" : "Pageviews",
    avgTime: locale === "fr" ? "Temps moyen" : "Avg. Time",
    avgScroll: locale === "fr" ? "Scroll moyen" : "Avg. Scroll",
    bounceRate: locale === "fr" ? "Taux de rebond" : "Bounce Rate",
    pagesRead: locale === "fr" ? "Pages lues à 100%" : "Pages read 100%",
    engagement: locale === "fr" ? "Score d'engagement" : "Engagement Score",
    scrollDepth: locale === "fr" ? "Profondeur de scroll" : "Scroll Depth",
    timeOnPage: locale === "fr" ? "Temps sur page" : "Time on Page",
    topPages: locale === "fr" ? "Top Pages" : "Top Pages",
    page: locale === "fr" ? "Page" : "Page",
    views: locale === "fr" ? "Vues" : "Views",
    scroll: locale === "fr" ? "Scroll" : "Scroll",
    exitRate: locale === "fr" ? "Taux sortie" : "Exit Rate",
    noData: locale === "fr" ? "Aucune donnée disponible" : "No data available",
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}/stats`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>
        <Badge variant="outline">{project.name}</Badge>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {t.pageviews}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {overview.totalPageviews.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t.avgTime}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatTime(overview.avgTimeOnPage)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <ArrowDownToLine className="h-3 w-3" />
                {t.avgScroll}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{overview.avgScrollDepth}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <MousePointer className="h-3 w-3" />
                {t.bounceRate}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{overview.avgBounceRate}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {t.pagesRead}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {overview.pagesRead100.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                {t.engagement}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">{overview.engagementScore}</p>
                <Progress value={overview.engagementScore} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scroll Depth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5" />
              {t.scrollDepth}
            </CardTitle>
            <CardDescription>
              {locale === "fr"
                ? "Distribution de la profondeur de scroll"
                : "Scroll depth distribution across pages"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scrollStats.length > 0 ? (
              <div className="space-y-4">
                {scrollStats.map((stat) => (
                  <div key={stat.depth} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{stat.depth}%</span>
                      <span className="text-muted-foreground">
                        {stat.count.toLocaleString()} ({stat.percentage}%)
                      </span>
                    </div>
                    <Progress value={stat.percentage} className="h-3" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {t.noData}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Time on Page */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t.timeOnPage}
            </CardTitle>
            <CardDescription>
              {locale === "fr"
                ? "Distribution du temps passé sur les pages"
                : "Time spent on pages distribution"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {timeStats.length > 0 ? (
              <div className="space-y-4">
                {timeStats.map((stat) => (
                  <div key={stat.bucket} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{stat.bucket}</span>
                      <span className="text-muted-foreground">
                        {stat.count.toLocaleString()} ({stat.percentage}%)
                      </span>
                    </div>
                    <Progress value={stat.percentage} className="h-3" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {t.noData}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Pages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t.topPages}
          </CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Performance détaillée par page"
              : "Detailed performance by page"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pages.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.page}</TableHead>
                  <TableHead className="text-right">{t.views}</TableHead>
                  <TableHead className="text-right">{t.bounceRate}</TableHead>
                  <TableHead className="text-right">{t.scroll}</TableHead>
                  <TableHead className="text-right">{t.exitRate}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.path}>
                    <TableCell className="font-mono text-sm max-w-xs truncate">
                      {page.path}
                    </TableCell>
                    <TableCell className="text-right">
                      {page.pageviews.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          page.bounceRate > 70 ? "destructive" : "secondary"
                        }
                      >
                        {page.bounceRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress
                          value={page.scrollDepth["100"]}
                          className="w-16 h-2"
                        />
                        <span className="text-sm text-muted-foreground w-10">
                          {page.scrollDepth["100"]}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {page.exitRate}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">{t.noData}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
