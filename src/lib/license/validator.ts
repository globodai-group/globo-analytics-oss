/**
 * License Validator
 *
 * Validates license keys using RSA signature verification.
 * Supports offline validation with cached licenses.
 *
 * License key format:
 * GLOB-[tier]-[base64(data)].[base64(signature)]
 *
 * Example:
 * GLOB-PRO-eyJpZCI6IjEyMzQ1...=.eyJzaWduYXR1cmUiOi...=
 */

import crypto from "crypto";
import { cacheGet, cacheSet } from "../redis";
import { logger, logError } from "../logger";
import type {
  License,
  LicenseData,
  LicenseStatus,
  LicenseFeature,
  LicenseValidationResult,
  LicenseActivationResponse,
} from "./types";

// Cache TTL: 24 hours for license validation
const LICENSE_CACHE_TTL = 86400;
// Revalidation interval: 7 days
const REVALIDATION_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Public key for license signature verification
 * This is bundled with the application - no external calls needed
 *
 * In production, replace with your actual public key
 */
const LICENSE_PUBLIC_KEY =
  process.env.LICENSE_PUBLIC_KEY ||
  `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Z3VS5JJcds3xfn/ygWL
hRHGOSj0C8zGHTxS5KBdY4TkNjsK7PWrxLJMM9F4Tb1P9gF3U3q5qW5UBxDKqJ0D
cP5P8vWJVxjG0M4pVALWBV4zXoF0PDwsWJtjBW0gQKCeGJCX3sMACf0F0PLXK5sO
2UJ7x0VJ0jqb0UZ1F3x2ycTJf4FQPFsO3Q5h2Q0V4cZJ7gZ3QMD0j5vKxV6Q0F0w
Fk5U4bV3xQdVLyKf5V8L5VFw5Z3Q0Q0F0w0F0w0F0w0F0w0F0w0F0w0F0w0F0w0F
0w0F0w0F0w0F0w0F0w0F0w0F0w0F0w0F0w0F0w0F0w0F0w0F0w0F0w0F0w0F0w0F
0wIDAQAB
-----END PUBLIC KEY-----`;

/**
 * License server URL for online validation
 */
const LICENSE_SERVER_URL =
  process.env.LICENSE_SERVER_URL || "https://license.globoanalytics.com";

/**
 * Singleton license instance
 */
let currentLicense: License | null = null;

/**
 * Get the instance ID (unique per installation)
 */
function getInstanceId(): string {
  // Use environment variable if set, otherwise generate from hostname
  if (process.env.INSTANCE_ID) {
    return process.env.INSTANCE_ID;
  }

  const hostname = process.env.HOSTNAME || "localhost";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  return crypto
    .createHash("sha256")
    .update(`${hostname}:${appUrl}`)
    .digest("hex")
    .slice(0, 16);
}

/**
 * Parse license key into parts
 */
function parseLicenseKey(
  key: string,
): { tier: string; data: string; signature: string } | null {
  try {
    // Format: GLOB-[TIER]-[base64data].[base64signature]
    const match = key.match(/^GLOB-(COMMUNITY|PRO|ENTERPRISE)-(.+)\.(.+)$/i);
    if (!match) {
      return null;
    }

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

    const signatureBuffer = Buffer.from(signature, "base64");
    return verifier.verify(LICENSE_PUBLIC_KEY, signatureBuffer);
  } catch (error) {
    logError(error, { context: "license", operation: "verifySignature" });
    return false;
  }
}

/**
 * Decode license data from base64
 */
