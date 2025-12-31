import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  trackEvent,
  extractDomain,
  isBot,
  isIpExcluded,
  TrackingData,
} from "@/lib/analytics/tracker";
import { getGeoData } from "@/lib/analytics/geoip";
import { checkRateLimit, isRedisAvailable } from "@/lib/redis";
import { logError, logSecurityEvent } from "@/lib/logger";

// CORS headers for cross-origin tracking
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

// Rate limit: 500 requests per minute per IP (legacy API - lower limits)
const RATE_LIMIT = 500;
const RATE_WINDOW_MS = 60 * 1000;

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Parse UTM parameters from URL
 */
function parseUtmFromUrl(url: string): TrackingData["utm"] | undefined {
  try {
    const pageUrl = new URL(url);
    const utm: TrackingData["utm"] = {};

    const source = pageUrl.searchParams.get("utm_source");
    const medium = pageUrl.searchParams.get("utm_medium");
    const campaign = pageUrl.searchParams.get("utm_campaign");
    const content = pageUrl.searchParams.get("utm_content");
    const term = pageUrl.searchParams.get("utm_term");

    if (source) utm.source = source;
    if (medium) utm.medium = medium;
    if (campaign) utm.campaign = campaign;
    if (content) utm.content = content;
    if (term) utm.term = term;

    return Object.keys(utm).length > 0 ? utm : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  // Get IP for rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  try {
    // Rate limiting check
    if (isRedisAvailable()) {
      const rateLimitResult = await checkRateLimit(
        `tracking-legacy:${ip}`,
        RATE_LIMIT,
        RATE_WINDOW_MS,
      );

      if (!rateLimitResult.allowed) {
        logSecurityEvent("rate_limit", {
          ip,
          reason: "Legacy tracking rate limit exceeded",
        });

        return NextResponse.json(
          { error: "Rate limit exceeded" },
          {
            status: 429,
            headers: {
              ...corsHeaders,
              "Retry-After": Math.ceil(
                (rateLimitResult.resetAt - Date.now()) / 1000,
              ).toString(),
            },
          },
        );
      }
    }

    const body = await request.json();

    // Destructure all fields from tracker.js v2
    const {
      type = "pageview",
      page,
      path,
      referrer,
      screen_resolution,
      session_id,
      visitor_id,
      is_new_session,
      is_new_visitor,
      landing_page,
      page_count,
      utm,
      // Engagement data
      time_on_page,
      scroll_depth,
      is_exit,
      // Custom event data
      event_name,
      event_value,
      event_data,
      // Legacy fields
      event,
      landing,
    } = body;

    // Validate required fields
    if (!page) {
      return NextResponse.json(
        { error: "Missing required field: page" },
        { status: 400, headers: corsHeaders },
      );
    }

    // Extract domain from page URL (handle www prefix)
    let domain = extractDomain(page);
    if (domain.startsWith("www.")) {
      domain = domain.substring(4);
    }

    // Find website by domain (try both with and without www)
    const website = await prisma.website.findFirst({
      where: {
        OR: [{ domain }, { domain: `www.${domain}` }],
      },
      include: {
        user: {
          select: {
            canTrack: true,
          },
        },
      },
    });

    // Website not found or tracking disabled
    if (!website) {
      return NextResponse.json(
        { error: "Website not found" },
        { status: 404, headers: corsHeaders },
      );
    }

    if (!website.user.canTrack) {
      return NextResponse.json(
        { error: "Tracking disabled" },
        { status: 403, headers: corsHeaders },
      );
    }

    // Get user agent (IP already extracted at the top for rate limiting)
    const userAgent = request.headers.get("user-agent") || "";

    // Check bot exclusion
    if (website.excludeBots && isBot(userAgent)) {
      return NextResponse.json(
        { success: true, message: "Bot excluded" },
        { headers: corsHeaders },
      );
    }

    // Check IP exclusion
    if (isIpExcluded(ip, website.excludeIps)) {
      return NextResponse.json(
        { success: true, message: "IP excluded" },
        { headers: corsHeaders },
      );
    }

    // Get language from Accept-Language header
    const language = request.headers.get("accept-language") || undefined;

    // Get geolocation data (only for pageviews to save resources)
    let geoData;
    if (type === "pageview") {
      geoData = await getGeoData(ip);
    }

    // Build tracking data object
    const trackingData: TrackingData = {
      type,
      page,
      path: path || undefined,
      referrer: referrer || undefined,
      screenResolution: screen_resolution || undefined,
      sessionId: session_id || undefined,
      visitorId: visitor_id || undefined,
      isNewSession: is_new_session || false,
      isNewVisitor: is_new_visitor || false,
      landingPage: landing_page || landing || undefined,
      pageCount: page_count || undefined,
      language,
      // UTM: prefer direct utm object from tracker.js, fallback to URL parsing
      utm: utm || parseUtmFromUrl(page),
      // Engagement data
      timeOnPage: time_on_page !== undefined ? Number(time_on_page) : undefined,
      scrollDepth:
        scroll_depth !== undefined ? Number(scroll_depth) : undefined,
      isExit: is_exit || false,
      // Event data
      eventName: event_name || undefined,
      eventValue: event_value || undefined,
      // Legacy support
      event: event || undefined,
    };

    // Track the event
    await trackEvent(
      website.id,
      trackingData,
      userAgent,
      ip,
      geoData || undefined,
    );

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    logError(error, { context: "legacy_tracking", ip });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders },
    );
  }
}
