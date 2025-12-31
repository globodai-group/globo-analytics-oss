/**
 * License System Types
 *
 * GloboAnalytics uses a "Source Available" licensing model:
 * - Community (Free): AGPL license, basic analytics
 * - Pro: BSL 1.1 license, advanced features
 * - Enterprise: Commercial license, all features + white-label
 *
 * Self-hosted users must activate a license key to unlock paid features.
 */

/**
 * License tiers available
 */
export type LicenseTier = "community" | "pro" | "enterprise";

/**
 * All features that can be gated by license
 */
export type LicenseFeature =
  // Community (Free) features
  | "analytics_basic"
  | "pageviews"
  | "visitors"
  | "events_basic"
  | "realtime_widget"
  | "export_csv"
  // Pro features
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
  // Enterprise features
  | "sso_saml"
  | "sso_oidc"
  | "white_label"
  | "custom_domain"
  | "role_permissions"
  | "audit_logs"
  | "ai_insights"
  | "predictive_analytics"
  | "mobile_sdk"
  | "priority_support"
  | "sla"
  | "dedicated_support";

/**
 * License status
 */
export type LicenseStatus =
  | "active"
  | "expired"
  | "suspended"
  | "pending"
  | "invalid";

/**
 * License data structure (decoded from license key)
 */
export interface LicenseData {
  /** Unique license identifier */
  id: string;
  /** License tier */
  tier: LicenseTier;
  /** Organization/company name */
  organization: string;
  /** License holder email */
  email: string;
  /** Features included in this license */
  features: LicenseFeature[];
  /** Maximum number of tracked domains (0 = unlimited) */
  maxDomains: number;
  /** Maximum monthly pageviews (0 = unlimited) */
  maxPageviews: number;
  /** Maximum team members (0 = unlimited) */
  maxUsers: number;
  /** Issue date (ISO string) */
  issuedAt: string;
  /** Expiration date (ISO string) */
  expiresAt: string;
  /** License version for future compatibility */
  version: number;
}

/**
 * Full license object with validation info
 */
export interface License {
  /** Raw license key */
  key: string;
  /** Decoded license data */
  data: LicenseData;
  /** Current status */
  status: LicenseStatus;
  /** Days until expiration (negative if expired) */
  daysRemaining: number;
  /** Whether license is valid and active */
  isValid: boolean;
  /** Last validation timestamp */
  lastValidated: Date;
}

/**
 * License activation request
 */
export interface LicenseActivationRequest {
  /** License key to activate */
  licenseKey: string;
  /** Instance ID (unique per installation) */
  instanceId: string;
  /** Server hostname */
  hostname: string;
}

/**
 * License activation response from license server
 */
export interface LicenseActivationResponse {
  success: boolean;
  license?: LicenseData;
  signature?: string;
  error?: string;
  message?: string;
}

/**
 * License validation result
 */
export interface LicenseValidationResult {
  valid: boolean;
  license?: License;
  error?: string;
  requiresRevalidation?: boolean;
}

/**
 * Feature check options
 */
export interface FeatureCheckOptions {
  /** If true, throws error instead of returning false */
  throwOnMissing?: boolean;
  /** Custom error message */
  errorMessage?: string;
}

/**
 * Features included in each tier
 */
export const TIER_FEATURES: Record<LicenseTier, LicenseFeature[]> = {
  community: [
    "analytics_basic",
    "pageviews",
    "visitors",
    "events_basic",
    "realtime_widget",
    "export_csv",
  ],
  pro: [
    // Includes community
    "analytics_basic",
    "pageviews",
    "visitors",
    "events_basic",
    "realtime_widget",
    "export_csv",
    // Pro features
    "heatmaps",
    "session_recording",
    "bot_detection_advanced",
    "ab_testing",
    "retention_analysis",
    "user_journey",
    "funnels_advanced",
    "goals_unlimited",
    "alerts_unlimited",
    "segments_advanced",
    "api_access",
    "export_pdf",
    "scheduled_reports",
  ],
  enterprise: [
    // Includes community
    "analytics_basic",
    "pageviews",
    "visitors",
    "events_basic",
    "realtime_widget",
    "export_csv",
    // Pro features
    "heatmaps",
    "session_recording",
    "bot_detection_advanced",
    "ab_testing",
    "retention_analysis",
    "user_journey",
    "funnels_advanced",
    "goals_unlimited",
    "alerts_unlimited",
    "segments_advanced",
    "api_access",
    "export_pdf",
    "scheduled_reports",
    // Enterprise features
    "sso_saml",
    "sso_oidc",
    "white_label",
    "custom_domain",
    "role_permissions",
    "audit_logs",
    "ai_insights",
    "predictive_analytics",
    "mobile_sdk",
    "priority_support",
    "sla",
    "dedicated_support",
  ],
};

