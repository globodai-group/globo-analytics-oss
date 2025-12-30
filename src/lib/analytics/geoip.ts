import { Reader, ReaderModel } from "@maxmind/geoip2-node";
import path from "path";
import fs from "fs";
import { logger, logError } from "@/lib/logger";

// GeoIP data structure
export interface GeoData {
  continent?: string; // Format: "EU:Europe"
  country?: string; // Format: "FR" (ISO code only for consistency)
  city?: string; // Format: "Paris"
  region?: string;
  latitude?: number;
  longitude?: number;
}

// Country code to name mapping
const COUNTRY_NAMES: Record<string, string> = {
  AF: "Afghanistan",
  AL: "Albania",
  DZ: "Algeria",
  AS: "American Samoa",
  AD: "Andorra",
  AO: "Angola",
  AR: "Argentina",
  AM: "Armenia",
  AU: "Australia",
  AT: "Austria",
  AZ: "Azerbaijan",
  BS: "Bahamas",
  BH: "Bahrain",
  BD: "Bangladesh",
  BB: "Barbados",
  BY: "Belarus",
  BE: "Belgium",
  BZ: "Belize",
  BJ: "Benin",
  BT: "Bhutan",
  BO: "Bolivia",
  BA: "Bosnia",
  BW: "Botswana",
  BR: "Brazil",
  BN: "Brunei",
  BG: "Bulgaria",
  CA: "Canada",
  CL: "Chile",
  CN: "China",
  CO: "Colombia",
  CR: "Costa Rica",
  HR: "Croatia",
  CU: "Cuba",
  CY: "Cyprus",
  CZ: "Czech Republic",
  DK: "Denmark",
  EC: "Ecuador",
  EG: "Egypt",
  SV: "El Salvador",
  EE: "Estonia",
  ET: "Ethiopia",
  FI: "Finland",
  FR: "France",
  DE: "Germany",
  GH: "Ghana",
  GR: "Greece",
  GT: "Guatemala",
  HN: "Honduras",
  HK: "Hong Kong",
  HU: "Hungary",
  IS: "Iceland",
  IN: "India",
  ID: "Indonesia",
  IR: "Iran",
  IQ: "Iraq",
  IE: "Ireland",
  IL: "Israel",
  IT: "Italy",
  JM: "Jamaica",
  JP: "Japan",
  JO: "Jordan",
  KZ: "Kazakhstan",
  KE: "Kenya",
  KR: "South Korea",
  KW: "Kuwait",
  LV: "Latvia",
  LB: "Lebanon",
  LY: "Libya",
  LT: "Lithuania",
  LU: "Luxembourg",
  MY: "Malaysia",
  MX: "Mexico",
  MA: "Morocco",
  NL: "Netherlands",
  NZ: "New Zealand",
  NG: "Nigeria",
  NO: "Norway",
  PK: "Pakistan",
  PA: "Panama",
  PE: "Peru",
  PH: "Philippines",
  PL: "Poland",
  PT: "Portugal",
  QA: "Qatar",
  RO: "Romania",
  RU: "Russia",
  SA: "Saudi Arabia",
  SN: "Senegal",
  RS: "Serbia",
  SG: "Singapore",
  SK: "Slovakia",
  SI: "Slovenia",
  ZA: "South Africa",
  ES: "Spain",
  LK: "Sri Lanka",
  SE: "Sweden",
  CH: "Switzerland",
  TW: "Taiwan",
  TH: "Thailand",
  TN: "Tunisia",
  TR: "Turkey",
  UA: "Ukraine",
  AE: "UAE",
  GB: "United Kingdom",
  US: "United States",
  UY: "Uruguay",
  VE: "Venezuela",
  VN: "Vietnam",
  ZW: "Zimbabwe",
};

export function getCountryName(code: string): string {
  return COUNTRY_NAMES[code?.toUpperCase()] || code;
}

/**
 * Validate that a string is a valid ISO 3166-1 alpha-2 country code
 */
export function isValidCountryCode(code: string | null | undefined): boolean {
  if (!code) return false;
  const normalized = code.toUpperCase().trim();
  return normalized.length === 2 && /^[A-Z]{2}$/.test(normalized) && normalized in COUNTRY_NAMES;
}

/**
 * Sanitize and validate a country code
 * Returns null if invalid
 */
export function sanitizeCountryCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const normalized = code.toUpperCase().trim().slice(0, 2);
  return isValidCountryCode(normalized) ? normalized : null;
}

// Singleton reader instance
let readerModel: ReaderModel | null = null;
let readerError: string | null = null;

/**
 * Get or initialize the GeoIP reader
 */
async function getReader(): Promise<ReaderModel | null> {
  if (readerModel) return readerModel;
  if (readerError) return null;

  const dbPath =
    process.env.GEOIP_DATABASE_PATH || path.join(process.cwd(), "data", "GeoLite2-City.mmdb");

  // Check if database file exists
  if (!fs.existsSync(dbPath)) {
    readerError = `GeoIP database not found at: ${dbPath}`;
    logger.warn({
      type: "geoip",
      event: "database_not_found",
      path: dbPath,
      hint: "Download from MaxMind: https://dev.maxmind.com/geoip/geolite2-free-geolocation-data",
    });
    return null;
  }

  try {
    readerModel = await Reader.open(dbPath);
    logger.info({ type: "geoip", event: "database_loaded", path: dbPath });
    return readerModel;
  } catch (error) {
    readerError = `Failed to load GeoIP database: ${error}`;
    logError(error, { context: "geoip", operation: "loadDatabase", path: dbPath });
    return null;
  }
}

