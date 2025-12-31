/**
 * Health Check Endpoint
 *
 * Used by:
 * - Heroku container orchestration
 * - Docker health checks
 * - Load balancers
 * - Monitoring systems
 *
 * Returns system status and component health
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";
import { getQueueStats } from "@/lib/queue";
import { logger } from "@/lib/logger";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: ComponentHealth;
    redis: ComponentHealth;
    queue: ComponentHealth;
  };
}

interface ComponentHealth {
  status: "up" | "down" | "not_configured";
  latency?: number;
  details?: Record<string, unknown>;
}

/**
 * GET /api/health
 *
 * Returns 200 if core services are healthy
 * Returns 503 if critical services are down
 */
export async function GET(): Promise<NextResponse<HealthStatus>> {
  const startTime = Date.now();

  // Check database
  const dbHealth = await checkDatabase();

  // Check Redis
  const redisHealth = await checkRedis();

  // Check queue status
  const queueHealth = await checkQueue();

  // Determine overall status
  const overallStatus = determineOverallStatus(dbHealth, redisHealth);

  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    uptime: process.uptime(),
    checks: {
      database: dbHealth,
      redis: redisHealth,
      queue: queueHealth,
    },
  };

  // Return 503 if unhealthy (critical services down)
  const httpStatus = overallStatus === "unhealthy" ? 503 : 200;

  return NextResponse.json(healthStatus, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Response-Time": `${Date.now() - startTime}ms`,
    },
  });
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: "up",
      latency: Date.now() - start,
    };
  } catch (error) {
    logger.warn({
      type: "health",
      component: "database",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      status: "down",
      latency: Date.now() - start,
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis(): Promise<ComponentHealth> {
  const start = Date.now();

  try {
    const redis = getRedis();

    if (!redis) {
      return {
        status: "not_configured",
      };
    }

    await redis.ping();

    return {
      status: "up",
      latency: Date.now() - start,
    };
  } catch (error) {
    logger.warn({
      type: "health",
      component: "redis",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      status: "down",
      latency: Date.now() - start,
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

/**
 * Check queue status
 */
async function checkQueue(): Promise<ComponentHealth> {
  try {
    const stats = await getQueueStats();

    if (!stats) {
      return {
        status: "not_configured",
      };
    }

    return {
      status: "up",
      details: {
        stats: {
          waiting: stats.stats.waiting,
          active: stats.stats.active,
          failed: stats.stats.failed,
        },
        events: {
          waiting: stats.events.waiting,
          active: stats.events.active,
          failed: stats.events.failed,
        },
      },
    };
  } catch (error) {
    logger.warn({
      type: "health",
      component: "queue",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      status: "down",
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

/**
 * Determine overall health status
 *
 * - unhealthy: Database is down (critical)
 * - degraded: Redis is down but database is up
 * - healthy: All configured services are up
 */
function determineOverallStatus(
  db: ComponentHealth,
  redis: ComponentHealth,
): "healthy" | "degraded" | "unhealthy" {
  // Database is critical - if it's down, we're unhealthy
  if (db.status === "down") {
    return "unhealthy";
  }

  // Redis is optional but if configured and down, we're degraded
  if (redis.status === "down") {
    return "degraded";
  }

  return "healthy";
}
