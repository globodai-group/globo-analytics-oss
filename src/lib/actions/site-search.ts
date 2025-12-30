"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { ActionResult, ActionSuccess, ActionError } from "@/lib/types/actions";
import { verifyProjectOwnership } from "./with-project-ownership";

interface SearchTerm {
  term: string;
  count: number;
  percentage: number;
  avgResultsCount: number;
}

interface SearchAnalytics {
  topSearchTerms: SearchTerm[];
  noResultsSearches: SearchTerm[];
  totalSearches: number;
  uniqueSearchTerms: number;
  searchesWithNoResults: number;
  avgResultsPerSearch: number;
}

/**
 * Get site search analytics
 */
export async function getSiteSearchAnalyticsAction(
  projectId: number,
  dateRange: { from: Date; to: Date },
  locale: string,
): Promise<ActionResult<SearchAnalytics>> {
  const t = await getTranslations({ locale, namespace: "siteSearch" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const project = await verifyProjectOwnership(projectId, session.user.id);
  if (!project) {
    return ActionError(t("errors.projectNotFound"));
  }

  try {
    // Get search events
    const searchEvents = await prisma.projectEvent.findMany({
      where: {
        projectId,
        name: "search",
        createdAt: { gte: dateRange.from, lte: dateRange.to },
      },
      select: {
        value: true, // search term
        properties: true, // { results_count?: number }
      },
    });

    if (searchEvents.length === 0) {
      return ActionSuccess({
        topSearchTerms: [],
        noResultsSearches: [],
        totalSearches: 0,
        uniqueSearchTerms: 0,
        searchesWithNoResults: 0,
        avgResultsPerSearch: 0,
      });
    }

    // Count search terms
    const termCounts = new Map<
      string,
      { count: number; totalResults: number }
    >();
    let totalResults = 0;
    let searchesWithResults = 0;

    for (const event of searchEvents) {
      const term = (event.value || "").toLowerCase().trim();
      if (!term) continue;

      const properties = event.properties as { results_count?: number } | null;
      const resultsCount = properties?.results_count ?? 0;

      const existing = termCounts.get(term) || { count: 0, totalResults: 0 };
      termCounts.set(term, {
        count: existing.count + 1,
        totalResults: existing.totalResults + resultsCount,
      });

      if (resultsCount > 0) {
        searchesWithResults++;
        totalResults += resultsCount;
      }
    }

    const totalSearches = searchEvents.length;

    // Build top search terms
    const topSearchTerms: SearchTerm[] = Array.from(termCounts.entries())
      .map(([term, data]) => ({
        term,
        count: data.count,
        percentage: Math.round((data.count / totalSearches) * 100 * 10) / 10,
        avgResultsCount:
          data.count > 0 ? Math.round(data.totalResults / data.count) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Build no results searches
    const noResultsSearches: SearchTerm[] = Array.from(termCounts.entries())
      .filter(([, data]) => data.totalResults === 0)
      .map(([term, data]) => ({
        term,
        count: data.count,
        percentage: Math.round((data.count / totalSearches) * 100 * 10) / 10,
        avgResultsCount: 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const searchesWithNoResults = totalSearches - searchesWithResults;

    return ActionSuccess({
      topSearchTerms,
      noResultsSearches,
      totalSearches,
      uniqueSearchTerms: termCounts.size,
      searchesWithNoResults,
      avgResultsPerSearch:
        searchesWithResults > 0
          ? Math.round(totalResults / searchesWithResults)
          : 0,
    });
  } catch (error) {
    console.error("Site search analytics error:", error);
    return ActionError(t("errors.analysisFailed"));
  }
}

/**
 * Get search term details (what pages users visited after searching)
 */
export async function getSearchTermDetailsAction(
  projectId: number,
  searchTerm: string,
  dateRange: { from: Date; to: Date },
  locale: string,
): Promise<
  ActionResult<{
    clickedPages: { page: string; count: number; percentage: number }[];
    totalSearches: number;
  }>
> {
  const t = await getTranslations({ locale, namespace: "siteSearch" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const project = await verifyProjectOwnership(projectId, session.user.id);
  if (!project) {
    return ActionError(t("errors.projectNotFound"));
  }

  try {
    // Get search events for this term
    const searchEvents = await prisma.projectEvent.findMany({
      where: {
        projectId,
        name: "search",
        value: { contains: searchTerm, mode: "insensitive" },
        createdAt: { gte: dateRange.from, lte: dateRange.to },
      },
      select: {
        sessionId: true,
        createdAt: true,
      },
    });

    if (searchEvents.length === 0) {
      return ActionSuccess({
        clickedPages: [],
        totalSearches: 0,
      });
    }

    // Get sessions where these searches happened
    const sessionIds = searchEvents
      .map((e) => e.sessionId)
      .filter((id): id is string => id !== null);

    // Get page views that happened after the search in those sessions
    const pageViews = await prisma.projectEvent.findMany({
      where: {
        projectId,
        name: "pageview",
        sessionId: { in: sessionIds },
        createdAt: { gte: dateRange.from, lte: dateRange.to },
      },
      select: {
        sessionId: true,
        value: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Find pages visited after search
    const pageCounts = new Map<string, number>();
    for (const searchEvent of searchEvents) {
      if (!searchEvent.sessionId) continue;

      const sessionPageViews = pageViews
        .filter(
          (pv) =>
            pv.sessionId === searchEvent.sessionId &&
            pv.createdAt > searchEvent.createdAt,
        )
        .slice(0, 3); // First 3 pages after search

      for (const pv of sessionPageViews) {
        const page = pv.value || "/";
        pageCounts.set(page, (pageCounts.get(page) || 0) + 1);
      }
    }

    const totalSearches = searchEvents.length;
    const clickedPages = Array.from(pageCounts.entries())
      .map(([page, count]) => ({
        page,
        count,
        percentage: Math.round((count / totalSearches) * 100 * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return ActionSuccess({
      clickedPages,
      totalSearches,
    });
  } catch (error) {
    console.error("Search term details error:", error);
    return ActionError(t("errors.analysisFailed"));
  }
}
