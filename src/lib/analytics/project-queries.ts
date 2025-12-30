import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, endOfDay, eachDayOfInterval, format } from "date-fns";

export interface DateRange {
  from: Date;
  to: Date;
}

// Google Analytics-like metrics
export interface GAStatsOverview {
  // Users metrics (like GA4)
  users: number; // Unique visitors
  newUsers: number; // First-time visitors
  activeUsers: number; // Users with activity
  returningUsers: number; // Returning visitors

  // Sessions metrics
  sessions: number; // Total sessions
  engagedSessions: number; // Sessions with engagement > 10s

  // Engagement metrics
  avgEngagementTime: string; // Average engagement time per user
  engagementRate: number; // % of engaged sessions
  bounceRate: number; // % of single-page sessions

  // Pageviews
  pageviews: number;
  screenViews: number; // For mobile apps
  viewsPerSession: number;

  // Comparisons with previous period
  usersChange: number;
  sessionsChange: number;
  pageviewsChange: number;
  engagementRateChange: number;
}

export interface GAChartDataPoint {
  date: string;
  users: number;
  sessions: number;
  pageviews: number;
  engagedSessions: number;
  newUsers: number;
}

export interface RealtimeData {
  activeUsersNow: number;
  usersLast30Min: number;
  pageviewsPerMinute: number;
  topPages: { page: string; users: number }[];
  topCountries: { country: string; users: number }[];
  usersByPlatform: { platform: string; users: number }[];
  usersByDevice: { device: string; users: number }[];
}

export interface UserRetention {
  day: number;
  users: number;
  percentage: number;
}

export interface AppVersionStats {
  version: string;
  users: number;
  sessions: number;
  percentage: number;
}

export interface OSVersionStats {
  os: string;
  version: string;
  users: number;
  percentage: number;
}

/**
 * Get default date range (last 28 days like GA)
 */
