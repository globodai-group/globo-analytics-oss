/**
 * Environment Validation - Ensures all required env vars are set
 *
 * Validates at startup and provides typed access to environment variables
 * OSS Version - Without Stripe/Payment related variables
 */

import { z } from "zod";
import { logger } from "./logger";

/**
 * Environment schema with validation
 */
const envSchema = z.object({
  // Core App
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  NEXT_PUBLIC_APP_NAME: z.string().default("GloboAnalytics"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Authentication
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z
    .string()
    .min(
      32,
      "NEXTAUTH_SECRET must be at least 32 characters for production security",
    ),

  // Redis (optional but recommended for production)
  REDIS_URL: z.string().url().optional(),

  // Cron
  CRON_SECRET: z
    .string()
    .min(16, "CRON_SECRET must be at least 16 characters")
    .optional(),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // OAuth Providers
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // GeoIP
  MAXMIND_LICENSE_KEY: z.string().optional(),
  GEOIP_DATABASE_PATH: z.string().optional(),

  // WebAuthn / Passkeys
  PASSKEY_RP_ID: z.string().default("localhost"),
  PASSKEY_RP_NAME: z.string().default("GloboAnalytics"),

  // OSS License API (for premium features validation)
  LICENSE_API_URL: z.string().url().optional(),
  LICENSE_API_KEY: z.string().optional(),

  // AI (Anthropic)
  ANTHROPIC_API_KEY: z.string().optional(),

  // Feature Flags
  FEATURE_RATE_LIMITING: z
    .string()
    .default("true")
    .transform((v) => v === "true"),
  FEATURE_CONSENT_REQUIRED: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  FEATURE_EVENT_QUEUE: z
    .string()
    .default("true")
    .transform((v) => v === "true"),

  // Logging
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

/**
 * Parsed and validated environment
 */
export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

/**
 * Get validated environment variables
 */
export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.format();
    const errorDetails: Record<string, string> = {};

    Object.entries(errors).forEach(([key, value]) => {
      if (
        key !== "_errors" &&
        value &&
        typeof value === "object" &&
        "_errors" in value
      ) {
        const errorMessages = (value as { _errors: string[] })._errors;
        if (errorMessages.length > 0) {
          errorDetails[key] = errorMessages.join(", ");
        }
      }
    });

    logger.error({
      type: "env",
      event: "validation_failed",
      errors: errorDetails,
    });

    // In development, continue with defaults
    if (process.env.NODE_ENV === "development") {
      logger.warn({
        type: "env",
        event: "using_defaults",
        message: "Continuing with defaults in development mode",
      });
      cachedEnv = envSchema.parse({
        ...process.env,
        DATABASE_URL:
          process.env.DATABASE_URL ||
          "postgresql://localhost:5432/globoanalytics",
        NEXTAUTH_SECRET:
          process.env.NEXTAUTH_SECRET ||
          "development-secret-key-min-32-chars-for-security",
      });
      return cachedEnv;
    }

    throw new Error("Invalid environment configuration");
  }

  cachedEnv = result.data;
  return cachedEnv;
}

/**
 * Feature flags helper
 */
export const features = {
  get rateLimiting() {
    return getEnv().FEATURE_RATE_LIMITING;
  },
  get consentRequired() {
    return getEnv().FEATURE_CONSENT_REQUIRED;
  },
  get eventQueue() {
    return getEnv().FEATURE_EVENT_QUEUE && !!getEnv().REDIS_URL;
  },
  get hasRedis() {
    return !!getEnv().REDIS_URL;
  },
  get hasEmail() {
    return !!getEnv().SMTP_HOST;
  },
  get hasGeoIP() {
    return !!getEnv().MAXMIND_LICENSE_KEY || !!getEnv().GEOIP_DATABASE_PATH;
  },
  get hasLicenseAPI() {
    return !!getEnv().LICENSE_API_URL && !!getEnv().LICENSE_API_KEY;
  },
  get hasAI() {
    return !!getEnv().ANTHROPIC_API_KEY;
  },
};

/**
 * Validate environment on module load (development only)
 */
if (process.env.NODE_ENV === "development") {
  try {
    getEnv();
    logger.info({ type: "env", event: "validated" });
  } catch {
    // Error already logged
  }
}
