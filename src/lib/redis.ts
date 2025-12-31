/**
 * Redis Client - Production-grade caching and rate limiting
 *
 * Features:
 * - Connection pooling
 * - Auto-reconnection
 * - Graceful degradation when Redis is unavailable
 * - Structured logging
 */

import Redis from "ioredis";
import { logger, logError } from "./logger";

// Singleton instance
let redisClient: Redis | null = null;
let isConnected = false;

/**
 * Get Redis client instance (singleton)
 */
export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      // Heroku Redis uses TLS with self-signed certificates
      tls: process.env.REDIS_URL?.startsWith("rediss://")
        ? { rejectUnauthorized: false }
        : undefined,
      retryStrategy(times) {
        if (times > 3) {
          logger.error({ type: "redis", event: "max_retries_exceeded", times });
          return null;
        }
        const delay = Math.min(times * 200, 2000);
        logger.info({
          type: "redis",
          event: "retry",
          attempt: times,
          delayMs: delay,
        });
        return delay;
      },
      reconnectOnError(err) {
        const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"];
        return targetErrors.some((e) => err.message.includes(e));
      },
      enableReadyCheck: true,
      lazyConnect: false,
    });

    redisClient.on("connect", () => {
      logger.info({ type: "redis", event: "connected" });
      isConnected = true;
    });

    redisClient.on("error", (err) => {
      logger.error({ type: "redis", event: "error", error: err.message });
      isConnected = false;
    });

    redisClient.on("close", () => {
      logger.info({ type: "redis", event: "connection_closed" });
      isConnected = false;
    });

    return redisClient;
  } catch (error) {
    logError(error, { context: "redis", operation: "createClient" });
    return null;
  }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return isConnected && redisClient !== null;
}

/**
 * Cache wrapper with TTL
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logError(error, { context: "redis", operation: "cacheGet", key });
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number = 300,
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    logError(error, { context: "redis", operation: "cacheSet", key });
    return false;
  }
}

export async function cacheDel(key: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    logError(error, { context: "redis", operation: "cacheDel", key });
    return false;
  }
}

/**
 * Cache with pattern invalidation
 */
export async function cacheDelPattern(pattern: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;
    return await redis.del(...keys);
  } catch (error) {
    logError(error, {
      context: "redis",
      operation: "cacheDelPattern",
      pattern,
    });
    return 0;
  }
}

/**
 * Visitor cache - 30 min TTL
 */
export async function getCachedVisitor(
  projectId: number,
  visitorId: string,
): Promise<{ id: string; firstSeenAt: Date } | null> {
  return cacheGet(`visitor:${projectId}:${visitorId}`);
}

export async function setCachedVisitor(
  projectId: number,
  visitorId: string,
  data: { id: string; firstSeenAt: Date },
): Promise<boolean> {
  return cacheSet(`visitor:${projectId}:${visitorId}`, data, 1800); // 30 min
}

/**
 * Session cache - 45 min TTL
 */
export async function getCachedSession(
  projectId: number,
  sessionId: string,
): Promise<{
  id: string;
  visitorId: string;
  pageviews: number;
  lastActivityAt: Date;
} | null> {
  return cacheGet(`session:${projectId}:${sessionId}`);
}

export async function setCachedSession(
  projectId: number,
  sessionId: string,
  data: {
    id: string;
    visitorId: string;
    pageviews: number;
    lastActivityAt: Date;
  },
): Promise<boolean> {
  return cacheSet(`session:${projectId}:${sessionId}`, data, 2700); // 45 min
}

/**
 * Project config cache - 5 min TTL
 */
export async function getCachedProjectConfig(projectId: number): Promise<{
  id: number;
  name: string;
  sessionTimeout: number;
  engagementThreshold: number;
  excludeBots: boolean;
  excludedIps: string[];
} | null> {
  return cacheGet(`project:${projectId}:config`);
}

export async function setCachedProjectConfig(
  projectId: number,
  data: {
    id: number;
    name: string;
    sessionTimeout: number;
    engagementThreshold: number;
    excludeBots: boolean;
    excludedIps: string[];
  },
): Promise<boolean> {
  return cacheSet(`project:${projectId}:config`, data, 300); // 5 min
}

/**
 * Rate limiting with sliding window
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const redis = getRedis();
  const now = Date.now();

  // SECURITY: Fail-CLOSED when Redis is unavailable
  // This prevents bypass attacks when Redis is down
  if (!redis) {
    logger.warn({
      type: "redis",
      event: "rate_limit_unavailable",
      message: "Blocking request for security",
    });
    return { allowed: false, remaining: 0, resetAt: now + windowMs };
  }

  const windowStart = now - windowMs;
  const redisKey = `ratelimit:${key}`;

  try {
    // Use Redis transaction for atomic operations
    const multi = redis.multi();

    // Remove old entries outside the window
    multi.zremrangebyscore(redisKey, 0, windowStart);

    // Count current requests in window
    multi.zcard(redisKey);

    // Add current request
    multi.zadd(redisKey, now, `${now}-${Math.random()}`);

    // Set expiry on the key
    multi.pexpire(redisKey, windowMs);

    const results = await multi.exec();

    // SECURITY: Fail-CLOSED if transaction fails
    if (!results) {
      logger.warn({
        type: "redis",
        event: "rate_limit_transaction_failed",
        message: "Blocking request for security",
      });
      return { allowed: false, remaining: 0, resetAt: now + windowMs };
    }

    const currentCount = (results[1]?.[1] as number) || 0;
    const allowed = currentCount < limit;
    const remaining = Math.max(0, limit - currentCount - 1);

    return {
      allowed,
      remaining,
      resetAt: now + windowMs,
    };
  } catch (error) {
    logError(error, { context: "redis", operation: "checkRateLimit", key });
    // SECURITY: Fail-CLOSED - block request if Redis fails
    // This prevents attackers from bypassing rate limiting by causing Redis errors
    return { allowed: false, remaining: 0, resetAt: now + windowMs };
  }
}

/**
 * Request deduplication - prevent duplicate tracking events
 */
export async function isDuplicateRequest(
  projectId: number,
  visitorId: string,
  eventType: string,
  timestampMs: number,
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  // Generate unique key for this event
  const key = `dedup:${projectId}:${visitorId}:${eventType}:${Math.floor(timestampMs / 1000)}`;

  try {
    // Try to set with NX (only if not exists) and 5 second TTL
    const result = await redis.set(key, "1", "EX", 5, "NX");
    // If result is null, the key already existed (duplicate)
    return result === null;
  } catch (error) {
    logError(error, {
      context: "redis",
      operation: "isDuplicateRequest",
      projectId,
      visitorId,
      eventType,
    });
    return false;
  }
}

/**
 * Graceful shutdown
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    logger.info({
      type: "redis",
      event: "shutdown",
      message: "Connection closed gracefully",
    });
  }
}
