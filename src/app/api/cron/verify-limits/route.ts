import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCronRequest } from "@/lib/api/auth";
import { logError } from "@/lib/logger";

/**
 * POST /api/cron/verify-limits
 * Verify pageview limits for all users and disable tracking if exceeded
 * Should be called daily
 *
 * Optimized for Heroku:
 * - Batch processing with cursor pagination
 * - Bulk updates instead of individual queries
 * - Memory-efficient streaming
 */
export async function POST(request: NextRequest) {
  // Verify cron secret using timing-safe comparison
  if (!authenticateCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let usersDisabled = 0;
  let usersEnabled = 0;

  try {
    // Disable users who are over their limit (single bulk query)
    const disabledResult = await prisma.$executeRaw`
      UPDATE "User" u
      SET "canTrack" = false
      WHERE u."deletedAt" IS NULL
        AND u."canTrack" = true
        AND EXISTS (
          SELECT 1 FROM "Plan" p
          WHERE p.id = u."planId"
            AND p."optionPageviews" IS NOT NULL
        )
        AND (
          SELECT COALESCE(SUM(w."pageviewsMonth"), 0)
          FROM "Website" w
          WHERE w."userId" = u.id
        ) >= (
          SELECT p."optionPageviews"
          FROM "Plan" p
          WHERE p.id = u."planId"
        )
    `;
    usersDisabled = Number(disabledResult);

    // Re-enable users who are under their limit or have no limit
    const enabledResult = await prisma.$executeRaw`
      UPDATE "User" u
      SET "canTrack" = true
      WHERE u."deletedAt" IS NULL
        AND u."canTrack" = false
        AND (
          -- Users with no pageview limit should be enabled
          NOT EXISTS (
            SELECT 1 FROM "Plan" p
            WHERE p.id = u."planId"
              AND p."optionPageviews" IS NOT NULL
          )
          OR
          -- Users under their limit should be re-enabled
          (
            SELECT COALESCE(SUM(w."pageviewsMonth"), 0)
            FROM "Website" w
            WHERE w."userId" = u.id
          ) < (
            SELECT p."optionPageviews"
            FROM "Plan" p
            WHERE p.id = u."planId"
          )
        )
    `;
    usersEnabled = Number(enabledResult);

    // Update cronjob last run time
    await prisma.cronjob.upsert({
      where: { name: "verify-limits" },
      update: { lastRunAt: now },
      create: { name: "verify-limits", lastRunAt: now },
    });

    return NextResponse.json({
      success: true,
      usersDisabled,
      usersEnabled,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logError(error, { context: "cron", operation: "verifyLimits" });
    return NextResponse.json({ error: "Failed to verify limits" }, { status: 500 });
  }
}
