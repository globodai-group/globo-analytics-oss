"use server";

/**
 * Algolia Search Service
 *
 * Server-side search functions that handle multi-index search
 * with proper user filtering and result grouping.
 */

import { getAlgoliaSearchClient } from "./client";
import { algoliaConfig, validateAlgoliaConfig } from "./config";
import type {
  AlgoliaRecord,
  AlgoliaProjectRecord,
  AlgoliaPageRecord,
  AlgoliaEventRecord,
  AlgoliaSegmentRecord,
  AlgoliaGoalRecord,
  AlgoliaFunnelRecord,
  GroupedSearchResults,
  SearchContext,
} from "./types";

interface SearchOptions {
  query: string;
  context: SearchContext;
  hitsPerPage?: number;
}

/**
 * Perform a multi-index search across all relevant indices
 */
export async function globalSearch({
  query,
  context,
  hitsPerPage = 5,
}: SearchOptions): Promise<GroupedSearchResults> {
  const validation = validateAlgoliaConfig();
  if (!validation.valid) {
    // Return empty results if not configured
    return createEmptyResults();
  }

  if (!query.trim()) {
    return createEmptyResults();
  }

  const client = getAlgoliaSearchClient();

  // Build filters based on context
  const userFilter = `userId:${context.userId}`;
  const projectFilter = context.projectId ? `projectId:${context.projectId}` : "";
  const combinedFilter = projectFilter ? `${userFilter} AND ${projectFilter}` : userFilter;

  // Determine which indices to search based on context
  const indicesToSearch = context.types
    ? context.types.map((type) => getIndexName(type))
    : context.projectId
      ? // In project context: search project-specific data
        [
          algoliaConfig.indices.pages,
          algoliaConfig.indices.events,
          algoliaConfig.indices.segments,
          algoliaConfig.indices.goals,
          algoliaConfig.indices.funnels,
        ]
      : // Global context: search everything
        Object.values(algoliaConfig.indices);

  try {
    // Perform multi-index search
    const responses = await Promise.all(
      indicesToSearch.map((indexName) =>
        client.searchSingleIndex({
          indexName,
          searchParams: {
            query,
            filters: indexName === algoliaConfig.indices.projects ? userFilter : combinedFilter,
            hitsPerPage,
            attributesToHighlight: ["name", "title", "description", "url", "eventName"],
            highlightPreTag: "<mark>",
            highlightPostTag: "</mark>",
          },
        })
      )
    );

    // Group results by type
    const results = createEmptyResults();
    let totalHits = 0;

    for (const response of responses) {
      totalHits += response.nbHits || 0;

      for (const hit of response.hits as AlgoliaRecord[]) {
        const result = {
          hit,
          highlightResult: (hit as unknown as { _highlightResult?: object })._highlightResult,
        };

        switch (hit.type) {
          case "project":
            results.projects.push(result as { hit: AlgoliaProjectRecord });
            break;
          case "page":
            results.pages.push(result as { hit: AlgoliaPageRecord });
            break;
          case "event":
            results.events.push(result as { hit: AlgoliaEventRecord });
            break;
          case "segment":
            results.segments.push(result as { hit: AlgoliaSegmentRecord });
            break;
          case "goal":
            results.goals.push(result as { hit: AlgoliaGoalRecord });
            break;
          case "funnel":
            results.funnels.push(result as { hit: AlgoliaFunnelRecord });
            break;
        }
      }
    }

    results.totalHits = totalHits;
    return results;
  } catch (error) {
    console.error("Algolia search error:", error);
    return createEmptyResults();
  }
}

/**
 * Search only projects (for project switcher)
 */
export async function searchProjects(
  query: string,
  userId: string,
  limit = 10
): Promise<AlgoliaProjectRecord[]> {
  const validation = validateAlgoliaConfig();
  if (!validation.valid) return [];

  if (!query.trim()) return [];

  const client = getAlgoliaSearchClient();

  try {
    const response = await client.searchSingleIndex({
      indexName: algoliaConfig.indices.projects,
      searchParams: {
        query,
        filters: `userId:${userId}`,
        hitsPerPage: limit,
      },
    });

    return response.hits as AlgoliaProjectRecord[];
  } catch (error) {
    console.error("Project search error:", error);
    return [];
  }
}

/**
 * Get recent/popular items for empty state
 */
export async function getRecentItems(
  context: SearchContext,
  limit = 5
): Promise<GroupedSearchResults> {
  const validation = validateAlgoliaConfig();
  if (!validation.valid) return createEmptyResults();

  const client = getAlgoliaSearchClient();
  const userFilter = `userId:${context.userId}`;

  try {
    // Get recent projects
    const projectsResponse = await client.searchSingleIndex({
      indexName: algoliaConfig.indices.projects,
      searchParams: {
        query: "",
        filters: userFilter,
        hitsPerPage: limit,
      },
    });

    const results = createEmptyResults();
    results.projects = (projectsResponse.hits as AlgoliaProjectRecord[]).map((hit) => ({
      hit,
    }));
    results.totalHits = projectsResponse.nbHits || 0;

    return results;
  } catch (error) {
    console.error("Recent items error:", error);
    return createEmptyResults();
  }
}

// Helper functions

function getIndexName(type: AlgoliaRecord["type"]): string {
  switch (type) {
    case "project":
      return algoliaConfig.indices.projects;
    case "page":
      return algoliaConfig.indices.pages;
    case "event":
      return algoliaConfig.indices.events;
    case "segment":
      return algoliaConfig.indices.segments;
    case "goal":
      return algoliaConfig.indices.goals;
    case "funnel":
      return algoliaConfig.indices.funnels;
    default:
      return algoliaConfig.indices.projects;
  }
}

function createEmptyResults(): GroupedSearchResults {
  return {
    projects: [],
    pages: [],
    events: [],
    segments: [],
    goals: [],
    funnels: [],
    totalHits: 0,
  };
}
