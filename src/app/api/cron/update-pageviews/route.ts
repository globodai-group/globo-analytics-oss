import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCronRequest } from "@/lib/api/auth";
import { startOfMonth } from "date-fns";
import { logError } from "@/lib/logger";

const BATCH_SIZE = 100; // Process websites in batches to avoid memory issues

/**
 * POST /api/cron/update-pageviews
 * Update monthly pageview counts for all websites
 * Should be called daily
 *
 * Optimized for Heroku:
 * - Batch processing to avoid memory spikes
 * - Single efficient query per batch using raw SQL
 * - Explicit connection management
 */
export async function POST(request: NextRequest) {
  // Verify cron secret using timing-safe comparison
  if (!authenticateCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const monthStart = startOfMonth(now);
  let totalUpdated = 0;

  try {
    // Get total count first
    const totalWebsites = await prisma.website.count();

    if (totalWebsites === 0) {
      return NextResponse.json({
        success: true,
        websitesUpdated: 0,
        timestamp: now.toISOString(),
      });
    }

    // Process in batches
    let offset = 0;
    while (offset < totalWebsites) {
      // Use raw query for efficient batch update
      // This single query aggregates and updates in one go for the batch
      await prisma.$executeRaw`
        UPDATE "Website" w
        SET "pageviewsMonth" = COALESCE(
          (SELECT SUM(s.count)::int
           FROM "Stat" s
           WHERE s."websiteId" = w.id
             AND s.name = 'pageviews'
             AND s.date >= ${monthStart}
          ), 0
        )
        WHERE w.id IN (
          SELECT id FROM "Website"
          ORDER BY id
          LIMIT ${BATCH_SIZE} OFFSET ${offset}
        )
      `;

      totalUpdated += Math.min(BATCH_SIZE, totalWebsites - offset);
      offset += BATCH_SIZE;
    }

    // Update cronjob last run time
    await prisma.cronjob.upsert({
      where: { name: "update-pageviews" },
      update: { lastRunAt: now },
      create: { name: "update-pageviews", lastRunAt: now },
    });

    return NextResponse.json({
      success: true,
      websitesUpdated: totalUpdated,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logError(error, { context: "cron", operation: "updatePageviews" });
    return NextResponse.json({ error: "Failed to update pageviews" }, { status: 500 });
  }
}
