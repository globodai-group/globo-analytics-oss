import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Paths that don't require authentication (for future auth middleware)
// const publicPaths = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/pricing", "/contact", "/pages", "/api/event", "/api/auth", "/api/webhooks"];

// Paths that require admin role (for future auth middleware)
// const adminPaths = ["/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes (except protected ones)
  if (pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Apply i18n middleware
  const response = intlMiddleware(request);

  return response;
}

export const config = {
  // Match all pathnames except for:
  // - API routes that don't need i18n
  // - Static files
  // - _next internal paths
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
