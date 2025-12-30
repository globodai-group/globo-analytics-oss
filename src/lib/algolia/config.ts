/**
 * Algolia Configuration
 *
 * Environment variables (supports Heroku addon naming):
 * - ALGOLIASEARCH_APPLICATION_ID or ALGOLIA_APP_ID: Application ID
 * - ALGOLIASEARCH_API_KEY or ALGOLIA_ADMIN_API_KEY: Admin API key (server-side)
 *
 * Note: Search is done via server actions, so we use the admin key server-side only.
 */

export const algoliaConfig = {
  // Support both Heroku addon naming and standard naming
  appId: process.env.ALGOLIASEARCH_APPLICATION_ID || process.env.ALGOLIA_APP_ID || "",
  adminApiKey: process.env.ALGOLIASEARCH_API_KEY || process.env.ALGOLIA_ADMIN_API_KEY || "",
  // For server-side search via actions, we use the admin key
  searchApiKey: process.env.ALGOLIASEARCH_API_KEY || process.env.ALGOLIA_ADMIN_API_KEY || "",

  // Index names with environment prefix
  indices: {
    projects: `${process.env.NODE_ENV || "development"}_projects`,
    pages: `${process.env.NODE_ENV || "development"}_pages`,
    events: `${process.env.NODE_ENV || "development"}_events`,
    segments: `${process.env.NODE_ENV || "development"}_segments`,
    goals: `${process.env.NODE_ENV || "development"}_goals`,
    funnels: `${process.env.NODE_ENV || "development"}_funnels`,
  } as const,

  // Search settings
  search: {
    hitsPerPage: 10,
    maxFacetHits: 10,
    attributesToHighlight: ["name", "title", "description", "url"],
    highlightPreTag: "<mark>",
    highlightPostTag: "</mark>",
  },
} as const;

export type AlgoliaIndex = keyof typeof algoliaConfig.indices;

/**
 * Validate Algolia configuration
 */
export function validateAlgoliaConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!algoliaConfig.appId) missing.push("ALGOLIASEARCH_APPLICATION_ID");
  if (!algoliaConfig.adminApiKey) missing.push("ALGOLIASEARCH_API_KEY");

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Check if Algolia is configured for admin operations
 */
export function isAlgoliaAdminConfigured(): boolean {
  return !!(algoliaConfig.appId && algoliaConfig.adminApiKey);
}
