import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCronRequest } from "@/lib/api/auth";
import { subDays } from "date-fns";
import { logger, logError } from "@/lib/logger";

/**
 * POST /api/cron/cleanup-users
 * Clean up unverified users and expired tokens
 * Should be called daily
 */
export async function POST(request: NextRequest) {
  // Verify cron secret using timing-safe comparison
  if (!authenticateCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = {
    unverifiedUsersDeleted: 0,
    expiredPasswordTokensDeleted: 0,
  };

  try {
    // Delete unverified users older than 7 days
    const sevenDaysAgo = subDays(now, 7);
    const unverifiedUsers = await prisma.user.deleteMany({
      where: {
        emailVerified: null,
        createdAt: { lt: sevenDaysAgo },
        // Don't delete users with OAuth accounts
        accounts: { none: {} },
      },
    });
    results.unverifiedUsersDeleted = unverifiedUsers.count;

    // Delete expired password reset tokens
    const expiredTokens = await prisma.passwordResetToken.deleteMany({
      where: {
        expires: { lt: now },
      },
    });
    results.expiredPasswordTokensDeleted = expiredTokens.count;

    // Update cronjob last run time
    await prisma.cronjob.upsert({
      where: { name: "cleanup-users" },
      update: { lastRunAt: now },
      create: { name: "cleanup-users", lastRunAt: now },
    });

    logger.info({
      type: "cron",
      job: "cleanup-users",
      event: "completed",
      ...results,
    });

    return NextResponse.json({
      success: true,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logError(error, { context: "cron", job: "cleanup-users" });
    return NextResponse.json(
      { error: "Failed to run cleanup" },
      { status: 500 },
    );
  }
}
