/**
 * Feature Gating Utilities
 *
 * Server-side utilities for protecting features based on license tier.
 * Use these to wrap server actions that require specific features.
 *
 * @example
 * ```ts
 * // Protect a server action
 * export const getHeatmapData = withFeature(
 *   "heatmaps",
 *   async (projectId: number) => {
 *     // Only runs if license has heatmaps feature
 *     return await fetchHeatmapData(projectId);
 *   }
 * );
 *
 * // Check feature in action
 * export async function myAction() {
 *   await requireFeature("session_recording");
 *   // Continue with action...
 * }
 * ```
 */

import { hasFeature, hasFeatures, hasAnyFeature, getLicense } from "./validator";
import type { LicenseFeature } from "./types";
import { ActionError, type ActionResult } from "../types/actions";

/**
 * Error messages for license-related errors
 */
export const LicenseErrors = {
  featureNotAvailable: (locale: string, feature: string) =>
    locale === "fr"
      ? `Cette fonctionnalite (${feature}) necessite une licence superieure`
      : `This feature (${feature}) requires a higher license tier`,
  noLicense: (locale: string) =>
    locale === "fr"
      ? "Licence requise pour cette fonctionnalite"
      : "License required for this feature",
  expired: (locale: string) =>
    locale === "fr" ? "Votre licence a expire" : "Your license has expired",
  limitExceeded: (locale: string, limit: string) =>
    locale === "fr" ? `Limite atteinte: ${limit}` : `Limit exceeded: ${limit}`,
} as const;

/**
 * Require a feature - throws if not available
 */
export async function requireFeature(
  feature: LicenseFeature,
  locale: string = "en"
): Promise<void> {
  const available = await hasFeature(feature);
  if (!available) {
    throw new Error(LicenseErrors.featureNotAvailable(locale, feature));
  }
}

/**
 * Require all features - throws if any is missing
 */
export async function requireFeatures(
  features: LicenseFeature[],
  locale: string = "en"
): Promise<void> {
  const available = await hasFeatures(features);
  if (!available) {
    throw new Error(LicenseErrors.featureNotAvailable(locale, features.join(", ")));
  }
}

/**
 * Require any of the features - throws if none available
 */
export async function requireAnyFeature(
  features: LicenseFeature[],
  locale: string = "en"
): Promise<void> {
  const available = await hasAnyFeature(features);
  if (!available) {
    throw new Error(LicenseErrors.featureNotAvailable(locale, features.join(" or ")));
  }
}

/**
 * Higher-order function to wrap server actions with feature check
 *
 * @example
 * ```ts
 * export const getHeatmapData = withFeature(
 *   "heatmaps",
 *   async (projectId: number) => {
 *     return await db.heatmap.findMany({ where: { projectId } });
 *   }
 * );
 * ```
 */
export function withFeature<TArgs extends unknown[], TResult>(
  feature: LicenseFeature,
  fn: (...args: TArgs) => Promise<TResult>,
  locale: string = "en"
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    await requireFeature(feature, locale);
    return fn(...args);
  };
}

/**
 * HOF for actions returning ActionResult
 *
 * @example
 * ```ts
 * export const createHeatmap = withFeatureAction(
 *   "heatmaps",
 *   async (data: HeatmapData): Promise<ActionResult<Heatmap>> => {
 *     const heatmap = await db.heatmap.create({ data });
 *     return ActionSuccess(heatmap);
 *   }
 * );
 * ```
 */
export function withFeatureAction<TArgs extends unknown[], TResult>(
  feature: LicenseFeature,
  fn: (...args: TArgs) => Promise<ActionResult<TResult>>,
  locale: string = "en"
): (...args: TArgs) => Promise<ActionResult<TResult>> {
  return async (...args: TArgs): Promise<ActionResult<TResult>> => {
    const available = await hasFeature(feature);
    if (!available) {
      return ActionError(LicenseErrors.featureNotAvailable(locale, feature));
    }
    return fn(...args);
  };
}

/**
 * HOF requiring multiple features
 */
export function withFeatures<TArgs extends unknown[], TResult>(
  features: LicenseFeature[],
  fn: (...args: TArgs) => Promise<TResult>,
  locale: string = "en"
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    await requireFeatures(features, locale);
    return fn(...args);
  };
}

/**
 * Check if user can access a pro feature and return appropriate error
 */
export async function checkProFeature(
  feature: LicenseFeature,
  locale: string = "en"
): Promise<ActionResult<void>> {
  const available = await hasFeature(feature);
  if (!available) {
    return ActionError(LicenseErrors.featureNotAvailable(locale, feature));
  }
  return { success: true, data: undefined };
}

/**
 * Get available features for current license
 */
export async function getAvailableFeatures(): Promise<LicenseFeature[]> {
  const license = await getLicense();
  return license?.data.features || [];
}

/**
 * Check if current tier is at least the specified tier
 */
export async function isTierAtLeast(
  requiredTier: "community" | "pro" | "enterprise"
): Promise<boolean> {
  const license = await getLicense();
  if (!license) return requiredTier === "community";

  const tierOrder = { community: 0, pro: 1, enterprise: 2 };
  const currentTierLevel = tierOrder[license.data.tier as keyof typeof tierOrder] ?? 0;
  const requiredTierLevel = tierOrder[requiredTier];

  return currentTierLevel >= requiredTierLevel;
}

/**
 * Require minimum tier
 */
export async function requireTier(
  requiredTier: "community" | "pro" | "enterprise",
  locale: string = "en"
): Promise<void> {
  const sufficient = await isTierAtLeast(requiredTier);
  if (!sufficient) {
    throw new Error(
      locale === "fr"
        ? `Cette fonctionnalite necessite le tier ${requiredTier} ou superieur`
        : `This feature requires ${requiredTier} tier or higher`
    );
  }
}

/**
 * HOF for tier-based access control
 */
export function withTier<TArgs extends unknown[], TResult>(
  requiredTier: "community" | "pro" | "enterprise",
  fn: (...args: TArgs) => Promise<TResult>,
  locale: string = "en"
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    await requireTier(requiredTier, locale);
    return fn(...args);
  };
}
