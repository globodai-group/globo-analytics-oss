import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Users,
  Activity,
  Clock,
  Eye,
  MousePointerClick,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  BarChart3,
  MapPin,
  Layers,
} from "lucide-react";
import { RealTimeWidget } from "@/components/analytics/realtime-widget";
import { ProjectStatsChart } from "@/components/analytics/project-stats-chart";
import { ProjectDateRangePicker } from "@/components/analytics/project-date-range-picker";
import { TrafficCategoryCard } from "@/components/analytics/traffic-category-card";
import { TrafficCategoryBreakdown } from "@/components/analytics/traffic-category-breakdown";
import { GeoMap } from "@/components/analytics/geo-map";
import { SegmentSelector } from "@/components/segments/segment-selector";
import { KPIBar } from "@/components/analytics/kpi-bar";
import { StatsBreakdownTable } from "@/components/analytics/stats-breakdown-table";
import { subDays, format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { getCountryName } from "@/lib/analytics/geoip";

interface ProjectStatsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function ProjectStatsPage({
  params,
  searchParams,
}: ProjectStatsPageProps) {
  const { id } = await params;
  const { from, to } = await searchParams;
  const session = await auth();
  const t = await getTranslations();
  const locale = await getLocale();
  const dateLocale = locale === "fr" ? fr : enUS;

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
    include: {
      domains: true,
    },
  });

  if (!project) {
    notFound();
  }

  // Date range (default: last 30 days)
  const endDate = to ? new Date(to) : new Date();
  const startDate = from ? new Date(from) : subDays(endDate, 30);

  // Previous period for comparison
  const periodLength = endDate.getTime() - startDate.getTime();
  const prevEndDate = new Date(startDate.getTime() - 1);
  const prevStartDate = new Date(prevEndDate.getTime() - periodLength);

  // Fetch all stats in parallel
  const [
    // Current period
    totalUsers,
    totalSessions,
    totalPageviews,
    avgEngagementTime,
    sessionsData,
    realtimeCount,
    topPages,
    topEvents,
    topCountries,
    topDevices,
    topBrowsers,
    topOS,
    topReferrers,
    // Previous period for comparison
    prevUsers,
    prevSessions,
    prevPageviews,
    prevEngagementTime,
    prevSessionsData,
  ] = await Promise.all([
    // Current - Total unique users
    prisma.visitor.count({
      where: {
        projectId,
        firstSeenAt: { gte: startDate, lte: endDate },
      },
    }),
    // Current - Total sessions
    prisma.projectSession.count({
      where: {
        projectId,
        startedAt: { gte: startDate, lte: endDate },
      },
    }),
    // Current - Total pageviews
    prisma.projectSession.aggregate({
      where: {
        projectId,
        startedAt: { gte: startDate, lte: endDate },
      },
      _sum: { pageviews: true },
    }),
    // Current - Average engagement time
    prisma.projectSession.aggregate({
      where: {
        projectId,
        startedAt: { gte: startDate, lte: endDate },
        isEngaged: true,
      },
      _avg: { engagementTime: true },
    }),
    // Sessions for bounce rate
    prisma.projectSession.findMany({
      where: {
        projectId,
        startedAt: { gte: startDate, lte: endDate },
      },
      select: { isBounce: true },
    }),
    // Real-time users
    prisma.realtimeUser.count({
      where: {
        projectId,
        lastPingAt: { gte: subDays(new Date(), 0.00347) },
      },
    }),
    // Top pages
    prisma.projectStat.findMany({
      where: {
        projectId,
        name: "page",
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { count: "desc" },
      take: 10,
    }),
    // Top events
    prisma.projectStat.findMany({
      where: {
        projectId,
        name: "event",
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { count: "desc" },
      take: 10,
    }),
    // Top countries
    prisma.projectStat.findMany({
      where: {
        projectId,
        name: "country",
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { count: "desc" },
      take: 10,
    }),
    // Top devices
    prisma.projectStat.findMany({
      where: {
        projectId,
        name: "device",
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { count: "desc" },
      take: 10,
    }),
    // Top browsers
    prisma.projectStat.findMany({
      where: {
        projectId,
        name: "browser",
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { count: "desc" },
      take: 10,
    }),
    // Top OS
    prisma.projectStat.findMany({
      where: {
        projectId,
        name: "os",
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { count: "desc" },
      take: 10,
    }),
    // Top referrers
    prisma.projectStat.findMany({
      where: {
        projectId,
        name: "referrer",
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { count: "desc" },
      take: 10,
    }),
    // Previous - Users
    prisma.visitor.count({
      where: {
        projectId,
        firstSeenAt: { gte: prevStartDate, lte: prevEndDate },
      },
    }),
    // Previous - Sessions
    prisma.projectSession.count({
      where: {
        projectId,
        startedAt: { gte: prevStartDate, lte: prevEndDate },
      },
    }),
    // Previous - Pageviews
    prisma.projectSession.aggregate({
      where: {
        projectId,
        startedAt: { gte: prevStartDate, lte: prevEndDate },
      },
      _sum: { pageviews: true },
    }),
    // Previous - Engagement
    prisma.projectSession.aggregate({
      where: {
        projectId,
        startedAt: { gte: prevStartDate, lte: prevEndDate },
        isEngaged: true,
      },
      _avg: { engagementTime: true },
    }),
    // Previous - Sessions for bounce rate
    prisma.projectSession.findMany({
      where: {
        projectId,
        startedAt: { gte: prevStartDate, lte: prevEndDate },
      },
      select: { isBounce: true },
    }),
  ]);

  // Calculate metrics
  const avgEngagement = Math.round(avgEngagementTime._avg?.engagementTime || 0);
  const prevAvgEngagement = Math.round(
    prevEngagementTime._avg?.engagementTime || 0,
  );
  const pageviewsCount = totalPageviews._sum?.pageviews || 0;
  const prevPageviewsCount = prevPageviews._sum?.pageviews || 0;
  const bounceCount = sessionsData.filter((s) => s.isBounce).length;
  const bounceRate =
    sessionsData.length > 0 ? (bounceCount / sessionsData.length) * 100 : 0;
  const prevBounceCount = prevSessionsData.filter((s) => s.isBounce).length;
  const prevBounceRate =
    prevSessionsData.length > 0
      ? (prevBounceCount / prevSessionsData.length) * 100
      : 0;
  const engagementRate =
    sessionsData.length > 0
      ? ((sessionsData.length - bounceCount) / sessionsData.length) * 100
      : 0;
  const prevEngagementRate =
    prevSessionsData.length > 0
      ? ((prevSessionsData.length - prevBounceCount) /
          prevSessionsData.length) *
        100
      : 0;
  const pagesPerSession =
    totalSessions > 0 ? pageviewsCount / totalSessions : 0;
  const _prevPagesPerSession =
    prevSessions > 0 ? prevPageviewsCount / prevSessions : 0;

  // KPI metrics for the bar
  const kpiMetrics = [
    {
      id: "users",
      label: locale === "fr" ? "Utilisateurs" : "Users",
      value: totalUsers,
      previousValue: prevUsers,
      format: "number" as const,
    },
    {
      id: "sessions",
      label: locale === "fr" ? "Sessions" : "Sessions",
      value: totalSessions,
      previousValue: prevSessions,
      format: "number" as const,
    },
    {
      id: "pageviews",
      label: locale === "fr" ? "Pages vues" : "Pageviews",
      value: pageviewsCount,
      previousValue: prevPageviewsCount,
      format: "number" as const,
    },
    {
      id: "engagement",
      label: locale === "fr" ? "Durée moy." : "Avg. Duration",
      value: avgEngagement,
      previousValue: prevAvgEngagement,
      format: "time" as const,
    },
    {
      id: "bounceRate",
      label: locale === "fr" ? "Taux de rebond" : "Bounce Rate",
      value: bounceRate,
      previousValue: prevBounceRate,
      format: "percent" as const,
      inverted: true,
    },
    {
      id: "engagementRate",
      label: locale === "fr" ? "Taux d'engagement" : "Engagement Rate",
      value: engagementRate,
      previousValue: prevEngagementRate,
      format: "percent" as const,
    },
  ];

  // Device icon helper
  const getDeviceIcon = (device: string) => {
    const d = device.toLowerCase();
    if (d.includes("mobile") || d.includes("phone"))
      return <Smartphone className="h-4 w-4 text-muted-foreground" />;
    if (d.includes("tablet") || d.includes("ipad"))
      return <Tablet className="h-4 w-4 text-muted-foreground" />;
    return <Monitor className="h-4 w-4 text-muted-foreground" />;
  };

  // Format date range display
  const _dateRangeLabel = `${format(startDate, "d MMM", { locale: dateLocale })} - ${format(endDate, "d MMM yyyy", { locale: dateLocale })}`;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-start sm:justify-between sm:gap-4">
        {/* Title row */}
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/projects" className="shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg sm:text-xl font-semibold truncate">
            {project.name}
          </h1>
        </div>
        {/* Controls row - full width on mobile */}
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          <SegmentSelector projectId={project.id} />
          <ProjectDateRangePicker projectId={project.id} />
        </div>
      </div>

      {/* Real-time Widget */}
      <RealTimeWidget projectId={project.id} initialCount={realtimeCount} />

      {/* KPI Bar */}
      <KPIBar metrics={kpiMetrics} />

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="bg-muted/50 p-1 w-max sm:w-auto">
            <TabsTrigger
              value="overview"
              className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-2.5 sm:px-3"
            >
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">
                {locale === "fr" ? "Vue d'ensemble" : "Overview"}
              </span>
              <span className="xs:hidden">
                {locale === "fr" ? "Vue" : "Overview"}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="audience"
              className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-2.5 sm:px-3"
            >
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {locale === "fr" ? "Audience" : "Audience"}
            </TabsTrigger>
            <TabsTrigger
              value="behavior"
              className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-2.5 sm:px-3"
            >
              <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">
                {locale === "fr" ? "Comportement" : "Behavior"}
              </span>
              <span className="sm:hidden">
                {locale === "fr" ? "Comport." : "Behavior"}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="geography"
              className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-2.5 sm:px-3"
            >
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">
                {locale === "fr" ? "Géographie" : "Geography"}
              </span>
              <span className="sm:hidden">
                {locale === "fr" ? "Géo" : "Geo"}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Chart Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                {locale === "fr"
                  ? "Activité dans le temps"
                  : "Activity over time"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectStatsChart
                projectId={project.id}
                startDate={startDate}
                endDate={endDate}
              />
            </CardContent>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Pages */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  {locale === "fr" ? "Pages les plus vues" : "Top Pages"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatsBreakdownTable
                  title=""
                  data={topPages.map((p) => ({
                    label: p.value || "/",
                    value: Number(p.count),
                  }))}
                  emptyMessage={t("stats.noData")}
                />
              </CardContent>
            </Card>

            {/* Top Events */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                  {locale === "fr" ? "Événements principaux" : "Top Events"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatsBreakdownTable
                  title=""
                  data={topEvents.map((e) => ({
                    label: e.value,
                    value: Number(e.count),
                  }))}
                  emptyMessage={t("stats.noData")}
                />
              </CardContent>
            </Card>

            {/* Top Referrers */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  {locale === "fr" ? "Sources de trafic" : "Traffic Sources"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatsBreakdownTable
                  title=""
                  data={topReferrers.map((r) => ({
                    label: r.value || (locale === "fr" ? "Direct" : "Direct"),
                    value: Number(r.count),
                  }))}
                  emptyMessage={t("stats.noData")}
                />
              </CardContent>
            </Card>

            {/* Traffic Categories Preview */}
            <TrafficCategoryCard
              projectId={project.id}
              dateRange={{ from: startDate, to: endDate }}
            />
          </div>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          {/* Traffic Category Breakdown */}
          <TrafficCategoryBreakdown
            projectId={project.id}
            dateRange={{ from: startDate, to: endDate }}
          />

          {/* Technology Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Devices */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  {locale === "fr" ? "Appareils" : "Devices"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatsBreakdownTable
                  title=""
                  data={topDevices.map((d) => ({
                    label: d.value || (locale === "fr" ? "Inconnu" : "Unknown"),
                    value: Number(d.count),
                    icon: getDeviceIcon(d.value),
                  }))}
                  emptyMessage={t("stats.noData")}
                />
              </CardContent>
            </Card>

            {/* Browsers */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  {t("stats.browsers")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatsBreakdownTable
                  title=""
                  data={topBrowsers.map((b) => ({
                    label: b.value || (locale === "fr" ? "Inconnu" : "Unknown"),
                    value: Number(b.count),
                  }))}
                  emptyMessage={t("stats.noData")}
                />
              </CardContent>
            </Card>

            {/* Operating Systems */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  {t("stats.operatingSystems")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatsBreakdownTable
                  title=""
                  data={topOS.map((o) => ({
                    label: o.value || (locale === "fr" ? "Inconnu" : "Unknown"),
                    value: Number(o.count),
                  }))}
                  emptyMessage={t("stats.noData")}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior" className="space-y-6">
          {/* Engagement Metrics */}
          <div className="grid gap-6 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">
                      {pagesPerSession.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {locale === "fr" ? "Pages / session" : "Pages / session"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">
                      {engagementRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {locale === "fr"
                        ? "Taux d'engagement"
                        : "Engagement rate"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <MousePointerClick className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">
                      {bounceRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {locale === "fr" ? "Taux de rebond" : "Bounce rate"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">
                      {avgEngagement < 60
                        ? `${avgEngagement}s`
                        : `${Math.floor(avgEngagement / 60)}m ${avgEngagement % 60}s`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {locale === "fr" ? "Durée moyenne" : "Avg. duration"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pages and Events side by side */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* All Pages */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  {locale === "fr" ? "Toutes les pages" : "All Pages"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatsBreakdownTable
                  title=""
                  data={topPages.map((p) => ({
                    label: p.value || "/",
                    value: Number(p.count),
                  }))}
                  maxRows={10}
                  emptyMessage={t("stats.noData")}
                />
              </CardContent>
            </Card>

            {/* All Events */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                  {locale === "fr" ? "Tous les événements" : "All Events"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatsBreakdownTable
                  title=""
                  data={topEvents.map((e) => ({
                    label: e.value,
                    value: Number(e.count),
                  }))}
                  maxRows={10}
                  emptyMessage={t("stats.noData")}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Geography Tab */}
        <TabsContent value="geography" className="space-y-6">
          {/* Map */}
          <GeoMap
            projectId={project.id}
            dateRange={{ from: startDate, to: endDate }}
          />

          {/* Countries Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                {locale === "fr" ? "Utilisateurs par pays" : "Users by Country"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatsBreakdownTable
                title=""
                data={topCountries.map((c) => ({
                  label: c.value
                    ? `${getCountryName(c.value)} (${c.value})`
                    : locale === "fr"
                      ? "Inconnu"
                      : "Unknown",
                  value: Number(c.count),
                }))}
                maxRows={10}
                emptyMessage={t("stats.noData")}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
