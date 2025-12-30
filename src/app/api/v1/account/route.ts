import { NextRequest } from "next/server";
import {
  authenticateApiRequest,
  apiResponse,
  apiError,
  checkRateLimit,
} from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { getLicenseStatus } from "@/lib/license/validator";

/**
 * GET /api/v1/account
 * Get current account information
 */
export async function GET(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rateLimit = checkRateLimit(`api:${ip}`, 100, 60000);
  if (!rateLimit.allowed) {
    return apiError("Rate limit exceeded", 429);
  }

  // Authenticate
  const user = await authenticateApiRequest(request);
  if (!user) {
    return apiError("Unauthorized", 401);
  }

  // Get additional user data
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      locale: true,
      timezone: true,
      createdAt: true,
      _count: {
        select: {
          websites: true,
        },
      },
    },
  });

  if (!userData) {
    return apiError("User not found", 404);
  }

  // Get license status
  const licenseStatus = await getLicenseStatus();

  return apiResponse({
    id: userData.id,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    locale: userData.locale,
    timezone: userData.timezone,
    license: {
      tier: licenseStatus.tier,
      tierName: licenseStatus.tierName,
      status: licenseStatus.status,
      organization: licenseStatus.organization,
      expiresAt: licenseStatus.expiresAt,
      daysRemaining: licenseStatus.daysRemaining,
      limits: {
        websites: licenseStatus.limits.domains.max,
        pageviews: licenseStatus.limits.pageviews.max,
        users: licenseStatus.limits.users.max,
      },
    },
    usage: {
      websites: userData._count.websites,
    },
    createdAt: userData.createdAt,
  });
}
