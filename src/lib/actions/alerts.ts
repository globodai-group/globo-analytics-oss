"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { AlertMetric, AlertCondition, CompareType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { ActionResult, ActionSuccess, ActionError, ActionSuccessVoid } from "@/lib/types/actions";
import { verifyProjectOwnership } from "./with-project-ownership";

interface AlertInput {
  name: string;
  metric: AlertMetric;
  condition: AlertCondition;
  threshold: number;
  compareType: CompareType;
  emailEnabled?: boolean;
  webhookUrl?: string;
  slackWebhook?: string;
}

/**
 * Get all alerts for a project
 */
export async function getProjectAlertsAction(
  projectId: number,
  locale: string
): Promise<
  ActionResult<{
    alerts: Array<{
      id: number;
      name: string;
      metric: AlertMetric;
      condition: AlertCondition;
      threshold: number;
      compareType: CompareType;
      isActive: boolean;
      emailEnabled: boolean;
      webhookUrl: string | null;
      slackWebhook: string | null;
      lastTriggered: Date | null;
      consecutiveHits: number;
    }>;
  }>
> {
  const t = await getTranslations({ locale, namespace: "alerts" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const project = await verifyProjectOwnership(projectId, session.user.id);
  if (!project) {
    return ActionError(t("errors.projectNotFound"));
  }

  const alerts = await prisma.alert.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  return ActionSuccess({
    alerts: alerts.map((alert) => ({
      id: alert.id,
      name: alert.name,
      metric: alert.metric,
      condition: alert.condition,
      threshold: alert.threshold,
      compareType: alert.compareType,
      isActive: alert.isActive,
      emailEnabled: alert.emailEnabled,
      webhookUrl: alert.webhookUrl,
      slackWebhook: alert.slackWebhook,
      lastTriggered: alert.lastTriggered,
      consecutiveHits: alert.consecutiveHits,
    })),
  });
}

/**
 * Create a new alert
 */
export async function createAlertAction(
  projectId: number,
  input: AlertInput,
  locale: string
): Promise<ActionResult<{ alertId: number }>> {
  const t = await getTranslations({ locale, namespace: "alerts" });
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
    const alert = await prisma.alert.create({
      data: {
        projectId,
        userId: session.user.id,
        name: input.name.trim(),
        metric: input.metric,
        condition: input.condition,
        threshold: input.threshold,
        compareType: input.compareType,
        emailEnabled: input.emailEnabled ?? true,
        webhookUrl: input.webhookUrl || null,
        slackWebhook: input.slackWebhook || null,
      },
    });

    revalidatePath(`/projects/${projectId}/alerts`);

    return ActionSuccess({ alertId: alert.id }, t("created"));
  } catch (error) {
    console.error("Create alert error:", error);
    return ActionError(t("errors.createFailed"));
  }
}

/**
 * Update an alert
 */
export async function updateAlertAction(
  alertId: number,
  input: Partial<AlertInput> & { isActive?: boolean },
  locale: string
): Promise<ActionResult<void>> {
  const t = await getTranslations({ locale, namespace: "alerts" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const alert = await prisma.alert.findFirst({
    where: { id: alertId },
    include: { project: true },
  });

  if (!alert || alert.project.userId !== session.user.id) {
    return ActionError(t("errors.notFound"));
  }

  try {
    await prisma.alert.update({
      where: { id: alertId },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.metric !== undefined && { metric: input.metric }),
        ...(input.condition !== undefined && { condition: input.condition }),
        ...(input.threshold !== undefined && { threshold: input.threshold }),
        ...(input.compareType !== undefined && { compareType: input.compareType }),
        ...(input.emailEnabled !== undefined && { emailEnabled: input.emailEnabled }),
        ...(input.webhookUrl !== undefined && { webhookUrl: input.webhookUrl || null }),
        ...(input.slackWebhook !== undefined && { slackWebhook: input.slackWebhook || null }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });

    revalidatePath(`/projects/${alert.projectId}/alerts`);

    return ActionSuccessVoid(t("updated"));
  } catch (error) {
    console.error("Update alert error:", error);
    return ActionError(t("errors.updateFailed"));
  }
}

/**
 * Delete an alert
 */
export async function deleteAlertAction(
  alertId: number,
  locale: string
): Promise<ActionResult<void>> {
  const t = await getTranslations({ locale, namespace: "alerts" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const alert = await prisma.alert.findFirst({
    where: { id: alertId },
    include: { project: true },
  });

  if (!alert || alert.project.userId !== session.user.id) {
    return ActionError(t("errors.notFound"));
  }

  try {
    await prisma.alert.delete({
      where: { id: alertId },
    });

    revalidatePath(`/projects/${alert.projectId}/alerts`);

    return ActionSuccessVoid(t("deleted"));
  } catch (error) {
    console.error("Delete alert error:", error);
    return ActionError(t("errors.deleteFailed"));
  }
}

/**
 * Toggle alert active status
 */
export async function toggleAlertAction(
  alertId: number,
  locale: string
): Promise<ActionResult<void>> {
  const t = await getTranslations({ locale, namespace: "alerts" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const alert = await prisma.alert.findFirst({
    where: { id: alertId },
    include: { project: true },
  });

  if (!alert || alert.project.userId !== session.user.id) {
    return ActionError(t("errors.notFound"));
  }

  try {
    await prisma.alert.update({
      where: { id: alertId },
      data: { isActive: !alert.isActive },
    });

    revalidatePath(`/projects/${alert.projectId}/alerts`);

    return ActionSuccessVoid(t("updated"));
  } catch (error) {
    console.error("Toggle alert error:", error);
    return ActionError(t("errors.updateFailed"));
  }
}

/**
 * Get alert history
 */
export async function getAlertHistoryAction(
  alertId: number,
  locale: string
): Promise<
  ActionResult<{
    history: Array<{
      id: number;
      triggeredAt: Date;
      metricValue: number;
      thresholdValue: number;
      notificationSent: boolean;
    }>;
  }>
> {
  const t = await getTranslations({ locale, namespace: "alerts" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const alert = await prisma.alert.findFirst({
    where: { id: alertId },
    include: { project: true },
  });

  if (!alert || alert.project.userId !== session.user.id) {
    return ActionError(t("errors.notFound"));
  }

  const history = await prisma.alertHistory.findMany({
    where: { alertId },
    orderBy: { triggeredAt: "desc" },
    take: 50,
  });

  return ActionSuccess({
    history: history.map((h) => ({
      id: h.id,
      triggeredAt: h.triggeredAt,
      metricValue: h.metricValue,
      thresholdValue: h.thresholdValue,
      notificationSent: h.notificationSent,
    })),
  });
}
