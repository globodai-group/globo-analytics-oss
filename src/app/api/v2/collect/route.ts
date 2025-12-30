import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGeoDataWithFallback } from "@/lib/analytics/geoip";
import {
  categorizeUserAgent,
  parseUserAgent,
  classifyTrafficSource,
  extractPath,
  getTimeBucket,
} from "@/lib/analytics/tracker";
import { checkGoalConversions } from "@/lib/analytics/goals";
import { StatType } from "@prisma/client";
import {
  checkRateLimit,
  isDuplicateRequest,
  cacheGet,
  cacheSet,
  isRedisAvailable,
} from "@/lib/redis";
import {
  logRequest,
  logAnalyticsEvent,
  logError,
  logSecurityEvent,
  createTimer,
  logger,
} from "@/lib/logger";
import { verifySignature, createCanonicalPayload } from "@/lib/security/hmac";

// CORS headers for cross-origin tracking
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

// SECURITY: URL validation to prevent SSRF and data injection
function isValidTrackingUrl(url: string | undefined): boolean {
  if (!url) return true; // Empty is allowed
  try {
    const parsed = new URL(url);
    // Only allow http/https protocols
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// SECURITY: Sanitize custom dimensions to prevent XSS and injection
const MAX_CUSTOM_DIMENSION_LENGTH = 150;
function sanitizeCustomDimension(value: string | undefined): string | undefined {
  if (!value) return undefined;
  // Truncate, strip HTML tags, and normalize whitespace
  return value
    .slice(0, MAX_CUSTOM_DIMENSION_LENGTH)
    .replace(/<[^>]*>/g, "")
    .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
    .trim();
}

// Rate limit config: 1000 requests per minute per IP
const RATE_LIMIT = 1000;
const RATE_WINDOW_MS = 60 * 1000;

// Project cache TTL: 5 minutes
const PROJECT_CACHE_TTL = 300;

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * V2 Tracking API - Project-based tracking with proper user/session distinction
 *
 * Google Analytics-like metrics:
 * - Users (unique visitors) vs Sessions
 * - Engagement time tracking
 * - Real-time active users
 * - App version, OS version, browser version tracking
 * - Multi-platform (web, ios, android, server)
 */
export async function POST(request: NextRequest) {
  const timer = createTimer();

  // Get IP for rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  try {
    // Rate limiting check
    if (isRedisAvailable()) {
      const rateLimitResult = await checkRateLimit(`tracking:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);

      if (!rateLimitResult.allowed) {
        logSecurityEvent("rate_limit", { ip, reason: "Tracking rate limit exceeded" });

        return NextResponse.json(
          { error: "Rate limit exceeded" },
          {
            status: 429,
            headers: {
              ...corsHeaders,
              "X-RateLimit-Limit": RATE_LIMIT.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
              "Retry-After": Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
            },
          }
        );
      }
    }

    const body = await request.json();

    const {
      // Required
      tid, // Tracking ID (project trackingId)
      t, // Hit type: pageview, event, engagement, session_end, ping

      // Page/Screen info
      dp, // Document path / Screen name
      dt, // Document title
      dl, // Document location (full URL)
      dr, // Document referrer

      // User identification
      cid, // Client ID (visitor hash, persistent)
      sid, // Session ID (per-session)

      // Session flags
      sc, // Session control: "start" for new session
      ni, // Non-interaction hit (don't affect bounce rate)

      // User agent override (for mobile SDKs)
      ua, // User agent string

      // Screen info
      sr, // Screen resolution
      sd, // Screen color depth
      vp, // Viewport size

      // Platform
      pl, // Platform: web, ios, android, server
      av, // App version (mobile)
      aid, // App ID (mobile bundle identifier)

      // Geography override (for server-side)
      geoid, // Country code override
      geocity, // City override

      // User preferences
      ul, // User language (e.g., "en-US", "fr-FR")

      // Custom dimensions
      cd1,
      cd2,
      cd3,
      cd4,
      cd5,

      // UTM parameters
      cs, // Campaign source
      cm, // Campaign medium
      cn, // Campaign name
      cc, // Campaign content
      ck, // Campaign keyword

      // Event parameters (when t=event)
      ec, // Event category
      ea, // Event action
      el, // Event label
      ev, // Event value

      // Engagement data (when t=engagement or ping)
      top, // Time on page (seconds)
      scd, // Scroll depth (0-100)
      et, // Engagement time (seconds) - time actively engaged

      // E-commerce data (GA4-like format)
      en, // Event name (purchase, add_to_cart, view_item, etc.)
      items, // E-commerce items array
      transaction_id, // Transaction ID
      currency, // Currency code (EUR, USD)
      value, // Total value
      tax, // Tax amount
      shipping, // Shipping cost
      coupon, // Coupon code
      affiliation, // Store affiliation
      item_list_id, // Item list ID
      item_list_name, // Item list name
      shipping_tier, // Shipping tier
      payment_type, // Payment type
      ep, // Event properties (for custom events)

      // Authentication flag - if true, user is authenticated (definitely human)
      auth, // Boolean: user is authenticated

      // HMAC signature for anti-spoofing
      sig, // HMAC-SHA256 signature
      ts, // Request timestamp (for replay protection)
    } = body;

    // Validate required fields
    if (!tid) {
      return NextResponse.json(
        { error: "Missing required field: tid (tracking ID)" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!cid) {
      return NextResponse.json(
        { error: "Missing required field: cid (client ID)" },
        { status: 400, headers: corsHeaders }
      );
    }

    const hitType = t || "pageview";

    // SECURITY: Validate URLs to prevent injection attacks
    if (!isValidTrackingUrl(dl)) {
      logSecurityEvent("invalid_url", { ip, field: "dl", value: dl?.slice(0, 100) });
      return NextResponse.json(
        { error: "Invalid document location URL" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!isValidTrackingUrl(dr)) {
      logSecurityEvent("invalid_url", { ip, field: "dr", value: dr?.slice(0, 100) });
      return NextResponse.json(
        { error: "Invalid document referrer URL" },
        { status: 400, headers: corsHeaders }
      );
    }

    // SECURITY: Sanitize custom dimensions to prevent XSS
    // Note: Custom dimensions are prepared for future use in visitor/session properties
    const customDimensions = {
      cd1: sanitizeCustomDimension(cd1),
      cd2: sanitizeCustomDimension(cd2),
      cd3: sanitizeCustomDimension(cd3),
      cd4: sanitizeCustomDimension(cd4),
      cd5: sanitizeCustomDimension(cd5),
    };
    // Avoid unused variable warning - dimensions will be stored when custom dimension feature is implemented
    void customDimensions;

    // Deduplication check - prevent duplicate events within same second
    if (isRedisAvailable()) {
      const isDuplicate = await isDuplicateRequest(
        0, // Will use tid as identifier
        cid,
        hitType,
        Date.now()
      );

      if (isDuplicate) {
        // Silently accept but don't process duplicates
        return NextResponse.json({ success: true, deduplicated: true }, { headers: corsHeaders });
      }
    }

    // Try to get project from cache first
    type CachedProject = {
      id: number;
      excludeBots: boolean;
      canTrack: boolean;
      optionPageviews: number;
      secretKey: string | null;
    };

    let project: CachedProject | null = null;
    const cacheKey = `project:tid:${tid}`;

    if (isRedisAvailable()) {
      project = await cacheGet<CachedProject>(cacheKey);
    }

    if (!project) {
      // Cache miss - fetch from database
      const dbProject = await prisma.project.findUnique({
        where: { trackingId: tid },
        select: {
          id: true,
          excludeBots: true,
          secretKey: true,
          user: {
            select: {
              canTrack: true,
            },
          },
          domains: true,
        },
      });

      if (!dbProject) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404, headers: corsHeaders }
        );
      }

      if (!dbProject.user.canTrack) {
        return NextResponse.json(
          { error: "Tracking disabled" },
          { status: 403, headers: corsHeaders }
        );
      }

      // Cache the project data
      // In OSS, pageview limits are managed via license, not per-user plan
      project = {
        id: dbProject.id,
        excludeBots: dbProject.excludeBots,
        canTrack: dbProject.user.canTrack,
        optionPageviews: 0, // Unlimited in OSS, use license for limits
        secretKey: dbProject.secretKey,
      };

      if (isRedisAvailable()) {
        await cacheSet(cacheKey, project, PROJECT_CACHE_TTL);
      }
    } else {
      // Cached project - verify tracking is still enabled
      if (!project.canTrack) {
        return NextResponse.json(
          { error: "Tracking disabled" },
          { status: 403, headers: corsHeaders }
        );
      }
    }

    // At this point, project is guaranteed to be non-null
    // (either from cache or from database query)
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // HMAC signature verification (anti-spoofing)
    // If project has a secretKey configured, all requests MUST be signed
    if (project.secretKey) {
      if (!sig) {
        logSecurityEvent("hmac_missing", {
          ip,
          tid,
          reason: "Signature required but not provided",
        });
        return NextResponse.json(
          { error: "Signature required" },
          { status: 403, headers: corsHeaders }
        );
      }

      // Verify timestamp to prevent replay attacks (5 minute window)
      const requestTs = typeof ts === "number" ? ts : parseInt(ts);
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (isNaN(requestTs) || Math.abs(now - requestTs) > fiveMinutes) {
        logSecurityEvent("hmac_replay", { ip, tid, reason: "Timestamp outside valid window" });
        return NextResponse.json(
          { error: "Invalid timestamp" },
          { status: 403, headers: corsHeaders }
        );
      }

      // Create canonical payload and verify signature
      const canonical = createCanonicalPayload({
        tid,
        cid,
        t: hitType,
        dp,
        ts: requestTs,
      });

      if (!verifySignature(canonical, sig, project.secretKey)) {
        logSecurityEvent("hmac_invalid", { ip, tid, reason: "Signature verification failed" });
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 403, headers: corsHeaders }
        );
      }

      logger.debug({ type: "hmac", event: "verified", tid });
    }

    // Get user agent (IP already extracted at the top)
    // SECURITY: Limit UA length to prevent ReDoS attacks on regex patterns
    const MAX_USER_AGENT_LENGTH = 500;
    const rawUserAgent = ua || request.headers.get("user-agent") || "";
    const userAgent = rawUserAgent.slice(0, MAX_USER_AGENT_LENGTH);

    // Initial traffic categorization
    // Will be refined later if visitor has engagement history
    // NOTE: We do NOT trust the client-side `auth` flag for security reasons.
    // It can be easily falsified. Instead, we rely on behavioral indicators.
    let trafficCategorization = categorizeUserAgent(userAgent);

    // Check bot exclusion (smart categorization)
    if (project.excludeBots && trafficCategorization.shouldExclude) {
      return NextResponse.json(
        { success: true, message: `${trafficCategorization.category} excluded` },
        { headers: corsHeaders }
      );
    }

    // Parse user agent (includes browser version and OS version)
    const parsedUA = parseUserAgent(userAgent);
    const platform = pl || "web";

    // Get/create visitor
    const visitorId = cid;
    const isNewSession = sc === "start";
    const path = dp || extractPath(dl || "");

    // Get geolocation - tries CDN headers first (Cloudflare, Vercel), then MaxMind DB
    const geoData =
      hitType === "pageview" || hitType === "ping"
        ? await getGeoDataWithFallback(ip, request.headers)
        : null;
    const country = geoid || geoData?.country || null;
    const city = geocity || geoData?.city || null;

    // User language
    const language = ul || request.headers.get("accept-language")?.split(",")[0] || null;

    // UTM parameters
    const utm = {
      source: cs || undefined,
      medium: cm || undefined,
      campaign: cn || undefined,
      content: cc || undefined,
      term: ck || undefined,
    };

    const trafficSource = classifyTrafficSource(
      dr,
      Object.keys(utm).some((k) => utm[k as keyof typeof utm]) ? utm : undefined
    );

    // Extract domain from dl (document location)
    let domain: string | null = null;
    if (dl) {
      try {
        domain = new URL(dl).hostname;
      } catch {}
    }

    // Get or create visitor record
    let visitor = await prisma.visitor.findUnique({
      where: {
        projectId_id: {
          projectId: project.id,
          id: visitorId,
        },
      },
    });

    const isNewVisitor = !visitor;

    // Refine traffic categorization for returning visitors with engagement
    // If a visitor has multiple pageviews or significant engagement time,
    // they are almost certainly human (bots don't exhibit this behavior)
    // This is a SECURE behavioral indicator that cannot be falsified
    if (visitor && trafficCategorization.category !== "human") {
      const hasSignificantEngagement =
        (visitor.totalPageviews || 0) > 3 || (visitor.totalEngagementTime || 0) > 30;

      if (hasSignificantEngagement) {
        trafficCategorization = categorizeUserAgent(userAgent, {
          hasActiveSession: true,
        });
      }
    }

    if (!visitor) {
      // Create new visitor with all GA-like fields
      visitor = await prisma.visitor.create({
        data: {
          id: visitorId,
          projectId: project.id,
          browser: parsedUA.browser,
          os: parsedUA.os,
          osVersion: parsedUA.osVersion,
          device: parsedUA.device,
          country,
          city,
          language,
          platform,
          appVersion: av || null,
          firstReferrer: dr || null,
          firstUtmSource: utm.source || null,
          firstUtmMedium: utm.medium || null,
          firstUtmCampaign: utm.campaign || null,
        },
      });
    } else {
      // Update last seen and engagement time
      const visitorUpdate: Record<string, unknown> = {
        lastSeenAt: new Date(),
        totalPageviews: { increment: hitType === "pageview" ? 1 : 0 },
      };

      // Update engagement time if provided (et is already in seconds from tracker.js)
      if (et && typeof et === "number") {
        visitorUpdate.totalEngagementTime = { increment: Math.round(et) };
      }

      // Update app version if changed
      if (av && av !== visitor.appVersion) {
        visitorUpdate.appVersion = av;
      }

      await prisma.visitor.update({
        where: { id: visitor.id },
        data: visitorUpdate,
      });
    }

    // Handle real-time tracking for ping hits
    if (hitType === "ping") {
      await updateRealtimeUser(
        project.id,
        visitorId,
        sid,
        path,
        dt,
        platform,
        country,
        city,
        parsedUA.device
      );
      return NextResponse.json({ success: true }, { headers: corsHeaders });
    }

    // Handle session
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    let session = isNewSession
      ? null
      : await prisma.projectSession.findFirst({
          where: {
            projectId: project.id,
            visitorId: visitorId,
            lastActivityAt: { gte: thirtyMinutesAgo },
          },
          orderBy: { lastActivityAt: "desc" },
        });

    const isNewSessionActual = !session;

    if (!session) {
      // Create new session with all GA-like fields
      session = await prisma.projectSession.create({
        data: {
          projectId: project.id,
          visitorId: visitorId,
          entryPage: path,
          exitPage: path,
          domain,
          referrer: dr || null,
          utmSource: utm.source || null,
          utmMedium: utm.medium || null,
          utmCampaign: utm.campaign || null,
          utmContent: utm.content || null,
          utmTerm: utm.term || null,
          trafficSource,
          browser: parsedUA.browser,
          browserVersion: parsedUA.browserVersion,
          os: parsedUA.os,
          osVersion: parsedUA.osVersion,
          device: parsedUA.device,
          country,
          city,
          language,
          platform,
          appVersion: av || null,
        },
      });

      // Increment visitor's session count
      await prisma.visitor.update({
        where: { id: visitor.id },
        data: { totalSessions: { increment: 1 } },
      });

      // Update real-time tracking
      await updateRealtimeUser(
        project.id,
        visitorId,
        session.id,
        path,
        dt,
        platform,
        country,
        city,
        parsedUA.device
      );
    } else {
      // Update existing session
      const sessionUpdate: Record<string, unknown> = {
        lastActivityAt: new Date(),
        exitPage: path,
      };

      if (hitType === "pageview" && !ni) {
        sessionUpdate.pageviews = { increment: 1 };
        sessionUpdate.isBounce = false; // More than one page = not a bounce
      }

      if (hitType === "event") {
        sessionUpdate.events = { increment: 1 };
      }

      // Update engagement time (et is already in seconds from tracker.js)
      if (et && typeof et === "number") {
        sessionUpdate.engagementTime = { increment: Math.round(et) };
        // Mark as engaged if engagement time > 10 seconds
        if ((session.engagementTime || 0) + Math.round(et) > 10) {
          sessionUpdate.isEngaged = true;
        }
      }

      // Screen views for mobile
      if (platform !== "web" && hitType === "pageview") {
        sessionUpdate.screenViews = { increment: 1 };
      }

      await prisma.projectSession.update({
        where: { id: session.id },
        data: sessionUpdate,
      });

      // Update real-time tracking
      await updateRealtimeUser(
        project.id,
        visitorId,
        session.id,
        path,
        dt,
        platform,
        country,
        city,
        parsedUA.device
      );
    }

    // Track stats based on hit type
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hour = new Date().getHours();

    if (hitType === "pageview") {
      await trackPageviewStats(
        project.id,
        {
          path,
          domain,
          platform,
          parsedUA,
          isNewVisitor,
          isNewSession: isNewSessionActual,
          hour,
          sr,
          country,
          city,
          language,
          appVersion: av || null,
          utm,
          dr,
          trafficSource,
          trafficCategory: trafficCategorization.category,
        },
        today
      );
    } else if (hitType === "event" && ec && ea) {
      await trackEventStats(
        project.id,
        {
          category: ec,
          action: ea,
          label: el,
          value: ev,
          domain,
          platform,
        },
        today
      );
    } else if (hitType === "engagement") {
      await trackEngagementStats(
        project.id,
        {
          timeOnPage: top,
          scrollDepth: scd,
          engagementTime: et ? Math.round(et) : undefined,
          path,
          sessionId: session?.id,
        },
        today
      );
    } else if (hitType === "session_end" && session) {
      // Calculate and store session duration
      const duration = Math.round((Date.now() - session.startedAt.getTime()) / 1000);
      await prisma.projectSession.update({
        where: { id: session.id },
        data: {
          endedAt: new Date(),
          duration,
        },
      });

      await upsertProjectStat(
        project.id,
        "session_duration",
        getTimeBucket(duration),
        today,
        domain
      );
    } else if (hitType === "ecommerce" && en) {
      // Handle e-commerce events
      await trackEcommerceEvent(
        project.id,
        {
          eventType: en,
          visitorId,
          sessionId: session?.id,
          items: items || [],
          transactionId: transaction_id,
          currency: currency || "EUR",
          value: parseFloat(value) || 0,
          tax: parseFloat(tax) || 0,
          shipping: parseFloat(shipping) || 0,
          coupon,
          affiliation,
          itemListId: item_list_id,
          itemListName: item_list_name,
          shippingTier: shipping_tier,
          paymentType: payment_type,
          domain,
          platform,
        },
        today
      );
    }

    // Check goal conversions after processing the hit
    try {
      await checkGoalConversions({
        projectId: project.id,
        visitorId,
        sessionId: session?.id,
        hitType,
        pagePath: path,
        pageTitle: dt,
        eventName: en || (ec && ea ? `${ec}:${ea}` : undefined),
        eventCategory: ec,
        eventAction: ea,
        eventLabel: el,
        eventValue: ev ? parseFloat(ev) : undefined,
        sessionDuration: session?.duration || undefined,
        pageviewCount: session?.pageviews || undefined,
        transactionValue: value ? parseFloat(value) : undefined,
      });
    } catch (goalError) {
      // Non-critical, log and continue
      logError(goalError, { context: "goal_conversion_check", projectId: project.id });
    }

    // Log analytics event for debugging/monitoring
    logAnalyticsEvent(project.id, hitType, visitorId, {
      path,
      durationMs: timer.elapsed(),
    });

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    logError(error, { context: "v2_tracking", ip });
    logRequest("POST", "/api/v2/collect", 500, timer.elapsed(), { error: true });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Upsert a project stat
 */
async function upsertProjectStat(
  projectId: number,
  name: string,
  value: string,
  date: Date,
  domain?: string | null
): Promise<void> {
  // Use raw query for upsert since Prisma doesn't handle optional unique fields well
  await prisma.projectStat.upsert({
    where: {
      projectId_name_value_date_domain: {
        projectId,
        name: name as StatType,
        value,
        date,
        domain: domain ?? "",
      },
    },
    update: { count: { increment: 1 } },
    create: {
      projectId,
      name: name as StatType,
      value,
      date,
      domain: domain || null,
      count: 1,
    },
  });
}

/**
 * Track pageview statistics (GA-like metrics)
 */
async function trackPageviewStats(
  projectId: number,
  data: {
    path: string;
    domain: string | null;
    platform: string;
    parsedUA: ReturnType<typeof parseUserAgent>;
    isNewVisitor: boolean;
    isNewSession: boolean;
    hour: number;
    sr?: string;
    country: string | null;
    city: string | null;
    language: string | null;
    appVersion: string | null;
    utm: { source?: string; medium?: string; campaign?: string; content?: string; term?: string };
    dr?: string;
    trafficSource: string;
    trafficCategory: string;
  },
  today: Date
): Promise<void> {
  const stats: Array<{ name: string; value: string }> = [
    { name: "pageviews", value: "total" },
    { name: "pageviews_hour", value: data.hour.toString() },
    { name: "page", value: data.path },
    { name: "browser", value: data.parsedUA.browser },
    { name: "os", value: data.parsedUA.os },
    { name: "device", value: data.parsedUA.device },
    { name: "traffic_source", value: data.trafficSource },
    { name: "traffic_category", value: data.trafficCategory },
    { name: "platform", value: data.platform },
  ];

  // Browser version (like GA)
  if (data.parsedUA.browserVersion) {
    stats.push({
      name: "browser_version",
      value: `${data.parsedUA.browser} ${data.parsedUA.browserVersion}`,
    });
  }

  // OS version (like GA)
  if (data.parsedUA.osVersion) {
    stats.push({ name: "os_version", value: `${data.parsedUA.os} ${data.parsedUA.osVersion}` });
  }

  // Domain tracking
  if (data.domain) {
    stats.push({ name: "domain", value: data.domain });
  }

  // Users vs Sessions (GA terminology)
  if (data.isNewVisitor) {
    stats.push({ name: "unique_visitors", value: "total" });
    stats.push({ name: "new_users", value: "total" });
    stats.push({ name: "active_users", value: "total" }); // All new users are active
  } else {
    stats.push({ name: "returning_users", value: "total" });
    stats.push({ name: "active_users", value: "total" }); // Returning users are also active
  }

  if (data.isNewSession) {
    stats.push({ name: "visitors", value: "total" }); // This is sessions
    stats.push({ name: "visitors_hour", value: data.hour.toString() });
    stats.push({ name: "bounce", value: "true" }); // Will be decremented on second pageview
    // Entry page tracking
    stats.push({ name: "landing_page", value: data.path });
  }

  // Screen resolution
  if (data.sr) {
    stats.push({ name: "resolution", value: data.sr });
  }

  // Country
  if (data.country) {
    stats.push({ name: "country", value: data.country });
  }

  // City (like GA)
  if (data.city) {
    stats.push({ name: "city", value: data.city });
  }

  // Language (like GA)
  if (data.language) {
    stats.push({ name: "language", value: data.language });
  }

  // App version for mobile (like GA)
  if (data.appVersion) {
    stats.push({ name: "app_version", value: data.appVersion });
  }

  // Screen views for mobile
  if (data.platform !== "web") {
    stats.push({ name: "screen_views", value: "total" });
    stats.push({ name: "screen", value: data.path });
  }

  // UTM
  if (data.utm.source) stats.push({ name: "utm_source", value: data.utm.source });
  if (data.utm.medium) stats.push({ name: "utm_medium", value: data.utm.medium });
  if (data.utm.campaign) stats.push({ name: "campaign", value: data.utm.campaign });
  if (data.utm.content) stats.push({ name: "utm_content", value: data.utm.content });
  if (data.utm.term) stats.push({ name: "utm_term", value: data.utm.term });

  // Referrer
  if (data.dr) {
    try {
      const referrerDomain = new URL(data.dr).hostname;
      if (referrerDomain !== data.domain) {
        stats.push({ name: "referrer", value: referrerDomain });
      }
    } catch {}
  }

  // Upsert all stats
  await Promise.all(
    stats.map((stat) => upsertProjectStat(projectId, stat.name, stat.value, today, data.domain))
  );
}

/**
 * Track event statistics
 */
async function trackEventStats(
  projectId: number,
  data: {
    category: string;
    action: string;
    label?: string;
    value?: number;
    domain: string | null;
    platform: string;
  },
  today: Date
): Promise<void> {
  // Store in ProjectEvent
  await prisma.projectEvent.create({
    data: {
      projectId,
      name: `${data.category}:${data.action}`,
      value: data.label || null,
      properties: data.value ? { value: data.value } : undefined,
      domain: data.domain,
      platform: data.platform,
    },
  });

  // Update stats
  await upsertProjectStat(
    projectId,
    "event",
    `${data.category}:${data.action}`,
    today,
    data.domain
  );
}

/**
 * Track engagement statistics
 */
async function trackEngagementStats(
  projectId: number,
  data: {
    timeOnPage?: number;
    scrollDepth?: number;
    engagementTime?: number;
    path: string;
    sessionId?: string;
  },
  today: Date
): Promise<void> {
  if (data.timeOnPage !== undefined) {
    await upsertProjectStat(projectId, "time_on_page", getTimeBucket(data.timeOnPage), today, null);
  }

  if (data.scrollDepth !== undefined) {
    const bucket =
      data.scrollDepth >= 100
        ? "100%"
        : data.scrollDepth >= 75
          ? "75%"
          : data.scrollDepth >= 50
            ? "50%"
            : data.scrollDepth >= 25
              ? "25%"
              : "0%";
    await upsertProjectStat(projectId, "scroll_depth", bucket, today, null);
  }

  // Track engagement time buckets (like GA)
  if (data.engagementTime !== undefined) {
    const engagementBucket =
      data.engagementTime >= 180
        ? "180s+"
        : data.engagementTime >= 60
          ? "60-180s"
          : data.engagementTime >= 30
            ? "30-60s"
            : data.engagementTime >= 10
              ? "10-30s"
              : "0-10s";
    await upsertProjectStat(projectId, "engagement_time", engagementBucket, today, null);

    // Mark session as engaged if > 10 seconds
    if (data.engagementTime > 10 && data.sessionId) {
      await upsertProjectStat(projectId, "engaged_sessions", "total", today, null);
    }
  }
}

/**
 * Update real-time user tracking
 */
async function updateRealtimeUser(
  projectId: number,
  visitorId: string,
  sessionId: string,
  currentPage: string,
  currentTitle: string | undefined,
  platform: string,
  country: string | null,
  city: string | null,
  device: string
): Promise<void> {
  try {
    await prisma.realtimeUser.upsert({
      where: {
        projectId_visitorId: {
          projectId,
          visitorId,
        },
      },
      update: {
        sessionId,
        currentPage,
        currentTitle: currentTitle || null,
        lastPingAt: new Date(),
        platform,
        country,
        city,
        device,
      },
      create: {
        projectId,
        visitorId,
        sessionId,
        currentPage,
        currentTitle: currentTitle || null,
        platform,
        country,
        city,
        device,
      },
    });
  } catch (error) {
    // Non-critical, log and continue
    logError(error, { context: "realtime_tracking", projectId });
  }
}

/**
 * Clean up stale real-time users (call from cron)
 */
export async function cleanupRealtimeUsers(): Promise<number> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const result = await prisma.realtimeUser.deleteMany({
    where: {
      lastPingAt: { lt: fiveMinutesAgo },
    },
  });
  return result.count;
}

/**
 * E-commerce item interface
 */
interface EcommerceItemData {
  item_id?: string;
  id?: string;
  sku?: string;
  item_name?: string;
  name?: string;
  item_brand?: string;
  brand?: string;
  item_category?: string;
  category?: string;
  item_variant?: string;
  variant?: string;
  price?: number;
  quantity?: number;
  discount?: number;
  coupon?: string;
}

/**
 * Track e-commerce events (GA4-like)
 */
async function trackEcommerceEvent(
  projectId: number,
  data: {
    eventType: string;
    visitorId: string;
    sessionId?: string;
    items: EcommerceItemData[];
    transactionId?: string;
    currency: string;
    value: number;
    tax: number;
    shipping: number;
    coupon?: string;
    affiliation?: string;
    itemListId?: string;
    itemListName?: string;
    shippingTier?: string;
    paymentType?: string;
    domain: string | null;
    platform: string;
  },
  today: Date
): Promise<void> {
  const {
    eventType,
    visitorId,
    sessionId,
    items,
    transactionId,
    currency,
    value,
    tax,
    shipping,
    coupon,
    affiliation,
    itemListId,
    itemListName,
    shippingTier,
    paymentType,
    domain,
    platform,
  } = data;

  // Normalize items
  const normalizedItems = items.map((item) => ({
    itemId: item.item_id || item.id || item.sku || "unknown",
    itemName: item.item_name || item.name || "Unknown",
    itemBrand: item.item_brand || item.brand || null,
    itemCategory: item.item_category || item.category || null,
    itemVariant: item.item_variant || item.variant || null,
    price: parseFloat(String(item.price)) || 0,
    quantity: parseInt(String(item.quantity)) || 1,
    discount: parseFloat(String(item.discount)) || 0,
    coupon: item.coupon || null,
  }));

  // Handle purchase event - create transaction record
  if (eventType === "purchase" && transactionId) {
    try {
      // Create transaction
      const transaction = await prisma.ecommerceTransaction.create({
        data: {
          projectId,
          transactionId,
          visitorId,
          sessionId,
          currency,
          value,
          tax,
          shipping,
          coupon,
          affiliation,
          itemCount: normalizedItems.reduce((sum, item) => sum + item.quantity, 0),
          domain,
          platform,
        },
      });

      // Create items
      if (normalizedItems.length > 0) {
        await prisma.ecommerceItem.createMany({
          data: normalizedItems.map((item) => ({
            transactionId: transaction.id,
            itemId: item.itemId,
            itemName: item.itemName,
            itemBrand: item.itemBrand,
            itemCategory: item.itemCategory,
            itemVariant: item.itemVariant,
            price: item.price,
            quantity: item.quantity,
            discount: item.discount,
            coupon: item.coupon,
          })),
        });
      }

      // Update stats
      await Promise.all([
        upsertProjectStat(projectId, "purchase", "total", today, domain),
        upsertProjectStat(projectId, "ecommerce_transactions", "total", today, domain),
        upsertProjectStatWithValue(projectId, "ecommerce_revenue", value, today, domain),
        // Track by item
        ...normalizedItems.map((item) =>
          upsertProjectStat(projectId, "ecommerce_item", item.itemId, today, domain)
        ),
        // Track by category
        ...normalizedItems
          .filter((item) => item.itemCategory)
          .map((item) =>
            upsertProjectStat(projectId, "ecommerce_category", item.itemCategory!, today, domain)
          ),
        // Track by brand
        ...normalizedItems
          .filter((item) => item.itemBrand)
          .map((item) =>
            upsertProjectStat(projectId, "ecommerce_brand", item.itemBrand!, today, domain)
          ),
      ]);
    } catch (error) {
      // Transaction might already exist, log and continue
      logError(error, { context: "ecommerce_transaction", projectId });
    }
  } else {
    // For other e-commerce events (view_item, add_to_cart, etc.)
    // Store in EcommerceEvent table
    const firstItem = normalizedItems[0];

    await prisma.ecommerceEvent.create({
      data: {
        projectId,
        eventType,
        visitorId,
        sessionId,
        itemId: firstItem?.itemId,
        itemName: firstItem?.itemName,
        itemBrand: firstItem?.itemBrand,
        itemCategory: firstItem?.itemCategory,
        itemVariant: firstItem?.itemVariant,
        price: firstItem?.price,
        quantity: firstItem?.quantity,
        transactionId,
        currency,
        value,
        itemListId,
        itemListName,
        shippingTier,
        paymentType,
        domain,
        platform,
      },
    });

    // Update stats based on event type
    const statName = eventType as StatType;
    if (
      ["view_item", "add_to_cart", "remove_from_cart", "begin_checkout", "refund"].includes(
        eventType
      )
    ) {
      await upsertProjectStat(projectId, statName, "total", today, domain);

      // Track item-level stats for item events
      if (firstItem && ["view_item", "add_to_cart"].includes(eventType)) {
        await upsertProjectStat(projectId, "ecommerce_item", firstItem.itemId, today, domain);
      }
    }
  }
}

/**
 * Upsert a project stat with a numeric value (for revenue, etc.)
 */
async function upsertProjectStatWithValue(
  projectId: number,
  name: string,
  value: number,
  date: Date,
  domain?: string | null
): Promise<void> {
  // For revenue stats, we store the total in the count field (multiplied by 100 to preserve decimals)
  const valueInCents = Math.round(value * 100);

  await prisma.projectStat.upsert({
    where: {
      projectId_name_value_date_domain: {
        projectId,
        name: name as StatType,
        value: "total",
        date,
        domain: domain ?? "",
      },
    },
    update: { count: { increment: valueInCents } },
    create: {
      projectId,
      name: name as StatType,
      value: "total",
      date,
      domain: domain || null,
      count: BigInt(valueInCents),
    },
  });
}
