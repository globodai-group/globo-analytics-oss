"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { FunnelStepType } from "@prisma/client";
import { ActionResult, ActionSuccess, ActionError, ActionSuccessVoid } from "@/lib/types/actions";
import { verifyProjectOwnership } from "./with-project-ownership";

interface FunnelStepInput {
  position: number;
  name: string;
  type: FunnelStepType;
  urlPattern?: string;
  eventName?: string;
  goalId?: number;
}

interface FunnelInput {
  name: string;
  description?: string;
  isActive?: boolean;
  steps: FunnelStepInput[];
}

/**
 * Create a new funnel
 */
export async function createFunnelAction(
  projectId: number,
  input: FunnelInput,
  locale: string
): Promise<ActionResult<{ id: number }>> {
  const t = await getTranslations({ locale, namespace: "funnels" });
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

  if (!input.steps || input.steps.length < 2) {
    return ActionError(t("errors.minSteps"));
  }

  try {
    const funnel = await prisma.funnel.create({
      data: {
        projectId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        isActive: input.isActive ?? true,
        steps: {
          create: input.steps.map((step, index) => ({
            position: index + 1,
            name: step.name.trim(),
            type: step.type,
            urlPattern: step.urlPattern || null,
            eventName: step.eventName || null,
            goalId: step.goalId || null,
          })),
        },
      },
    });

    revalidatePath(`/projects/${projectId}/funnels`);
    return ActionSuccess({ id: funnel.id }, t("created"));
  } catch (error) {
    console.error("Create funnel error:", error);
    return ActionError(t("errors.createFailed"));
  }
}

/**
 * Update an existing funnel
 */
export async function updateFunnelAction(
  funnelId: number,
  input: Partial<FunnelInput>,
  locale: string
): Promise<ActionResult<void>> {
  const t = await getTranslations({ locale, namespace: "funnels" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const funnel = await prisma.funnel.findFirst({
    where: { id: funnelId },
    include: { project: true },
  });

  if (!funnel || funnel.project.userId !== session.user.id) {
    return ActionError(t("errors.notFound"));
  }

  if (input.steps && input.steps.length < 2) {
    return ActionError(t("errors.minSteps"));
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Update funnel
      await tx.funnel.update({
        where: { id: funnelId },
        data: {
          name: input.name?.trim() || funnel.name,
          description:
            input.description !== undefined
              ? input.description?.trim() || null
              : funnel.description,
          isActive: input.isActive ?? funnel.isActive,
        },
      });

      // If steps are provided, replace all steps
      if (input.steps) {
        await tx.funnelStep.deleteMany({ where: { funnelId } });
        await tx.funnelStep.createMany({
          data: input.steps.map((step, index) => ({
            funnelId,
            position: index + 1,
            name: step.name.trim(),
            type: step.type,
            urlPattern: step.urlPattern || null,
            eventName: step.eventName || null,
            goalId: step.goalId || null,
          })),
        });
      }
    });

    revalidatePath(`/projects/${funnel.projectId}/funnels`);
    revalidatePath(`/projects/${funnel.projectId}/funnels/${funnelId}`);
    return ActionSuccessVoid(t("updated"));
  } catch (error) {
    console.error("Update funnel error:", error);
    return ActionError(t("errors.updateFailed"));
  }
}

/**
 * Delete a funnel
 */
export async function deleteFunnelAction(
  funnelId: number,
  locale: string
): Promise<ActionResult<void>> {
  const t = await getTranslations({ locale, namespace: "funnels" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const funnel = await prisma.funnel.findFirst({
    where: { id: funnelId },
    include: { project: true },
  });

  if (!funnel || funnel.project.userId !== session.user.id) {
    return ActionError(t("errors.notFound"));
  }

  try {
    await prisma.funnel.delete({ where: { id: funnelId } });
    revalidatePath(`/projects/${funnel.projectId}/funnels`);
    return ActionSuccessVoid(t("deleted"));
  } catch (error) {
    console.error("Delete funnel error:", error);
    return ActionError(t("errors.deleteFailed"));
  }
}

/**
 * Toggle funnel active status
 */
export async function toggleFunnelActiveAction(funnelId: number): Promise<ActionResult<void>> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError("Unauthorized");
  }

  const funnel = await prisma.funnel.findFirst({
    where: { id: funnelId },
    include: { project: true },
  });

  if (!funnel || funnel.project.userId !== session.user.id) {
    return ActionError("Not found");
  }

  await prisma.funnel.update({
    where: { id: funnelId },
    data: { isActive: !funnel.isActive },
  });

  revalidatePath(`/projects/${funnel.projectId}/funnels`);
  return ActionSuccessVoid();
}

