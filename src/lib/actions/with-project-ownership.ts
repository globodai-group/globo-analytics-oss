import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ActionResult, ActionError } from "@/lib/types/actions";
import { Project } from "@prisma/client";

/**
 * Verify that a user owns a project
 * Centralized function to eliminate duplicate implementations across action files
 */
export async function verifyProjectOwnership(
  projectId: number,
  userId: string
): Promise<Project | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  return project;
}

/**
 * Context passed to actions wrapped with withProjectOwnership
 */
export interface ProjectOwnershipContext {
  project: Project;
  userId: string;
}

/**
 * Higher-order function that wraps an action with project ownership verification
 * Eliminates boilerplate auth and ownership checks in action functions
 *
 * @example
 * export const getProjectStatsAction = withProjectOwnership(
 *   async (ctx, projectId, dateRange) => {
 *     // ctx.project and ctx.userId are guaranteed to exist
 *     const stats = await getStats(ctx.project.id, dateRange);
 *     return ActionSuccess(stats);
 *   },
 *   "stats" // namespace for translations
 * );
 */
export function withProjectOwnership<TArgs extends unknown[], TResult>(
  action: (ctx: ProjectOwnershipContext, projectId: number, ...args: TArgs) => Promise<TResult>,
  namespace: string
) {
  return async (projectId: number, ...args: TArgs): Promise<TResult | ActionResult<never>> => {
    const session = await auth();

    if (!session?.user?.id) {
      // Return generic unauthorized error
      return ActionError("Unauthorized") as ActionResult<never>;
    }

    const project = await verifyProjectOwnership(projectId, session.user.id);
    if (!project) {
      return ActionError("Project not found") as ActionResult<never>;
    }

    const ctx: ProjectOwnershipContext = {
      project,
      userId: session.user.id,
    };

    return action(ctx, projectId, ...args);
  };
}

/**
 * Convenience wrapper that combines auth check and ownership verification
 * Returns { authorized: true, project, userId } or { authorized: false }
 * Use this when you need the project object in your action logic
 */
export async function checkProjectAccess(
  projectId: number
): Promise<
  { authorized: true; project: Project; userId: string } | { authorized: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { authorized: false, error: "Unauthorized" };
  }

  const project = await verifyProjectOwnership(projectId, session.user.id);
  if (!project) {
    return { authorized: false, error: "Project not found" };
  }

  return { authorized: true, project, userId: session.user.id };
}

/**
 * Simple boolean check for project ownership
 * For backwards compatibility with existing code
 */
export async function hasProjectAccess(projectId: number): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  const project = await verifyProjectOwnership(projectId, session.user.id);
  return !!project;
}

/**
 * Variant with locale and translations support
 * For actions that need localized error messages
 */
export function withProjectOwnershipLocalized<TArgs extends unknown[], TResult>(
  action: (
    ctx: ProjectOwnershipContext & { t: (key: string) => string },
    projectId: number,
    locale: string,
    ...args: TArgs
  ) => Promise<TResult>,
  namespace: string
) {
  return async (
    projectId: number,
    locale: string,
    ...args: TArgs
  ): Promise<TResult | ActionResult<never>> => {
    const { getTranslations } = await import("next-intl/server");
    const t = await getTranslations({ locale, namespace });
    const session = await auth();

    if (!session?.user?.id) {
      return ActionError(t("errors.unauthorized")) as ActionResult<never>;
    }

    const project = await verifyProjectOwnership(projectId, session.user.id);
    if (!project) {
      return ActionError(t("errors.projectNotFound")) as ActionResult<never>;
    }

    const ctx: ProjectOwnershipContext & { t: (key: string) => string } = {
      project,
      userId: session.user.id,
      t,
    };

    return action(ctx, projectId, locale, ...args);
  };
}
