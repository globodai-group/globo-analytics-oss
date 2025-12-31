import { prisma } from "@/lib/prisma";
import { Goal, GoalType, UrlMatchType } from "@prisma/client";

interface HitData {
  projectId: number;
  visitorId: string;
  sessionId?: string;
  hitType: string;
  pagePath?: string;
  pageTitle?: string;
  eventName?: string;
  eventCategory?: string;
  eventAction?: string;
  eventLabel?: string;
  eventValue?: number;
  sessionDuration?: number;
  pageviewCount?: number;
  transactionValue?: number;
}

/**
 * Check if a URL matches a goal pattern
 */
function matchUrl(
  url: string,
  pattern: string,
  matchType: UrlMatchType,
): boolean {
  if (!url || !pattern) return false;

  switch (matchType) {
    case "EXACT":
      return url === pattern;
    case "CONTAINS":
      return url.includes(pattern);
    case "STARTS_WITH":
      return url.startsWith(pattern);
    case "REGEX":
      try {
        const regex = new RegExp(pattern);
        return regex.test(url);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

/**
 * Check if a hit matches a goal's conditions
 */
function matchesGoal(goal: Goal, hit: HitData): boolean {
  switch (goal.type) {
    case "URL":
      if (!goal.urlMatch || !goal.urlMatchType) return false;
      return (
        hit.hitType === "pageview" &&
        matchUrl(hit.pagePath || "", goal.urlMatch, goal.urlMatchType)
      );

    case "EVENT":
      if (hit.hitType !== "event") return false;

      // Match event conditions
      if (goal.eventName && hit.eventName !== goal.eventName) return false;
      if (goal.eventCategory && hit.eventCategory !== goal.eventCategory)
        return false;
      if (goal.eventAction && hit.eventAction !== goal.eventAction)
        return false;
      if (goal.eventLabel && hit.eventLabel !== goal.eventLabel) return false;
      if (
        goal.eventValue !== null &&
        hit.eventValue !== undefined &&
        hit.eventValue < goal.eventValue
      )
        return false;

      return true;

    case "DURATION":
      if (!goal.durationSeconds) return false;
      return (
        hit.hitType === "session_end" &&
        hit.sessionDuration !== undefined &&
        hit.sessionDuration >= goal.durationSeconds
      );

    case "PAGES_PER_SESSION":
      if (!goal.minPages) return false;
      return (
        hit.hitType === "session_end" &&
        hit.pageviewCount !== undefined &&
        hit.pageviewCount >= goal.minPages
      );

    case "ECOMMERCE":
      return hit.hitType === "ecommerce" && hit.eventName === "purchase";

    default:
      return false;
  }
}

/**
 * Calculate revenue for a conversion
 */
function calculateRevenue(goal: Goal, hit: HitData): number | null {
  if (!goal.revenueTracking) return null;

  // For e-commerce goals, use transaction value
  if (goal.type === "ECOMMERCE" && hit.transactionValue !== undefined) {
    return hit.transactionValue;
  }

  // For event goals with value
  if (goal.type === "EVENT" && hit.eventValue !== undefined) {
    return hit.eventValue;
  }

  // Use default revenue if set
  if (goal.defaultRevenue !== null) {
    return goal.defaultRevenue;
  }

  return null;
}

/**
 * Check all active goals for a project and record conversions
 * This should be called after each hit is processed
 */
export async function checkGoalConversions(hit: HitData): Promise<number> {
  // Get all active goals for the project
  const goals = await prisma.goal.findMany({
    where: {
      projectId: hit.projectId,
      isActive: true,
    },
  });

  if (goals.length === 0) return 0;

  let conversionsRecorded = 0;

  for (const goal of goals) {
    if (matchesGoal(goal, hit)) {
      // Check if this visitor already converted for this goal today (prevent duplicates)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingConversion = await prisma.goalConversion.findFirst({
        where: {
          goalId: goal.id,
          visitorId: hit.visitorId,
          createdAt: {
            gte: today,
          },
        },
      });

      // For some goal types, allow multiple conversions per day
      const allowMultiple = goal.type === "ECOMMERCE" || goal.type === "EVENT";

      if (!existingConversion || allowMultiple) {
        const revenue = calculateRevenue(goal, hit);

        await prisma.goalConversion.create({
          data: {
            goalId: goal.id,
            projectId: hit.projectId,
            visitorId: hit.visitorId,
            sessionId: hit.sessionId || null,
            revenue,
            pagePath: hit.pagePath || null,
            eventName: hit.eventName || null,
          },
        });

        conversionsRecorded++;
      }
    }
  }

  return conversionsRecorded;
}

/**
 * Get goal statistics for a date range
 */
export async function getGoalStats(
  goalId: number,
  dateRange: { from: Date; to: Date },
): Promise<{
  conversions: number;
  uniqueVisitors: number;
  totalRevenue: number;
  avgRevenue: number;
}> {
  const conversions = await prisma.goalConversion.findMany({
    where: {
      goalId,
      createdAt: {
        gte: dateRange.from,
        lte: dateRange.to,
      },
    },
  });

  const uniqueVisitors = new Set(conversions.map((c) => c.visitorId)).size;
  const totalRevenue = conversions.reduce(
    (sum, c) => sum + (c.revenue || 0),
    0,
  );
  const avgRevenue =
    conversions.length > 0 ? totalRevenue / conversions.length : 0;

  return {
    conversions: conversions.length,
    uniqueVisitors,
    totalRevenue,
    avgRevenue,
  };
}

/**
 * Get top converting goals for a project
 */
export async function getTopGoals(
  projectId: number,
  dateRange: { from: Date; to: Date },
  limit: number = 5,
): Promise<
  {
    id: number;
    name: string;
    type: GoalType;
    conversions: number;
    revenue: number;
  }[]
> {
  const goals = await prisma.goal.findMany({
    where: { projectId, isActive: true },
    include: {
      conversions: {
        where: {
          createdAt: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
        },
      },
    },
  });

  return goals
    .map((goal) => ({
      id: goal.id,
      name: goal.name,
      type: goal.type,
      conversions: goal.conversions.length,
      revenue: goal.conversions.reduce((sum, c) => sum + (c.revenue || 0), 0),
    }))
    .sort((a, b) => b.conversions - a.conversions)
    .slice(0, limit);
}

/**
 * Get conversion funnel data (visitors -> conversions)
 */
export async function getConversionFunnel(
  projectId: number,
  goalId: number,
  dateRange: { from: Date; to: Date },
): Promise<{
  totalVisitors: number;
  totalSessions: number;
  conversions: number;
  conversionRate: number;
}> {
  // Get total visitors in period
  const totalVisitors = await prisma.visitor.count({
    where: {
      projectId,
      lastSeenAt: {
        gte: dateRange.from,
        lte: dateRange.to,
      },
    },
  });

  // Get total sessions in period
  const totalSessions = await prisma.projectSession.count({
    where: {
      projectId,
      startedAt: {
        gte: dateRange.from,
        lte: dateRange.to,
      },
    },
  });

  // Get conversions
  const conversions = await prisma.goalConversion.count({
    where: {
      goalId,
      createdAt: {
        gte: dateRange.from,
        lte: dateRange.to,
      },
    },
  });

  const conversionRate =
    totalVisitors > 0 ? (conversions / totalVisitors) * 100 : 0;

  return {
    totalVisitors,
    totalSessions,
    conversions,
    conversionRate: Math.round(conversionRate * 100) / 100,
  };
}
