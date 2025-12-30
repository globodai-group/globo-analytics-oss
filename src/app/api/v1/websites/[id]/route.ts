import { NextRequest } from "next/server";
import { authenticateApiRequest, apiResponse, apiError, checkRateLimit } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateWebsiteSchema = z.object({
  privacy: z.number().int().min(0).max(2).optional(),
  excludeBots: z.boolean().optional(),
  excludeIps: z.string().optional(),
  excludeParams: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/websites/[id]
 * Get a specific website
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

  const website = await prisma.website.findFirst({
    where: {
      id: websiteId,
      userId: user.id,
    },
    select: {
      id: true,
      url: true,
      domain: true,
      privacy: true,
      excludeBots: true,
      excludeIps: true,
      excludeParams: true,
      pageviewsMonth: true,
      favoritedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!website) {
    return apiError("Website not found", 404);
  }

  return apiResponse({
    id: website.id,
    url: website.url,
    domain: website.domain,
    privacy: website.privacy,
    excludeBots: website.excludeBots,
    excludeIps: website.excludeIps,
    excludeParams: website.excludeParams,
    pageviewsMonth: website.pageviewsMonth,
    isFavorite: !!website.favoritedAt,
    createdAt: website.createdAt,
    updatedAt: website.updatedAt,
  });
}

/**
 * PATCH /api/v1/websites/[id]
 * Update a website
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

  // Parse and validate body
  let body;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = updateWebsiteSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 400);
  }

  const updatedWebsite = await prisma.website.update({
    where: { id: websiteId },
    data: parsed.data,
    select: {
      id: true,
      url: true,
      domain: true,
      privacy: true,
      excludeBots: true,
      excludeIps: true,
      excludeParams: true,
      updatedAt: true,
    },
  });

  return apiResponse(updatedWebsite);
}

/**
 * DELETE /api/v1/websites/[id]
 * Delete a website
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

  await prisma.website.delete({
    where: { id: websiteId },
  });

  // Update hasWebsites flag if no more websites
  const remainingWebsites = await prisma.website.count({
    where: { userId: user.id },
  });

  if (remainingWebsites === 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { hasWebsites: false },
    });
  }

  return apiResponse({ success: true });
}
