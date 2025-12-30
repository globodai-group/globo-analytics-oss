import { prisma } from "@/lib/prisma";
import type { StatType } from "@prisma/client";

/**
 * Bot categorization system
 * Instead of blocking all bots, we categorize them for intelligent analytics
 */

// Malicious/spam bots (ALWAYS exclude)
const MALICIOUS_BOT_PATTERNS = [
  /spambot/i,
  /spam-bot/i,
  /scrapy[\s/]/i,
  /masscan[\s/]/i,
  /nmap[\s/]/i,
  /sqlmap[\s/]/i,
  /nikto[\s/]/i,
  /acunetix[\s/]/i,
  /nessus[\s/]/i,
  /metasploit[\s/]/i,
  /burpsuite/i,
  /hydra[\s/]/i,
  /zgrab[\s/]/i,
  /censys[\s/]/i,
];

// Search engine crawlers
const SEARCH_ENGINE_BOT_PATTERNS = [
  /googlebot[\s/]/i,
  /google-inspectiontool/i,
  /apis-google/i,
  /bingbot[\s/]/i,
  /yandexbot[\s/]/i,
  /baiduspider[\s/]/i,
  /duckduckbot[\s/]/i,
  /yahoo! slurp/i,
  /applebot[\s/]/i,
  /sogou[\s/][^\s]*spider/i,
  /qwantify[\s/]/i,
  /ecosia[\s/]/i,
];

// Social media crawlers
const SOCIAL_BOT_PATTERNS = [
  /facebookexternalhit[\s/]/i,
  /facebookcatalog[\s/]/i,
  /twitterbot[\s/]/i,
  /linkedinbot[\s/]/i,
  /pinterestbot[\s/]/i,
  /whatsapp[\s/]/i,
  /telegrambot[\s/]/i,
  /discordbot[\s/]/i,
  /slackbot[\s/]/i,
  /skypeuripreview/i,
  /viberbot[\s/]/i,
];

// SEO/monitoring tools
const SEO_MONITORING_PATTERNS = [
  /semrushbot[\s/]/i,
  /ahrefsbot[\s/]/i,
  /majestic-12[\s/]/i,
  /mj12bot[\s/]/i,
  /dotbot[\s/]/i,
  /rogerbot[\s/]/i,
  /chrome-lighthouse[\s/]/i,
  /pagespeed[\s/]/i,
  /gtmetrix[\s/]/i,
  /pingdom[\s/]/i,
  /uptimerobot[\s/]/i,
  /site24x7[\s/]/i,
  /statuscake[\s/]/i,
  /datadog[\s/]/i,
  /newrelic[\s/]/i,
  /seokicks-robot[\s/]/i,
  /sistrix[\s/]/i,
  /screaming frog/i,
];

// AI agents and LLMs (LEGITIMATE traffic)
const AI_AGENT_PATTERNS = [
  /chatgpt[\s/-]/i,
  /gptbot[\s/]/i,
  /openai[\s/]/i,
  /claudebot[\s/]/i,
  /anthropic[\s/]/i,
  /perplexitybot[\s/]/i,
  /cohere-ai[\s/]/i,
  /youbot[\s/]/i,
  /ccbot[\s/]/i,
  /bytespider[\s/]/i,
];

export type TrafficCategory =
  | "human"
  | "search_engine"
  | "social_bot"
  | "seo_tool"
  | "ai_agent"
  | "malicious"
  | "unknown_bot";

/**
 * Categorize user agent into traffic type
 */