export function getDefaultDateRange(): DateRange {
  return {
    from: startOfDay(subDays(new Date(), 27)),
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
 * Format seconds to human-readable time
 */
function formatEngagementTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

/**
 * Get Google Analytics-like overview stats for a project
 */
export async function getGAStatsOverview(
  projectId: number,
  dateRange: DateRange
): Promise<GAStatsOverview> {
  const previousRange = getPreviousPeriod(dateRange);
  const startDate = startOfDay(dateRange.from);
  const endDate = endOfDay(dateRange.to);
  const prevStartDate = startOfDay(previousRange.from);
  const prevEndDate = endOfDay(previousRange.to);

  // Fetch all data in parallel
  const [
    currentStats,
    previousStats,
    currentSessions,
    previousSessions,
    currentVisitors,
    previousVisitors,
  ] = await Promise.all([
    // Current period stats
    prisma.projectStat.groupBy({
      by: ["name"],
      where: {
        projectId,
        name: {
          in: [
            "pageviews",
            "unique_visitors",
            "new_users",
            "returning_users",
            "active_users",
            "visitors",
            "engaged_sessions",
            "screen_views",
          ],
        },
        date: { gte: startDate, lte: endDate },
      },
      _sum: { count: true },
    }),
    // Previous period stats
    prisma.projectStat.groupBy({
      by: ["name"],
      where: {
        projectId,
        name: { in: ["pageviews", "unique_visitors", "visitors", "engaged_sessions"] },
        date: { gte: prevStartDate, lte: prevEndDate },
      },
      _sum: { count: true },
    }),
    // Current session engagement data
    prisma.projectSession.aggregate({
      where: { projectId, startedAt: { gte: startDate, lte: endDate } },
      _count: { id: true },
      _sum: { engagementTime: true },
      _avg: { pageviews: true },
    }),
    // Previous session data
    prisma.projectSession.aggregate({
      where: { projectId, startedAt: { gte: prevStartDate, lte: prevEndDate } },
      _count: { id: true },
    }),
    // Current visitors engagement
    prisma.visitor.aggregate({
      where: { projectId, lastSeenAt: { gte: startDate, lte: endDate } },
      _count: { id: true },
      _sum: { totalEngagementTime: true },
    }),
    // Previous visitors
    prisma.visitor.aggregate({
      where: { projectId, lastSeenAt: { gte: prevStartDate, lte: prevEndDate } },
      _count: { id: true },
    }),
  ]);

  // Extract current stats
  const getStatValue = (stats: typeof currentStats, name: string): number => {
    return Number(stats.find((s) => s.name === name)?._sum?.count || 0);
  };

  const users = getStatValue(currentStats, "unique_visitors") || currentVisitors._count.id;
  const newUsers = getStatValue(currentStats, "new_users");
  const activeUsers = getStatValue(currentStats, "active_users") || users;
  const returningUsers = getStatValue(currentStats, "returning_users");
  const sessions = getStatValue(currentStats, "visitors") || currentSessions._count.id;
  const engagedSessions = getStatValue(currentStats, "engaged_sessions");
  const pageviews = getStatValue(currentStats, "pageviews");
  const screenViews = getStatValue(currentStats, "screen_views");

  // Previous period stats
  const prevUsers = getStatValue(previousStats, "unique_visitors") || previousVisitors._count.id;
  const prevSessions = getStatValue(previousStats, "visitors") || previousSessions._count.id;
  const prevPageviews = getStatValue(previousStats, "pageviews");
  const prevEngagedSessions = getStatValue(previousStats, "engaged_sessions");

  // Calculate engagement metrics
  const totalEngagementTime = currentVisitors._sum.totalEngagementTime || 0;
  const avgEngagementTimeSeconds = users > 0 ? totalEngagementTime / users : 0;
  const engagementRate = sessions > 0 ? Math.round((engagedSessions / sessions) * 100) : 0;
  const bounceRate = 100 - engagementRate;
  const viewsPerSession = sessions > 0 ? Math.round((pageviews / sessions) * 10) / 10 : 0;

  // Previous engagement rate
  const prevEngagementRate =
    prevSessions > 0 ? Math.round((prevEngagedSessions / prevSessions) * 100) : 0;

  // Calculate changes
  const calcChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return {
    users,
    newUsers,
    activeUsers,
    returningUsers,
    sessions,
    engagedSessions,
    avgEngagementTime: formatEngagementTime(avgEngagementTimeSeconds),
    engagementRate,
    bounceRate,
    pageviews,
    screenViews,
    viewsPerSession,
    usersChange: calcChange(users, prevUsers),
    sessionsChange: calcChange(sessions, prevSessions),
    pageviewsChange: calcChange(pageviews, prevPageviews),
    engagementRateChange: engagementRate - prevEngagementRate,
  };
}

/**
 * Get chart data for users/sessions over time (like GA)
 */
export async function getGAChartData(
  projectId: number,
  dateRange: DateRange
): Promise<GAChartDataPoint[]> {
  const dates = eachDayOfInterval({
    start: dateRange.from,
    end: dateRange.to,
  });

  // Fetch stats for the period
  const stats = await prisma.projectStat.findMany({
    where: {
      projectId,
      name: { in: ["unique_visitors", "new_users", "visitors", "pageviews", "engaged_sessions"] },
      date: {
        gte: startOfDay(dateRange.from),
        lte: endOfDay(dateRange.to),
      },
    },
    select: {
      name: true,
      count: true,
      date: true,
    },
  });

  // Group stats by date
  const statsByDate = new Map<
    string,
    {
      users: number;
      sessions: number;
      pageviews: number;
      engagedSessions: number;
      newUsers: number;
    }
  >();

  for (const stat of stats) {
    const dateKey = format(stat.date, "yyyy-MM-dd");
    const existing = statsByDate.get(dateKey) || {
      users: 0,
      sessions: 0,
      pageviews: 0,
      engagedSessions: 0,
      newUsers: 0,
    };

    const count = Number(stat.count);
    if (stat.name === "unique_visitors") existing.users += count;
    else if (stat.name === "visitors") existing.sessions += count;
    else if (stat.name === "pageviews") existing.pageviews += count;
    else if (stat.name === "engaged_sessions") existing.engagedSessions += count;
    else if (stat.name === "new_users") existing.newUsers += count;

    statsByDate.set(dateKey, existing);
  }

  return dates.map((date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const dayStats = statsByDate.get(dateKey) || {
      users: 0,
      sessions: 0,
      pageviews: 0,
      engagedSessions: 0,
      newUsers: 0,
    };

    return {
      date: dateKey,
      ...dayStats,
    };
  });
}

/**
 * Get real-time active users (like GA Real-time)
 */
export async function getRealtimeData(projectId: number): Promise<RealtimeData> {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

  const [activeUsersNow, realtimeUsers, recentPageviews] = await Promise.all([
    // Active users from RealtimeUser table
    prisma.realtimeUser.count({
      where: { projectId, lastPingAt: { gte: fiveMinutesAgo } },
    }),
    // Get real-time user details
    prisma.realtimeUser.findMany({
      where: { projectId, lastPingAt: { gte: fiveMinutesAgo } },
      select: {
        currentPage: true,
        platform: true,
        country: true,
        device: true,
      },
    }),
    // Users in last 30 minutes from sessions
    prisma.projectSession.count({
      where: { projectId, lastActivityAt: { gte: thirtyMinutesAgo } },
    }),
  ]);

  // Aggregate real-time data
  const pageCount = new Map<string, number>();
  const countryCount = new Map<string, number>();
  const platformCount = new Map<string, number>();
  const deviceCount = new Map<string, number>();

  for (const user of realtimeUsers) {
    pageCount.set(user.currentPage, (pageCount.get(user.currentPage) || 0) + 1);
    if (user.country) countryCount.set(user.country, (countryCount.get(user.country) || 0) + 1);
    platformCount.set(user.platform, (platformCount.get(user.platform) || 0) + 1);
    if (user.device) deviceCount.set(user.device, (deviceCount.get(user.device) || 0) + 1);
  }

  const sortByCount = <T extends { users: number }>(arr: T[]): T[] =>
    arr.sort((a, b) => b.users - a.users);

  return {
    activeUsersNow,
    usersLast30Min: recentPageviews,
    pageviewsPerMinute: Math.round(activeUsersNow / 5), // Approximate
    topPages: sortByCount(
      Array.from(pageCount.entries()).map(([page, users]) => ({ page, users }))
    ).slice(0, 10),
    topCountries: sortByCount(
      Array.from(countryCount.entries()).map(([country, users]) => ({ country, users }))
    ).slice(0, 10),
    usersByPlatform: sortByCount(
      Array.from(platformCount.entries()).map(([platform, users]) => ({ platform, users }))
    ),
    usersByDevice: sortByCount(
      Array.from(deviceCount.entries()).map(([device, users]) => ({ device, users }))
    ),
  };
}

/**
 * Get user retention data (like GA Retention report)
 */
export async function getUserRetention(
  projectId: number,
  dateRange: DateRange
): Promise<UserRetention[]> {
  const startDate = startOfDay(dateRange.from);

  // Get all visitors who first visited during the period
  const newVisitors = await prisma.visitor.findMany({
    where: {
      projectId,
      firstSeenAt: { gte: startDate, lte: endOfDay(dateRange.to) },
    },
    select: {
      id: true,
      firstSeenAt: true,
      lastSeenAt: true,
    },
  });

  const totalNewUsers = newVisitors.length;
  if (totalNewUsers === 0) {
    return [];
  }

  // Calculate retention for each day (0-7 days)
  const retention: UserRetention[] = [];

  for (let day = 0; day <= 7; day++) {
    const retainedUsers = newVisitors.filter((visitor) => {
      const daysSinceFirst = Math.floor(
        (visitor.lastSeenAt.getTime() - visitor.firstSeenAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceFirst >= day;
    }).length;

    retention.push({
      day,
      users: retainedUsers,
      percentage: Math.round((retainedUsers / totalNewUsers) * 100),
    });
  }

  return retention;
}

/**
 * Get active users by app version (like GA App version report)
 */
export async function getAppVersionStats(
  projectId: number,
  dateRange: DateRange
): Promise<AppVersionStats[]> {
  const startDate = startOfDay(dateRange.from);
  const endDate = endOfDay(dateRange.to);

  const stats = await prisma.projectStat.groupBy({
    by: ["value"],
    where: {
      projectId,
      name: "app_version",
      date: { gte: startDate, lte: endDate },
    },
    _sum: { count: true },
    orderBy: { _sum: { count: "desc" } },
    take: 20,
  });

  const totalUsers = stats.reduce((sum, s) => sum + Number(s._sum?.count || 0), 0);

  // Get session counts for each version
  const sessionStats = await prisma.projectSession.groupBy({
    by: ["appVersion"],
    where: {
      projectId,
      startedAt: { gte: startDate, lte: endDate },
      appVersion: { not: null },
    },
    _count: { id: true },
  });

  const sessionMap = new Map(sessionStats.map((s) => [s.appVersion, s._count.id]));

  return stats.map((s) => ({
    version: s.value,
    users: Number(s._sum?.count || 0),
    sessions: sessionMap.get(s.value) || 0,
    percentage: totalUsers > 0 ? Math.round((Number(s._sum?.count || 0) / totalUsers) * 100) : 0,
  }));
}

/**
 * Get active users by OS version (like GA Tech > Operating System report)
 */
export async function getOSVersionStats(
  projectId: number,
  dateRange: DateRange
): Promise<OSVersionStats[]> {
  const startDate = startOfDay(dateRange.from);
  const endDate = endOfDay(dateRange.to);

  const stats = await prisma.projectStat.groupBy({
    by: ["value"],
    where: {
      projectId,
      name: "os_version",
      date: { gte: startDate, lte: endDate },
    },
    _sum: { count: true },
    orderBy: { _sum: { count: "desc" } },
    take: 20,
  });

  const totalUsers = stats.reduce((sum, s) => sum + Number(s._sum?.count || 0), 0);

  return stats.map((s) => {
    // Parse "OS Version" format (e.g., "Windows 11", "macOS 14.2")
    const parts = s.value.split(" ");
    const version = parts.pop() || "";
    const os = parts.join(" ") || s.value;

    return {
      os,
      version,
      users: Number(s._sum?.count || 0),
      percentage: totalUsers > 0 ? Math.round((Number(s._sum?.count || 0) / totalUsers) * 100) : 0,
    };
  });
}

/**
 * Get users by country (like GA Geography report)
 */
export async function getUsersByCountry(
  projectId: number,
  dateRange: DateRange,
  limit = 10
): Promise<{ country: string; users: number; sessions: number; percentage: number }[]> {
  const startDate = startOfDay(dateRange.from);
  const endDate = endOfDay(dateRange.to);

  const [userStats, sessionStats] = await Promise.all([
    prisma.projectStat.groupBy({
      by: ["value"],
      where: {
        projectId,
        name: "country",
        date: { gte: startDate, lte: endDate },
      },
      _sum: { count: true },
      orderBy: { _sum: { count: "desc" } },
      take: limit,
    }),
    prisma.projectSession.groupBy({
      by: ["country"],
      where: {
        projectId,
        startedAt: { gte: startDate, lte: endDate },
        country: { not: null },
      },
      _count: { id: true },
    }),
  ]);

  const totalUsers = userStats.reduce((sum, s) => sum + Number(s._sum?.count || 0), 0);
  const sessionMap = new Map(sessionStats.map((s) => [s.country, s._count.id]));

  return userStats.map((s) => ({
    country: s.value,
    users: Number(s._sum?.count || 0),
    sessions: sessionMap.get(s.value) || 0,
    percentage: totalUsers > 0 ? Math.round((Number(s._sum?.count || 0) / totalUsers) * 100) : 0,
  }));
}

/**
 * Get users by city (like GA Geography > City report)
 */
export async function getUsersByCity(
  projectId: number,
  dateRange: DateRange,
  limit = 10
): Promise<{ city: string; users: number; percentage: number }[]> {
  const startDate = startOfDay(dateRange.from);
  const endDate = endOfDay(dateRange.to);

  const stats = await prisma.projectStat.groupBy({
    by: ["value"],
    where: {
      projectId,
      name: "city",
      date: { gte: startDate, lte: endDate },
    },
    _sum: { count: true },
    orderBy: { _sum: { count: "desc" } },
    take: limit,
  });

  const totalUsers = stats.reduce((sum, s) => sum + Number(s._sum?.count || 0), 0);

  return stats.map((s) => ({
    city: s.value,
    users: Number(s._sum?.count || 0),
    percentage: totalUsers > 0 ? Math.round((Number(s._sum?.count || 0) / totalUsers) * 100) : 0,
  }));
}

/**
 * Get event data (like GA Events report)
 */
export async function getEventStats(
  projectId: number,
  dateRange: DateRange,
  limit = 20
): Promise<{ eventName: string; count: number; uniqueUsers: number }[]> {
  const startDate = startOfDay(dateRange.from);
  const endDate = endOfDay(dateRange.to);

  const events = await prisma.projectEvent.groupBy({
    by: ["name"],
    where: {
      projectId,
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: { id: true },
  });

  // Get unique users per event
  const eventUserCounts = await Promise.all(
    events.slice(0, limit).map(async (event) => {
      const uniqueUsers = await prisma.projectEvent.groupBy({
        by: ["visitorId"],
        where: {
          projectId,
          name: event.name,
          createdAt: { gte: startDate, lte: endDate },
          visitorId: { not: null },
        },
      });
      return { name: event.name, uniqueUsers: uniqueUsers.length };
    })
  );

  const userCountMap = new Map(eventUserCounts.map((e) => [e.name, e.uniqueUsers]));

  return events
    .map((e) => ({
      eventName: e.name,
      count: e._count.id,
      uniqueUsers: userCountMap.get(e.name) || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get engagement time distribution (like GA Engagement > Engagement time)
 */
export async function getEngagementTimeDistribution(
  projectId: number,
  dateRange: DateRange
): Promise<{ bucket: string; users: number; percentage: number }[]> {
  const startDate = startOfDay(dateRange.from);
  const endDate = endOfDay(dateRange.to);

  const stats = await prisma.projectStat.groupBy({
    by: ["value"],
    where: {
      projectId,
      name: "engagement_time",
      date: { gte: startDate, lte: endDate },
    },
    _sum: { count: true },
  });

  const totalUsers = stats.reduce((sum, s) => sum + Number(s._sum?.count || 0), 0);
  const buckets = ["0-10s", "10-30s", "30-60s", "60-180s", "180s+"];

  return buckets.map((bucket) => {
    const stat = stats.find((s) => s.value === bucket);
    const users = Number(stat?._sum?.count || 0);
    return {
      bucket,
      users,
      percentage: totalUsers > 0 ? Math.round((users / totalUsers) * 100) : 0,
    };
  });
}
