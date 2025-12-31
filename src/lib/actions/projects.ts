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
import { generateSecretKey } from "@/lib/security/hmac";
import { logError } from "@/lib/logger";

export async function createProjectAction(
  formData: FormData,
  locale: string,
): Promise<ActionResult<{ id: number; trackingId: string }>> {
  const t = await getTranslations({ locale, namespace: "projects" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const name = formData.get("name") as string;
  const platform = (formData.get("platform") as string) || "web";
  const privacy = parseInt(formData.get("privacy") as string) || 1;
  const excludeBots = formData.get("excludeBots") === "true";
  const sessionTimeout =
    parseInt(formData.get("sessionTimeout") as string) || 30;
  const engagementThreshold =
    parseInt(formData.get("engagementThreshold") as string) || 10;

  if (!name) {
    return ActionError(t("errors.nameRequired"));
  }

  try {
    // Generate HMAC secret key for anti-spoofing
    const secretKey = generateSecretKey();

    const project = await prisma.project.create({
      data: {
        name,
        userId: session.user.id,
        platform,
        privacy,
        excludeBots,
        sessionTimeout,
        engagementThreshold,
        secretKey,
      },
    });

    revalidatePath("/projects");
    return ActionSuccess(
      { id: project.id, trackingId: project.trackingId },
      t("created"),
    );
  } catch (error) {
    logError(error, { context: "projects", operation: "create" });
    return ActionError(t("errors.createFailed"));
  }
}

export async function updateProjectAction(
  projectId: number,
  formData: FormData,
  locale: string,
): Promise<ActionResult<void>> {
  const t = await getTranslations({ locale, namespace: "projects" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });

  if (!project) {
    return ActionError(t("errors.notFound"));
  }

  const name = formData.get("name") as string;
  const privacy = parseInt(formData.get("privacy") as string) || 1;
  const excludeBots = formData.get("excludeBots") === "true";
  const sessionTimeout =
    parseInt(formData.get("sessionTimeout") as string) || 30;
  const engagementThreshold =
    parseInt(formData.get("engagementThreshold") as string) || 10;

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        name,
        privacy,
        excludeBots,
        sessionTimeout,
        engagementThreshold,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    return ActionSuccessVoid(t("updated"));
  } catch (error) {
    logError(error, { context: "projects", operation: "update", projectId });
    return ActionError(t("errors.updateFailed"));
  }
}

export async function deleteProjectAction(
  projectId: number,
  locale: string,
): Promise<ActionResult<void>> {
  const t = await getTranslations({ locale, namespace: "projects" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });

  if (!project) {
    return ActionError(t("errors.notFound"));
  }

  try {
    await prisma.project.delete({ where: { id: projectId } });
    revalidatePath("/projects");
    return ActionSuccessVoid(t("deleted"));
  } catch (error) {
    logError(error, { context: "projects", operation: "delete", projectId });
    return ActionError(t("errors.deleteFailed"));
  }
}

export async function toggleProjectFavoriteAction(
  projectId: number,
): Promise<ActionResult<void>> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError("Unauthorized");
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });

  if (!project) {
    return ActionError("Not found");
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      favoritedAt: project.favoritedAt ? null : new Date(),
    },
  });

  revalidatePath("/projects");
  return ActionSuccessVoid();
}

export async function addProjectDomainAction(
  projectId: number,
  domain: string,
  type: string = "web",
): Promise<
  ActionResult<{ id: number; domain: string; type: string; createdAt: string }>
> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError("Unauthorized");
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });

  if (!project) {
    return ActionError("Not found");
  }

  try {
    const newDomain = await prisma.projectDomain.create({
      data: {
        projectId,
        domain,
        type,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    return ActionSuccess(
      {
        id: newDomain.id,
        domain: newDomain.domain,
        type: newDomain.type,
        createdAt: newDomain.createdAt.toISOString(),
      },
      "Domain added",
    );
  } catch (error) {
    logError(error, { context: "projects", operation: "addDomain", projectId });
    return ActionError("Failed to add domain");
  }
}

export async function removeProjectDomainAction(
  domainId: number,
): Promise<ActionResult<void>> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError("Unauthorized");
  }

  const domain = await prisma.projectDomain.findFirst({
    where: { id: domainId },
    include: { project: true },
  });

  if (!domain || domain.project.userId !== session.user.id) {
    return ActionError("Not found");
  }

  await prisma.projectDomain.delete({ where: { id: domainId } });
  revalidatePath(`/projects/${domain.projectId}`);
  return ActionSuccessVoid();
}

/**
 * Regenerate the HMAC secret key for a project
 * This invalidates any existing signed tracking scripts
 */
export async function regenerateProjectSecretAction(
  projectId: number,
): Promise<ActionResult<{ secretKey: string }>> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError("Unauthorized");
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });

  if (!project) {
    return ActionError("Not found");
  }

  try {
    const newSecretKey = generateSecretKey();

    await prisma.project.update({
      where: { id: projectId },
      data: { secretKey: newSecretKey },
    });

    revalidatePath(`/projects/${projectId}`);
    return ActionSuccess({ secretKey: newSecretKey }, "Secret key regenerated");
  } catch (error) {
    logError(error, {
      context: "projects",
      operation: "regenerateSecret",
      projectId,
    });
    return ActionError("Failed to regenerate secret key");
  }
}

/**
 * Get the HMAC secret key for a project (for displaying in tracking code)
 */
export async function getProjectSecretAction(
  projectId: number,
): Promise<ActionResult<{ secretKey: string | null }>> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError("Unauthorized");
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { secretKey: true },
  });

  if (!project) {
    return ActionError("Not found");
  }

  return ActionSuccess({ secretKey: project.secretKey });
}