function decodeLicenseData(base64Data: string): LicenseData | null {
  try {
    const json = Buffer.from(base64Data, "base64").toString("utf-8");
    const data = JSON.parse(json) as LicenseData;

    // Validate required fields
    if (
      !data.id ||
      !data.tier ||
      !data.organization ||
      !data.email ||
      !data.expiresAt
    ) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Calculate license status
 */
function calculateStatus(data: LicenseData): LicenseStatus {
  const now = new Date();
  const expiresAt = new Date(data.expiresAt);

  if (expiresAt < now) {
    return "expired";
  }

  return "active";
}

/**
 * Calculate days remaining
 */
function calculateDaysRemaining(expiresAt: string): number {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Validate license key locally (offline validation)
 */
export async function validateLicenseOffline(
  licenseKey: string,
): Promise<LicenseValidationResult> {
  // Parse key
  const parsed = parseLicenseKey(licenseKey);
  if (!parsed) {
    return { valid: false, error: "Invalid license key format" };
  }

  // Decode data
  const data = decodeLicenseData(parsed.data);
  if (!data) {
    return { valid: false, error: "Unable to decode license data" };
  }

  // Verify signature
  if (!verifySignature(parsed.data, parsed.signature)) {
    return { valid: false, error: "Invalid license signature" };
  }

  // Check expiration
  const status = calculateStatus(data);
  if (status === "expired") {
    return { valid: false, error: "License has expired" };
  }

  // Build license object
  const license: License = {
    key: licenseKey,
    data,
    status,
    daysRemaining: calculateDaysRemaining(data.expiresAt),
    isValid: true,
    lastValidated: new Date(),
  };

  return { valid: true, license };
}

/**
 * Validate license online (contact license server)
 */
export async function validateLicenseOnline(
  licenseKey: string,
): Promise<LicenseValidationResult> {
  try {
    const response = await fetch(`${LICENSE_SERVER_URL}/api/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licenseKey,
        instanceId: getInstanceId(),
        hostname: process.env.NEXT_PUBLIC_APP_URL || "localhost",
      }),
    });

    if (!response.ok) {
      // Fall back to offline validation
      logger.warn({
        type: "license",
        event: "online_validation_failed",
        status: response.status,
      });
      return validateLicenseOffline(licenseKey);
    }

    const result: LicenseActivationResponse = await response.json();

    if (!result.success || !result.license) {
      return { valid: false, error: result.error || "Validation failed" };
    }

    // Build license object from server response
    const license: License = {
      key: licenseKey,
      data: result.license,
      status: calculateStatus(result.license),
      daysRemaining: calculateDaysRemaining(result.license.expiresAt),
      isValid: true,
      lastValidated: new Date(),
    };

    // Cache the validated license
    await cacheSet(`license:${getInstanceId()}`, license, LICENSE_CACHE_TTL);

    return { valid: true, license };
  } catch (error) {
    logError(error, { context: "license", operation: "validateLicenseOnline" });

    // Fall back to offline validation
    return validateLicenseOffline(licenseKey);
  }
}

/**
 * Main validation function - uses cache, then online, then offline
 */
export async function validateLicense(
  licenseKey?: string,
): Promise<LicenseValidationResult> {
  // Use provided key or environment variable
  const key = licenseKey || process.env.LICENSE_KEY;

  if (!key) {
    // No license = Community tier (free)
    return {
      valid: true,
      license: {
        key: "",
        data: {
          id: "community",
          tier: "community",
          organization: "Self-Hosted",
          email: "",
          features: [
            "analytics_basic",
            "pageviews",
            "visitors",
            "events_basic",
            "realtime_widget",
            "export_csv",
          ],
          maxDomains: 3,
          maxPageviews: 10000,
          maxUsers: 1,
          issuedAt: new Date().toISOString(),
          expiresAt: new Date(
            Date.now() + 100 * 365 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 100 years
          version: 1,
        },
        status: "active",
        daysRemaining: 36500,
        isValid: true,
        lastValidated: new Date(),
      },
    };
  }

  // Check cache first
  const cached = await cacheGet<License>(`license:${getInstanceId()}`);
  if (cached) {
    // Check if revalidation is needed
    const lastValidated = new Date(cached.lastValidated);
    const needsRevalidation =
      Date.now() - lastValidated.getTime() > REVALIDATION_INTERVAL_MS;

    if (!needsRevalidation) {
      // Recalculate status in case of expiration
      cached.status = calculateStatus(cached.data);
      cached.daysRemaining = calculateDaysRemaining(cached.data.expiresAt);
      cached.isValid = cached.status === "active";

      if (cached.isValid) {
        return { valid: true, license: cached };
      }
    }

    // Needs revalidation, try online
    return validateLicenseOnline(key);
  }

  // No cache, try online first, then offline
  const onlineResult = await validateLicenseOnline(key);
  if (onlineResult.valid) {
    return onlineResult;
  }

  // Try offline as last resort
  return validateLicenseOffline(key);
}

/**
 * Get current license (cached singleton)
 */
export async function getLicense(): Promise<License | null> {
  if (currentLicense && currentLicense.isValid) {
    return currentLicense;
  }

  const result = await validateLicense();
  if (result.valid && result.license) {
    currentLicense = result.license;
    return currentLicense;
  }

  return null;
}

/**
 * Check if a specific feature is available
 */
export async function hasFeature(feature: LicenseFeature): Promise<boolean> {
  const license = await getLicense();
  if (!license) {
    return false;
  }

  return license.data.features.includes(feature);
}

/**
 * Check multiple features at once
 */
export async function hasFeatures(
  features: LicenseFeature[],
): Promise<boolean> {
  const license = await getLicense();
  if (!license) {
    return false;
  }

  return features.every((f) => license.data.features.includes(f));
}

/**
 * Check if any of the features is available
 */
export async function hasAnyFeature(
  features: LicenseFeature[],
): Promise<boolean> {
  const license = await getLicense();
  if (!license) {
    return false;
  }

  return features.some((f) => license.data.features.includes(f));
}

/**
 * Get current tier
 */
export async function getCurrentTier(): Promise<string> {
  const license = await getLicense();
  return license?.data.tier || "community";
}

/**
 * Check usage limits
 */
export async function checkUsageLimits(usage: {
  domains?: number;
  pageviews?: number;
  users?: number;
}): Promise<{
  withinLimits: boolean;
  exceeded: ("domains" | "pageviews" | "users")[];
}> {
  const license = await getLicense();
  if (!license) {
    return { withinLimits: false, exceeded: [] };
  }

  const exceeded: ("domains" | "pageviews" | "users")[] = [];

  // 0 means unlimited
  if (
    license.data.maxDomains > 0 &&
    (usage.domains || 0) > license.data.maxDomains
  ) {
    exceeded.push("domains");
  }

  if (
    license.data.maxPageviews > 0 &&
    (usage.pageviews || 0) > license.data.maxPageviews
  ) {
    exceeded.push("pageviews");
  }

  if (license.data.maxUsers > 0 && (usage.users || 0) > license.data.maxUsers) {
    exceeded.push("users");
  }

  return {
    withinLimits: exceeded.length === 0,
    exceeded,
  };
}

/**
 * Activate a new license key
 */
export async function activateLicense(
  licenseKey: string,
): Promise<LicenseValidationResult> {
  // Validate the new key
  const result = await validateLicenseOnline(licenseKey);

  if (result.valid && result.license) {
    // Update singleton
    currentLicense = result.license;

    // Cache it
    await cacheSet(
      `license:${getInstanceId()}`,
      result.license,
      LICENSE_CACHE_TTL,
    );

    logger.info({
      type: "license",
      event: "activated",
      tier: result.license.data.tier,
      organization: result.license.data.organization,
    });
  }

  return result;
}

/**
 * Clear cached license (for logout/deactivation)
 */
export async function clearLicense(): Promise<void> {
  currentLicense = null;
  const { cacheDel } = await import("../redis");
  await cacheDel(`license:${getInstanceId()}`);

  logger.info({ type: "license", event: "cleared" });
}

/**
 * Get license status summary for display
 */
export async function getLicenseStatus(): Promise<{
  tier: string;
  tierName: string;
  status: LicenseStatus;
  organization: string;
  daysRemaining: number;
  expiresAt: string;
  features: LicenseFeature[];
  limits: {
    domains: { current: number; max: number };
    pageviews: { current: number; max: number };
    users: { current: number; max: number };
  };
}> {
  const license = await getLicense();

  if (!license) {
    return {
      tier: "community",
      tierName: "Community",
      status: "active",
      organization: "Self-Hosted",
      daysRemaining: 36500,
      expiresAt: new Date(
        Date.now() + 100 * 365 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      features: [
        "analytics_basic",
        "pageviews",
        "visitors",
        "events_basic",
        "realtime_widget",
        "export_csv",
      ],
      limits: {
        domains: { current: 0, max: 3 },
        pageviews: { current: 0, max: 10000 },
        users: { current: 0, max: 1 },
      },
    };
  }

  const tierNames: Record<string, string> = {
    community: "Community",
    pro: "Pro",
    enterprise: "Enterprise",
  };

  return {
    tier: license.data.tier,
    tierName: tierNames[license.data.tier] || license.data.tier,
    status: license.status,
    organization: license.data.organization,
    daysRemaining: license.daysRemaining,
    expiresAt: license.data.expiresAt,
    features: license.data.features,
    limits: {
      domains: { current: 0, max: license.data.maxDomains },
      pageviews: { current: 0, max: license.data.maxPageviews },
      users: { current: 0, max: license.data.maxUsers },
    },
  };
}
