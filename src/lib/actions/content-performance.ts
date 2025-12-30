"use server";

import { prisma } from "@/lib/prisma";
import { hasProjectAccess } from "./with-project-ownership";
import type { ActionResult } from "@/lib/types/actions";

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface PagePerformance {
  path: string;
  pageviews: number;
  uniqueVisitors: number;
  avgTimeOnPage: number;
  bounceRate: number;
  scrollDepth: {
    "25": number;
    "50": number;
    "75": number;
    "100": number;
  };
  exitRate: number;
}

interface ScrollDepthStats {
  depth: number;
  count: number;
  percentage: number;
}

interface TimeOnPageStats {
  bucket: string;
  count: number;
  percentage: number;
}

interface ContentOverview {
  totalPageviews: number;
  avgTimeOnPage: number;
  avgScrollDepth: number;
  avgBounceRate: number;
  pagesRead100: number;
  engagementScore: number;
}

/**
 * Get content performance overview
 */
export async function getContentOverviewAction(
  projectId: number,
  dateRange: DateRange
): Promise<ActionResult<ContentOverview>> {
  try {
    const isOwner = await hasProjectAccess(projectId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized" };
    }

    // Get pageviews
    const pageviewStats = await prisma.projectStat.aggregate({
      where: {
        projectId,
        name: "pageviews",
        date: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      _sum: { count: true },
    });

    // Get scroll depth stats
    const scrollStats = await prisma.projectStat.groupBy({
      by: ["value"],
      where: {
        projectId,
        name: "scroll_depth",
        date: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      _sum: { count: true },
    });

    // Get time on page stats
    const timeStats = await prisma.projectStat.aggregate({
      where: {
        projectId,
        name: "time_on_page",
        date: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      _avg: { count: true },
    });

    // Get bounce rate
    const sessions = await prisma.projectSession.aggregate({
      where: {
        projectId,
        startedAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      _count: true,
    });

    const bounceSessions = await prisma.projectSession.count({
      where: {
        projectId,
        startedAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
        isBounce: true,
      },
    });

    const totalPageviews = Number(pageviewStats._sum.count || 0);
    const bounceRate = sessions._count > 0 ? (bounceSessions / sessions._count) * 100 : 0;

    // Calculate avg scroll depth
    let totalScrollEvents = 0;
    let weightedScrollSum = 0;
    scrollStats.forEach((stat) => {
      const depth = parseInt(stat.value);
      const count = Number(stat._sum.count || 0);
      weightedScrollSum += depth * count;
      totalScrollEvents += count;
    });
    const avgScrollDepth = totalScrollEvents > 0 ? weightedScrollSum / totalScrollEvents : 0;

    // Count pages read to 100%
    const pagesRead100 = scrollStats.find((s) => s.value === "100")?._sum.count || BigInt(0);

    // Calculate engagement score (0-100)
    const engagementScore = Math.min(
      100,
      Math.round(
        avgScrollDepth * 0.4 +
          (100 - bounceRate) * 0.4 +
          (Math.min(Number(timeStats._avg.count || 0), 300) / 300) * 20
      )
    );

    return {
      success: true,
      data: {
        totalPageviews,
        avgTimeOnPage: Number(timeStats._avg.count || 0),
        avgScrollDepth: Math.round(avgScrollDepth),
        avgBounceRate: Math.round(bounceRate * 10) / 10,
        pagesRead100: Number(pagesRead100),
        engagementScore,
      },
    };
  } catch (error) {
    console.error("Error getting content overview:", error);
    return { success: false, error: "Failed to get content overview" };
  }
}

/**
 * Get page performance data
 */
export async function getPagePerformanceAction(
  projectId: number,
  dateRange: DateRange,
  limit = 20
): Promise<ActionResult<PagePerformance[]>> {
  try {
    const isOwner = await hasProjectAccess(projectId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized" };
    }

    // Get page stats
    const pageStats = await prisma.projectStat.groupBy({
      by: ["value"],
      where: {
        projectId,
        name: "page",
        date: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      _sum: { count: true },
      orderBy: {
        _sum: { count: "desc" },
      },
      take: limit,
    });

    // Get sessions by entry page for bounce calculation
    const sessionStats = await prisma.projectSession.groupBy({
      by: ["entryPage"],
      where: {
        projectId,
        startedAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      _count: true,
    });

    const bounceStats = await prisma.projectSession.groupBy({
      by: ["entryPage"],
      where: {
        projectId,
        startedAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
        isBounce: true,
      },
      _count: true,
    });

    // Get exit page stats
    const exitStats = await prisma.projectSession.groupBy({
      by: ["exitPage"],
      where: {
        projectId,
        startedAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      _count: true,
    });

    // Get scroll depth per page (from ProjectStat - we'd need custom tracking)
    // For now, use session's maxScrollDepth as approximation
    const scrollByPage = await prisma.projectSession.groupBy({
      by: ["entryPage"],
      where: {
        projectId,
        startedAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      _avg: { maxScrollDepth: true },
    });

    // Build page performance data
    const sessionMap = new Map(sessionStats.map((s) => [s.entryPage, s._count]));
    const bounceMap = new Map(bounceStats.map((s) => [s.entryPage, s._count]));
    const exitMap = new Map(exitStats.map((s) => [s.exitPage, s._count]));
    const scrollMap = new Map(scrollByPage.map((s) => [s.entryPage, s._avg.maxScrollDepth || 0]));

    const totalSessions = sessionStats.reduce((acc, s) => acc + s._count, 0);

    const pages: PagePerformance[] = pageStats.map((stat) => {
      const path = stat.value;
      const pageviews = Number(stat._sum.count || 0);
      const sessions = sessionMap.get(path) || 0;
      const bounces = bounceMap.get(path) || 0;
      const exits = exitMap.get(path) || 0;
      const avgScroll = scrollMap.get(path) || 0;

      return {
        path,
        pageviews,
        uniqueVisitors: sessions, // Approximation
        avgTimeOnPage: 0, // Would need per-page time tracking
        bounceRate: sessions > 0 ? Math.round((bounces / sessions) * 100) : 0,
        scrollDepth: {
          "25": avgScroll >= 25 ? 100 : Math.round((avgScroll / 25) * 100),
          "50": avgScroll >= 50 ? 100 : Math.round((avgScroll / 50) * 100),
          "75": avgScroll >= 75 ? 100 : Math.round((avgScroll / 75) * 100),
          "100": avgScroll >= 100 ? 100 : Math.round(avgScroll),
        },
        exitRate: totalSessions > 0 ? Math.round((exits / totalSessions) * 100) : 0,
      };
    });

    return { success: true, data: pages };
  } catch (error) {
    console.error("Error getting page performance:", error);
    return { success: false, error: "Failed to get page performance" };
  }
}

/**
 * Get scroll depth distribution
 */
export async function getScrollDepthStatsAction(
  projectId: number,
  dateRange: DateRange
): Promise<ActionResult<ScrollDepthStats[]>> {
  try {
    const isOwner = await hasProjectAccess(projectId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized" };
    }

    const stats = await prisma.projectStat.groupBy({
      by: ["value"],
      where: {
        projectId,
        name: "scroll_depth",
        date: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      _sum: { count: true },
    });

    const total = stats.reduce((acc, s) => acc + Number(s._sum.count || 0), 0);

    const scrollStats: ScrollDepthStats[] = [25, 50, 75, 100].map((depth) => {
      const stat = stats.find((s) => s.value === String(depth));
      const count = Number(stat?._sum.count || 0);
      return {
        depth,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });

    return { success: true, data: scrollStats };
  } catch (error) {
    console.error("Error getting scroll depth stats:", error);
    return { success: false, error: "Failed to get scroll depth stats" };
  }
}

/**
 * Get time on page distribution
 */
export async function getTimeOnPageStatsAction(
  projectId: number,
  dateRange: DateRange
): Promise<ActionResult<TimeOnPageStats[]>> {
  try {
    const isOwner = await hasProjectAccess(projectId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized" };
    }

    const stats = await prisma.projectStat.groupBy({
      by: ["value"],
      where: {
        projectId,
        name: "time_on_page",
        date: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      _sum: { count: true },
    });

    // Group into time buckets
    const buckets = {
      "0-10s": 0,
      "10-30s": 0,
      "30-60s": 0,
      "1-3min": 0,
      "3-10min": 0,
      "10min+": 0,
    };

    stats.forEach((stat) => {
      const seconds = parseInt(stat.value);
      const count = Number(stat._sum.count || 0);

      if (seconds < 10) buckets["0-10s"] += count;
      else if (seconds < 30) buckets["10-30s"] += count;
      else if (seconds < 60) buckets["30-60s"] += count;
      else if (seconds < 180) buckets["1-3min"] += count;
      else if (seconds < 600) buckets["3-10min"] += count;
      else buckets["10min+"] += count;
    });

    const total = Object.values(buckets).reduce((a, b) => a + b, 0);

    const timeStats: TimeOnPageStats[] = Object.entries(buckets).map(([bucket, count]) => ({
      bucket,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    return { success: true, data: timeStats };
  } catch (error) {
    console.error("Error getting time on page stats:", error);
    return { success: false, error: "Failed to get time on page stats" };
  }
}

/**
 * Get top performing content
 */
export async function getTopContentAction(
  projectId: number,
  dateRange: DateRange,
  sortBy: "pageviews" | "engagement" | "scroll" = "pageviews",
  limit = 10
): Promise<ActionResult<PagePerformance[]>> {
  try {
    const result = await getPagePerformanceAction(projectId, dateRange, 100);
    if (!result.success || !result.data) {
      return result;
    }

    const sorted = [...result.data];

    switch (sortBy) {
      case "engagement":
        sorted.sort((a, b) => 100 - b.bounceRate - (100 - a.bounceRate));
        break;
      case "scroll":
        sorted.sort(
          (a, b) =>
            parseInt(b.scrollDepth["100"].toString()) - parseInt(a.scrollDepth["100"].toString())
        );
        break;
      default:
        sorted.sort((a, b) => b.pageviews - a.pageviews);
    }

    return { success: true, data: sorted.slice(0, limit) };
  } catch (error) {
    console.error("Error getting top content:", error);
    return { success: false, error: "Failed to get top content" };
  }
}
