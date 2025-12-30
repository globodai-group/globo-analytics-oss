import { prisma } from "@/lib/prisma";
import { StatType } from "@prisma/client";
import { subDays, startOfDay, endOfDay, eachDayOfInterval, format } from "date-fns";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface StatsOverview {
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

export interface StatRow {
  value: string;
  count: number;
  percentage: number;
}

export interface ChartDataPoint {
  date: string;
  visitors: number;
  pageviews: number;
  bounceRate?: number;
}

export interface EngagementMetrics {
  bounceRate: number;
  avgSessionDuration: string;
  avgPageDepth: number;
  scrollDepthDistribution: { bucket: string; percentage: number }[];
  timeOnPageDistribution: { bucket: string; percentage: number }[];
}

/**
 * Get default date range (last 30 days)
 */
export function getDefaultDateRange(): DateRange {
  return {
    from: startOfDay(subDays(new Date(), 29)),
    to: endOfDay(new Date()),
  };
}

/**
 * Get previous period for comparison
 */
export function getPreviousPeriod(range: DateRange): DateRange {
  const days = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24));
  return {
    from: subDays(range.from, days),
    to: subDays(range.to, days),
  };
}

/**
 * Calculate bounce rate from stats
 */
async function calculateBounceRate(
  websiteId: number,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const bounceStats = await prisma.stat.aggregate({
    where: {
      websiteId,
      name: "bounce",
      value: "true",
      date: { gte: startDate, lte: endDate },
    },
    _sum: { count: true },
  });

  const sessionStats = await prisma.stat.aggregate({
    where: {
      websiteId,
      name: "visitors",
      date: { gte: startDate, lte: endDate },
    },
    _sum: { count: true },
  });

  const bounces = Number(bounceStats._sum?.count || 0);
  const sessions = Number(sessionStats._sum?.count || 0);

  if (sessions === 0) return 0;
  return Math.round((bounces / sessions) * 100);
}

/**
 * Calculate average session duration from stats
 */