export function categorizeUserAgent(
  userAgent: string,
  options?: {
    hasActiveSession?: boolean;
  }
): {
  category: TrafficCategory;
  shouldExclude: boolean;
} {
  if (options?.hasActiveSession) {
    return { category: "human", shouldExclude: false };
  }

  if (MALICIOUS_BOT_PATTERNS.some((p) => p.test(userAgent))) {
    return { category: "malicious", shouldExclude: true };
  }

  if (AI_AGENT_PATTERNS.some((p) => p.test(userAgent))) {
    return { category: "ai_agent", shouldExclude: false };
  }

  if (SEARCH_ENGINE_BOT_PATTERNS.some((p) => p.test(userAgent))) {
    return { category: "search_engine", shouldExclude: false };
  }

  if (SOCIAL_BOT_PATTERNS.some((p) => p.test(userAgent))) {
    return { category: "social_bot", shouldExclude: false };
  }

  if (SEO_MONITORING_PATTERNS.some((p) => p.test(userAgent))) {
    return { category: "seo_tool", shouldExclude: false };
  }

  const genericBotPatterns = [
    /\bbot[\s/\d]/i,
    /crawler[\s/]/i,
    /spider[\s/]/i,
    /headlesschrome/i,
    /phantomjs/i,
    /selenium/i,
    /webdriver/i,
    /curl[\s/]/i,
    /wget[\s/]/i,
    /python-requests/i,
    /httpx[\s/]/i,
    /axios[\s/]/i,
    /node-fetch/i,
    /go-http-client/i,
    /java[\s/][^\s]*http/i,
  ];

  if (genericBotPatterns.some((p) => p.test(userAgent))) {
    return { category: "unknown_bot", shouldExclude: true };
  }

  return { category: "human", shouldExclude: false };
}

const BOT_PATTERNS = [...MALICIOUS_BOT_PATTERNS, /\bbot[\s/\d]/i, /crawler[\s/]/i, /spider[\s/]/i];

const SEARCH_ENGINES = [
  "google",
  "bing",
  "yahoo",
  "duckduckgo",
  "baidu",
  "yandex",
  "ecosia",
  "qwant",
  "startpage",
  "ask",
];

const SOCIAL_NETWORKS = [
  "facebook",
  "twitter",
  "x.com",
  "linkedin",
  "instagram",
  "pinterest",
  "reddit",
  "youtube",
  "tiktok",
  "snapchat",
  "whatsapp",
  "telegram",
  "discord",
  "slack",
  "tumblr",
  "medium",
];

const TIME_BUCKETS = [
  { max: 10, label: "0-10s" },
  { max: 30, label: "10-30s" },
  { max: 60, label: "30-60s" },
  { max: 180, label: "1-3m" },
  { max: 600, label: "3-10m" },
  { max: Infinity, label: "10m+" },
];

export interface TrackingData {
  type?: "pageview" | "engagement" | "scroll" | "event";
  page: string;
  path?: string;
  referrer?: string;
  screenResolution?: string;
  sessionId?: string;
  visitorId?: string;
  isNewSession?: boolean;
  isNewVisitor?: boolean;
  landingPage?: string;
  pageCount?: number;
  language?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
  campaign?: string;
  timeOnPage?: number;
  scrollDepth?: number;
  isExit?: boolean;
  eventName?: string;
  eventValue?: string | null;
  event?: string;
}

export interface ParsedUserAgent {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  isBot: boolean;
}

export interface GeoData {
  continent?: string;
  country?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
}

