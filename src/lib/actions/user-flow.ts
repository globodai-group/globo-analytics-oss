"use server";

import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { ActionResult, ActionSuccess, ActionError } from "@/lib/types/actions";
import { verifyProjectOwnership } from "./with-project-ownership";
import { auth } from "@/lib/auth";

interface FlowNode {
  id: string;
  name: string;
  value: number;
}

interface FlowLink {
  source: string;
  target: string;
  value: number;
}

interface UserFlowData {
  nodes: FlowNode[];
  links: FlowLink[];
  topEntryPages: { page: string; count: number }[];
  topExitPages: { page: string; count: number }[];
  totalSessions: number;
}

/**
 * Get user flow analysis
 */
export async function getUserFlowAnalysisAction(
  projectId: number,
  dateRange: { from: Date; to: Date },
  locale: string,
  options: {
    entryPage?: string;
    maxDepth?: number;
  } = {},
): Promise<ActionResult<UserFlowData>> {
  const t = await getTranslations({ locale, namespace: "userFlow" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const project = await verifyProjectOwnership(projectId, session.user.id);
  if (!project) {
    return ActionError(t("errors.projectNotFound"));
  }

  try {
    const maxDepth = options.maxDepth || 5;

    // Get sessions with page events
    const sessions = await prisma.projectSession.findMany({
      where: {
        projectId,
        startedAt: { gte: dateRange.from, lte: dateRange.to },
        ...(options.entryPage ? { entryPage: options.entryPage } : {}),
      },
      select: {
        id: true,
        entryPage: true,
        exitPage: true,
      },
    });

    // Get page events for each session to track navigation paths
    const sessionIds = sessions.map((s) => s.id);

    // Get page view events ordered by time
    const pageEvents = await prisma.projectEvent.findMany({
      where: {
        projectId,
        sessionId: { in: sessionIds },
        name: "pageview",
        createdAt: { gte: dateRange.from, lte: dateRange.to },
      },
      orderBy: { createdAt: "asc" },
      select: {
        sessionId: true,
        value: true, // page path
        createdAt: true,
      },
    });

    // Group events by session
    const sessionPaths = new Map<string, string[]>();
    for (const event of pageEvents) {
      if (!event.sessionId || !event.value) continue;
      const path = sessionPaths.get(event.sessionId) || [];
      path.push(event.value);
      sessionPaths.set(event.sessionId, path);
    }

    // For sessions without detailed events, use entry/exit pages
    for (const session of sessions) {
      if (!sessionPaths.has(session.id)) {
        const path = [session.entryPage];
        if (session.exitPage && session.exitPage !== session.entryPage) {
          path.push(session.exitPage);
        }
        sessionPaths.set(session.id, path);
      }
    }

    // Count transitions between pages
    const transitionCounts = new Map<string, number>();
    const nodeSet = new Set<string>();
    const nodeValues = new Map<string, number>();

    for (const [, path] of sessionPaths) {
      const limitedPath = path.slice(0, maxDepth);

      for (let i = 0; i < limitedPath.length; i++) {
        const page = limitedPath[i];
        nodeSet.add(page);
        nodeValues.set(page, (nodeValues.get(page) || 0) + 1);

        if (i < limitedPath.length - 1) {
          const nextPage = limitedPath[i + 1];
          const key = `${page}|||${nextPage}`;
          transitionCounts.set(key, (transitionCounts.get(key) || 0) + 1);
        }
      }
    }

    // Build nodes array
    const nodes: FlowNode[] = Array.from(nodeSet).map((name) => ({
      id: name,
      name: name || "/",
      value: nodeValues.get(name) || 0,
    }));

    // Build links array (min 2 transitions to reduce noise)
    const links: FlowLink[] = [];
    for (const [key, value] of transitionCounts) {
      if (value >= 2) {
        const [source, target] = key.split("|||");
        links.push({ source, target, value });
      }
    }

    // Sort links by value
    links.sort((a, b) => b.value - a.value);

    // Get top entry pages
    const entryPageCounts = new Map<string, number>();
    for (const session of sessions) {
      entryPageCounts.set(
        session.entryPage,
        (entryPageCounts.get(session.entryPage) || 0) + 1,
      );
    }
    const topEntryPages = Array.from(entryPageCounts.entries())
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get top exit pages
    const exitPageCounts = new Map<string, number>();
    for (const session of sessions) {
      exitPageCounts.set(
        session.exitPage,
        (exitPageCounts.get(session.exitPage) || 0) + 1,
      );
    }
    const topExitPages = Array.from(exitPageCounts.entries())
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return ActionSuccess({
      nodes: nodes.slice(0, 50), // Limit nodes for performance
      links: links.slice(0, 100), // Limit links for performance
      topEntryPages,
      topExitPages,
      totalSessions: sessions.length,
    });
  } catch (error) {
    console.error("User flow analysis error:", error);
    return ActionError(t("errors.analysisFailed"));
  }
}

/**
 * Get detailed page flow (from a specific page)
 */
export async function getPageFlowAction(
  projectId: number,
  pagePath: string,
  direction: "from" | "to",
  dateRange: { from: Date; to: Date },
  locale: string,
): Promise<
  ActionResult<{
    transitions: { page: string; count: number; percentage: number }[];
  }>
> {
  const t = await getTranslations({ locale, namespace: "userFlow" });
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(t("errors.unauthorized"));
  }

  const project = await verifyProjectOwnership(projectId, session.user.id);
  if (!project) {
    return ActionError(t("errors.projectNotFound"));
  }

  try {
    // Get all sessions
    const sessions = await prisma.projectSession.findMany({
      where: {
        projectId,
        startedAt: { gte: dateRange.from, lte: dateRange.to },
      },
      select: { id: true },
    });

    const sessionIds = sessions.map((s) => s.id);

    // Get page events
    const pageEvents = await prisma.projectEvent.findMany({
      where: {
        projectId,
        sessionId: { in: sessionIds },
        name: "pageview",
        createdAt: { gte: dateRange.from, lte: dateRange.to },
      },
      orderBy: { createdAt: "asc" },
      select: {
        sessionId: true,
        value: true,
        createdAt: true,
      },
    });

    // Group by session and find transitions
    const sessionPaths = new Map<string, string[]>();
    for (const event of pageEvents) {
      if (!event.sessionId || !event.value) continue;
      const path = sessionPaths.get(event.sessionId) || [];
      path.push(event.value);
      sessionPaths.set(event.sessionId, path);
    }

    // Count transitions
    const transitionCounts = new Map<string, number>();
    let totalTransitions = 0;

    for (const [, path] of sessionPaths) {
      for (let i = 0; i < path.length - 1; i++) {
        if (direction === "from" && path[i] === pagePath) {
          const nextPage = path[i + 1];
          transitionCounts.set(
            nextPage,
            (transitionCounts.get(nextPage) || 0) + 1,
          );
          totalTransitions++;
        } else if (direction === "to" && path[i + 1] === pagePath) {
          const prevPage = path[i];
          transitionCounts.set(
            prevPage,
            (transitionCounts.get(prevPage) || 0) + 1,
          );
          totalTransitions++;
        }
      }
    }

    const transitions = Array.from(transitionCounts.entries())
      .map(([page, count]) => ({
        page,
        count,
        percentage:
          totalTransitions > 0
            ? Math.round((count / totalTransitions) * 100 * 10) / 10
            : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return ActionSuccess({ transitions });
  } catch (error) {
    console.error("Page flow analysis error:", error);
    return ActionError(t("errors.analysisFailed"));
  }
}
