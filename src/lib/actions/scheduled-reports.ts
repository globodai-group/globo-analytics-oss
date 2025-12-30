"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ReportFrequency, ReportDateRange, ReportFormat } from "@prisma/client";

// Types
interface ActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface ScheduledReportInput {
  name: string;
  metrics: string[];
  segmentId?: number;
  dateRange: ReportDateRange;
  frequency: ReportFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  hour?: number;
  timezone?: string;
  recipients: string[];
  format?: ReportFormat;
}

interface ScheduledReportWithRelations {
  id: number;
  name: string;
  metrics: string[];
  dateRange: ReportDateRange;
  frequency: ReportFrequency;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  hour: number;
  timezone: string;
  recipients: string[];
  format: ReportFormat;
  isActive: boolean;
  lastSent: Date | null;
  nextRun: Date | null;
  createdAt: Date;
  segment: { id: number; name: string } | null;
}

// Helper to calculate next run date
function calculateNextRun(
  frequency: ReportFrequency,
  hour: number,
  timezone: string,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null
): Date {
  const now = new Date();
  const next = new Date();

  // Set the hour
  next.setHours(hour, 0, 0, 0);

  // If the time has passed today, move to next occurrence
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  switch (frequency) {
    case "DAILY":
      // Already set to next day if needed
      break;

    case "WEEKLY":
      const targetDay = dayOfWeek ?? 1; // Default to Monday
      const currentDay = next.getDay();
      let daysUntilTarget = targetDay - currentDay;
      if (daysUntilTarget <= 0) {
        daysUntilTarget += 7;
      }
      next.setDate(next.getDate() + daysUntilTarget);
      break;

    case "MONTHLY":
      const targetDate = dayOfMonth ?? 1;
      next.setDate(targetDate);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      break;
  }

  return next;
}

// Get project reports
export async function getProjectReportsAction(
  projectId: number,
  locale: string
): Promise<ActionResult<ScheduledReportWithRelations[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: locale === "fr" ? "Non authentifié" : "Not authenticated",
      };
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return {
        success: false,
        error: locale === "fr" ? "Projet non trouvé" : "Project not found",
      };
    }

    const reports = await prisma.scheduledReport.findMany({
      where: { projectId },
      include: {
        segment: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: reports };
  } catch (error) {
    console.error("Error fetching reports:", error);
    return {
      success: false,
      error: locale === "fr" ? "Erreur serveur" : "Server error",
    };
  }
}

// Create report
export async function createReportAction(
  projectId: number,
  input: ScheduledReportInput,
  locale: string
): Promise<ActionResult<{ id: number }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: locale === "fr" ? "Non authentifié" : "Not authenticated",
      };
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return {
        success: false,
        error: locale === "fr" ? "Projet non trouvé" : "Project not found",
      };
    }

    // Validate recipients
    if (!input.recipients || input.recipients.length === 0) {
      return {
        success: false,
        error:
          locale === "fr" ? "Au moins un destinataire requis" : "At least one recipient required",
      };
    }

    // Validate metrics
    if (!input.metrics || input.metrics.length === 0) {
      return {
        success: false,
        error: locale === "fr" ? "Au moins une métrique requise" : "At least one metric required",
      };
    }

    const hour = input.hour ?? 9;
    const timezone = input.timezone ?? "Europe/Paris";

    const nextRun = calculateNextRun(
      input.frequency,
      hour,
      timezone,
      input.dayOfWeek,
      input.dayOfMonth
    );

    const report = await prisma.scheduledReport.create({
      data: {
        projectId,
        userId: session.user.id,
        name: input.name,
        metrics: input.metrics,
        segmentId: input.segmentId,
        dateRange: input.dateRange,
        frequency: input.frequency,
        dayOfWeek: input.dayOfWeek,
        dayOfMonth: input.dayOfMonth,
        hour,
        timezone,
        recipients: input.recipients,
        format: input.format ?? "PDF",
        nextRun,
      },
    });

    revalidatePath(`/projects/${projectId}/reports`);

    return {
      success: true,
      data: { id: report.id },
      message: locale === "fr" ? "Rapport programmé créé" : "Scheduled report created",
    };
  } catch (error) {
    console.error("Error creating report:", error);
    return {
      success: false,
      error: locale === "fr" ? "Erreur serveur" : "Server error",
    };
  }
}

// Update report
export async function updateReportAction(
  reportId: number,
  input: Partial<ScheduledReportInput>,
  locale: string
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: locale === "fr" ? "Non authentifié" : "Not authenticated",
      };
    }

    // Verify ownership
    const report = await prisma.scheduledReport.findFirst({
      where: {
        id: reportId,
        userId: session.user.id,
      },
    });

    if (!report) {
      return {
        success: false,
        error: locale === "fr" ? "Rapport non trouvé" : "Report not found",
      };
    }

    // Recalculate next run if schedule changed
    let nextRun = report.nextRun;
    if (input.frequency || input.hour || input.dayOfWeek || input.dayOfMonth) {
      nextRun = calculateNextRun(
        input.frequency ?? report.frequency,
        input.hour ?? report.hour,
        input.timezone ?? report.timezone,
        input.dayOfWeek ?? report.dayOfWeek,
        input.dayOfMonth ?? report.dayOfMonth
      );
    }

    await prisma.scheduledReport.update({
      where: { id: reportId },
      data: {
        ...input,
        nextRun,
      },
    });

    revalidatePath(`/projects/${report.projectId}/reports`);

    return {
      success: true,
      message: locale === "fr" ? "Rapport mis à jour" : "Report updated",
    };
  } catch (error) {
    console.error("Error updating report:", error);
    return {
      success: false,
      error: locale === "fr" ? "Erreur serveur" : "Server error",
    };
  }
}

