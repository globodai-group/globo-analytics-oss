"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { GoalType, UrlMatchType } from "@prisma/client";
import { ActionResult, ActionSuccess, ActionError, ActionSuccessVoid } from "@/lib/types/actions";
import { verifyProjectOwnership } from "./with-project-ownership";

interface GoalInput {
  name: string;
  description?: string;
  type: GoalType;
  isActive?: boolean;
  // URL matching
  urlMatch?: string;
  urlMatchType?: UrlMatchType;
  // Event matching
  eventName?: string;
  eventCategory?: string;
  eventAction?: string;
  eventLabel?: string;
  eventValue?: number;
  // Duration
  durationSeconds?: number;
  // Pages per session
  minPages?: number;
  // Revenue
  revenueTracking?: boolean;
  defaultRevenue?: number;
}

/**
 * Create a new goal
 */
export async function createGoalAction(
  projectId: number,
  input: GoalInput,
  locale: string
): Promise<ActionResult<{ id: number }>> {
  const t = await getTranslations({ locale, namespace: "goals" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const project = await verifyProjectOwnership(projectId, session.user.id);
  if (!project) {
    return ActionError(t("errors.projectNotFound"));
  }

  if (!input.name?.trim()) {
    return ActionError(t("errors.nameRequired"));
  }

  try {
    const goal = await prisma.goal.create({
      data: {
        projectId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        type: input.type,
        isActive: input.isActive ?? true,
        urlMatch: input.urlMatch || null,
        urlMatchType: input.urlMatchType || null,
        eventName: input.eventName || null,
        eventCategory: input.eventCategory || null,
        eventAction: input.eventAction || null,
        eventLabel: input.eventLabel || null,
        eventValue: input.eventValue || null,
        durationSeconds: input.durationSeconds || null,
        minPages: input.minPages || null,
        revenueTracking: input.revenueTracking ?? false,
        defaultRevenue: input.defaultRevenue || null,
      },
    });

    revalidatePath(`/projects/${projectId}/goals`);
    return ActionSuccess({ id: goal.id }, t("created"));
  } catch (error) {
    console.error("Create goal error:", error);
    return ActionError(t("errors.createFailed"));
  }
}

/**
 * Update an existing goal
 */
export async function updateGoalAction(
  goalId: number,
  input: Partial<GoalInput>,
  locale: string
): Promise<ActionResult<void>> {
  const t = await getTranslations({ locale, namespace: "goals" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const goal = await prisma.goal.findFirst({
    where: { id: goalId },
    include: { project: true },
  });

  if (!goal || goal.project.userId !== session.user.id) {
    return ActionError(t("errors.notFound"));
  }

  try {
    await prisma.goal.update({
      where: { id: goalId },
      data: {
        name: input.name?.trim() || goal.name,
        description:
          input.description !== undefined ? input.description?.trim() || null : goal.description,
        type: input.type || goal.type,
        isActive: input.isActive ?? goal.isActive,
        urlMatch: input.urlMatch !== undefined ? input.urlMatch || null : goal.urlMatch,
        urlMatchType:
          input.urlMatchType !== undefined ? input.urlMatchType || null : goal.urlMatchType,
        eventName: input.eventName !== undefined ? input.eventName || null : goal.eventName,
        eventCategory:
          input.eventCategory !== undefined ? input.eventCategory || null : goal.eventCategory,
        eventAction: input.eventAction !== undefined ? input.eventAction || null : goal.eventAction,
        eventLabel: input.eventLabel !== undefined ? input.eventLabel || null : goal.eventLabel,
        eventValue: input.eventValue !== undefined ? input.eventValue || null : goal.eventValue,
        durationSeconds:
          input.durationSeconds !== undefined
            ? input.durationSeconds || null
            : goal.durationSeconds,
        minPages: input.minPages !== undefined ? input.minPages || null : goal.minPages,
        revenueTracking: input.revenueTracking ?? goal.revenueTracking,
        defaultRevenue:
          input.defaultRevenue !== undefined ? input.defaultRevenue || null : goal.defaultRevenue,
      },
    });

    revalidatePath(`/projects/${goal.projectId}/goals`);
    revalidatePath(`/projects/${goal.projectId}/goals/${goalId}`);
    return ActionSuccessVoid(t("updated"));
  } catch (error) {
    console.error("Update goal error:", error);
    return ActionError(t("errors.updateFailed"));
  }
}

/**
 * Delete a goal
 */
export async function deleteGoalAction(
  goalId: number,
  locale: string
): Promise<ActionResult<void>> {
  const t = await getTranslations({ locale, namespace: "goals" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const goal = await prisma.goal.findFirst({
    where: { id: goalId },
    include: { project: true },
  });

  if (!goal || goal.project.userId !== session.user.id) {
    return ActionError(t("errors.notFound"));
  }

  try {
    await prisma.goal.delete({ where: { id: goalId } });
    revalidatePath(`/projects/${goal.projectId}/goals`);
    return ActionSuccessVoid(t("deleted"));
  } catch (error) {
    console.error("Delete goal error:", error);
    return ActionError(t("errors.deleteFailed"));
  }
}

/**
 * Toggle goal active status
 */
export async function toggleGoalActiveAction(goalId: number): Promise<ActionResult<void>> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError("Unauthorized");
  }

  const goal = await prisma.goal.findFirst({
    where: { id: goalId },
    include: { project: true },
  });

  if (!goal || goal.project.userId !== session.user.id) {
    return ActionError("Not found");
  }

  await prisma.goal.update({
    where: { id: goalId },
    data: { isActive: !goal.isActive },
  });

  revalidatePath(`/projects/${goal.projectId}/goals`);
  return ActionSuccessVoid();
}

/**
 * Get all goals for a project
 */
export async function getProjectGoalsAction(
  projectId: number,
  locale: string
): Promise<ActionResult<{ goals: unknown[] }>> {
  const t = await getTranslations({ locale, namespace: "goals" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const project = await verifyProjectOwnership(projectId, session.user.id);
  if (!project) {
    return ActionError(t("errors.projectNotFound"));
  }

  const goals = await prisma.goal.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { conversions: true },
      },
    },
  });

  return ActionSuccess({
    goals: goals.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      type: g.type,
      isActive: g.isActive,
      conversionsCount: g._count.conversions,
      createdAt: g.createdAt.toISOString(),
    })),
  });
}

