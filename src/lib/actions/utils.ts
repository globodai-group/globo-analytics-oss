"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logError, logAudit } from "@/lib/logger";
import type { ActionResult } from "@/lib/types/actions";
import { ActionError } from "@/lib/types/actions";

// Re-export for backwards compatibility
export type { ActionResult };

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Date range parameters
 */
export interface DateRangeParams {
  from: Date;
  to: Date;
}

// Note: For success/error helpers, use ActionSuccess/ActionError from "@/lib/types/actions"

/**
 * Get authenticated session or return error
 */
export async function requireAuth(locale: string = "en") {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthError(locale);
  }
  return session;
}

/**
 * Authentication error class
 */
export class AuthError extends Error {
  constructor(locale: string = "en") {
    super(locale === "fr" ? "Non autorisé" : "Unauthorized");
    this.name = "AuthError";
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends Error {
  constructor(resource: string, locale: string = "en") {
    const messages: Record<string, Record<string, string>> = {
      project: { fr: "Projet non trouvé", en: "Project not found" },
      website: { fr: "Site web non trouvé", en: "Website not found" },
      goal: { fr: "Objectif non trouvé", en: "Goal not found" },
      funnel: { fr: "Entonnoir non trouvé", en: "Funnel not found" },
      segment: { fr: "Segment non trouvé", en: "Segment not found" },
      alert: { fr: "Alerte non trouvée", en: "Alert not found" },
      report: { fr: "Rapport non trouvé", en: "Report not found" },
    };
    super(
      messages[resource]?.[locale] ||
        messages[resource]?.["en"] ||
        `${resource} not found`,
    );
    this.name = "NotFoundError";
  }
}

/**
 * Get website with ownership check
 */
export async function getWebsiteWithAuth(
  websiteId: number,
  locale: string = "en",
) {
  const session = await requireAuth(locale);

  const website = await prisma.website.findFirst({
    where: { id: websiteId, userId: session.user.id },
  });

  if (!website) {
    throw new Error(locale === "fr" ? "Site non trouvé" : "Website not found");
  }

  return { session, website };
}

/**
 * Localized error messages
 */
const messages: Record<string, Record<string, string>> = {
  unauthorized: {
    fr: "Non autorisé",
    en: "Unauthorized",
  },
  notFound: {
    fr: "Non trouvé",
    en: "Not found",
  },
  userNotFound: {
    fr: "Utilisateur non trouvé",
    en: "User not found",
  },
  websiteNotFound: {
    fr: "Site web non trouvé",
    en: "Website not found",
  },
  invalidInput: {
    fr: "Données invalides",
    en: "Invalid input",
  },
  serverError: {
    fr: "Une erreur est survenue",
    en: "An error occurred",
  },
  emailExists: {
    fr: "Cet email est déjà utilisé",
    en: "This email is already in use",
  },
  invalidCredentials: {
    fr: "Email ou mot de passe incorrect",
    en: "Invalid email or password",
  },
  passwordUpdated: {
    fr: "Mot de passe mis à jour",
    en: "Password updated successfully",
  },
  profileUpdated: {
    fr: "Profil mis à jour",
    en: "Profile updated successfully",
  },
  websiteCreated: {
    fr: "Site web créé avec succès",
    en: "Website created successfully",
  },
  websiteUpdated: {
    fr: "Site web mis à jour avec succès",
    en: "Website updated successfully",
  },
  websiteDeleted: {
    fr: "Site web supprimé avec succès",
    en: "Website deleted successfully",
  },
  tokenGenerated: {
    fr: "Token API généré",
    en: "API token generated",
  },
  preferencesUpdated: {
    fr: "Préférences mises à jour",
    en: "Preferences updated successfully",
  },
  accountDeleted: {
    fr: "Compte supprimé",
    en: "Account deleted successfully",
  },
  tfaEnabled: {
    fr: "Double authentification activée",
    en: "Two-factor authentication enabled",
  },
  tfaDisabled: {
    fr: "Double authentification désactivée",
    en: "Two-factor authentication disabled",
  },
  invalidCode: {
    fr: "Code invalide",
    en: "Invalid code",
  },
  codeExpired: {
    fr: "Code expiré",
    en: "Code expired",
  },
};

/**
 * Get localized message
 */
export function t(key: string, locale: string = "en"): string {
  return messages[key]?.[locale] || messages[key]?.["en"] || key;
}

/**
 * Wrap an async action with error handling
 */
export async function withErrorHandler<T>(
  action: () => Promise<ActionResult<T>>,
  locale: string = "en",
): Promise<ActionResult<T>> {
  try {
    return await action();
  } catch (err) {
    if (err instanceof AuthError) {
      return ActionError(err.message);
    }
    if (err instanceof NotFoundError) {
      return ActionError(err.message);
    }
    logError(err, { locale });
    return ActionError(t("serverError", locale));
  }
}

// ============================================
// PROJECT UTILITIES (Main analytics model)
// Note: For ownership verification, use functions from ./with-project-ownership.ts
// ============================================

/**
 * Get project with ownership check (with session and locale support)
 */
export async function getProjectWithAuth(
  projectId: number,
  locale: string = "en",
) {
  const session = await requireAuth(locale);

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });

