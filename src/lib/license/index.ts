/**
 * License Module
 *
 * Exports for license validation and feature gating.
 */

export type {
  LicenseTier,
  LicenseFeature,
  LicenseStatus,
  LicenseData,
  License,
} from "./types";

export {
  COMMUNITY_FEATURES,
  CLOUD_REQUIRED_FEATURES,
  LOCAL_VALIDATED_FEATURES,
  TIER_LIMITS,
} from "./types";

export {
  validateLicense,
  getLicense,
  hasFeature,
  getCurrentTier,
  getLicenseStatus,
  getCommunityLicense,
} from "./validator";
