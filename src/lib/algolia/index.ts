/**
 * Algolia Module
 *
 * Provides global search functionality powered by Algolia.
 *
 * Usage:
 * - Server-side: Use sync functions to index data
 * - Client-side: Use search functions via server actions
 *
 * Environment variables required:
 * - ALGOLIA_APP_ID: Algolia Application ID
 * - ALGOLIA_ADMIN_API_KEY: Admin API key (server-side indexing)
 * - NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY: Search-only API key (client search)
 */

// Configuration
export {
  algoliaConfig,
  validateAlgoliaConfig,
  isAlgoliaAdminConfigured,
} from "./config";
export type { AlgoliaIndex } from "./config";

// Types
export type {
  AlgoliaBaseRecord,
  AlgoliaProjectRecord,
  AlgoliaPageRecord,
  AlgoliaEventRecord,
  AlgoliaSegmentRecord,
  AlgoliaGoalRecord,
  AlgoliaFunnelRecord,
  AlgoliaRecord,
  AlgoliaSearchResult,
  GroupedSearchResults,
  SearchContext,
} from "./types";

// Search functions (can be called from client via server actions)
export { globalSearch, searchProjects, getRecentItems } from "./search";

// Sync functions (server-side only)
export {
  initializeAlgoliaIndices,
  syncUserProjects,
  syncProject,
  deleteProjectFromIndex,
  syncProjectPages,
  syncProjectEvents,
  syncProjectSegments,
  syncProjectGoals,
  syncProjectFunnels,
  fullSyncForUser,
} from "./sync";
