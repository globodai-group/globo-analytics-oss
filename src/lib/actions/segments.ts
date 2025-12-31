"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import {
  ActionResult,
  ActionSuccess,
  ActionError,
  ActionSuccessVoid,
} from "@/lib/types/actions";
import { verifyProjectOwnership } from "./with-project-ownership";

// Segment rule operator types
export type SegmentOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "in"
  | "not_in"
  | "is_set"
  | "is_not_set";

// Available segment fields
export type SegmentField =
  | "country"
  | "city"
  | "browser"
  | "os"
  | "device"
  | "platform"
  | "language"
  | "referrer"
  | "landing_page"
  | "exit_page"
  | "page_path"
  | "utm_source"
  | "utm_medium"
  | "utm_campaign"
  | "traffic_source"
  | "is_new_user"
  | "session_count"
  | "page_views"
  | "engagement_time"
  | "custom_dimension_1"
  | "custom_dimension_2"
  | "custom_dimension_3"
  | "custom_dimension_4"
  | "custom_dimension_5";

export interface SegmentRule {
  id: string;
  field: SegmentField;
  operator: SegmentOperator;
  value: string | number | string[];
}

export interface SegmentCondition {
  type: "AND" | "OR";
  rules: SegmentRule[];
}

export interface SegmentInput {
  name: string;
  description?: string;
  conditions: SegmentCondition;
  isShared?: boolean;
}

/**
 * Create a new segment
 */
export async function createSegmentAction(
  projectId: number,
  input: SegmentInput,
  locale: string,
): Promise<ActionResult<{ id: number }>> {
  const t = await getTranslations({ locale, namespace: "segments" });
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

  if (!input.conditions?.rules?.length) {
    return ActionError(t("errors.rulesRequired"));
  }

  try {
    const segment = await prisma.segment.create({
      data: {
        projectId,
        userId: session.user.id,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        conditions: input.conditions as object,
        isShared: input.isShared ?? false,
      },
    });

    revalidatePath(`/projects/${projectId}/segments`);
    return ActionSuccess({ id: segment.id }, t("created"));
  } catch (error) {
    console.error("Create segment error:", error);
    return ActionError(t("errors.createFailed"));
  }
}

/**
 * Update an existing segment
 */
export async function updateSegmentAction(
  segmentId: number,
  input: Partial<SegmentInput>,
  locale: string,
): Promise<ActionResult> {
  const t = await getTranslations({ locale, namespace: "segments" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const segment = await prisma.segment.findFirst({
    where: { id: segmentId },
    include: { project: true },
  });

  if (!segment) {
    return ActionError(t("errors.notFound"));
  }

  // Only owner or project owner can update
  if (
    segment.userId !== session.user.id &&
    segment.project.userId !== session.user.id
  ) {
    return ActionError(t("errors.unauthorized"));
  }

  try {
    await prisma.segment.update({
      where: { id: segmentId },
      data: {
        name: input.name?.trim() || segment.name,
        description:
          input.description !== undefined
            ? input.description?.trim() || null
            : segment.description,
        conditions: input.conditions
          ? (input.conditions as object)
          : (segment.conditions as object),
        isShared: input.isShared ?? segment.isShared,
      },
    });

    revalidatePath(`/projects/${segment.projectId}/segments`);
    revalidatePath(`/projects/${segment.projectId}/segments/${segmentId}`);
    return ActionSuccessVoid(t("updated"));
  } catch (error) {
    console.error("Update segment error:", error);
    return ActionError(t("errors.updateFailed"));
  }
}

/**
 * Delete a segment
 */
export async function deleteSegmentAction(
  segmentId: number,
  locale: string,
): Promise<ActionResult> {
  const t = await getTranslations({ locale, namespace: "segments" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const segment = await prisma.segment.findFirst({
    where: { id: segmentId },
    include: { project: true },
  });

  if (!segment) {
    return ActionError(t("errors.notFound"));
  }

  // Only owner or project owner can delete
  if (
    segment.userId !== session.user.id &&
    segment.project.userId !== session.user.id
  ) {
    return ActionError(t("errors.unauthorized"));
  }

  try {
    await prisma.segment.delete({ where: { id: segmentId } });
    revalidatePath(`/projects/${segment.projectId}/segments`);
    return ActionSuccessVoid(t("deleted"));
  } catch (error) {
    console.error("Delete segment error:", error);
    return ActionError(t("errors.deleteFailed"));
  }
}

/**
 * Toggle segment sharing
 */
export async function toggleSegmentSharingAction(
  segmentId: number,
): Promise<ActionResult<void>> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError("Unauthorized");
  }

  const segment = await prisma.segment.findFirst({
    where: { id: segmentId },
    include: { project: true },
  });

  if (!segment || segment.userId !== session.user.id) {
    return ActionError("Not found");
  }

  await prisma.segment.update({
    where: { id: segmentId },
    data: { isShared: !segment.isShared },
  });

  revalidatePath(`/projects/${segment.projectId}/segments`);
  return ActionSuccessVoid();
}

/**
 * Get all segments for a project
 */
export async function getProjectSegmentsAction(
  projectId: number,
  locale: string,
): Promise<ActionResult<{ segments: unknown[] }>> {
  const t = await getTranslations({ locale, namespace: "segments" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const project = await verifyProjectOwnership(projectId, session.user.id);
  if (!project) {
    return ActionError(t("errors.projectNotFound"));
  }

  // Get segments: user's own segments + shared segments from team
  const segments = await prisma.segment.findMany({
    where: {
      projectId,
      OR: [{ userId: session.user.id }, { isShared: true }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
    },
  });

  return ActionSuccess({
    segments: segments.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      conditions: s.conditions,
      isShared: s.isShared,
      isOwner: s.userId === session.user.id,
      createdBy: s.user.firstName
        ? `${s.user.firstName} ${s.user.lastName}`
        : s.user.email,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
  });
}

/**
 * Duplicate a segment
 */
export async function duplicateSegmentAction(
  segmentId: number,
  locale: string,
): Promise<ActionResult<{ id: number }>> {
  const t = await getTranslations({ locale, namespace: "segments" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const segment = await prisma.segment.findFirst({
    where: { id: segmentId },
    include: { project: true },
  });

  if (!segment) {
    return ActionError(t("errors.notFound"));
  }

  // Check access - owner or project member with access to shared segment
  const hasAccess =
    segment.userId === session.user.id ||
    (segment.isShared && segment.project.userId === session.user.id);

  if (!hasAccess) {
    return ActionError(t("errors.unauthorized"));
  }

  try {
    const newSegment = await prisma.segment.create({
      data: {
        projectId: segment.projectId,
        userId: session.user.id,
        name: `${segment.name} (Copy)`,
        description: segment.description,
        conditions: segment.conditions as object,
        isShared: false,
      },
    });

    revalidatePath(`/projects/${segment.projectId}/segments`);
    return ActionSuccess({ id: newSegment.id }, t("duplicated"));
  } catch (error) {
    console.error("Duplicate segment error:", error);
    return ActionError(t("errors.duplicateFailed"));
  }
}
