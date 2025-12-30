/**
 * License Module
 *
 * Centralized exports for the GloboAnalytics licensing system.
 *
 * @example
 * ```ts
 * // Server-side
 * import { hasFeature, requireFeature, withFeatureAction } from "@/lib/license";
 *
 * // Check if feature is available
 * if (await hasFeature("heatmaps")) {
 *   // render heatmaps
 * }
 *
 * // Protect a server action
 * export const getSessionRecording = withFeatureAction(
 *   "session_recording",
 *   async (sessionId) => { ... }
 * );
 * ```
 */

// Types
export type {
  LicenseTier,
  LicenseFeature,
  LicenseStatus,
  LicenseData,
  License,
  LicenseActivationRequest,
  LicenseActivationResponse,
  LicenseValidationResult,
  FeatureCheckOptions,
} from "./types";

export { TIER_FEATURES, TIER_LIMITS, TIER_NAMES, FEATURE_NAMES } from "./types";

// Validator
export {
  validateLicense,
  validateLicenseOffline,
  validateLicenseOnline,
  getLicense,
  hasFeature,
  hasFeatures,
  hasAnyFeature,
  getCurrentTier,
  checkUsageLimits,
  activateLicense,
  clearLicense,
  getLicenseStatus,
} from "./validator";

// Feature gating
export {
  requireFeature,
  requireFeatures,
  requireAnyFeature,
  withFeature,
  withFeatureAction,
  withFeatures,
  checkProFeature,
  getAvailableFeatures,
  isTierAtLeast,
  requireTier,
  withTier,
  LicenseErrors,
} from "./feature-gate";
