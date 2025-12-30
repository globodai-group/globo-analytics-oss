"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { AttributionModel } from "@prisma/client";
import { ActionResult, ActionSuccess, ActionError } from "@/lib/types/actions";
import { verifyProjectOwnership } from "./with-project-ownership";

interface TouchPointData {
  channel: string;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  createdAt: Date;
  visitorId: string;
}

interface ChannelAttribution {
  channel: string;
  conversions: number;
  revenue: number;
  percentage: number;
}

/**
 * Calculate attribution for Last Click model
 * 100% credit to the last touchpoint before conversion
 */
function calculateLastClick(touchpoints: TouchPointData[]): Map<string, number> {
  const attribution = new Map<string, number>();
  if (touchpoints.length === 0) return attribution;

  const lastTouchpoint = touchpoints[touchpoints.length - 1];
  attribution.set(lastTouchpoint.channel, 1);
  return attribution;
}

/**
 * Calculate attribution for First Click model
 * 100% credit to the first touchpoint
 */
function calculateFirstClick(touchpoints: TouchPointData[]): Map<string, number> {
  const attribution = new Map<string, number>();
  if (touchpoints.length === 0) return attribution;

  const firstTouchpoint = touchpoints[0];
  attribution.set(firstTouchpoint.channel, 1);
  return attribution;
}

/**
 * Calculate attribution for Linear model
 * Equal credit to all touchpoints
 */
function calculateLinear(touchpoints: TouchPointData[]): Map<string, number> {
  const attribution = new Map<string, number>();
  if (touchpoints.length === 0) return attribution;

  const creditPerTouch = 1 / touchpoints.length;
  for (const tp of touchpoints) {
    const current = attribution.get(tp.channel) || 0;
    attribution.set(tp.channel, current + creditPerTouch);
  }
  return attribution;
}

/**
 * Calculate attribution for Time Decay model
 * More credit to recent touchpoints (exponential decay)
 */
function calculateTimeDecay(touchpoints: TouchPointData[]): Map<string, number> {
  const attribution = new Map<string, number>();
  if (touchpoints.length === 0) return attribution;

  // Half-life of 7 days
  const halfLife = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  const lastTime = touchpoints[touchpoints.length - 1].createdAt.getTime();

  let totalWeight = 0;
  const weights: number[] = [];

  for (const tp of touchpoints) {
    const timeDiff = lastTime - tp.createdAt.getTime();
    const weight = Math.pow(0.5, timeDiff / halfLife);
    weights.push(weight);
    totalWeight += weight;
  }

  for (let i = 0; i < touchpoints.length; i++) {
    const tp = touchpoints[i];
    const normalizedWeight = weights[i] / totalWeight;
    const current = attribution.get(tp.channel) || 0;
    attribution.set(tp.channel, current + normalizedWeight);
  }

  return attribution;
}

/**
 * Calculate attribution for Position Based model
 * 40% first, 40% last, 20% distributed to middle
 */
function calculatePositionBased(touchpoints: TouchPointData[]): Map<string, number> {
  const attribution = new Map<string, number>();
  if (touchpoints.length === 0) return attribution;

  if (touchpoints.length === 1) {
    attribution.set(touchpoints[0].channel, 1);
    return attribution;
  }

  if (touchpoints.length === 2) {
    const first = attribution.get(touchpoints[0].channel) || 0;
    attribution.set(touchpoints[0].channel, first + 0.5);
    const last = attribution.get(touchpoints[1].channel) || 0;
    attribution.set(touchpoints[1].channel, last + 0.5);
    return attribution;
  }

  // First touchpoint: 40%
  const firstCurrent = attribution.get(touchpoints[0].channel) || 0;
  attribution.set(touchpoints[0].channel, firstCurrent + 0.4);

  // Last touchpoint: 40%
  const lastTp = touchpoints[touchpoints.length - 1];
  const lastCurrent = attribution.get(lastTp.channel) || 0;
  attribution.set(lastTp.channel, lastCurrent + 0.4);

  // Middle touchpoints: 20% distributed equally
  const middleCount = touchpoints.length - 2;
  const middleCredit = 0.2 / middleCount;

  for (let i = 1; i < touchpoints.length - 1; i++) {
    const tp = touchpoints[i];
    const current = attribution.get(tp.channel) || 0;
    attribution.set(tp.channel, current + middleCredit);
  }

  return attribution;
}

/**
 * Get attribution analysis for a project - OPTIMIZED VERSION
 * Uses batch queries instead of N+1 pattern
 */
export async function getAttributionAnalysisAction(
  projectId: number,
  model: AttributionModel,
  dateRange: { from: Date; to: Date },
  locale: string
): Promise<
  ActionResult<{
    channels: ChannelAttribution[];
    totalConversions: number;
    totalRevenue: number;
    avgTouchpoints: number;
  }>
