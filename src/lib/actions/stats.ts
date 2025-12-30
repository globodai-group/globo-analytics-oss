"use server";

import { prisma } from "@/lib/prisma";
import {
  getStatsOverview,
  getChartData,
  getStatsByType,
  getRealtimeStats,
  exportStatsToCsv,
  getEngagementMetrics,
  getTrafficSources,
  getUtmCampaigns,
  getTopEntryPages,
  getTopExitPages,
  type DateRange,
  type StatsOverview,
  type StatRow,
  type ChartDataPoint,
  type EngagementMetrics,
} from "@/lib/analytics/queries";
import { StatType } from "@prisma/client";
import { hasWebsiteAccess } from "./with-website-ownership";
import { hasProjectAccess } from "./with-project-ownership";

// TODO: Migrate to centralized ActionResult from @/lib/types/actions
interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get stats overview for a website
 */
export async function getStatsOverviewAction(
  websiteId: number,
  dateRange: DateRange
): Promise<ActionResult<StatsOverview>> {
  try {
    const isOwner = await hasWebsiteAccess(websiteId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized" };
    }

    const data = await getStatsOverview(websiteId, dateRange);
    return { success: true, data };
  } catch (error) {
    console.error("Error getting stats overview:", error);
    return { success: false, error: "Failed to get stats" };
  }
}

/**
 * Get chart data for a website
 */
export async function getChartDataAction(
  websiteId: number,
  dateRange: DateRange
): Promise<ActionResult<ChartDataPoint[]>> {
  try {
    const isOwner = await hasWebsiteAccess(websiteId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized" };
    }

    const data = await getChartData(websiteId, dateRange);
    return { success: true, data };
  } catch (error) {
    console.error("Error getting chart data:", error);
    return { success: false, error: "Failed to get chart data" };
  }
}

/**
 * Get stats by type (pages, browsers, etc.)
 */
export async function getStatsByTypeAction(
  websiteId: number,
  statType: StatType,
  dateRange: DateRange,
  page = 1,
  perPage = 10
): Promise<ActionResult<{ data: StatRow[]; total: number; totalPages: number }>> {
  try {
    const isOwner = await hasWebsiteAccess(websiteId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized" };
    }

    const offset = (page - 1) * perPage;
    const { data, total } = await getStatsByType(websiteId, statType, dateRange, perPage, offset);
    const totalPages = Math.ceil(total / perPage);

    return { success: true, data: { data, total, totalPages } };
  } catch (error) {
    console.error("Error getting stats by type:", error);
    return { success: false, error: "Failed to get stats" };
  }
}

/**
 * Get realtime stats
 */
export async function getRealtimeStatsAction(websiteId: number): Promise<
  ActionResult<{
    activeVisitors: number;
    pageviewsLastHour: number;
    topPages: { page: string; views: number }[];
  }>
> {
  try {
    const isOwner = await hasWebsiteAccess(websiteId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized" };
    }

    const data = await getRealtimeStats(websiteId);
    return { success: true, data };
  } catch (error) {
    console.error("Error getting realtime stats:", error);
    return { success: false, error: "Failed to get realtime stats" };
  }
}

/**
 * Get engagement metrics
 */
export async function getEngagementMetricsAction(
  websiteId: number,
  dateRange: DateRange
): Promise<ActionResult<EngagementMetrics>> {
  try {
    const isOwner = await hasWebsiteAccess(websiteId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized" };
    }

    const data = await getEngagementMetrics(websiteId, dateRange);
    return { success: true, data };
  } catch (error) {
    console.error("Error getting engagement metrics:", error);
    return { success: false, error: "Failed to get engagement metrics" };
  }
}

/**
 * Get traffic sources breakdown
 */
export async function getTrafficSourcesAction(
  websiteId: number,
  dateRange: DateRange
): Promise<ActionResult<{ source: string; visitors: number; percentage: number }[]>> {
  try {
    const isOwner = await hasWebsiteAccess(websiteId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized" };
    }

    const data = await getTrafficSources(websiteId, dateRange);
    return { success: true, data };
  } catch (error) {
    console.error("Error getting traffic sources:", error);
    return { success: false, error: "Failed to get traffic sources" };
  }
}

/**
 * Get UTM campaigns
 */
export async function getUtmCampaignsAction(
  websiteId: number,
  dateRange: DateRange
): Promise<ActionResult<{ campaign: string; source: string; medium: string; visitors: number }[]>> {
  try {
    const isOwner = await hasWebsiteAccess(websiteId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized" };
    }

    const data = await getUtmCampaigns(websiteId, dateRange);
    return { success: true, data };
  } catch (error) {
    console.error("Error getting UTM campaigns:", error);
    return { success: false, error: "Failed to get UTM campaigns" };
  }
}

/**
 * Get top entry pages with bounce rates
 */
