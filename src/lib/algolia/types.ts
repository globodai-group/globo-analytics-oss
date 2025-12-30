/**
 * Algolia Index Types
 *
 * Defines the structure of documents stored in each Algolia index.
 * All documents include userId for filtering and objectID for Algolia.
 */

// Base interface for all indexed documents
export interface AlgoliaBaseRecord {
  objectID: string;
  userId: string;
  createdAt: number; // Unix timestamp for sorting
  updatedAt: number;
}

/**
 * Project Index
 * Stores project metadata for quick project switching
 */
export interface AlgoliaProjectRecord extends AlgoliaBaseRecord {
  type: "project";
  name: string;
  domain: string;
  description?: string;
  trackingId: string;
  status: "active" | "paused" | "archived";
  // Metrics for context
  totalPageviews?: number;
  totalVisitors?: number;
}

/**
 * Page Index
 * Stores page URLs and titles for page search
 */
export interface AlgoliaPageRecord extends AlgoliaBaseRecord {
  type: "page";
  projectId: number;
  projectName: string;
  url: string;
  title: string;
  // Metrics
  pageviews: number;
  avgTimeOnPage: number;
  bounceRate: number;
}

/**
 * Event Index
 * Stores custom events for event search
 */
export interface AlgoliaEventRecord extends AlgoliaBaseRecord {
  type: "event";
  projectId: number;
  projectName: string;
  eventName: string;
  eventCategory?: string;
  count: number;
  lastSeen: number;
}

/**
 * Segment Index
 * Stores audience segments
 */
export interface AlgoliaSegmentRecord extends AlgoliaBaseRecord {
  type: "segment";
  projectId: number;
  projectName: string;
  name: string;
  description?: string;
  conditions: string; // Human-readable summary of conditions
  userCount?: number;
}

/**
 * Goal Index
 * Stores conversion goals
 */
export interface AlgoliaGoalRecord extends AlgoliaBaseRecord {
  type: "goal";
  projectId: number;
  projectName: string;
  name: string;
  description?: string;
  goalType: string;
  conversionRate?: number;
  totalConversions?: number;
}

/**
 * Funnel Index
 * Stores conversion funnels
 */
export interface AlgoliaFunnelRecord extends AlgoliaBaseRecord {
  type: "funnel";
  projectId: number;
  projectName: string;
  name: string;
  description?: string;
  steps: string[]; // Step names for searchability
  stepCount: number;
  conversionRate?: number;
}

/**
 * Union type for all records
 */
export type AlgoliaRecord =
  | AlgoliaProjectRecord
  | AlgoliaPageRecord
  | AlgoliaEventRecord
  | AlgoliaSegmentRecord
  | AlgoliaGoalRecord
  | AlgoliaFunnelRecord;

/**
 * Search result with highlighting
 */
export interface AlgoliaSearchResult<T extends AlgoliaRecord = AlgoliaRecord> {
  hit: T;
  highlightResult?: {
    [K in keyof T]?: {
      value: string;
      matchLevel: "none" | "partial" | "full";
      matchedWords: string[];
    };
  };
}

/**
 * Search response grouped by type
 */
export interface GroupedSearchResults {
  projects: AlgoliaSearchResult<AlgoliaProjectRecord>[];
  pages: AlgoliaSearchResult<AlgoliaPageRecord>[];
  events: AlgoliaSearchResult<AlgoliaEventRecord>[];
  segments: AlgoliaSearchResult<AlgoliaSegmentRecord>[];
  goals: AlgoliaSearchResult<AlgoliaGoalRecord>[];
  funnels: AlgoliaSearchResult<AlgoliaFunnelRecord>[];
  totalHits: number;
}

/**
 * Search context for filtering
 */
export interface SearchContext {
  userId: string;
  projectId?: number; // If set, filter to this project only
  types?: AlgoliaRecord["type"][]; // Filter to specific types
}
