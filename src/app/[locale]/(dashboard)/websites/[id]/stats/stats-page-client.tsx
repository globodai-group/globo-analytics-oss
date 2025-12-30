"use client";

import { useState, useEffect, useCallback } from "react";
import { clientLogger } from "@/lib/client-logger";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Eye,
  Globe,
  Monitor,
  Smartphone,
  FileText,
  TrendingDown,
  Clock,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  LogIn,
  LogOut,
  Link as LinkIcon,
} from "lucide-react";
import {
  DateRangePicker,
  StatsChart,
  StatsCard,
  StatsTable,
  type ChartDataPoint,
  type StatsTableRow,
} from "@/components/analytics";
import {
  getStatsOverviewAction,
  getChartDataAction,
  getStatsByTypeAction,
} from "@/lib/actions/stats";

interface StatsPageClientProps {
  websiteId: number;
  locale: string;
}

interface StatsOverview {
  visitors: number;
  pageviews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: string;
  previousVisitors: number;
  previousPageviews: number;
  previousUniqueVisitors: number;
  previousBounceRate: number;
}

export function StatsPageClient({ websiteId }: StatsPageClientProps) {
  const t = useTranslations();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [activeTab, setActiveTab] = useState("pages");
  const [tableData, setTableData] = useState<StatsTableRow[]>([]);
  const [tablePage, setTablePage] = useState(1);
  const [tableTotalPages, setTableTotalPages] = useState(1);
  const [isTableLoading, setIsTableLoading] = useState(false);

  // Fetch overview and chart data
  const fetchMainData = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    setIsLoading(true);
    try {
      const [overviewResult, chartResult] = await Promise.all([
        getStatsOverviewAction(websiteId, {
          from: dateRange.from,
          to: dateRange.to,
        }),
        getChartDataAction(websiteId, {
          from: dateRange.from,
          to: dateRange.to,
        }),
      ]);

      if (overviewResult.success && overviewResult.data) {
        setOverview(overviewResult.data);
      }
      if (chartResult.success && chartResult.data) {
        setChartData(chartResult.data);
      }
    } catch (error) {
      clientLogger.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [websiteId, dateRange]);

  // Fetch table data based on active tab
  const fetchTableData = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    setIsTableLoading(true);
    try {
      const statTypeMap: Record<string, string> = {
        pages: "page",
        landing_pages: "landing_page",
        exit_pages: "exit_page",
        referrers: "referrer",
        traffic_sources: "traffic_source",
        countries: "country",
        browsers: "browser",
        devices: "device",
        os: "os",
      };

      const statType = statTypeMap[activeTab] || "page";
      const result = await getStatsByTypeAction(
        websiteId,
        statType as Parameters<typeof getStatsByTypeAction>[1],
        { from: dateRange.from, to: dateRange.to },
        tablePage,
        10
      );

      if (result.success && result.data) {
        setTableData(
          result.data.data.map((row) => ({
            label: row.value,
            count: row.count,
            percentage: row.percentage,
          }))
        );
        setTableTotalPages(result.data.totalPages);
      }
    } catch (error) {
      clientLogger.error("Error fetching table data:", error);
    } finally {
      setIsTableLoading(false);
    }
  }, [websiteId, dateRange, activeTab, tablePage]);

  // Initial data fetch
  useEffect(() => {
    fetchMainData();
  }, [fetchMainData]);

  // Fetch table data when tab or page changes
  useEffect(() => {
    fetchTableData();
  }, [fetchTableData]);

  // Reset page when tab changes
  useEffect(() => {
    setTablePage(1);
  }, [activeTab]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setTablePage(1);
  };

  return (
    <div className="space-y-6">
      {/* Date Range Picker */}
      <div className="flex justify-end">
        <DateRangePicker dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {isLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <StatsCard
              title={t("stats.sessions")}
              value={overview?.visitors || 0}
              previousValue={overview?.previousVisitors}
              icon={Users}
            />
            <StatsCard
              title={t("stats.pageviews")}
              value={overview?.pageviews || 0}
              previousValue={overview?.previousPageviews}
              icon={Eye}
            />
            <StatsCard
              title={t("stats.uniqueVisitors")}
              value={overview?.uniqueVisitors || 0}
              previousValue={overview?.previousUniqueVisitors}
              icon={UserCheck}
            />
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("stats.bounceRate")}
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview?.bounceRate !== undefined ? `${overview.bounceRate}%` : "--"}
                </div>
                {overview?.previousBounceRate !== undefined &&
                  overview.bounceRate !== undefined && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      {overview.bounceRate < overview.previousBounceRate ? (
                        <>
                          <ArrowDownRight className="h-3 w-3 text-green-500" />
                          <span className="text-green-500">
                            {Math.abs(overview.bounceRate - overview.previousBounceRate)}%
                          </span>
                        </>
                      ) : overview.bounceRate > overview.previousBounceRate ? (
                        <>
                          <ArrowUpRight className="h-3 w-3 text-red-500" />
                          <span className="text-red-500">
                            +{overview.bounceRate - overview.previousBounceRate}%
                          </span>
                        </>
                      ) : (
                        <span>0%</span>
                      )}
                      <span className="ml-1">{t("stats.vsPreviousPeriod")}</span>
                    </p>
                  )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("stats.avgSessionDuration")}
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.avgSessionDuration || "--"}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("stats.averageTimePerSession")}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t("stats.overview")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[350px] w-full" />
          ) : chartData.length > 0 ? (
            <StatsChart data={chartData} />
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              {t("stats.noDataYet")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Tables */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex-wrap h-auto gap-1">
              <TabsTrigger value="pages" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t("stats.pages")}
              </TabsTrigger>
              <TabsTrigger value="landing_pages" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                {t("stats.landingPages")}
              </TabsTrigger>
              <TabsTrigger value="exit_pages" className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                {t("stats.exitPages")}
              </TabsTrigger>
              <TabsTrigger value="referrers" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                {t("stats.referrers")}
              </TabsTrigger>
              <TabsTrigger value="traffic_sources" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                {t("stats.trafficSources")}
              </TabsTrigger>
              <TabsTrigger value="countries" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {t("stats.countries")}
              </TabsTrigger>
              <TabsTrigger value="browsers" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                {t("stats.browsers")}
              </TabsTrigger>
              <TabsTrigger value="devices" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                {t("stats.devices")}
              </TabsTrigger>
              <TabsTrigger value="os" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                {t("stats.operatingSystems")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {isTableLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <StatsTable
                  data={tableData}
                  currentPage={tablePage}
                  totalPages={tableTotalPages}
                  onPageChange={setTablePage}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-20 mt-2" />
      </CardContent>
    </Card>
  );
}