> {
  const t = await getTranslations({ locale, namespace: "attribution" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const project = await verifyProjectOwnership(projectId, session.user.id);
  if (!project) {
    return ActionError(t("errors.projectNotFound"));
  }

  try {
    // Get all conversions in the date range
    const conversions = await prisma.goalConversion.findMany({
      where: {
        projectId,
        createdAt: { gte: dateRange.from, lte: dateRange.to },
      },
      include: {
        goal: true,
      },
    });

    if (conversions.length === 0) {
      return ActionSuccess({
        channels: [],
        totalConversions: 0,
        totalRevenue: 0,
        avgTouchpoints: 0,
      });
    }

    // OPTIMIZATION: Get all unique visitor IDs from conversions
    const visitorIds = [...new Set(conversions.map((c) => c.visitorId))];

    // OPTIMIZATION: Fetch ALL touchpoints for ALL converting visitors in ONE query
    const allTouchpoints = await prisma.touchPoint.findMany({
      where: {
        projectId,
        visitorId: { in: visitorIds },
        createdAt: { lte: dateRange.to },
      },
      orderBy: { createdAt: "asc" },
    });

    // OPTIMIZATION: Group touchpoints by visitorId in memory
    const touchpointsByVisitor = new Map<string, TouchPointData[]>();
    for (const tp of allTouchpoints) {
      const existing = touchpointsByVisitor.get(tp.visitorId) || [];
      existing.push(tp);
      touchpointsByVisitor.set(tp.visitorId, existing);
    }

    // Process conversions using in-memory data
    const channelCredits = new Map<string, { conversions: number; revenue: number }>();
    let totalTouchpoints = 0;
    let totalRevenue = 0;

    for (const conversion of conversions) {
      // Filter touchpoints that happened before this conversion
      const visitorTouchpoints = touchpointsByVisitor.get(conversion.visitorId) || [];
      const touchpointsBeforeConversion = visitorTouchpoints.filter(
        (tp) => tp.createdAt <= conversion.createdAt
      );

      if (touchpointsBeforeConversion.length === 0) {
        // Attribute to "direct" if no touchpoints
        const current = channelCredits.get("direct") || { conversions: 0, revenue: 0 };
        channelCredits.set("direct", {
          conversions: current.conversions + 1,
          revenue: current.revenue + (conversion.revenue || 0),
        });
        continue;
      }

      totalTouchpoints += touchpointsBeforeConversion.length;
      const conversionRevenue = conversion.revenue || 0;
      totalRevenue += conversionRevenue;

      // Calculate attribution based on model
      let attribution: Map<string, number>;
      switch (model) {
        case AttributionModel.LAST_CLICK:
          attribution = calculateLastClick(touchpointsBeforeConversion);
          break;
        case AttributionModel.FIRST_CLICK:
          attribution = calculateFirstClick(touchpointsBeforeConversion);
          break;
        case AttributionModel.LINEAR:
          attribution = calculateLinear(touchpointsBeforeConversion);
          break;
        case AttributionModel.TIME_DECAY:
          attribution = calculateTimeDecay(touchpointsBeforeConversion);
          break;
        case AttributionModel.POSITION_BASED:
          attribution = calculatePositionBased(touchpointsBeforeConversion);
          break;
        default:
          attribution = calculateLastClick(touchpointsBeforeConversion);
      }

      // Add attribution to channel totals
      for (const [channel, credit] of attribution) {
        const current = channelCredits.get(channel) || { conversions: 0, revenue: 0 };
        channelCredits.set(channel, {
          conversions: current.conversions + credit,
          revenue: current.revenue + conversionRevenue * credit,
        });
      }
    }

    // Convert to array and calculate percentages
    const totalConversions = conversions.length;
    const channels: ChannelAttribution[] = Array.from(channelCredits.entries())
      .map(([channel, data]) => ({
        channel,
        conversions: Math.round(data.conversions * 100) / 100,
        revenue: Math.round(data.revenue * 100) / 100,
        percentage: Math.round((data.conversions / totalConversions) * 100 * 100) / 100,
      }))
      .sort((a, b) => b.conversions - a.conversions);

    const avgTouchpoints =
      totalConversions > 0 ? Math.round((totalTouchpoints / totalConversions) * 100) / 100 : 0;

    return ActionSuccess({
      channels,
      totalConversions,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgTouchpoints,
    });
  } catch (error) {
    console.error("Attribution analysis error:", error);
    return ActionError(t("errors.analysisFailed"));
  }
}

/**
 * Compare attribution across all models - OPTIMIZED VERSION
 * Fetches data once and calculates all models in memory
 */
export async function getAttributionComparisonAction(
  projectId: number,
  dateRange: { from: Date; to: Date },
  locale: string
): Promise<
  ActionResult<{
    models: {
      model: AttributionModel;
      channels: ChannelAttribution[];
    }[];
  }>
> {
  const t = await getTranslations({ locale, namespace: "attribution" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const project = await verifyProjectOwnership(projectId, session.user.id);
  if (!project) {
    return ActionError(t("errors.projectNotFound"));
  }

  try {
    // Get all conversions in the date range
    const conversions = await prisma.goalConversion.findMany({
      where: {
        projectId,
        createdAt: { gte: dateRange.from, lte: dateRange.to },
      },
      include: {
        goal: true,
      },
    });

    if (conversions.length === 0) {
      const emptyModels = [
        AttributionModel.LAST_CLICK,
        AttributionModel.FIRST_CLICK,
        AttributionModel.LINEAR,
        AttributionModel.TIME_DECAY,
        AttributionModel.POSITION_BASED,
      ].map((model) => ({ model, channels: [] }));

      return ActionSuccess({ models: emptyModels });
    }

    // Get all unique visitor IDs
    const visitorIds = [...new Set(conversions.map((c) => c.visitorId))];

    // Fetch ALL touchpoints in ONE query
    const allTouchpoints = await prisma.touchPoint.findMany({
      where: {
        projectId,
        visitorId: { in: visitorIds },
        createdAt: { lte: dateRange.to },
      },
      orderBy: { createdAt: "asc" },
    });

    // Group touchpoints by visitorId
    const touchpointsByVisitor = new Map<string, TouchPointData[]>();
    for (const tp of allTouchpoints) {
      const existing = touchpointsByVisitor.get(tp.visitorId) || [];
      existing.push(tp);
      touchpointsByVisitor.set(tp.visitorId, existing);
    }

    // Calculate all models in memory
    const models = [
      AttributionModel.LAST_CLICK,
      AttributionModel.FIRST_CLICK,
      AttributionModel.LINEAR,
      AttributionModel.TIME_DECAY,
      AttributionModel.POSITION_BASED,
    ];

    const results = models.map((model) => {
      const channelCredits = new Map<string, { conversions: number; revenue: number }>();

      for (const conversion of conversions) {
        const visitorTouchpoints = touchpointsByVisitor.get(conversion.visitorId) || [];
        const touchpointsBeforeConversion = visitorTouchpoints.filter(
          (tp) => tp.createdAt <= conversion.createdAt
        );

        if (touchpointsBeforeConversion.length === 0) {
          const current = channelCredits.get("direct") || { conversions: 0, revenue: 0 };
          channelCredits.set("direct", {
            conversions: current.conversions + 1,
            revenue: current.revenue + (conversion.revenue || 0),
          });
          continue;
        }

        const conversionRevenue = conversion.revenue || 0;

        let attribution: Map<string, number>;
        switch (model) {
          case AttributionModel.LAST_CLICK:
            attribution = calculateLastClick(touchpointsBeforeConversion);
            break;
          case AttributionModel.FIRST_CLICK:
            attribution = calculateFirstClick(touchpointsBeforeConversion);
            break;
          case AttributionModel.LINEAR:
            attribution = calculateLinear(touchpointsBeforeConversion);
            break;
          case AttributionModel.TIME_DECAY:
            attribution = calculateTimeDecay(touchpointsBeforeConversion);
            break;
          case AttributionModel.POSITION_BASED:
            attribution = calculatePositionBased(touchpointsBeforeConversion);
            break;
          default:
            attribution = calculateLastClick(touchpointsBeforeConversion);
        }

        for (const [channel, credit] of attribution) {
          const current = channelCredits.get(channel) || { conversions: 0, revenue: 0 };
          channelCredits.set(channel, {
            conversions: current.conversions + credit,
            revenue: current.revenue + conversionRevenue * credit,
          });
        }
      }

      const totalConversions = conversions.length;
      const channels: ChannelAttribution[] = Array.from(channelCredits.entries())
        .map(([channel, data]) => ({
          channel,
          conversions: Math.round(data.conversions * 100) / 100,
          revenue: Math.round(data.revenue * 100) / 100,
          percentage: Math.round((data.conversions / totalConversions) * 100 * 100) / 100,
        }))
        .sort((a, b) => b.conversions - a.conversions);

      return { model, channels };
    });

    return ActionSuccess({ models: results });
  } catch (error) {
    console.error("Attribution comparison error:", error);
    return ActionError(t("errors.analysisFailed"));
  }
}

/**
 * Get channel details (sources within a channel)
 */
export async function getChannelDetailsAction(
  projectId: number,
  channel: string,
  dateRange: { from: Date; to: Date },
  locale: string
): Promise<
  ActionResult<{
    sources: { source: string; count: number; percentage: number }[];
  }>
> {
  const t = await getTranslations({ locale, namespace: "attribution" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const project = await verifyProjectOwnership(projectId, session.user.id);
  if (!project) {
    return ActionError(t("errors.projectNotFound"));
  }

  const touchpoints = await prisma.touchPoint.groupBy({
    by: ["source"],
    where: {
      projectId,
      channel,
      createdAt: { gte: dateRange.from, lte: dateRange.to },
    },
    _count: true,
    orderBy: { _count: { source: "desc" } },
    take: 20,
  });

  const total = touchpoints.reduce((sum, tp) => sum + tp._count, 0);

  return ActionSuccess({
    sources: touchpoints.map((tp) => ({
      source: tp.source || "direct",
      count: tp._count,
      percentage: total > 0 ? Math.round((tp._count / total) * 100 * 100) / 100 : 0,
    })),
  });
}
