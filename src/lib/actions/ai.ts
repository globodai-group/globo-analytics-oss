"use server";

/**
 * AI Server Actions - Smart analytics suggestions
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { features } from "@/lib/env";
import {
  suggestFunnels,
  suggestSegments,
  generateInsights,
  queryToFilters,
  type FunnelSuggestion,
  type SegmentSuggestion,
  type AnalyticsInsight,
} from "@/lib/ai";
import { ActionResult, ActionSuccess, ActionError } from "@/lib/types/actions";
import { hasProjectAccess } from "./with-project-ownership";

/**
 * Get AI-suggested funnels for a project
 */
export async function getAIFunnelSuggestionsAction(
  projectId: number
): Promise<ActionResult<FunnelSuggestion[]>> {
  const session = await auth();
  if (!session?.user?.id) {
    return ActionError("Unauthorized");
  }

  if (!features.hasAI) {
    return ActionError("AI features are not available");
  }

  const hasAccess = await hasProjectAccess(projectId);
  if (!hasAccess) {
    return ActionError("Project not found");
  }

  // Get top pages for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [topPages, topEvents, goals] = await Promise.all([
    prisma.projectStat.groupBy({
      by: ["value"],
      where: {
        projectId,
        name: "page",
        date: { gte: thirtyDaysAgo },
      },
      _sum: { count: true },
      orderBy: { _sum: { count: "desc" } },
      take: 20,
    }),
    prisma.projectEvent.groupBy({
      by: ["name"],
      where: {
        projectId,
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: true,
      orderBy: { _count: { name: "desc" } },
      take: 15,
    }),
    prisma.goal.findMany({
      where: { projectId },
      select: { name: true, type: true },
    }),
  ]);

  const suggestions = await suggestFunnels({
    topPages: topPages.map((p) => ({
      path: p.value,
      pageviews: Number(p._sum?.count ?? 0),
    })),
    topEvents: topEvents.map((e) => ({
      name: e.name,
      count: e._count,
    })),
    goals: goals.map((g) => ({
      name: g.name,
      type: g.type,
    })),
  });

  return ActionSuccess(suggestions);
}

/**
 * Get AI-suggested segments for a project
 */
