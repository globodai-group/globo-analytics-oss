import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getAnalyticsReportTemplate } from "@/lib/email";
import { authenticateCronRequest } from "@/lib/api/auth";
import { subDays } from "date-fns";
import { logError, logger } from "@/lib/logger";

const BATCH_SIZE = 50; // Process emails in smaller batches
const DELAY_BETWEEN_EMAILS_MS = 100; // Rate limit emails

/**
 * POST /api/cron/email-reports
 * Send weekly and monthly email reports to users who have opted in
 * Should be called daily - sends weekly on Monday, monthly on 1st
 *
 * Optimized for Heroku:
 * - Batch processing to avoid memory issues
 * - Rate limiting to prevent email provider throttling
 * - Cursor-based pagination for large datasets
 */
export async function POST(request: NextRequest) {
  // Verify cron secret using timing-safe comparison
  if (!authenticateCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday
  const dayOfMonth = now.getDate();

  // Skip if not Monday (weekly) or 1st (monthly)
  const shouldSendWeekly = dayOfWeek === 1;
  const shouldSendMonthly = dayOfMonth === 1;

  if (!shouldSendWeekly && !shouldSendMonthly) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: "Not a report day",
      timestamp: now.toISOString(),
    });
  }

  const results = {
    weekly: { sent: 0, failed: 0 },
    monthly: { sent: 0, failed: 0 },
  };

  try {
    // Process weekly reports
    if (shouldSendWeekly) {
      await processReports(1, "weekly", results);
    }

    // Process monthly reports
    if (shouldSendMonthly) {
      await processReports(2, "monthly", results);
    }

    // Update cronjob last run time
    await prisma.cronjob.upsert({
      where: { name: "email-reports" },
      update: { lastRunAt: now },
      create: { name: "email-reports", lastRunAt: now },
    });

    return NextResponse.json({
      success: true,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logError(error, { context: "cron", operation: "emailReports" });
    return NextResponse.json(
      { error: "Failed to send email reports" },
      { status: 500 },
    );
  }
}

async function processReports(
  emailType: number,
  reportType: "weekly" | "monthly",
  results: {
    weekly: { sent: number; failed: number };
    monthly: { sent: number; failed: number };
  },
) {
  let cursor: number | undefined;
  let hasMore = true;

  while (hasMore) {
    // Fetch batch of websites with cursor pagination
    const websites = await prisma.website.findMany({
      where: {
        email: emailType,
        user: {
          emailVerified: { not: null },
          deletedAt: null,
        },
        ...(cursor ? { id: { gt: cursor } } : {}),
      },
      select: {
        id: true,
        domain: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            locale: true,
          },
        },
      },
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
    });

    if (websites.length === 0) {
      hasMore = false;
      break;
    }

    cursor = websites[websites.length - 1].id;
    hasMore = websites.length === BATCH_SIZE;

    // Process each website in the batch
    for (const website of websites) {
      const success = await sendReportEmail(website, reportType);

      if (success) {
        results[reportType].sent++;
      } else {
        results[reportType].failed++;
      }

      // Rate limiting delay between emails
      if (DELAY_BETWEEN_EMAILS_MS > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_EMAILS_MS),
        );
      }
    }
  }
}

async function sendReportEmail(
  website: {
    id: number;
    domain: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      locale: string;
    };
  },
  reportType: "weekly" | "monthly",
): Promise<boolean> {
  const days = reportType === "weekly" ? 7 : 30;
  const fromDate = subDays(new Date(), days);
  const toDate = new Date();

  try {
    // Get all stats in parallel with a single Promise.all
    const [visitorsData, pageviewsData, topPages, topCountries] =
      await Promise.all([
        prisma.stat.aggregate({
          where: {
            websiteId: website.id,
            name: "visitors",
            date: { gte: fromDate, lte: toDate },
          },
          _sum: { count: true },
        }),
        prisma.stat.aggregate({
          where: {
            websiteId: website.id,
            name: "pageviews",
            date: { gte: fromDate, lte: toDate },
          },
          _sum: { count: true },
        }),
        prisma.stat.groupBy({
          by: ["value"],
          where: {
            websiteId: website.id,
            name: "page",
            date: { gte: fromDate, lte: toDate },
          },
          _sum: { count: true },
          orderBy: { _sum: { count: "desc" } },
          take: 5,
        }),
        prisma.stat.groupBy({
          by: ["value"],
          where: {
            websiteId: website.id,
            name: "country",
            date: { gte: fromDate, lte: toDate },
          },
          _sum: { count: true },
          orderBy: { _sum: { count: "desc" } },
          take: 5,
        }),
      ]);

    const stats = {
      visitors: Number(visitorsData._sum.count || 0),
      pageviews: Number(pageviewsData._sum.count || 0),
      topPages: topPages.map((p) => ({
        page: p.value,
        views: Number(p._sum.count || 0),
      })),
      topCountries: topCountries.map((c) => ({
        country: c.value,
        visitors: Number(c._sum.count || 0),
      })),
    };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const dashboardUrl = `${appUrl}/${website.user.locale}/websites/${website.id}/stats`;

    const html = getAnalyticsReportTemplate(
      website.user.firstName,
      website.domain,
      reportType,
      stats,
      dashboardUrl,
      website.user.locale,
    );

    return await sendEmail({
      to: website.user.email,
      subject: `${reportType === "weekly" ? "Weekly" : "Monthly"} Report: ${website.domain}`,
      html,
    });
  } catch (error) {
    logger.warn({
      type: "cron",
      event: "email_report_failed",
      reportType,
      domain: website.domain,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}