  if (!project) {
    throw new NotFoundError("project", locale);
  }

  return { session, project };
}

// Note: For withProjectOwnership HOF, use the version from ./with-project-ownership.ts

/**
 * Higher-order function: wrap action with authentication only
 */
export function withAuth<T, Args extends unknown[]>(
  action: (
    session: Awaited<ReturnType<typeof requireAuth>>,
    ...args: Args
  ) => Promise<ActionResult<T>>,
) {
  return async (locale: string, ...args: Args): Promise<ActionResult<T>> => {
    return withErrorHandler(async () => {
      const session = await requireAuth(locale);
      return action(session, ...args);
    }, locale);
  };
}

// ============================================
// GOAL UTILITIES
// ============================================

/**
 * Verify goal ownership (through project)
 */
export async function verifyGoalOwnership(
  goalId: number,
  userId: string,
): Promise<boolean> {
  const goal = await prisma.goal.findFirst({
    where: {
      id: goalId,
      project: { userId },
    },
  });
  return !!goal;
}

/**
 * Get goal with ownership check
 */
export async function getGoalWithAuth(goalId: number, locale: string = "en") {
  const session = await requireAuth(locale);

  const goal = await prisma.goal.findFirst({
    where: {
      id: goalId,
      project: { userId: session.user.id },
    },
    include: { project: true },
  });

  if (!goal) {
    throw new NotFoundError("goal", locale);
  }

  return { session, goal };
}

// ============================================
// FUNNEL UTILITIES
// ============================================

/**
 * Verify funnel ownership (through project)
 */
export async function verifyFunnelOwnership(
  funnelId: number,
  userId: string,
): Promise<boolean> {
  const funnel = await prisma.funnel.findFirst({
    where: {
      id: funnelId,
      project: { userId },
    },
  });
  return !!funnel;
}

/**
 * Get funnel with ownership check
 */
export async function getFunnelWithAuth(
  funnelId: number,
  locale: string = "en",
) {
  const session = await requireAuth(locale);

  const funnel = await prisma.funnel.findFirst({
    where: {
      id: funnelId,
      project: { userId: session.user.id },
    },
    include: { project: true, steps: { orderBy: { position: "asc" } } },
  });

  if (!funnel) {
    throw new NotFoundError("funnel", locale);
  }

  return { session, funnel };
}

// ============================================
// SEGMENT UTILITIES
// ============================================

/**
 * Verify segment ownership (through project or user)
 */
export async function verifySegmentOwnership(
  segmentId: number,
  userId: string,
): Promise<boolean> {
  const segment = await prisma.segment.findFirst({
    where: {
      id: segmentId,
      OR: [{ userId }, { project: { userId } }],
    },
  });
  return !!segment;
}

/**
 * Get segment with ownership check
 */
export async function getSegmentWithAuth(
  segmentId: number,
  locale: string = "en",
) {
  const session = await requireAuth(locale);

  const segment = await prisma.segment.findFirst({
    where: {
      id: segmentId,
      OR: [
        { userId: session.user.id },
        { project: { userId: session.user.id } },
      ],
    },
    include: { project: true },
  });

  if (!segment) {
    throw new NotFoundError("segment", locale);
  }

  return { session, segment };
}

// ============================================
// UTILITY HELPERS
// ============================================

/**
 * Parse pagination params with defaults
 */
export function parsePagination(params: PaginationParams, maxLimit = 100) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(maxLimit, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Parse date range with defaults (last 30 days)
 */
export function parseDateRange(
  params?: Partial<DateRangeParams>,
): DateRangeParams {
  const to = params?.to || new Date();
  const from =
    params?.from ||
    (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d;
    })();

  return { from, to };
}

/**
 * Sanitize string for safe database storage
 */
export function sanitizeString(str: string, maxLength = 255): string {
  return str.trim().slice(0, maxLength);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}

/**
 * Log audit action helper
 */
export async function auditAction(
  action: string,
  userId: string,
  resource: string,
  resourceId: string | number,
  details?: Record<string, unknown>,
) {
  logAudit(action, userId, resource, resourceId, details);
}