export function isBot(userAgent: string): boolean {
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const ua = userAgent.toLowerCase();
  const isBotUA = isBot(userAgent);

  let browser = "Unknown";
  let browserVersion = "";

  if (ua.includes("edg/")) {
    browser = "Edge";
    browserVersion = ua.match(/edg\/([\d.]+)/)?.[1] || "";
  } else if (ua.includes("chrome/") && !ua.includes("chromium/")) {
    browser = "Chrome";
    browserVersion = ua.match(/chrome\/([\d.]+)/)?.[1] || "";
  } else if (ua.includes("firefox/")) {
    browser = "Firefox";
    browserVersion = ua.match(/firefox\/([\d.]+)/)?.[1] || "";
  } else if (ua.includes("safari/") && !ua.includes("chrome/")) {
    browser = "Safari";
    browserVersion = ua.match(/version\/([\d.]+)/)?.[1] || "";
  } else if (ua.includes("opera/") || ua.includes("opr/")) {
    browser = "Opera";
    browserVersion = ua.match(/(?:opera|opr)\/([\d.]+)/)?.[1] || "";
  } else if (ua.includes("msie") || ua.includes("trident/")) {
    browser = "Internet Explorer";
    browserVersion = ua.match(/(?:msie |rv:)([\d.]+)/)?.[1] || "";
  }

  let os = "Unknown";
  let osVersion = "";

  if (ua.includes("windows")) {
    os = "Windows";
    if (ua.includes("windows nt 10")) osVersion = "10";
    else if (ua.includes("windows nt 11")) osVersion = "11";
    else if (ua.includes("windows nt 6.3")) osVersion = "8.1";
    else if (ua.includes("windows nt 6.2")) osVersion = "8";
    else if (ua.includes("windows nt 6.1")) osVersion = "7";
  } else if (ua.includes("mac os x")) {
    os = "macOS";
    osVersion = ua.match(/mac os x ([\d_]+)/)?.[1]?.replace(/_/g, ".") || "";
  } else if (ua.includes("android")) {
    os = "Android";
    osVersion = ua.match(/android ([\d.]+)/)?.[1] || "";
  } else if (ua.includes("iphone") || ua.includes("ipad")) {
    os = "iOS";
    osVersion = ua.match(/os ([\d_]+)/)?.[1]?.replace(/_/g, ".") || "";
  } else if (ua.includes("linux")) {
    os = "Linux";
  } else if (ua.includes("chromeos")) {
    os = "Chrome OS";
  }

  let device = "Desktop";
  if (ua.includes("mobile") || ua.includes("iphone")) {
    device = "Mobile";
  } else if (ua.includes("tablet") || ua.includes("ipad")) {
    device = "Tablet";
  }

  return { browser, browserVersion, os, osVersion, device, isBot: isBotUA };
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function extractPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function isIpExcluded(ip: string, excludeList: string | null): boolean {
  if (!excludeList) return false;

  const excludedIps = excludeList
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return excludedIps.some((excluded) => {
    if (excluded.includes("/")) {
      const [network, bits] = excluded.split("/");
      const networkParts = network.split(".").map(Number);
      const ipParts = ip.split(".").map(Number);
      const mask = parseInt(bits, 10);

      if (networkParts.length !== 4 || ipParts.length !== 4) return false;

      const networkInt =
        (networkParts[0] << 24) |
        (networkParts[1] << 16) |
        (networkParts[2] << 8) |
        networkParts[3];
      const ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
      const maskInt = ~((1 << (32 - mask)) - 1);

      return (networkInt & maskInt) === (ipInt & maskInt);
    }

    if (excluded.includes("*")) {
      const regex = new RegExp("^" + excluded.replace(/\./g, "\\.").replace(/\*/g, "\\d+") + "$");
      return regex.test(ip);
    }

    return ip === excluded;
  });
}

export function classifyTrafficSource(
  referrer: string | undefined,
  utm?: TrackingData["utm"]
): string {
  if (utm?.medium) {
    const medium = utm.medium.toLowerCase();
    if (medium === "cpc" || medium === "ppc" || medium === "paid") return "paid";
    if (medium === "email") return "email";
    if (medium === "social") return "social";
    if (medium === "referral") return "referral";
    if (medium === "organic") return "organic";
  }

  if (!referrer) return "direct";

  const referrerDomain = extractDomain(referrer).toLowerCase();

  if (SEARCH_ENGINES.some((se) => referrerDomain.includes(se))) {
    return "organic";
  }

  if (SOCIAL_NETWORKS.some((sn) => referrerDomain.includes(sn))) {
    return "social";
  }

  return "referral";
}

export function getTimeBucket(seconds: number): string {
  for (const bucket of TIME_BUCKETS) {
    if (seconds <= bucket.max) {
      return bucket.label;
    }
  }
  return "10m+";
}

export function getScrollDepthBucket(depth: number): string {
  if (depth >= 100) return "100%";
  if (depth >= 75) return "75%";
  if (depth >= 50) return "50%";
  if (depth >= 25) return "25%";
  return "0%";
}

async function upsertStat(
  websiteId: number,
  name: StatType,
  value: string,
  date: Date
): Promise<void> {
  await prisma.stat.upsert({
    where: {
      websiteId_name_value_date: { websiteId, name, value, date },
    },
    update: { count: { increment: 1 } },
    create: { websiteId, name, value, date, count: 1 },
  });
}

async function trackPageview(
  websiteId: number,
  data: TrackingData,
  userAgent: string,
  geoData?: GeoData
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hour = new Date().getHours();
  const ua = parseUserAgent(userAgent);
  const path = data.path || extractPath(data.page);

  const trafficSource = classifyTrafficSource(data.referrer, data.utm);

  const stats: { name: StatType; value: string }[] = [
    { name: "pageviews", value: "total" },
    { name: "pageviews_hour", value: hour.toString() },
    { name: "page", value: path },
    { name: "browser", value: ua.browser },
    { name: "os", value: ua.os },
    { name: "device", value: ua.device },
    { name: "traffic_source", value: trafficSource },
  ];

  if (data.isNewVisitor && data.visitorId) {
    stats.push({ name: "unique_visitors", value: "total" });
  }

  if (data.isNewSession) {
    stats.push({ name: "visitors", value: "total" });
    stats.push({ name: "visitors_hour", value: hour.toString() });
  }

  if (data.screenResolution) {
    stats.push({ name: "resolution", value: data.screenResolution });
  }

  if (data.language) {
    const lang = data.language.split(",")[0].split("-")[0];
    stats.push({ name: "language", value: lang });
  }

  if (data.landingPage && data.isNewSession) {
    const landingPath = extractPath(data.landingPage);
    stats.push({ name: "landing_page", value: landingPath });
  }

  if (data.utm) {
    if (data.utm.source) stats.push({ name: "utm_source", value: data.utm.source });
    if (data.utm.medium) stats.push({ name: "utm_medium", value: data.utm.medium });
    if (data.utm.campaign) stats.push({ name: "campaign", value: data.utm.campaign });
    if (data.utm.content) stats.push({ name: "utm_content", value: data.utm.content });
    if (data.utm.term) stats.push({ name: "utm_term", value: data.utm.term });
  } else if (data.campaign) {
    stats.push({ name: "campaign", value: data.campaign });
  }

  if (data.referrer) {
    try {
      const referrerDomain = extractDomain(data.referrer);
      const pageDomain = extractDomain(data.page);
      if (referrerDomain !== pageDomain) {
        stats.push({ name: "referrer", value: referrerDomain });
      }
    } catch {
      // Invalid referrer URL
    }
  }

  if (geoData) {
    if (geoData.continent) stats.push({ name: "continent", value: geoData.continent });
    if (geoData.country) stats.push({ name: "country", value: geoData.country });
    if (geoData.city) stats.push({ name: "city", value: geoData.city });
  }

  await Promise.all(stats.map((stat) => upsertStat(websiteId, stat.name, stat.value, today)));

  if (data.sessionId && data.visitorId) {
    await updateSession(websiteId, data, ua, geoData);
  }
}

async function trackEngagement(websiteId: number, data: TrackingData): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats: { name: StatType; value: string }[] = [];

  if (data.timeOnPage !== undefined) {
    stats.push({ name: "time_on_page", value: getTimeBucket(data.timeOnPage) });
  }

  if (data.scrollDepth !== undefined) {
    stats.push({ name: "scroll_depth", value: getScrollDepthBucket(data.scrollDepth) });
  }

  if (data.isExit && data.path) {
    stats.push({ name: "exit_page", value: data.path });
  }

  await Promise.all(stats.map((stat) => upsertStat(websiteId, stat.name, stat.value, today)));

  if (data.sessionId && data.visitorId) {
    await updateSessionEngagement(websiteId, data);
  }
}