export async function getAISegmentSuggestionsAction(
  projectId: number
): Promise<ActionResult<SegmentSuggestion[]>> {
  const session = await auth();
  if (!session?.user?.id) {
    return ActionError("Unauthorized");
  }

  if (!features.hasAI) {
    return ActionError("AI features are not available");
  }

  const hasAccess = await hasProjectAccess(projectId);
  if (!hasAccess) {
    return ActionError("Project not found");
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [countries, devices, sources, browsers, sessionStats] = await Promise.all([
    prisma.projectStat.groupBy({
      by: ["value"],
      where: {
        projectId,
        name: "country",
        date: { gte: thirtyDaysAgo },
      },
      _sum: { count: true },
      orderBy: { _sum: { count: "desc" } },
      take: 15,
    }),
    prisma.projectStat.groupBy({
      by: ["value"],
      where: {
        projectId,
        name: "device",
        date: { gte: thirtyDaysAgo },
      },
      _sum: { count: true },
      orderBy: { _sum: { count: "desc" } },
    }),
    prisma.projectStat.groupBy({
      by: ["value"],
      where: {
        projectId,
        name: "utm_source",
        date: { gte: thirtyDaysAgo },
      },
      _sum: { count: true },
      orderBy: { _sum: { count: "desc" } },
      take: 15,
    }),
    prisma.projectStat.groupBy({
      by: ["value"],
      where: {
        projectId,
        name: "browser",
        date: { gte: thirtyDaysAgo },
      },
      _sum: { count: true },
      orderBy: { _sum: { count: "desc" } },
      take: 10,
    }),
    prisma.projectSession.aggregate({
      where: {
        projectId,
        startedAt: { gte: thirtyDaysAgo },
      },
      _avg: { duration: true },
      _count: true,
    }),
  ]);

  // Calculate bounce rate
  const bouncedSessions = await prisma.projectSession.count({
    where: {
      projectId,
      startedAt: { gte: thirtyDaysAgo },
      pageviews: 1,
    },
  });

  const bounceRate = sessionStats._count > 0 ? bouncedSessions / sessionStats._count : 0;

  const suggestions = await suggestSegments({
    countries: countries.map((c) => ({
      code: c.value,
      visitors: Number(c._sum?.count ?? 0),
    })),
    devices: devices.map((d) => ({
      type: d.value,
      visitors: Number(d._sum?.count ?? 0),
    })),
    sources: sources.map((s) => ({
      source: s.value,
      visitors: Number(s._sum?.count ?? 0),
    })),
    browsers: browsers.map((b) => ({
      name: b.value,
      visitors: Number(b._sum?.count ?? 0),
    })),
    avgSessionDuration: sessionStats._avg.duration || 0,
    bounceRate,
  });

  return ActionSuccess(suggestions);
}

/**
 * Get AI-generated insights for a project
 */
export async function getAIInsightsAction(
  projectId: number
): Promise<ActionResult<AnalyticsInsight[]>> {
  const session = await auth();
  if (!session?.user?.id) {
    return ActionError("Unauthorized");
  }

  if (!features.hasAI) {
    return ActionError("AI features are not available");
  }

  const hasAccess = await hasProjectAccess(projectId);
  if (!hasAccess) {
    return ActionError("Project not found");
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Get metrics for current and previous periods
  const [currentStats, previousStats, currentSessions, previousSessions] = await Promise.all([
    prisma.projectStat.aggregate({
      where: {
        projectId,
        name: "page",
        date: { gte: sevenDaysAgo },
      },
      _sum: { count: true },
    }),
    prisma.projectStat.aggregate({
      where: {
        projectId,
        name: "page",
        date: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
      _sum: { count: true },
    }),
    prisma.projectSession.aggregate({
      where: {
        projectId,
        startedAt: { gte: sevenDaysAgo },
      },
      _avg: { duration: true },
      _count: true,
    }),
    prisma.projectSession.aggregate({
      where: {
        projectId,
        startedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
      _avg: { duration: true },
      _count: true,
    }),
  ]);

  // Get unique visitors
  const [currentVisitors, previousVisitors] = await Promise.all([
    prisma.visitor.count({
      where: {
        projectId,
        firstSeenAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.visitor.count({
      where: {
        projectId,
        firstSeenAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    }),
  ]);

  // Calculate bounce rates
  const [currentBounced, previousBounced] = await Promise.all([
    prisma.projectSession.count({
      where: {
        projectId,
        startedAt: { gte: sevenDaysAgo },
        pageviews: 1,
      },
    }),
    prisma.projectSession.count({
      where: {
        projectId,
        startedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
        pageviews: 1,
      },
    }),
  ]);

  const currentBounceRate =
    currentSessions._count > 0 ? currentBounced / currentSessions._count : 0;
  const previousBounceRate =
    previousSessions._count > 0 ? previousBounced / previousSessions._count : 0;

  // Convert bigints to numbers
  const currentPageviews = Number(currentStats._sum?.count ?? 0);
  const previousPageviews = Number(previousStats._sum?.count ?? 0);

  // Calculate changes
  const pageviewChange =
    previousPageviews > 0 ? (currentPageviews - previousPageviews) / previousPageviews : 0;

  const visitorChange =
    previousVisitors > 0 ? (currentVisitors - previousVisitors) / previousVisitors : 0;

  const sessionChange =
    previousSessions._count > 0
      ? (currentSessions._count - previousSessions._count) / previousSessions._count
      : 0;

  const insights = await generateInsights({
    currentPeriod: {
      pageviews: currentPageviews,
      visitors: currentVisitors,
      sessions: currentSessions._count,
      bounceRate: currentBounceRate,
      avgDuration: currentSessions._avg.duration || 0,
    },
    previousPeriod: {
      pageviews: previousPageviews,
      visitors: previousVisitors,
      sessions: previousSessions._count,
      bounceRate: previousBounceRate,
      avgDuration: previousSessions._avg.duration || 0,
    },
    topChanges: [
      { metric: "Pageviews", change: pageviewChange },
      { metric: "Visitors", change: visitorChange },
      { metric: "Sessions", change: sessionChange },
      { metric: "Bounce Rate", change: currentBounceRate - previousBounceRate },
    ],
  });

  return ActionSuccess(insights);
}

/**
 * Parse natural language query into filters
 */
export async function parseQueryToFiltersAction(query: string): Promise<
  ActionResult<{
    filters: { field: string; operator: string; value: string }[];
    interpretation: string;
  }>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return ActionError("Unauthorized");
  }

  if (!features.hasAI) {
    return ActionError("AI features are not available");
  }

  if (!query || query.trim().length < 3) {
    return ActionError("Query too short");
  }

  const result = await queryToFilters(query);

  if (!result) {
    return ActionError("Could not parse query");
  }

  return ActionSuccess(result);
}

/**
 * Check if AI features are available
 */
export async function isAIAvailableAction(): Promise<ActionResult<boolean>> {
  const session = await auth();
  if (!session?.user?.id) {
    return ActionError("Unauthorized");
  }

  return ActionSuccess(features.hasAI);
}
