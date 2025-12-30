/**
 * License Validator for GloboAnalytics OSS
 *
 * Validates license keys using RSA signature verification.
 * Works offline for basic validation, but Cloud API features
 * require online validation.
 */

import crypto from "crypto";
import type {
  License,
  LicenseData,
  LicenseStatus,
  LicenseFeature,
  LicenseTier,
} from "./types";
import {
  COMMUNITY_FEATURES,
  CLOUD_REQUIRED_FEATURES,
  TIER_LIMITS,
} from "./types";
import { getCloudClient } from "../cloud-api";
import { logger } from "../logger";

/**
 * GloboAnalytics public key for license verification
 * This key can verify signatures but cannot create them
 */
const LICENSE_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Z3VS5JJcds3xfn/ygWL
hRHGOSj0C8zGHTxS5KBdY4TkNjsK7PWrxLJMM9F4Tb1P9gF3U3q5qW5UBxDKqJ0D
cP5P8vWJVxjG0M4pVALWBV4zXoF0PDwsWJtjBW0gQKCeGJCX3sMACf0F0PLXK5sO
2UJ7x0VJ0jqb0UZ1F3x2ycTJf4FQPFsO3Q5h2Q0V4cZJ7gZ3QMD0j5vKxV6Q0F0w
Fk5U4bV3xQdVLyKf5V8L5VFw5Z3Q0Q0F0w0F0w0F0w0F0w0F0w0F0w0F0w0F0w0F
0w0F0w0F0w0F0w0F0w0F0w0F0w0F0w0F0w0F0w0F0w0F0w0F0w0F0w0F0w0F0w0F
0wIDAQAB
-----END PUBLIC KEY-----`;

// Cache
let currentLicense: License | null = null;
let lastValidation: Date | null = null;
const REVALIDATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Parse license key format: GLOB-[TIER]-[base64data].[base64signature]
 */
function parseLicenseKey(
  key: string
): { tier: string; data: string; signature: string } | null {
  try {
    const match = key.match(/^GLOB-(COMMUNITY|PRO|ENTERPRISE)-(.+)\.(.+)$/i);
    if (!match) return null;
    return {
      tier: match[1].toLowerCase(),
      data: match[2],
      signature: match[3],
    };
  } catch {
    return null;
  }
}

/**
 * Verify RSA signature
 */
function verifySignature(data: string, signature: string): boolean {
  try {
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(data);
    return verifier.verify(
      LICENSE_PUBLIC_KEY,
      Buffer.from(signature, "base64")
    );
  } catch {
    return false;
  }
}

/**
 * Decode license data from base64
 */
function decodeLicenseData(base64Data: string): LicenseData | null {
  try {
    const json = Buffer.from(base64Data, "base64").toString("utf-8");
    return JSON.parse(json) as LicenseData;
  } catch {
    return null;
  }
}

/**
 * Get community license (default when no license key)
 */
function getCommunityLicense(): License {
  return {
    key: "",
    data: {
      id: "community",
      tier: "community",
      organization: "Self-Hosted",
      email: "",
      features: COMMUNITY_FEATURES,
      maxDomains: TIER_LIMITS.community.domains,
      maxPageviews: TIER_LIMITS.community.pageviews,
      maxUsers: TIER_LIMITS.community.users,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(
        Date.now() + 100 * 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
      version: 1,
    },
    status: "community",
    daysRemaining: 36500,
    isValid: true,
    lastValidated: new Date(),
  };
}

/**
 * Validate license locally (signature verification)
 */
export async function validateLicense(
  licenseKey?: string
): Promise<License | null> {
  const key = licenseKey || process.env.LICENSE_KEY;

  // No license key = Community tier
  if (!key) {
    currentLicense = getCommunityLicense();
    return currentLicense;
  }

  // Check cache
  if (
    currentLicense &&
    lastValidation &&
    Date.now() - lastValidation.getTime() < REVALIDATION_INTERVAL
  ) {
    return currentLicense;
  }

  // Parse key
  const parsed = parseLicenseKey(key);
  if (!parsed) {
    logger.warn({ type: "license", event: "invalid_format" });
    return getCommunityLicense();
  }

  // Verify signature
  if (!verifySignature(parsed.data, parsed.signature)) {
    logger.warn({ type: "license", event: "invalid_signature" });
    return getCommunityLicense();
  }

  // Decode data
  const data = decodeLicenseData(parsed.data);
  if (!data) {
    logger.warn({ type: "license", event: "decode_failed" });
    return getCommunityLicense();
  }

  // Check expiration
  const expiresAt = new Date(data.expiresAt);
  const now = new Date();
  const isExpired = expiresAt < now;
  const daysRemaining = Math.ceil(
    (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  const license: License = {
    key,
    data,
    status: isExpired ? "expired" : "active",
    daysRemaining,
    isValid: !isExpired,
    lastValidated: new Date(),
  };

  currentLicense = license;
  lastValidation = new Date();

  logger.info({
    type: "license",
    event: "validated",
    tier: data.tier,
    status: license.status,
  });

  return license;
}

/**
 * Get current license
 */
export async function getLicense(): Promise<License> {
  if (!currentLicense) {
    await validateLicense();
  }
  return currentLicense || getCommunityLicense();
}

/**
 * Check if a feature is available
 */
export async function hasFeature(feature: LicenseFeature): Promise<boolean> {
  // Community features are always available
  if (COMMUNITY_FEATURES.includes(feature)) {
    return true;
  }

  const license = await getLicense();

  // Check if feature is in license
  if (!license.data.features.includes(feature)) {
    return false;
  }

  // For Cloud-required features, verify with Cloud API
  if (CLOUD_REQUIRED_FEATURES.includes(feature)) {
    try {
      const cloud = getCloudClient();
      return await cloud.checkFeature(feature);
    } catch {
      return false;
    }
  }

  return license.isValid;
}

/**
 * Get current tier
 */
export async function getCurrentTier(): Promise<LicenseTier> {
  const license = await getLicense();
  return license.data.tier;
}

/**
 * Get license status summary
 */
export async function getLicenseStatus(): Promise<{
  tier: LicenseTier;
  status: LicenseStatus;
  organization: string;
  features: LicenseFeature[];
  limits: {
    domains: number;
    pageviews: number;
    users: number;
  };
  expiresAt: string;
  daysRemaining: number;
}> {
  const license = await getLicense();

  return {
    tier: license.data.tier,
    status: license.status,
    organization: license.data.organization,
    features: license.data.features,
    limits: {
      domains: license.data.maxDomains,
      pageviews: license.data.maxPageviews,
      users: license.data.maxUsers,
    },
    expiresAt: license.data.expiresAt,
    daysRemaining: license.daysRemaining,
  };
}

export { getCommunityLicense };
