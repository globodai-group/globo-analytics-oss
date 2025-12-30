import { NextRequest } from "next/server";
import {
  authenticateApiRequest,
  apiResponse,
  apiError,
  checkRateLimit,
} from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { StatType } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const VALID_STAT_TYPES: StatType[] = [
  "visitors",
  "pageviews",
  "page",
  "landing_page",
  "referrer",
  "browser",
  "os",
  "device",
  "country",
  "city",
  "continent",
  "language",
  "resolution",
  "campaign",
  "event",
];

/**
 * GET /api/v1/stats/[id]
 * Get analytics stats for a website
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rateLimit = checkRateLimit(`api:${ip}`, 100, 60000);
  if (!rateLimit.allowed) {
    return apiError("Rate limit exceeded", 429);
  }

  const user = await authenticateApiRequest(request);
  if (!user) {
    return apiError("Unauthorized", 401);
  }

  const { id } = await params;
  const websiteId = parseInt(id);
  if (isNaN(websiteId)) {
    return apiError("Invalid website ID", 400);
  }

  // Check ownership
  const website = await prisma.website.findFirst({
    where: {
      id: websiteId,
      userId: user.id,
    },
  });

  if (!website) {
    return apiError("Website not found", 404);
  }

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") as StatType | null;
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  // Validate stat type if provided
  if (type && !VALID_STAT_TYPES.includes(type)) {
    return apiError(
      `Invalid stat type. Valid types: ${VALID_STAT_TYPES.join(", ")}`,
      400,
    );
  }

  // Default to last 30 days
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const from = fromDate ? new Date(fromDate) : defaultFrom;
  const to = toDate ? new Date(toDate) : now;

  // Validate dates
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return apiError(
      "Invalid date format. Use ISO 8601 format (YYYY-MM-DD)",
      400,
    );
  }

  if (from > to) {
    return apiError("'from' date must be before 'to' date", 400);
  }

  // Build where clause
  const where: {
    websiteId: number;
    date: { gte: Date; lte: Date };
    name?: StatType;
  } = {
    websiteId,
    date: {
      gte: from,
      lte: to,
    },
  };

  if (type) {
    where.name = type;
  }

  // Get overview stats (visitors and pageviews)
  if (!type) {
    const [visitorsData, pageviewsData] = await Promise.all([
      prisma.stat.groupBy({
        by: ["date"],
        where: { ...where, name: "visitors" },
        _sum: { count: true },
        orderBy: { date: "asc" },
      }),
      prisma.stat.groupBy({
        by: ["date"],
        where: { ...where, name: "pageviews" },
        _sum: { count: true },
        orderBy: { date: "asc" },
      }),
    ]);

    const totalVisitors = visitorsData.reduce(
      (sum, d) => sum + Number(d._sum.count || 0),
      0,
    );
    const totalPageviews = pageviewsData.reduce(
      (sum, d) => sum + Number(d._sum.count || 0),
      0,
    );

    return apiResponse({
      websiteId,
      dateRange: { from, to },
      overview: {
        visitors: totalVisitors,
        pageviews: totalPageviews,
      },
      chart: {
        visitors: visitorsData.map((d) => ({
          date: d.date,
          count: Number(d._sum.count || 0),
        })),
        pageviews: pageviewsData.map((d) => ({
          date: d.date,
          count: Number(d._sum.count || 0),
        })),
      },
    });
  }

  // Get specific stat type data
  const [stats, totalCount] = await Promise.all([
    prisma.stat.groupBy({
      by: ["value"],
      where,
      _sum: { count: true },
      orderBy: { _sum: { count: "desc" } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.stat
      .groupBy({
        by: ["value"],
        where,
        _sum: { count: true },
      })
      .then((results) => results.length),
  ]);

  const total = stats.reduce((sum, s) => sum + Number(s._sum.count || 0), 0);

  return apiResponse({
    websiteId,
    type,
    dateRange: { from, to },
    data: stats.map((stat) => ({
      value: stat.value,
      count: Number(stat._sum.count || 0),
      percentage:
        total > 0
          ? Math.round((Number(stat._sum.count || 0) / total) * 10000) / 100
          : 0,
    })),
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}
