"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { DimensionScope } from "@prisma/client";
import {
  ActionResult,
  ActionSuccess,
  ActionError,
  ActionSuccessVoid,
} from "@/lib/types/actions";
import { verifyProjectOwnership } from "./with-project-ownership";

interface CustomDimensionInput {
  slot: number;
  name: string;
  scope: DimensionScope;
  isActive?: boolean;
}

/**
 * Get the maximum allowed slots based on license tier
 */
async function getMaxSlotsForUser(): Promise<number> {
  const { getCurrentTier } = await import("@/lib/license/validator");
  const tier = await getCurrentTier();
  // Community: 20 slots, Pro/Enterprise: 200 slots
  return tier === "community" ? 20 : 200;
}

/**
 * Create a new custom dimension
 */
export async function createCustomDimensionAction(
  projectId: number,
  input: CustomDimensionInput,
  locale: string,
): Promise<ActionResult<{ id: number }>> {
  const t = await getTranslations({ locale, namespace: "dimensions" });
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

  // Validate slot number
  const maxSlots = await getMaxSlotsForUser();
  if (input.slot < 1 || input.slot > maxSlots) {
    return ActionError(t("errors.invalidSlot", { max: maxSlots }));
  }

  // Check if slot is already used
  const existingDimension = await prisma.customDimension.findUnique({
    where: { projectId_slot: { projectId, slot: input.slot } },
  });

  if (existingDimension) {
    return ActionError(t("errors.slotInUse"));
  }

  try {
    const dimension = await prisma.customDimension.create({
      data: {
        projectId,
        slot: input.slot,
        name: input.name.trim(),
        scope: input.scope,
        isActive: input.isActive ?? true,
      },
    });

    revalidatePath(`/projects/${projectId}/settings/dimensions`);
    return ActionSuccess({ id: dimension.id }, t("created"));
  } catch (error) {
    console.error("Create custom dimension error:", error);
    return ActionError(t("errors.createFailed"));
  }
}

/**
 * Update an existing custom dimension
 */