/**
 * Get funnel analysis data
 */
export async function getFunnelAnalysisAction(
  funnelId: number,
  dateRange: { from: Date; to: Date },
  locale: string
): Promise<ActionResult<unknown>> {
  const t = await getTranslations({ locale, namespace: "funnels" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const funnel = await prisma.funnel.findFirst({
    where: { id: funnelId },
    include: {
      project: true,
      steps: { orderBy: { position: "asc" } },
    },
  });

  if (!funnel || funnel.project.userId !== session.user.id) {
    return ActionError(t("errors.notFound"));
  }

  // Calculate funnel metrics for each step
  const stepsWithMetrics = await Promise.all(
    funnel.steps.map(async (step, index) => {
      let visitors = 0;

      if (step.type === "URL" && step.urlPattern) {
        // Count sessions that visited this URL pattern
        visitors = await prisma.projectSession.count({
          where: {
            projectId: funnel.projectId,
            startedAt: { gte: dateRange.from, lte: dateRange.to },
            entryPage: { contains: step.urlPattern },
          },
        });
      } else if (step.type === "EVENT" && step.eventName) {
        // Count unique visitors for this event
        const events = await prisma.projectEvent.groupBy({
          by: ["visitorId"],
          where: {
            projectId: funnel.projectId,
            name: step.eventName,
            createdAt: { gte: dateRange.from, lte: dateRange.to },
          },
        });
        visitors = events.length;
      } else if (step.type === "GOAL" && step.goalId) {
        // Count goal conversions
        visitors = await prisma.goalConversion.count({
          where: {
            goalId: step.goalId,
            createdAt: { gte: dateRange.from, lte: dateRange.to },
          },
        });
      }

      return {
        position: step.position,
        name: step.name,
        type: step.type,
        visitors,
        dropOff: 0,
        dropOffRate: 0,
        conversionRate: 0,
      };
    })
  );

  // Calculate drop-off and conversion rates
  for (let i = 0; i < stepsWithMetrics.length; i++) {
    if (i === 0) {
      stepsWithMetrics[i].conversionRate = 100;
    } else {
      const previousVisitors = stepsWithMetrics[i - 1].visitors;
      const currentVisitors = stepsWithMetrics[i].visitors;

      stepsWithMetrics[i].dropOff = Math.max(0, previousVisitors - currentVisitors);
      stepsWithMetrics[i].dropOffRate =
        previousVisitors > 0
          ? Math.round(((previousVisitors - currentVisitors) / previousVisitors) * 100 * 100) / 100
          : 0;
      stepsWithMetrics[i].conversionRate =
        stepsWithMetrics[0].visitors > 0
          ? Math.round((currentVisitors / stepsWithMetrics[0].visitors) * 100 * 100) / 100
          : 0;
    }
  }

  // Overall funnel stats
  const totalEntrants = stepsWithMetrics[0]?.visitors || 0;
  const totalConversions = stepsWithMetrics[stepsWithMetrics.length - 1]?.visitors || 0;
  const overallConversionRate =
    totalEntrants > 0 ? Math.round((totalConversions / totalEntrants) * 100 * 100) / 100 : 0;

  return ActionSuccess({
    funnel: {
      id: funnel.id,
      name: funnel.name,
      description: funnel.description,
      isActive: funnel.isActive,
    },
    steps: stepsWithMetrics,
    summary: {
      totalEntrants,
      totalConversions,
      overallConversionRate,
      totalDropOff: totalEntrants - totalConversions,
    },
  });
}