/**
 * Tier limits
 */
export const TIER_LIMITS: Record<
  LicenseTier,
  { maxDomains: number; maxPageviews: number; maxUsers: number }
> = {
  community: {
    maxDomains: 3,
    maxPageviews: 10000, // 10K/month
    maxUsers: 1,
  },
  pro: {
    maxDomains: 10,
    maxPageviews: 1000000, // 1M/month
    maxUsers: 10,
  },
  enterprise: {
    maxDomains: 0, // Unlimited
    maxPageviews: 0, // Unlimited
    maxUsers: 0, // Unlimited
  },
};

/**
 * Human-readable tier names
 */
export const TIER_NAMES: Record<LicenseTier, { en: string; fr: string }> = {
  community: { en: "Community", fr: "Communaute" },
  pro: { en: "Pro", fr: "Pro" },
  enterprise: { en: "Enterprise", fr: "Entreprise" },
};

/**
 * Feature display names for UI
 */
export const FEATURE_NAMES: Record<LicenseFeature, { en: string; fr: string }> =
  {
    analytics_basic: { en: "Basic Analytics", fr: "Analytics de base" },
    pageviews: { en: "Pageview Tracking", fr: "Suivi des pages vues" },
    visitors: { en: "Visitor Tracking", fr: "Suivi des visiteurs" },
    events_basic: { en: "Basic Events", fr: "Evenements de base" },
    realtime_widget: { en: "Realtime Widget", fr: "Widget temps reel" },
    export_csv: { en: "CSV Export", fr: "Export CSV" },
    heatmaps: { en: "Heatmaps", fr: "Cartes de chaleur" },
    session_recording: {
      en: "Session Recording",
      fr: "Enregistrement de session",
    },
    bot_detection_advanced: {
      en: "Advanced Bot Detection",
      fr: "Detection avancee des bots",
    },
    ab_testing: { en: "A/B Testing", fr: "Tests A/B" },
    retention_analysis: {
      en: "Retention Analysis",
      fr: "Analyse de retention",
    },
    user_journey: { en: "User Journey", fr: "Parcours utilisateur" },
    funnels_advanced: { en: "Advanced Funnels", fr: "Entonnoirs avances" },
    goals_unlimited: { en: "Unlimited Goals", fr: "Objectifs illimites" },
    alerts_unlimited: { en: "Unlimited Alerts", fr: "Alertes illimitees" },
    segments_advanced: { en: "Advanced Segments", fr: "Segments avances" },
    api_access: { en: "API Access", fr: "Acces API" },
    export_pdf: { en: "PDF Export", fr: "Export PDF" },
    scheduled_reports: {
      en: "Scheduled Reports",
      fr: "Rapports programmes",
    },
    sso_saml: { en: "SAML SSO", fr: "SSO SAML" },
    sso_oidc: { en: "OIDC SSO", fr: "SSO OIDC" },
    white_label: { en: "White Label", fr: "Marque blanche" },
    custom_domain: { en: "Custom Domain", fr: "Domaine personnalise" },
    role_permissions: {
      en: "Role Permissions",
      fr: "Permissions par role",
    },
    audit_logs: { en: "Audit Logs", fr: "Journaux d'audit" },
    ai_insights: { en: "AI Insights", fr: "Insights IA" },
    predictive_analytics: {
      en: "Predictive Analytics",
      fr: "Analytics predictifs",
    },
    mobile_sdk: { en: "Mobile SDK", fr: "SDK Mobile" },
    priority_support: {
      en: "Priority Support",
      fr: "Support prioritaire",
    },
    sla: { en: "SLA", fr: "SLA" },
    dedicated_support: { en: "Dedicated Support", fr: "Support dedie" },
  };