async function calculateAvgSessionDuration(
  websiteId: number,
  startDate: Date,
  endDate: Date
): Promise<string> {
  const durationStats = await prisma.stat.findMany({
    where: {
      websiteId,
      name: "session_duration",
      date: { gte: startDate, lte: endDate },
    },
    select: { value: true, count: true },
  });

  // Map buckets to average seconds
  const bucketToSeconds: Record<string, number> = {
    "0-10s": 5,
    "10-30s": 20,
    "30-60s": 45,
    "1-3m": 120,
    "3-10m": 390,
    "10m+": 900,
  };

  let totalSeconds = 0;
  let totalSessions = 0;

  for (const stat of durationStats) {
    const seconds = bucketToSeconds[stat.value] || 0;
    const count = Number(stat.count);
    totalSeconds += seconds * count;
    totalSessions += count;
  }

  if (totalSessions === 0) return "0s";

  const avgSeconds = Math.round(totalSeconds / totalSessions);

  if (avgSeconds < 60) return `${avgSeconds}s`;
  if (avgSeconds < 3600) {
    const minutes = Math.floor(avgSeconds / 60);
    const seconds = avgSeconds % 60;
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(avgSeconds / 3600);
  const minutes = Math.floor((avgSeconds % 3600) / 60);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

/**
 * Get overview stats for a website
 */
export async function getStatsOverview(
  websiteId: number,
  dateRange: DateRange
): Promise<StatsOverview> {
  const previousRange = getPreviousPeriod(dateRange);
  const startDate = startOfDay(dateRange.from);
  const endDate = endOfDay(dateRange.to);
  const prevStartDate = startOfDay(previousRange.from);
  const prevEndDate = endOfDay(previousRange.to);

  // Fetch all stats in parallel
  const [currentStats, previousStats, bounceRate, previousBounceRate, avgSessionDuration] =
    await Promise.all([
      // Current period stats
      prisma.stat.groupBy({
        by: ["name"],
        where: {
          websiteId,
          name: { in: ["visitors", "pageviews", "unique_visitors"] },
          date: { gte: startDate, lte: endDate },
        },
        _sum: { count: true },
      }),
      // Previous period stats for comparison
      prisma.stat.groupBy({
        by: ["name"],
        where: {
          websiteId,
          name: { in: ["visitors", "pageviews", "unique_visitors"] },
          date: { gte: prevStartDate, lte: prevEndDate },
        },
        _sum: { count: true },
      }),
      // Bounce rate
      calculateBounceRate(websiteId, startDate, endDate),
      calculateBounceRate(websiteId, prevStartDate, prevEndDate),
      // Average session duration
      calculateAvgSessionDuration(websiteId, startDate, endDate),
    ]);

  const visitors = Number(currentStats.find((s) => s.name === "visitors")?._sum?.count || 0);
  const pageviews = Number(currentStats.find((s) => s.name === "pageviews")?._sum?.count || 0);
  const uniqueVisitors = Number(
    currentStats.find((s) => s.name === "unique_visitors")?._sum?.count || 0
  );
  const previousVisitors = Number(
    previousStats.find((s) => s.name === "visitors")?._sum?.count || 0
  );
  const previousPageviews = Number(
    previousStats.find((s) => s.name === "pageviews")?._sum?.count || 0
  );
  const previousUniqueVisitors = Number(
    previousStats.find((s) => s.name === "unique_visitors")?._sum?.count || 0
  );

  return {
    visitors,
    pageviews,
    uniqueVisitors,
    bounceRate,
    avgSessionDuration,
    previousVisitors,
    previousPageviews,
    previousUniqueVisitors,
    previousBounceRate,
  };
}

/**
 * Get engagement metrics for a website
 */
export async function getEngagementMetrics(
  websiteId: number,
  dateRange: DateRange
): Promise<EngagementMetrics> {
  const startDate = startOfDay(dateRange.from);
  const endDate = endOfDay(dateRange.to);

  const [bounceRate, avgSessionDuration, scrollDepthStats, timeOnPageStats, sessionStats] =
    await Promise.all([
      calculateBounceRate(websiteId, startDate, endDate),
      calculateAvgSessionDuration(websiteId, startDate, endDate),
      // Scroll depth distribution
      prisma.stat.groupBy({
        by: ["value"],
        where: { websiteId, name: "scroll_depth", date: { gte: startDate, lte: endDate } },
        _sum: { count: true },
      }),
      // Time on page distribution
      prisma.stat.groupBy({
        by: ["value"],
        where: { websiteId, name: "time_on_page", date: { gte: startDate, lte: endDate } },
        _sum: { count: true },
      }),
      // Session page depth (from AnalyticsSession)
      prisma.analyticsSession.aggregate({
        where: { websiteId, startedAt: { gte: startDate, lte: endDate } },
        _avg: { pageviews: true },
      }),
    ]);

  // Calculate scroll depth distribution
  const scrollTotal = scrollDepthStats.reduce((sum, s) => sum + Number(s._sum?.count || 0), 0);
  const scrollDepthDistribution = ["0%", "25%", "50%", "75%", "100%"].map((bucket) => {
    const stat = scrollDepthStats.find((s) => s.value === bucket);
    const count = Number(stat?._sum?.count || 0);
    return { bucket, percentage: scrollTotal > 0 ? Math.round((count / scrollTotal) * 100) : 0 };
  });

  // Calculate time on page distribution
  const timeTotal = timeOnPageStats.reduce((sum, s) => sum + Number(s._sum?.count || 0), 0);
  const timeOnPageDistribution = ["0-10s", "10-30s", "30-60s", "1-3m", "3-10m", "10m+"].map(
    (bucket) => {
      const stat = timeOnPageStats.find((s) => s.value === bucket);
      const count = Number(stat?._sum?.count || 0);
      return { bucket, percentage: timeTotal > 0 ? Math.round((count / timeTotal) * 100) : 0 };
    }
  );

  return {
    bounceRate,
    avgSessionDuration,
    avgPageDepth: Math.round((sessionStats._avg?.pageviews || 1) * 10) / 10,
    scrollDepthDistribution,
    timeOnPageDistribution,
  };
}

/**
 * Get chart data for visitors/pageviews over time
 */
export async function getChartData(
  websiteId: number,
  dateRange: DateRange
): Promise<ChartDataPoint[]> {
  // Get all dates in the range
  const dates = eachDayOfInterval({
    start: dateRange.from,
    end: dateRange.to,
  });

  // Fetch stats for the period
  const stats = await prisma.stat.findMany({
    where: {
      websiteId,
      name: { in: ["visitors", "pageviews", "bounce"] },
      date: {
        gte: startOfDay(dateRange.from),
        lte: endOfDay(dateRange.to),
      },
    },
    select: {
      name: true,
      value: true,
      count: true,
      date: true,
    },
  });

  // Group stats by date
  const statsByDate = new Map<string, { visitors: number; pageviews: number; bounces: number }>();

  for (const stat of stats) {
    const dateKey = format(stat.date, "yyyy-MM-dd");
    const existing = statsByDate.get(dateKey) || { visitors: 0, pageviews: 0, bounces: 0 };

    if (stat.name === "visitors") {
      existing.visitors += Number(stat.count);
    } else if (stat.name === "pageviews") {
      existing.pageviews += Number(stat.count);
    } else if (stat.name === "bounce" && stat.value === "true") {
      existing.bounces += Number(stat.count);
    }

    statsByDate.set(dateKey, existing);
  }

  // Build chart data with all dates
  return dates.map((date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const dayStats = statsByDate.get(dateKey) || { visitors: 0, pageviews: 0, bounces: 0 };
    const bounceRate =
      dayStats.visitors > 0 ? Math.round((dayStats.bounces / dayStats.visitors) * 100) : 0;

    return {
      date: dateKey,
      visitors: dayStats.visitors,
      pageviews: dayStats.pageviews,
      bounceRate,
    };
  });
}

/**
 * Get stats by type (pages, browsers, countries, etc.)
 */
export async function getStatsByType(
  websiteId: number,
  statType: StatType,
  dateRange: DateRange,
  limit = 10,
  offset = 0
): Promise<{ data: StatRow[]; total: number }> {
  // Get total count
  const totalResult = await prisma.stat.groupBy({
    by: ["value"],
    where: {
      websiteId,
      name: statType,
      date: {
        gte: startOfDay(dateRange.from),
        lte: endOfDay(dateRange.to),
      },
    },
  });

  const total = totalResult.length;

  // Get paginated stats
  const stats = await prisma.stat.groupBy({
    by: ["value"],
    where: {
      websiteId,
      name: statType,
      date: {
        gte: startOfDay(dateRange.from),
        lte: endOfDay(dateRange.to),
      },
    },
    _sum: {
      count: true,
    },
    orderBy: {
      _sum: {
        count: "desc",
      },
    },
    skip: offset,
    take: limit,
  });

  // Calculate total count for percentages
  const totalCount = stats.reduce((sum, s) => sum + Number(s._sum?.count || 0), 0);

  // Transform to StatRow format
  const data: StatRow[] = stats.map((s) => {
    const count = Number(s._sum?.count || 0);
    return {
      value: s.value,
      count,
      percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
    };
  });

  return { data, total };
}

/**
 * Get traffic source breakdown
 */
export async function getTrafficSources(
  websiteId: number,
  dateRange: DateRange
): Promise<{ source: string; visitors: number; percentage: number }[]> {
  const stats = await prisma.stat.groupBy({
    by: ["value"],
    where: {
      websiteId,
      name: "traffic_source",
      date: {
        gte: startOfDay(dateRange.from),
        lte: endOfDay(dateRange.to),
      },
    },
    _sum: { count: true },
    orderBy: { _sum: { count: "desc" } },
  });

  const total = stats.reduce((sum, s) => sum + Number(s._sum?.count || 0), 0);

  return stats.map((s) => ({
    source: s.value,
    visitors: Number(s._sum?.count || 0),
    percentage: total > 0 ? Math.round((Number(s._sum?.count || 0) / total) * 100) : 0,
  }));
}

/**
 * Get UTM campaign performance
 */
export async function getUtmCampaigns(
  websiteId: number,
  dateRange: DateRange
): Promise<
  {
    campaign: string;
    source: string;
    medium: string;
    visitors: number;
  }[]
> {
  const startDate = startOfDay(dateRange.from);
  const endDate = endOfDay(dateRange.to);

  // Get campaigns from sessions (more accurate, has all UTM params)
  const sessions = await prisma.analyticsSession.groupBy({
    by: ["utmCampaign", "utmSource", "utmMedium"],
    where: {
      websiteId,
      startedAt: { gte: startDate, lte: endDate },
      utmCampaign: { not: null },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 50,
  });

  return sessions.map((s) => ({
    campaign: s.utmCampaign || "Unknown",
    source: s.utmSource || "Unknown",
    medium: s.utmMedium || "Unknown",
    visitors: s._count.id,
  }));
}

/**
 * Get realtime stats (last hour)
 */
export async function getRealtimeStats(websiteId: number): Promise<{
  activeVisitors: number;
  pageviewsLastHour: number;
  topPages: { page: string; views: number }[];
}> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Count active sessions (sessions with activity in last 5 minutes)
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const activeSessions = await prisma.analyticsSession.count({
    where: {
      websiteId,
      lastActivityAt: { gte: fiveMinutesAgo },
    },
  });

  // Count pageviews in the last hour
  const stats = await prisma.stat.aggregate({
    where: {
      websiteId,
      name: "pageviews_hour",
      date: { gte: startOfDay(now) },
      value: now.getHours().toString(),
    },
    _sum: { count: true },
  });

  // Get top pages from recent sessions
  const recentPages = await prisma.analyticsSession.findMany({
    where: {
      websiteId,
      lastActivityAt: { gte: oneHourAgo },
    },
    select: { exitPage: true },
    take: 100,
  });

  // Count page occurrences
  const pageCount = new Map<string, number>();
  for (const session of recentPages) {
    const count = pageCount.get(session.exitPage) || 0;
    pageCount.set(session.exitPage, count + 1);
  }

  const topPages = Array.from(pageCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([page, views]) => ({ page, views }));

  const pageviewsLastHour = Number(stats._sum?.count || 0);

  return {
    activeVisitors: activeSessions,
    pageviewsLastHour,
    topPages,
  };
}

/**
 * Export stats data to CSV format
 */
export async function exportStatsToCsv(
  websiteId: number,
  statType: StatType,
  dateRange: DateRange
): Promise<{ name: string; count: string; percentage: string }[]> {
  const { data } = await getStatsByType(websiteId, statType, dateRange, 1000, 0);

  return data.map((row) => ({
    name: row.value,
    count: row.count.toString(),
    percentage: row.percentage.toFixed(1) + "%",
  }));
}

/**
 * Get top entry pages with engagement metrics
 */
export async function getTopEntryPages(
  websiteId: number,
  dateRange: DateRange,
  limit = 10
): Promise<
  {
    page: string;
    entries: number;
    bounceRate: number;
    avgTimeOnPage: string;
  }[]
> {
  const startDate = startOfDay(dateRange.from);
  const endDate = endOfDay(dateRange.to);

  // Get sessions grouped by entry page
  const sessions = await prisma.analyticsSession.groupBy({
    by: ["entryPage"],
    where: { websiteId, startedAt: { gte: startDate, lte: endDate } },
    _count: { id: true },
  });

  // Get bounce counts for entry pages
  const bounceSessions = await prisma.analyticsSession.groupBy({
    by: ["entryPage"],
    where: { websiteId, startedAt: { gte: startDate, lte: endDate }, isBounce: true },
    _count: { id: true },
  });

  const bounceMap = new Map(bounceSessions.map((b) => [b.entryPage, b._count.id]));

  return sessions
    .map((s) => {
      const bounces = bounceMap.get(s.entryPage) || 0;
      const bounceRate = s._count.id > 0 ? Math.round((bounces / s._count.id) * 100) : 0;

      return {
        page: s.entryPage,
        entries: s._count.id,
        bounceRate,
        avgTimeOnPage: "N/A", // Would need more granular tracking
      };
    })
    .sort((a, b) => b.entries - a.entries)
    .slice(0, limit);
}

/**
 * Get top exit pages
 */
export async function getTopExitPages(
  websiteId: number,
  dateRange: DateRange,
  limit = 10
): Promise<{ page: string; exits: number; percentage: number }[]> {
  const { data } = await getStatsByType(websiteId, "exit_page", dateRange, limit, 0);

  return data.map((d) => ({
    page: d.value,
    exits: d.count,
    percentage: d.percentage,
  }));
}