export async function updateCustomDimensionAction(
  dimensionId: number,
  input: Partial<CustomDimensionInput>,
  locale: string,
): Promise<ActionResult<void>> {
  const t = await getTranslations({ locale, namespace: "dimensions" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const dimension = await prisma.customDimension.findFirst({
    where: { id: dimensionId },
    include: { project: true },
  });

  if (!dimension || dimension.project.userId !== session.user.id) {
    return ActionError(t("errors.notFound"));
  }

  // If changing slot, check if new slot is available
  if (input.slot && input.slot !== dimension.slot) {
    const maxSlots = await getMaxSlotsForUser();
    if (input.slot < 1 || input.slot > maxSlots) {
      return ActionError(t("errors.invalidSlot", { max: maxSlots }));
    }

    const existingDimension = await prisma.customDimension.findUnique({
      where: {
        projectId_slot: { projectId: dimension.projectId, slot: input.slot },
      },
    });

    if (existingDimension) {
      return ActionError(t("errors.slotInUse"));
    }
  }

  try {
    await prisma.customDimension.update({
      where: { id: dimensionId },
      data: {
        slot: input.slot ?? dimension.slot,
        name: input.name?.trim() || dimension.name,
        scope: input.scope || dimension.scope,
        isActive: input.isActive ?? dimension.isActive,
      },
    });

    revalidatePath(`/projects/${dimension.projectId}/settings/dimensions`);
    return ActionSuccessVoid(t("updated"));
  } catch (error) {
    console.error("Update custom dimension error:", error);
    return ActionError(t("errors.updateFailed"));
  }
}

/**
 * Delete a custom dimension
 */
export async function deleteCustomDimensionAction(
  dimensionId: number,
  locale: string,
): Promise<ActionResult<void>> {
  const t = await getTranslations({ locale, namespace: "dimensions" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const dimension = await prisma.customDimension.findFirst({
    where: { id: dimensionId },
    include: { project: true },
  });

  if (!dimension || dimension.project.userId !== session.user.id) {
    return ActionError(t("errors.notFound"));
  }

  try {
    await prisma.customDimension.delete({ where: { id: dimensionId } });
    revalidatePath(`/projects/${dimension.projectId}/settings/dimensions`);
    return ActionSuccessVoid(t("deleted"));
  } catch (error) {
    console.error("Delete custom dimension error:", error);
    return ActionError(t("errors.deleteFailed"));
  }
}

/**
 * Toggle custom dimension active status
 */
export async function toggleCustomDimensionActiveAction(
  dimensionId: number,
): Promise<ActionResult<void>> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError("Unauthorized");
  }

  const dimension = await prisma.customDimension.findFirst({
    where: { id: dimensionId },
    include: { project: true },
  });

  if (!dimension || dimension.project.userId !== session.user.id) {
    return ActionError("Not found");
  }

  await prisma.customDimension.update({
    where: { id: dimensionId },
    data: { isActive: !dimension.isActive },
  });

  revalidatePath(`/projects/${dimension.projectId}/settings/dimensions`);
  return ActionSuccessVoid();
}

/**
 * Get all custom dimensions for a project
 */
export async function getProjectCustomDimensionsAction(
  projectId: number,
  locale: string,
): Promise<ActionResult<{ dimensions: unknown[]; maxSlots: number }>> {
  const t = await getTranslations({ locale, namespace: "dimensions" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const project = await verifyProjectOwnership(projectId, session.user.id);
  if (!project) {
    return ActionError(t("errors.projectNotFound"));
  }

  const dimensions = await prisma.customDimension.findMany({
    where: { projectId },
    orderBy: { slot: "asc" },
    include: {
      _count: {
        select: { values: true },
      },
    },
  });

  const maxSlots = await getMaxSlotsForUser();

  return ActionSuccess({
    dimensions: dimensions.map((d) => ({
      id: d.id,
      slot: d.slot,
      name: d.name,
      scope: d.scope,
      isActive: d.isActive,
      valuesCount: d._count.values,
      createdAt: d.createdAt.toISOString(),
    })),
    maxSlots,
  });
}

/**
 * Get custom dimension values (top values with counts)
 */
export async function getCustomDimensionValuesAction(
  dimensionId: number,
  dateRange: { from: Date; to: Date },
  limit: number = 10,
): Promise<ActionResult<{ values: { value: string; count: number }[] }>> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError("Unauthorized");
  }

  const dimension = await prisma.customDimension.findFirst({
    where: { id: dimensionId },
    include: { project: true },
  });

  if (!dimension || dimension.project.userId !== session.user.id) {
    return ActionError("Not found");
  }

  // Get value counts
  const valueCounts = await prisma.customDimensionValue.groupBy({
    by: ["value"],
    where: {
      dimensionId,
      createdAt: {
        gte: dateRange.from,
        lte: dateRange.to,
      },
    },
    _count: true,
    orderBy: {
      _count: {
        value: "desc",
      },
    },
    take: limit,
  });

  return ActionSuccess({
    values: valueCounts.map((v) => ({
      value: v.value,
      count: v._count,
    })),
  });
}

/**
 * Get next available slot for a project
 */
export async function getNextAvailableSlotAction(
  projectId: number,
): Promise<ActionResult<{ slot: number }>> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError("Unauthorized");
  }

  const project = await verifyProjectOwnership(projectId, session.user.id);
  if (!project) {
    return ActionError("Project not found");
  }

  const maxSlots = await getMaxSlotsForUser();

  // Get all used slots
  const usedDimensions = await prisma.customDimension.findMany({
    where: { projectId },
    select: { slot: true },
    orderBy: { slot: "asc" },
  });

  const usedSlots = new Set(usedDimensions.map((d) => d.slot));

  // Find first available slot
  for (let i = 1; i <= maxSlots; i++) {
    if (!usedSlots.has(i)) {
      return ActionSuccess({ slot: i });
    }
  }

  return ActionError("No available slots");
}