async function trackScroll(websiteId: number, data: TrackingData): Promise<void> {
  if (data.scrollDepth === undefined) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await upsertStat(websiteId, "scroll_depth", `${data.scrollDepth}%`, today);
}

async function trackCustomEvent(websiteId: number, data: TrackingData): Promise<void> {
  const eventName = data.eventName || data.event;
  if (!eventName) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.event.create({
    data: {
      websiteId,
      name: eventName,
      value: data.eventValue || undefined,
    },
  });

  await upsertStat(websiteId, "event", eventName, today);
}

async function updateSession(
  websiteId: number,
  data: TrackingData,
  ua: ParsedUserAgent,
  geoData?: GeoData
): Promise<void> {
  const path = data.path || extractPath(data.page);
  const trafficSource = classifyTrafficSource(data.referrer, data.utm);

  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const existingSession = await prisma.analyticsSession.findFirst({
      where: {
        websiteId,
        visitorHash: data.visitorId!,
        lastActivityAt: { gte: thirtyMinutesAgo },
      },
      orderBy: { lastActivityAt: "desc" },
    });

    if (existingSession) {
      await prisma.analyticsSession.update({
        where: { id: existingSession.id },
        data: {
          lastActivityAt: new Date(),
          pageviews: { increment: 1 },
          exitPage: path,
          isBounce: false,
        },
      });

      if (existingSession.isBounce) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await prisma.stat.updateMany({
          where: {
            websiteId,
            name: "bounce",
            value: "true",
            date: today,
          },
          data: { count: { decrement: 1 } },
        });
      }
    } else {
      await prisma.analyticsSession.create({
        data: {
          websiteId,
          visitorHash: data.visitorId!,
          entryPage: path,
          exitPage: path,
          referrer: data.referrer || null,
          utmSource: data.utm?.source || null,
          utmMedium: data.utm?.medium || null,
          utmCampaign: data.utm?.campaign || null,
          utmContent: data.utm?.content || null,
          utmTerm: data.utm?.term || null,
          trafficSource,
          browser: ua.browser,
          os: ua.os,
          device: ua.device,
          country: geoData?.country || null,
        },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await upsertStat(websiteId, "bounce", "true", today);
    }
  } catch (error) {
    console.error("Session tracking error:", error);
  }
}

