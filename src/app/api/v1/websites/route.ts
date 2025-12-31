import { NextRequest } from "next/server";
import {
  withApiAuth,
  apiResponse,
  apiError,
  parsePaginationParams,
  buildPaginationResponse,
} from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getLicenseStatus } from "@/lib/license/validator";

const createWebsiteSchema = z.object({
  url: z.string().url("Invalid URL"),
  privacy: z.number().int().min(0).max(2).optional().default(0),
  excludeBots: z.boolean().optional().default(false),
  excludeIps: z.string().optional(),
  excludeParams: z.string().optional(),
});

/**
 * GET /api/v1/websites
 * List all websites for the authenticated user
 */
export async function GET(request: NextRequest) {
  return withApiAuth(request, async (user) => {
    const params = parsePaginationParams(request.nextUrl.searchParams);

    const [websites, total] = await Promise.all([
      prisma.website.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          url: true,
          domain: true,
          privacy: true,
          excludeBots: true,
          pageviewsMonth: true,
          favoritedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: params.offset,
        take: params.limit,
      }),
      prisma.website.count({ where: { userId: user.id } }),
    ]);

    const mappedWebsites = websites.map((website) => ({
      id: website.id,
      url: website.url,
      domain: website.domain,
      privacy: website.privacy,
      excludeBots: website.excludeBots,
      pageviewsMonth: website.pageviewsMonth,
      isFavorite: !!website.favoritedAt,
      createdAt: website.createdAt,
      updatedAt: website.updatedAt,
    }));

    return apiResponse(buildPaginationResponse(mappedWebsites, total, params));
  });
}

/**
 * POST /api/v1/websites
 * Create a new website
 */
export async function POST(request: NextRequest) {
  return withApiAuth(request, async (user) => {
    // Check license limits
    const licenseStatus = await getLicenseStatus();
    const maxWebsites = licenseStatus.limits.domains.max;
    if (maxWebsites > 0) {
      const websiteCount = await prisma.website.count({
        where: { userId: user.id },
      });
      if (websiteCount >= maxWebsites) {
        return apiError("Website limit reached for your license tier", 403);
      }
    }

    // Parse and validate body
    let body;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body", 400);
    }

    const parsed = createWebsiteSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const { url, privacy, excludeBots, excludeIps, excludeParams } =
      parsed.data;

    // Extract domain from URL
    let domain: string;
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname;
    } catch {
      return apiError("Invalid URL format", 400);
    }

    // Check if website already exists for this user
    const existing = await prisma.website.findFirst({
      where: { url, userId: user.id },
    });

    if (existing) {
      return apiError("Website already exists", 409);
    }

    const website = await prisma.website.create({
      data: {
        url,
        domain,
        userId: user.id,
        privacy,
        excludeBots,
        excludeIps,
        excludeParams,
      },
    });

    // Update user hasWebsites flag
    await prisma.user.update({
      where: { id: user.id },
      data: { hasWebsites: true },
    });

    return apiResponse(
      {
        id: website.id,
        url: website.url,
        domain: website.domain,
        privacy: website.privacy,
        excludeBots: website.excludeBots,
        createdAt: website.createdAt,
      },
      201,
    );
  });
}
