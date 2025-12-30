import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

export type ApiUser = NonNullable<Awaited<ReturnType<typeof authenticateApiRequest>>>;

/**
 * Authenticate API request using Bearer token
 * @returns User object if authenticated, null otherwise
 */
export async function authenticateApiRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  if (!token) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      apiToken: token,
      deletedAt: null,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      licenseKey: true,
    },
  });

  return user;
}

/**
 * API middleware that handles rate limiting and authentication
 * Use this wrapper for protected API routes
 */
export async function withApiAuth(
  request: NextRequest,
  handler: (user: ApiUser) => Promise<Response>
): Promise<Response> {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rateLimit = checkRateLimit(`api:${ip}`, 100, 60000);

  if (!rateLimit.allowed) {
    return apiError("Rate limit exceeded", 429);
  }

  const user = await authenticateApiRequest(request);
  if (!user) {
    return apiError("Unauthorized", 401);
  }

  return handler(user);
}

/**
 * API response helper for consistent JSON responses
 */
export function apiResponse<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

/**
 * API error response helper
 */
export function apiError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

/**
 * Rate limit check (simple in-memory implementation)
 * In production, use Redis or similar
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  limit = 100,
  windowMs = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || record.resetAt < now) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count };
}

/**
 * Pagination parameters from URL search params
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Parse pagination params from URL search params
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaultLimit = 20,
  maxLimit = 100
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    Math.max(1, parseInt(searchParams.get("limit") || String(defaultLimit), 10)),
    maxLimit
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Build pagination response object
 */
export function buildPaginationResponse<T>(items: T[], total: number, params: PaginationParams) {
  return {
    data: items,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

/**
 * Timing-safe string comparison to prevent timing attacks
 * Used for comparing secrets like cron tokens
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

/**
 * Authenticate cron job requests using timing-safe comparison
 * Prevents timing attacks on the cron secret
 */
export function authenticateCronRequest(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || !authHeader) {
    return false;
  }

  const expectedAuth = `Bearer ${cronSecret}`;
  return secureCompare(authHeader, expectedAuth);
}