/**
 * Get geolocation data from request headers (CDN/proxy-provided)
 * Supports: Cloudflare, Vercel, Heroku, AWS CloudFront
 *
 * SECURITY NOTE: These headers should only be trusted when behind a CDN that sets them.
 * We validate country codes against a whitelist to prevent injection.
 */
export function getGeoDataFromHeaders(headers: Headers): GeoData | null {
  // Try various geo headers from CDNs/proxies
  // Order by reliability: Cloudflare > Vercel > Generic
  const rawCountry =
    headers.get("cf-ipcountry") || // Cloudflare (most reliable)
    headers.get("x-vercel-ip-country") || // Vercel
    headers.get("x-country-code"); // Generic (less trusted)

  // SECURITY: Validate country code against whitelist
  const country = sanitizeCountryCode(rawCountry);

  // Only trust geo data if we have a valid country code
  // This prevents injection attacks via forged headers
  if (!country) {
    return null;
  }

  // City and region are less critical but still sanitize
  const rawCity =
    headers.get("cf-ipcity") || // Cloudflare
    headers.get("x-vercel-ip-city"); // Vercel

  const rawRegion =
    headers.get("cf-region") || // Cloudflare
    headers.get("x-vercel-ip-country-region"); // Vercel

  // Sanitize city and region (limit length, remove control chars)
  const city = rawCity
    ? rawCity
        .slice(0, 100)
        .replace(/[\x00-\x1F\x7F]/g, "")
        .trim()
    : undefined;
  const region = rawRegion
    ? rawRegion
        .slice(0, 50)
        .replace(/[\x00-\x1F\x7F]/g, "")
        .trim()
    : undefined;

  const latitude = headers.get("cf-iplat") || headers.get("x-vercel-ip-latitude");
  const longitude = headers.get("cf-iplon") || headers.get("x-vercel-ip-longitude");

  return {
    country,
    city: city || undefined,
    region: region || undefined,
    latitude: latitude ? parseFloat(latitude) : undefined,
    longitude: longitude ? parseFloat(longitude) : undefined,
  };
}

/**
 * Get geolocation data for an IP address
 * First tries MaxMind DB, returns null if not available
 */
export async function getGeoData(ip: string): Promise<GeoData | null> {
  // Skip private/localhost IPs
  if (isPrivateIP(ip)) {
    return null;
  }

  const reader = await getReader();
  if (!reader) {
    return null;
  }

  try {
    const response = reader.city(ip);

    // Return ISO country code only (not "FR:France" format)
    const country = response.country?.isoCode || undefined;
    const city = response.city?.names?.en || undefined;

    return {
      continent: response.continent?.code,
      country,
      city,
      region: response.subdivisions?.[0]?.names?.en,
      latitude: response.location?.latitude,
      longitude: response.location?.longitude,
    };
  } catch (error) {
    // IP not found in database is common (private IPs, etc.)
    if (error instanceof Error && !error.message.includes("not found")) {
      logError(error, { context: "geoip", operation: "lookup", ip });
    }
    return null;
  }
}

/**
 * Get geolocation from external API (ip-api.com)
 * Free tier: 45 requests/minute, no API key needed
 * Used as final fallback when CDN headers and MaxMind DB are unavailable
 */
async function getGeoDataFromAPI(ip: string): Promise<GeoData | null> {
  // Skip private IPs
  if (isPrivateIP(ip)) {
    return null;
  }

  try {
    // ip-api.com free tier - returns JSON with geo data
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,countryCode,city,regionName,lat,lon`,
      { signal: AbortSignal.timeout(2000) } // 2s timeout
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status !== "success") {
      return null;
    }

    // Validate country code against our whitelist
    const country = sanitizeCountryCode(data.countryCode);
    if (!country) {
      return null;
    }

    // Sanitize city and region
    const city = data.city
      ? String(data.city)
          .slice(0, 100)
          .replace(/[\x00-\x1F\x7F]/g, "")
          .trim()
      : undefined;
    const region = data.regionName
      ? String(data.regionName)
          .slice(0, 50)
          .replace(/[\x00-\x1F\x7F]/g, "")
          .trim()
      : undefined;

    return {
      country,
      city: city || undefined,
      region: region || undefined,
      latitude: typeof data.lat === "number" ? data.lat : undefined,
      longitude: typeof data.lon === "number" ? data.lon : undefined,
    };
  } catch (error) {
    // API call failed - log but don't crash
    logger.warn({ type: "geoip", event: "api_fallback_failed", ip, error: String(error) });
    return null;
  }
}

/**
 * Get geolocation - tries headers first, then MaxMind DB, then external API
 */
export async function getGeoDataWithFallback(
  ip: string,
  headers: Headers
): Promise<GeoData | null> {
  // First try CDN-provided geo headers (most reliable, no DB needed)
  const headerGeo = getGeoDataFromHeaders(headers);
  if (headerGeo) {
    return headerGeo;
  }

  // Second try MaxMind DB (if available)
  const maxmindGeo = await getGeoData(ip);
  if (maxmindGeo) {
    return maxmindGeo;
  }

  // Final fallback: external IP geolocation API
  return getGeoDataFromAPI(ip);
}

/**
 * Check if an IP is private/local
 */
function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  const privateRanges = [
    /^127\./, // Loopback
    /^10\./, // Class A private
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Class B private
    /^192\.168\./, // Class C private
    /^169\.254\./, // Link-local
    /^0\./, // "This" network
  ];

  // IPv6 private
  if (ip === "::1" || ip.startsWith("fe80:") || ip.startsWith("fc") || ip.startsWith("fd")) {
    return true;
  }

  return privateRanges.some((range) => range.test(ip));
}

/**
 * Initialize GeoIP (call on app startup for faster first request)
 */
export async function initGeoIP(): Promise<boolean> {
  const reader = await getReader();
  return reader !== null;
}