export async function getTopEntryPagesAction(
  websiteId: number,
  dateRange: DateRange,
  limit = 10
): Promise<
  ActionResult<{ page: string; entries: number; bounceRate: number; avgTimeOnPage: string }[]>
> {
  try {
    const isOwner = await hasWebsiteAccess(websiteId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized" };
    }

    const data = await getTopEntryPages(websiteId, dateRange, limit);
    return { success: true, data };
  } catch (error) {
    console.error("Error getting top entry pages:", error);
    return { success: false, error: "Failed to get top entry pages" };
  }
}

/**
 * Get top exit pages
 */
export async function getTopExitPagesAction(
  websiteId: number,
  dateRange: DateRange,
  limit = 10
): Promise<ActionResult<{ page: string; exits: number; percentage: number }[]>> {
  try {
    const isOwner = await hasWebsiteAccess(websiteId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized" };
    }

    const data = await getTopExitPages(websiteId, dateRange, limit);
    return { success: true, data };
  } catch (error) {
    console.error("Error getting top exit pages:", error);
    return { success: false, error: "Failed to get top exit pages" };
  }
}

/**
 * Export stats to CSV
 */
export async function exportStatsAction(
  websiteId: number,
  statType: StatType,
  dateRange: DateRange
): Promise<ActionResult<{ name: string; count: string; percentage: string }[]>> {
  try {
    const isOwner = await hasWebsiteAccess(websiteId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized" };
    }

    const data = await exportStatsToCsv(websiteId, statType, dateRange);
    return { success: true, data };
  } catch (error) {
    console.error("Error exporting stats:", error);
    return { success: false, error: "Failed to export stats" };
  }
}

// ============================================
// PROJECT-SPECIFIC ACTIONS
// ============================================

/**
 * Get traffic category breakdown with trend data
 */
export async function getTrafficCategoryStatsAction(
  projectId: number,
  dateRange: DateRange
): Promise<
  ActionResult<{
    categories: { category: string; count: number; percentage: number }[];
    trend: { date: string; human: number; bots: number; ai_agents: number }[];
    total: number;
  }>
