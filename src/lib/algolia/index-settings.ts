/**
 * Algolia Index Settings
 *
 * Defines searchable attributes, facets, and ranking for each index.
 * These settings are applied when initializing or updating indices.
 */

import type { SearchParamsObject } from "algoliasearch";

type IndexSettings = Partial<SearchParamsObject> & {
  searchableAttributes?: string[];
  attributesForFaceting?: string[];
  customRanking?: string[];
  attributesToRetrieve?: string[];
  attributesToHighlight?: string[];
  highlightPreTag?: string;
  highlightPostTag?: string;
  hitsPerPage?: number;
  maxValuesPerFacet?: number;
  sortFacetValuesBy?: "count" | "alpha";
  typoTolerance?: boolean | "min" | "strict";
  minWordSizefor1Typo?: number;
  minWordSizefor2Typos?: number;
  removeStopWords?: boolean | string[];
  ignorePlurals?: boolean | string[];
  distinct?: boolean | number;
  attributeForDistinct?: string;
  ranking?: string[];
  replicas?: string[];
};

/**
 * Common settings applied to all indices
 */
const commonSettings: IndexSettings = {
  highlightPreTag: "<mark>",
  highlightPostTag: "</mark>",
  hitsPerPage: 10,
  typoTolerance: true,
  minWordSizefor1Typo: 3,
  minWordSizefor2Typos: 6,
  removeStopWords: ["en", "fr"],
  ignorePlurals: ["en", "fr"],
};

/**
 * Project index settings
 */
export const projectIndexSettings: IndexSettings = {
  ...commonSettings,
  searchableAttributes: [
    "name", // Highest priority
    "domain",
    "description",
    "trackingId",
  ],
  attributesForFaceting: ["filterOnly(userId)", "status", "searchable(domain)"],
  customRanking: ["desc(totalPageviews)", "desc(updatedAt)"],
  attributesToRetrieve: [
    "objectID",
    "name",
    "domain",
    "description",
    "status",
    "trackingId",
    "totalPageviews",
    "totalVisitors",
    "createdAt",
  ],
  attributesToHighlight: ["name", "domain", "description"],
};

/**
 * Page index settings
 */
export const pageIndexSettings: IndexSettings = {
  ...commonSettings,
  searchableAttributes: [
    "title", // Highest priority
    "url",
    "projectName",
  ],
  attributesForFaceting: ["filterOnly(userId)", "filterOnly(projectId)", "searchable(projectName)"],
  customRanking: ["desc(pageviews)", "desc(updatedAt)"],
  attributesToRetrieve: [
    "objectID",
    "url",
    "title",
    "projectId",
    "projectName",
    "pageviews",
    "avgTimeOnPage",
    "bounceRate",
  ],
  attributesToHighlight: ["title", "url"],
  // Deduplicate by URL within same project
  distinct: 1,
  attributeForDistinct: "url",
};

/**
 * Event index settings
 */
export const eventIndexSettings: IndexSettings = {
  ...commonSettings,
  searchableAttributes: [
    "eventName", // Highest priority
    "eventCategory",
    "projectName",
  ],
  attributesForFaceting: [
    "filterOnly(userId)",
    "filterOnly(projectId)",
    "searchable(eventCategory)",
    "searchable(projectName)",
  ],
  customRanking: ["desc(count)", "desc(lastSeen)"],
  attributesToRetrieve: [
    "objectID",
    "eventName",
    "eventCategory",
    "projectId",
    "projectName",
    "count",
    "lastSeen",
  ],
  attributesToHighlight: ["eventName", "eventCategory"],
  // Deduplicate by event name within same project
  distinct: 1,
  attributeForDistinct: "eventName",
};

/**
 * Segment index settings
 */
export const segmentIndexSettings: IndexSettings = {
  ...commonSettings,
  searchableAttributes: [
    "name", // Highest priority
    "description",
    "conditions",
    "projectName",
  ],
  attributesForFaceting: ["filterOnly(userId)", "filterOnly(projectId)", "searchable(projectName)"],
  customRanking: ["desc(userCount)", "desc(updatedAt)"],
  attributesToRetrieve: [
    "objectID",
    "name",
    "description",
    "conditions",
    "projectId",
    "projectName",
    "userCount",
  ],
  attributesToHighlight: ["name", "description"],
};

/**
 * Goal index settings
 */
export const goalIndexSettings: IndexSettings = {
  ...commonSettings,
  searchableAttributes: [
    "name", // Highest priority
    "description",
    "goalType",
    "projectName",
  ],
  attributesForFaceting: [
    "filterOnly(userId)",
    "filterOnly(projectId)",
    "searchable(goalType)",
    "searchable(projectName)",
  ],
  customRanking: ["desc(totalConversions)", "desc(conversionRate)", "desc(updatedAt)"],
  attributesToRetrieve: [
    "objectID",
    "name",
    "description",
    "goalType",
    "projectId",
    "projectName",
    "conversionRate",
    "totalConversions",
  ],
  attributesToHighlight: ["name", "description"],
};

/**
 * Funnel index settings
 */
export const funnelIndexSettings: IndexSettings = {
  ...commonSettings,
  searchableAttributes: [
    "name", // Highest priority
    "description",
    "steps",
    "projectName",
  ],
  attributesForFaceting: ["filterOnly(userId)", "filterOnly(projectId)", "searchable(projectName)"],
  customRanking: ["desc(conversionRate)", "desc(updatedAt)"],
  attributesToRetrieve: [
    "objectID",
    "name",
    "description",
    "steps",
    "stepCount",
    "projectId",
    "projectName",
    "conversionRate",
  ],
  attributesToHighlight: ["name", "description", "steps"],
};

/**
 * Get settings for a specific index type
 */
export function getIndexSettings(indexType: string): IndexSettings {
  switch (indexType) {
    case "projects":
      return projectIndexSettings;
    case "pages":
      return pageIndexSettings;
    case "events":
      return eventIndexSettings;
    case "segments":
      return segmentIndexSettings;
    case "goals":
      return goalIndexSettings;
    case "funnels":
      return funnelIndexSettings;
    default:
      return commonSettings;
  }
}