/**
 * Get goal details with stats
 */
export async function getGoalDetailsAction(
  goalId: number,
  dateRange: { from: Date; to: Date },
  locale: string
): Promise<ActionResult<unknown>> {
  const t = await getTranslations({ locale, namespace: "goals" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const goal = await prisma.goal.findFirst({
    where: { id: goalId },
    include: { project: true },
  });

  if (!goal || goal.project.userId !== session.user.id) {
    return ActionError(t("errors.notFound"));
  }

  // Get conversions count
  const conversionsCount = await prisma.goalConversion.count({
    where: {
      goalId,
      createdAt: {
        gte: dateRange.from,
        lte: dateRange.to,
      },
    },
  });

  // Get total revenue
  const revenueAgg = await prisma.goalConversion.aggregate({
    where: {
      goalId,
      createdAt: {
        gte: dateRange.from,
        lte: dateRange.to,
      },
    },
    _sum: { revenue: true },
  });

  // Get unique visitors who converted
  const uniqueVisitors = await prisma.goalConversion.groupBy({
    by: ["visitorId"],
    where: {
      goalId,
      createdAt: {
        gte: dateRange.from,
        lte: dateRange.to,
      },
    },
  });

  // Get daily conversions for chart
  const dailyConversions = await prisma.$queryRaw<{ date: Date; count: bigint; revenue: number }[]>`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as count,
      COALESCE(SUM(revenue), 0) as revenue
    FROM "GoalConversion"
    WHERE goal_id = ${goalId}
      AND created_at >= ${dateRange.from}
      AND created_at <= ${dateRange.to}
    GROUP BY DATE(created_at)
    ORDER BY date
  `;

  return ActionSuccess({
    goal: {
      id: goal.id,
      name: goal.name,
      description: goal.description,
      type: goal.type,
      isActive: goal.isActive,
      urlMatch: goal.urlMatch,
      urlMatchType: goal.urlMatchType,
      eventName: goal.eventName,
      eventCategory: goal.eventCategory,
      eventAction: goal.eventAction,
      eventLabel: goal.eventLabel,
      eventValue: goal.eventValue,
      durationSeconds: goal.durationSeconds,
      minPages: goal.minPages,
      revenueTracking: goal.revenueTracking,
      defaultRevenue: goal.defaultRevenue,
      createdAt: goal.createdAt.toISOString(),
    },
    stats: {
      conversions: conversionsCount,
      revenue: revenueAgg._sum.revenue || 0,
      uniqueVisitors: uniqueVisitors.length,
      conversionRate: 0, // Will be calculated on frontend with total visitors
    },
    chartData: dailyConversions.map((d) => ({
      date: d.date.toISOString().split("T")[0],
      conversions: Number(d.count),
      revenue: Number(d.revenue),
    })),
  });
}

/**
 * Get goal conversion rate (requires total visitors)
 */
export async function getGoalConversionRateAction(
  goalId: number,
  dateRange: { from: Date; to: Date }
): Promise<ActionResult<{ rate: number; conversions: number; visitors: number }>> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError("Unauthorized");
  }

  const goal = await prisma.goal.findFirst({
    where: { id: goalId },
    include: { project: true },
  });

  if (!goal || goal.project.userId !== session.user.id) {
    return ActionError("Not found");
  }

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

  // Get total unique visitors for the project in the same period
  const visitors = await prisma.visitor.count({
    where: {
      projectId: goal.projectId,
      lastSeenAt: {
        gte: dateRange.from,
        lte: dateRange.to,
      },
    },
  });

  const rate = visitors > 0 ? (conversions / visitors) * 100 : 0;

  return ActionSuccess({
    rate: Math.round(rate * 100) / 100,
    conversions,
    visitors,
  });
}