// Delete report
export async function deleteReportAction(reportId: number, locale: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: locale === "fr" ? "Non authentifié" : "Not authenticated",
      };
    }

    // Verify ownership
    const report = await prisma.scheduledReport.findFirst({
      where: {
        id: reportId,
        userId: session.user.id,
      },
    });

    if (!report) {
      return {
        success: false,
        error: locale === "fr" ? "Rapport non trouvé" : "Report not found",
      };
    }

    await prisma.scheduledReport.delete({
      where: { id: reportId },
    });

    revalidatePath(`/projects/${report.projectId}/reports`);

    return {
      success: true,
      message: locale === "fr" ? "Rapport supprimé" : "Report deleted",
    };
  } catch (error) {
    console.error("Error deleting report:", error);
    return {
      success: false,
      error: locale === "fr" ? "Erreur serveur" : "Server error",
    };
  }
}

// Toggle report active status
export async function toggleReportAction(reportId: number, locale: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: locale === "fr" ? "Non authentifié" : "Not authenticated",
      };
    }

    // Verify ownership
    const report = await prisma.scheduledReport.findFirst({
      where: {
        id: reportId,
        userId: session.user.id,
      },
    });

    if (!report) {
      return {
        success: false,
        error: locale === "fr" ? "Rapport non trouvé" : "Report not found",
      };
    }

    const newStatus = !report.isActive;

    // Recalculate next run if activating
    let nextRun = report.nextRun;
    if (newStatus) {
      nextRun = calculateNextRun(
        report.frequency,
        report.hour,
        report.timezone,
        report.dayOfWeek,
        report.dayOfMonth
      );
    }

    await prisma.scheduledReport.update({
      where: { id: reportId },
      data: {
        isActive: newStatus,
        nextRun: newStatus ? nextRun : null,
      },
    });

    revalidatePath(`/projects/${report.projectId}/reports`);

    return {
      success: true,
      message: newStatus
        ? locale === "fr"
          ? "Rapport activé"
          : "Report activated"
        : locale === "fr"
          ? "Rapport désactivé"
          : "Report deactivated",
    };
  } catch (error) {
    console.error("Error toggling report:", error);
    return {
      success: false,
      error: locale === "fr" ? "Erreur serveur" : "Server error",
    };
  }
}

// Get report by ID
export async function getReportAction(
  reportId: number,
  locale: string
): Promise<ActionResult<ScheduledReportWithRelations>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: locale === "fr" ? "Non authentifié" : "Not authenticated",
      };
    }

    const report = await prisma.scheduledReport.findFirst({
      where: {
        id: reportId,
        userId: session.user.id,
      },
      include: {
        segment: {
          select: { id: true, name: true },
        },
      },
    });

    if (!report) {
      return {
        success: false,
        error: locale === "fr" ? "Rapport non trouvé" : "Report not found",
      };
    }

    return { success: true, data: report };
  } catch (error) {
    console.error("Error fetching report:", error);
    return {
      success: false,
      error: locale === "fr" ? "Erreur serveur" : "Server error",
    };
  }
}

// Get project segments for form dropdown
export async function getProjectSegmentsAction(
  projectId: number,
  locale: string
): Promise<ActionResult<{ id: number; name: string }[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: locale === "fr" ? "Non authentifié" : "Not authenticated",
      };
    }

    const segments = await prisma.segment.findMany({
      where: {
        projectId,
        OR: [{ userId: session.user.id }, { isShared: true }],
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return { success: true, data: segments };
  } catch (error) {
    console.error("Error fetching segments:", error);
    return {
      success: false,
      error: locale === "fr" ? "Erreur serveur" : "Server error",
    };
  }
}

// Send report manually (for testing)
export async function sendReportNowAction(reportId: number, locale: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: locale === "fr" ? "Non authentifié" : "Not authenticated",
      };
    }

    const report = await prisma.scheduledReport.findFirst({
      where: {
        id: reportId,
        userId: session.user.id,
      },
    });

    if (!report) {
      return {
        success: false,
        error: locale === "fr" ? "Rapport non trouvé" : "Report not found",
      };
    }

    // TODO: Implement actual report generation and sending
    // For now, just update lastSent and nextRun
    const nextRun = calculateNextRun(
      report.frequency,
      report.hour,
      report.timezone,
      report.dayOfWeek,
      report.dayOfMonth
    );

    await prisma.scheduledReport.update({
      where: { id: reportId },
      data: {
        lastSent: new Date(),
        nextRun,
      },
    });

    revalidatePath(`/projects/${report.projectId}/reports`);

    return {
      success: true,
      message: locale === "fr" ? "Rapport envoyé (simulation)" : "Report sent (simulation)",
    };
  } catch (error) {
    console.error("Error sending report:", error);
    return {
      success: false,
      error: locale === "fr" ? "Erreur serveur" : "Server error",
    };
  }
}
