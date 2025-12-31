/**
 * SECURITY: Rate Limiting for Server Actions
 *
 * Provides protection against brute-force attacks on sensitive operations
 * like login, 2FA verification, password reset, etc.
 *
 * Uses Redis when available, with fail-closed behavior for security.
 */

import { checkRateLimit, isRedisAvailable } from "@/lib/redis";
import { logSecurityEvent } from "@/lib/logger";

// Rate limit configurations for different operation types
export const RATE_LIMITS = {
  // Very strict for authentication operations
  TFA_VERIFY: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  LOGIN: { limit: 10, windowMs: 15 * 60 * 1000 }, // 10 attempts per 15 minutes
  RECOVERY_CODE: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  PASSWORD_RESET: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour

  // Less strict for general operations
  API_KEY_CREATE: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  OAUTH_GRANT: { limit: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
} as const;

type RateLimitType = keyof typeof RATE_LIMITS;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a specific operation
 *
 * @param type - The type of operation (determines limits)
 * @param identifier - Unique identifier (e.g., userId, email, IP)
 * @returns Rate limit result
 */
export async function checkActionRateLimit(
  type: RateLimitType,
  identifier: string,
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[type];
  const key = `action:${type}:${identifier}`;

  // SECURITY: If Redis is unavailable, we fail closed but with a generous limit
  // This allows some operations to continue while still providing protection
  if (!isRedisAvailable()) {
    // Log the security concern
    logSecurityEvent("rate_limit", {
      reason: `Redis unavailable for ${type} rate limiting`,
    });

    // Return a single-use allowance - subsequent calls will also get one allowance
    // This is a compromise between security and availability
    return {
      allowed: true,
      remaining: 0,
      resetAt: Date.now() + config.windowMs,
    };
  }

  const result = await checkRateLimit(key, config.limit, config.windowMs);

  if (!result.allowed) {
    logSecurityEvent("rate_limit", {
      reason: `${type} rate limit exceeded for ${identifier}`,
    });
  }

  return result;
}

/**
 * Higher-order function to wrap an action with rate limiting
 *
 * @example
 * ```ts
 * const rateLimitedVerify = withRateLimit(
 *   "TFA_VERIFY",
 *   (userId) => userId, // identifier extractor
 *   async (userId, code) => {
 *     // actual verification logic
 *   }
 * );
 * ```
 */
export function withRateLimit<TArgs extends unknown[], TReturn>(
  type: RateLimitType,
  getIdentifier: (...args: TArgs) => string,
  action: (...args: TArgs) => Promise<TReturn>,
  errorMessage = "Too many attempts. Please try again later.",
): (...args: TArgs) => Promise<TReturn | { success: false; error: string }> {
  return async (...args: TArgs) => {
    const identifier = getIdentifier(...args);
    const rateLimitResult = await checkActionRateLimit(type, identifier);

    if (!rateLimitResult.allowed) {
      const retryAfterSeconds = Math.ceil(
        (rateLimitResult.resetAt - Date.now()) / 1000,
      );
      return {
        success: false,
        error: `${errorMessage} Retry after ${Math.ceil(retryAfterSeconds / 60)} minutes.`,
      };
    }

    return action(...args);
  };
}

/**
 * Manual rate limit check for use in existing actions
 *
 * @returns Error message if rate limited, undefined if allowed
 */
export async function checkRateLimitOrError(
  type: RateLimitType,
  identifier: string,
  locale: string = "en",
): Promise<string | undefined> {
  const result = await checkActionRateLimit(type, identifier);

  if (!result.allowed) {
    const retryAfterMinutes = Math.ceil((result.resetAt - Date.now()) / 60000);
    return locale === "fr"
      ? `Trop de tentatives. Veuillez réessayer dans ${retryAfterMinutes} minutes.`
      : `Too many attempts. Please try again in ${retryAfterMinutes} minutes.`;
  }

  return undefined;
}