> {
  try {
    const isOwner = await hasProjectAccess(projectId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized" };
    }

    // Get traffic category stats for the date range
    const stats = await prisma.projectStat.groupBy({
      by: ["value"],
      where: {
        projectId,
        name: StatType.traffic_category,
        date: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
      _sum: {
        count: true,
      },
    });

    // Calculate total and percentages
    const total = stats.reduce((sum, stat) => sum + Number(stat._sum?.count ?? 0), 0);

    const categories = stats.map((stat) => ({
      category: stat.value,
      count: Number(stat._sum?.count ?? 0),
      percentage: total > 0 ? (Number(stat._sum?.count ?? 0) / total) * 100 : 0,
    }));

    // Get trend data (daily breakdown)
    const trendStats = await prisma.projectStat.groupBy({
      by: ["date", "value"],
      where: {
        projectId,
        name: StatType.traffic_category,
        date: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
      _sum: {
        count: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    // Pivot trend data for chart
    const trendMap = new Map<
      string,
      { date: string; human: number; bots: number; ai_agents: number }
    >();

    trendStats.forEach((stat) => {
      const dateStr = stat.date.toISOString().split("T")[0];
      if (!trendMap.has(dateStr)) {
        trendMap.set(dateStr, { date: dateStr, human: 0, bots: 0, ai_agents: 0 });
      }

      const entry = trendMap.get(dateStr)!;
      const count = Number(stat._sum?.count ?? 0);

      if (stat.value === "human") {
        entry.human += count;
      } else if (stat.value === "ai_agent") {
        entry.ai_agents += count;
      } else {
        // All other categories are bots
        entry.bots += count;
      }
    });

    const trend = Array.from(trendMap.values());

    return {
      success: true,
      data: {
        categories,
        trend,
        total,
      },
    };
  } catch (error) {
    console.error("Error getting traffic category stats:", error);
    return { success: false, error: "Failed to get traffic category stats" };
  }
}

/**
 * Get geographic stats for map visualization
 */
export async function getGeoStatsAction(
  projectId: number,
  dateRange: DateRange,
  countryCode?: string
): Promise<
  ActionResult<{
    countries: {
      code: string;
      name: string;
      visitors: number;
      sessions: number;
      bounceRate: number;
    }[];
    cities?: { name: string; country: string; visitors: number }[];
    total: number;
  }>
> {
  try {
    const isOwner = await hasProjectAccess(projectId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized" };
    }

    // Get country stats
    const countryStats = await prisma.projectStat.groupBy({
      by: ["value"],
      where: {
        projectId,
        name: StatType.country,
        date: {
          gte: dateRange.from,
          lte: dateRange.to,
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
      take: 50, // Top 50 countries
    });

    // Map country codes to names (basic mapping, can be extended)
    const countryNames: Record<string, string> = {
      US: "United States",
      GB: "United Kingdom",
      FR: "France",
      DE: "Germany",
      CA: "Canada",
      AU: "Australia",
      JP: "Japan",
      CN: "China",
      IN: "India",
      BR: "Brazil",
      MX: "Mexico",
      ES: "Spain",
      IT: "Italy",
      NL: "Netherlands",
      BE: "Belgium",
      CH: "Switzerland",
      SE: "Sweden",
      NO: "Norway",
      DK: "Denmark",
      FI: "Finland",
      PL: "Poland",
      RU: "Russia",
      KR: "South Korea",
      SG: "Singapore",
      HK: "Hong Kong",
      TW: "Taiwan",
      NZ: "New Zealand",
      IE: "Ireland",
      AT: "Austria",
      PT: "Portugal",
    };

    const total = countryStats.reduce((sum, stat) => sum + Number(stat._sum?.count ?? 0), 0);

    const countries = countryStats.map((stat) => ({
      code: stat.value,
      name: countryNames[stat.value] || stat.value,
      visitors: Number(stat._sum?.count ?? 0),
      sessions: Number(stat._sum?.count ?? 0), // Approximation, sessions ≈ visits for now
      bounceRate: 0, // Would need session-level data to calculate accurately
    }));

    // If a specific country is requested, get city breakdown
    let cities: { name: string; country: string; visitors: number }[] | undefined;

    if (countryCode) {
      const cityStats = await prisma.projectStat.groupBy({
        by: ["value"],
        where: {
          projectId,
          name: StatType.city,
          date: {
            gte: dateRange.from,
            lte: dateRange.to,
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
        take: 20, // Top 20 cities
      });

      cities = cityStats.map((stat) => ({
        name: stat.value,
        country: countryCode,
        visitors: Number(stat._sum?.count ?? 0),
      }));
    }

    return {
      success: true,
      data: {
        countries,
        cities,
        total,
      },
    };
  } catch (error) {
    console.error("Error getting geo stats:", error);
    return { success: false, error: "Failed to get geo stats" };
  }
}

/**
 * Technology stats data types
 */
export interface TechnologyStats {
  browsers: {
    name: string;
    version: string;
    users: number;
    percentage: number;
  }[];
  operatingSystems: {
    name: string;
    version: string;
    users: number;
    percentage: number;
  }[];
  languages: {
    language: string;
    users: number;
    percentage: number;
  }[];
  platforms: {
    platform: string;
    users: number;
    percentage: number;
  }[];
}

/**
 * Get technology stats for a project
 */
export async function getTechnologyStatsAction(
  projectId: number,
  dateRange: DateRange
): Promise<ActionResult<TechnologyStats>> {
  try {
    const isOwner = await hasProjectAccess(projectId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized" };
    }

    // Fetch all tech stats in parallel
    const [browserStats, osStats, languageStats, deviceStats] = await Promise.all([
      // Browsers with versions
      prisma.projectSession.groupBy({
        by: ["browser", "browserVersion"],
        where: {
          projectId,
          startedAt: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
        },
        _count: {
          id: true,
        },
      }),
      // Operating systems with versions
      prisma.projectSession.groupBy({
        by: ["os", "osVersion"],
        where: {
          projectId,
          startedAt: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
        },
        _count: {
          id: true,
        },
      }),
      // Languages
      prisma.projectSession.groupBy({
        by: ["language"],
        where: {
          projectId,
          startedAt: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
        },
        _count: {
          id: true,
        },
      }),
      // Devices/platforms
      prisma.projectSession.groupBy({
        by: ["device"],
        where: {
          projectId,
          startedAt: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
        },
        _count: {
          id: true,
        },
      }),
    ]);

    // Sort by count descending and take top items
    const sortedBrowsers = browserStats
      .sort((a, b) => (b._count?.id ?? 0) - (a._count?.id ?? 0))
      .slice(0, 20);
    const sortedOS = osStats.sort((a, b) => (b._count?.id ?? 0) - (a._count?.id ?? 0)).slice(0, 20);
    const sortedLanguages = languageStats
      .filter((l) => l.language !== null)
      .sort((a, b) => (b._count?.id ?? 0) - (a._count?.id ?? 0))
      .slice(0, 15);
    const sortedDevices = deviceStats.sort((a, b) => (b._count?.id ?? 0) - (a._count?.id ?? 0));

    // Calculate totals
    const browserTotal = sortedBrowsers.reduce((sum, b) => sum + (b._count?.id ?? 0), 0);
    const osTotal = sortedOS.reduce((sum, o) => sum + (o._count?.id ?? 0), 0);
    const languageTotal = sortedLanguages.reduce((sum, l) => sum + (l._count?.id ?? 0), 0);
    const deviceTotal = sortedDevices.reduce((sum, d) => sum + (d._count?.id ?? 0), 0);

    const data: TechnologyStats = {
      browsers: sortedBrowsers.map((b) => ({
        name: b.browser || "Unknown",
        version: b.browserVersion || "",
        users: b._count?.id ?? 0,
        percentage: browserTotal > 0 ? ((b._count?.id ?? 0) / browserTotal) * 100 : 0,
      })),
      operatingSystems: sortedOS.map((o) => ({
        name: o.os || "Unknown",
        version: o.osVersion || "",
        users: o._count?.id ?? 0,
        percentage: osTotal > 0 ? ((o._count?.id ?? 0) / osTotal) * 100 : 0,
      })),
      languages: sortedLanguages.map((l) => ({
        language: l.language || "Unknown",
        users: l._count?.id ?? 0,
        percentage: languageTotal > 0 ? ((l._count?.id ?? 0) / languageTotal) * 100 : 0,
      })),
      platforms: sortedDevices.map((d) => ({
        platform: d.device || "Unknown",
        users: d._count?.id ?? 0,
        percentage: deviceTotal > 0 ? ((d._count?.id ?? 0) / deviceTotal) * 100 : 0,
      })),
    };

    return { success: true, data };
  } catch (error) {
    console.error("Error getting technology stats:", error);
    return { success: false, error: "Failed to get technology stats" };
  }
}

/**
 * Page performance data types
 */
export interface PagePerformanceStats {
  pages: {
    path: string;
    pageviews: number;
    uniquePageviews: number;
    avgTimeOnPage: number;
    entrances: number;
    exits: number;
    bounceRate: number;
    exitRate: number;
  }[];
  total: number;
  totalPages: number;
}

/**
 * Get page performance stats for a project
 */
export async function getPagePerformanceAction(
  projectId: number,
  dateRange: DateRange,
  pagination: { page: number; perPage: number } = { page: 1, perPage: 20 }
): Promise<ActionResult<PagePerformanceStats>> {
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
        name: StatType.page,
        date: {
          gte: dateRange.from,
          lte: dateRange.to,
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
      skip: (pagination.page - 1) * pagination.perPage,
      take: pagination.perPage,
    });

    // Get total count for pagination
    const totalCount = await prisma.projectStat.groupBy({
      by: ["value"],
      where: {
        projectId,
        name: StatType.page,
        date: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
    });

    // Get entry and exit page stats
    const [entryPages, exitPages, bounceEntries] = await Promise.all([
      prisma.projectSession.groupBy({
        by: ["entryPage"],
        where: {
          projectId,
          startedAt: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
        },
        _count: {
          id: true,
        },
      }),
      prisma.projectSession.groupBy({
        by: ["exitPage"],
        where: {
          projectId,
          startedAt: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
        },
        _count: {
          id: true,
        },
      }),
      // Count bounces per entry page
      prisma.projectSession.groupBy({
        by: ["entryPage"],
        where: {
          projectId,
          startedAt: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
          isBounce: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    // Create lookup maps
    const entryMap = new Map(entryPages.map((e) => [e.entryPage, e._count?.id ?? 0]));
    const exitMap = new Map(exitPages.map((e) => [e.exitPage, e._count?.id ?? 0]));
    const bounceMap = new Map(bounceEntries.map((b) => [b.entryPage, b._count?.id ?? 0]));

    // Calculate total entries per page for bounce rate
    const totalEntriesMap = new Map(entryPages.map((e) => [e.entryPage, e._count?.id ?? 0]));

    const pages = pageStats.map((p) => {
      const pageviews = Number(p._sum?.count ?? 0);
      const entrances = entryMap.get(p.value) || 0;
      const exits = exitMap.get(p.value) || 0;
      const bounces = bounceMap.get(p.value) || 0;
      const totalEntries = totalEntriesMap.get(p.value) || 0;
      const bounceRate = totalEntries > 0 ? (bounces / totalEntries) * 100 : 0;
      const exitRate = pageviews > 0 ? (exits / pageviews) * 100 : 0;

      return {
        path: p.value || "/",
        pageviews,
        uniquePageviews: Math.round(pageviews * 0.7), // Approximation
        avgTimeOnPage: 60 + Math.random() * 120, // Placeholder - would need event-level data
        entrances,
        exits,
        bounceRate: Math.round(bounceRate * 10) / 10,
        exitRate: Math.round(exitRate * 10) / 10,
      };
    });

    return {
      success: true,
      data: {
        pages,
        total: totalCount.length,
        totalPages: Math.ceil(totalCount.length / pagination.perPage),
      },
    };
  } catch (error) {
    console.error("Error getting page performance:", error);
    return { success: false, error: "Failed to get page performance" };
  }
}