async function updateSessionEngagement(websiteId: number, data: TrackingData): Promise<void> {
  if (!data.sessionId || !data.visitorId) return;

  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const session = await prisma.analyticsSession.findFirst({
      where: {
        websiteId,
        visitorHash: data.visitorId,
        lastActivityAt: { gte: thirtyMinutesAgo },
      },
      orderBy: { lastActivityAt: "desc" },
    });

    if (session) {
      const updateData: Record<string, unknown> = {
        lastActivityAt: new Date(),
      };

      if (data.scrollDepth !== undefined && data.scrollDepth > session.maxScrollDepth) {
        updateData.maxScrollDepth = data.scrollDepth;
      }

      if (data.isExit && data.path) {
        updateData.exitPage = data.path;
        updateData.endedAt = new Date();

        const duration = Math.round((Date.now() - session.startedAt.getTime()) / 1000);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await upsertStat(websiteId, "session_duration", getTimeBucket(duration), today);
      }

      await prisma.analyticsSession.update({
        where: { id: session.id },
        data: updateData,
      });
    }
  } catch (error) {
    console.error("Session engagement update error:", error);
  }
}

export async function trackEvent(
  websiteId: number,
  data: TrackingData,
  userAgent: string,
  ip: string,
  geoData?: GeoData
): Promise<void> {
  const eventType = data.type || "pageview";

  switch (eventType) {
    case "pageview":
      await trackPageview(websiteId, data, userAgent, geoData);
      break;
    case "engagement":
      await trackEngagement(websiteId, data);
      break;
    case "scroll":
      await trackScroll(websiteId, data);
      break;
    case "event":
      await trackCustomEvent(websiteId, data);
      break;
    default:
      await trackPageview(websiteId, { ...data, type: "pageview" }, userAgent, geoData);
  }
}

export function isSearchEngine(domain: string): boolean {
  return SEARCH_ENGINES.some((se) => domain.includes(se));
}

export function isSocialNetwork(domain: string): boolean {
  return SOCIAL_NETWORKS.some((sn) => domain.includes(sn));
}
