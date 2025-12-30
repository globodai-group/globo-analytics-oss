/**
 * License Types for GloboAnalytics OSS
 *
 * Defines the license system types used for feature gating.
 */

export type LicenseTier = "community" | "pro" | "enterprise";

export type LicenseFeature =
  // Community (Free) - Local processing
  | "analytics_basic"
  | "pageviews"
  | "visitors"
  | "events_basic"
  | "realtime_widget"
  | "export_csv"
  | "goals_basic" // Max 3
  | "funnels_basic" // Max 1
  | "segments_basic" // Max 2
  // Pro (€29/mo) - Cloud API required
  | "heatmaps"
  | "session_recording"
  | "bot_detection_advanced"
  | "ab_testing"
  | "retention_analysis"
  | "user_journey"
  | "funnels_advanced"
  | "goals_unlimited"
  | "alerts_unlimited"
  | "segments_advanced"
  | "api_access"
  | "export_pdf"
  | "scheduled_reports"
  | "attribution"
  | "cohorts"
  // Enterprise (€199/mo) - Cloud API required
  | "sso_saml"
  | "sso_oidc"
  | "white_label"
  | "custom_domain"
  | "role_permissions"
  | "audit_logs"
  | "ai_insights"
  | "predictive_analytics"
  | "anomaly_detection"
  | "natural_language_query"
  | "priority_support"
  | "sla"
  | "dedicated_support";

export type LicenseStatus =
  | "active"
  | "expired"
  | "suspended"
  | "invalid"
  | "community";

export interface LicenseData {
  id: string;
  tier: LicenseTier;
  organization: string;
  email: string;
  features: LicenseFeature[];
  maxDomains: number;
  maxPageviews: number;
  maxUsers: number;
  issuedAt: string;
  expiresAt: string;
  version: number;
}

export interface License {
  key: string;
  data: LicenseData;
  status: LicenseStatus;
  daysRemaining: number;
  isValid: boolean;
  lastValidated: Date;
}

/**
 * Features that require Cloud API (80%+ of premium features)
 * These cannot be bypassed by modifying the code
 */
export const CLOUD_REQUIRED_FEATURES: LicenseFeature[] = [
  // Pro Cloud features
  "heatmaps",
  "session_recording",
  "bot_detection_advanced",
  "ab_testing",
  "retention_analysis",
  "user_journey",
  "funnels_advanced",
  "attribution",
  "cohorts",
  "export_pdf",
  "scheduled_reports",
  // Enterprise Cloud features
  "ai_insights",
  "predictive_analytics",
  "anomaly_detection",
  "natural_language_query",
];

/**
 * Features that can be validated locally (20% of premium features)
 * These rely on license key signature verification
 */
export const LOCAL_VALIDATED_FEATURES: LicenseFeature[] = [
  "goals_unlimited",
  "alerts_unlimited",
  "segments_advanced",
  "api_access",
  "sso_saml",
  "sso_oidc",
  "white_label",
  "custom_domain",
  "role_permissions",
  "audit_logs",
  "priority_support",
  "sla",
  "dedicated_support",
];

/**
 * Community tier features (always available)
 */
export const COMMUNITY_FEATURES: LicenseFeature[] = [
  "analytics_basic",
  "pageviews",
  "visitors",
  "events_basic",
  "realtime_widget",
  "export_csv",
  "goals_basic",
  "funnels_basic",
  "segments_basic",
];

/**
 * Feature limits for each tier
 */
export const TIER_LIMITS = {
  community: {
    goals: 3,
    funnels: 1,
    segments: 2,
    domains: 3,
    pageviews: 10000,
    users: 1,
    dataRetention: 180, // days
  },
  pro: {
    goals: -1, // unlimited
    funnels: -1,
    segments: -1,
    domains: 10,
    pageviews: 1000000,
    users: 10,
    dataRetention: 730, // 2 years
  },
  enterprise: {
    goals: -1,
    funnels: -1,
    segments: -1,
    domains: -1,
    pageviews: -1,
    users: -1,
    dataRetention: -1, // unlimited
  },
} as const;
