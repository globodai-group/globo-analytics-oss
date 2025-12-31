"use server";

/**
 * Algolia Sync Service
 *
 * Handles synchronization of data from Prisma to Algolia indices.
 * Can be triggered manually or via webhooks/cron jobs.
 */

import { prisma } from "@/lib/prisma";
import { getAdminIndex } from "./client";
import { algoliaConfig, isAlgoliaAdminConfigured } from "./config";
import { getIndexSettings } from "./index-settings";
import type {
  AlgoliaProjectRecord,
  AlgoliaPageRecord,
  AlgoliaEventRecord,
  AlgoliaSegmentRecord,
  AlgoliaGoalRecord,
  AlgoliaFunnelRecord,
} from "./types";
import { logger } from "@/lib/logger";

/**
 * Initialize all Algolia indices with proper settings
 */
export async function initializeAlgoliaIndices(): Promise<void> {
  if (!isAlgoliaAdminConfigured()) {
    logger.warn("Algolia admin not configured, skipping index initialization");
    return;
  }

  const indices = Object.entries(algoliaConfig.indices);

  for (const [type, indexName] of indices) {
    try {
      const index = getAdminIndex(indexName);
      const settings = getIndexSettings(type);
      await index.setSettings(settings);
      logger.info(`Algolia index ${indexName} initialized with type: ${type}`);
    } catch (error) {
      logger.error(`Failed to initialize Algolia index ${indexName}: ${error}`);
    }
  }
}

/**
 * Sync all projects for a user to Algolia
 */
export async function syncUserProjects(userId: string): Promise<number> {
  if (!isAlgoliaAdminConfigured()) return 0;

  const projects = await prisma.project.findMany({
    where: { userId },
  });

  if (projects.length === 0) return 0;

  const records: AlgoliaProjectRecord[] = projects.map((project) => ({
    objectID: `project_${project.id}`,
    type: "project",
    userId,
    name: project.name,
    domain: "", // Project doesn't have domain field
    trackingId: project.trackingId,
    status: "active",
    createdAt: project.createdAt.getTime(),
    updatedAt: project.updatedAt.getTime(),
  }));

  const index = getAdminIndex(algoliaConfig.indices.projects);
  await index.saveObjects(records);

  logger.info(`Synced ${records.length} projects for user ${userId}`);
  return records.length;
}

/**
 * Sync a single project to Algolia
 */
export async function syncProject(projectId: number): Promise<void> {
  if (!isAlgoliaAdminConfigured()) return;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) return;

  const record: AlgoliaProjectRecord = {
    objectID: `project_${project.id}`,
    type: "project",
    userId: project.userId,
    name: project.name,
    domain: "",
    trackingId: project.trackingId,
    status: "active",
    createdAt: project.createdAt.getTime(),
    updatedAt: project.updatedAt.getTime(),
  };

  const index = getAdminIndex(algoliaConfig.indices.projects);
  await index.saveObjects([record]);
}

/**
 * Delete a project from Algolia
 */
export async function deleteProjectFromIndex(projectId: number): Promise<void> {
  if (!isAlgoliaAdminConfigured()) return;

  const index = getAdminIndex(algoliaConfig.indices.projects);
  await index.deleteObjects([`project_${projectId}`]);
}

/**
 * Sync top pages for a project
 */
export async function syncProjectPages(
  projectId: number,
  userId: string,
): Promise<number> {
  if (!isAlgoliaAdminConfigured()) return 0;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  });

  if (!project) return 0;

  // Get top 100 pages by pageviews
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const pageEvents = await prisma.projectEvent.groupBy({
    by: ["value"],
    where: {
      projectId,
      name: "pageview",
      createdAt: { gte: thirtyDaysAgo },
      value: { not: null },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 100,
  });

  if (pageEvents.length === 0) return 0;

  const records: AlgoliaPageRecord[] = pageEvents.map((page, index) => ({
    objectID: `page_${projectId}_${index}`,
    type: "page",
    userId,
    projectId,
    projectName: project.name,
    url: page.value || "/",
    title: extractPageTitle(page.value || "/"),
    pageviews: page._count.id,
    avgTimeOnPage: 0,
    bounceRate: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));

  const index = getAdminIndex(algoliaConfig.indices.pages);
  await index.saveObjects(records);

  return records.length;
}

/**
 * Sync custom events for a project
 */
export async function syncProjectEvents(
  projectId: number,
  userId: string,
): Promise<number> {
  if (!isAlgoliaAdminConfigured()) return 0;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  });

  if (!project) return 0;

  // Get unique event names with counts
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const eventGroups = await prisma.projectEvent.groupBy({
    by: ["name"],
    where: {
      projectId,
      name: { notIn: ["pageview", "session_start", "session_end"] },
      createdAt: { gte: thirtyDaysAgo },
    },
    _count: { id: true },
    _max: { createdAt: true },
    orderBy: { _count: { id: "desc" } },
    take: 50,
  });

  if (eventGroups.length === 0) return 0;

  const records: AlgoliaEventRecord[] = eventGroups.map((event, index) => ({
    objectID: `event_${projectId}_${index}`,
    type: "event",
    userId,
    projectId,
    projectName: project.name,
    eventName: event.name,
    eventCategory: categorizeEvent(event.name),
    count: event._count.id,
    lastSeen: event._max.createdAt?.getTime() || Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));

  const index = getAdminIndex(algoliaConfig.indices.events);
  await index.saveObjects(records);

  return records.length;
}

/**
 * Sync segments for a project
 */
export async function syncProjectSegments(
  projectId: number,
  userId: string,
): Promise<number> {
  if (!isAlgoliaAdminConfigured()) return 0;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  });

  if (!project) return 0;

  const segments = await prisma.segment.findMany({
    where: { projectId },
  });

  if (segments.length === 0) return 0;

  const records: AlgoliaSegmentRecord[] = segments.map((segment) => ({
    objectID: `segment_${segment.id}`,
    type: "segment",
    userId,
    projectId,
    projectName: project.name,
    name: segment.name,
    description: segment.description || undefined,
    conditions: formatSegmentConditions(segment.conditions),
    createdAt: segment.createdAt.getTime(),
    updatedAt: segment.updatedAt.getTime(),
  }));

  const index = getAdminIndex(algoliaConfig.indices.segments);
  await index.saveObjects(records);

  return records.length;
}

/**
 * Sync goals for a project
 */
export async function syncProjectGoals(
  projectId: number,
  userId: string,
): Promise<number> {
  if (!isAlgoliaAdminConfigured()) return 0;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  });

  if (!project) return 0;

  const goals = await prisma.goal.findMany({
    where: { projectId },
  });

  if (goals.length === 0) return 0;

  const records: AlgoliaGoalRecord[] = goals.map((goal) => ({
    objectID: `goal_${goal.id}`,
    type: "goal",
    userId,
    projectId,
    projectName: project.name,
    name: goal.name,
    description: goal.description || undefined,
    goalType: goal.type,
    createdAt: goal.createdAt.getTime(),
    updatedAt: goal.updatedAt.getTime(),
  }));

  const index = getAdminIndex(algoliaConfig.indices.goals);
  await index.saveObjects(records);

  return records.length;
}

/**
 * Sync funnels for a project
 */
export async function syncProjectFunnels(
  projectId: number,
  userId: string,
): Promise<number> {
  if (!isAlgoliaAdminConfigured()) return 0;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  });

  if (!project) return 0;

  const funnels = await prisma.funnel.findMany({
    where: { projectId },
    include: {
      steps: {
        orderBy: { position: "asc" },
        select: { name: true },
      },
    },
  });

  if (funnels.length === 0) return 0;

  const records: AlgoliaFunnelRecord[] = funnels.map((funnel) => ({
    objectID: `funnel_${funnel.id}`,
    type: "funnel",
    userId,
    projectId,
    projectName: project.name,
    name: funnel.name,
    description: funnel.description || undefined,
    steps: funnel.steps.map((s) => s.name),
    stepCount: funnel.steps.length,
    createdAt: funnel.createdAt.getTime(),
    updatedAt: funnel.updatedAt.getTime(),
  }));

  const index = getAdminIndex(algoliaConfig.indices.funnels);
  await index.saveObjects(records);

  return records.length;
}

/**
 * Full sync for a user - syncs all their data
 */
export async function fullSyncForUser(userId: string): Promise<{
  projects: number;
  pages: number;
  events: number;
  segments: number;
  goals: number;
  funnels: number;
}> {
  const stats = {
    projects: 0,
    pages: 0,
    events: 0,
    segments: 0,
    goals: 0,
    funnels: 0,
  };

  if (!isAlgoliaAdminConfigured()) return stats;

  // Sync projects
  stats.projects = await syncUserProjects(userId);

  // Get all user's projects and sync their data
  const projects = await prisma.project.findMany({
    where: { userId },
    select: { id: true },
  });

  for (const project of projects) {
    stats.pages += await syncProjectPages(project.id, userId);
    stats.events += await syncProjectEvents(project.id, userId);
    stats.segments += await syncProjectSegments(project.id, userId);
    stats.goals += await syncProjectGoals(project.id, userId);
    stats.funnels += await syncProjectFunnels(project.id, userId);
  }

  logger.info(
    `Full Algolia sync completed for user ${userId}: ${JSON.stringify(stats)}`,
  );
  return stats;
}

// Helper functions

function extractPageTitle(url: string): string {
  // Extract a readable title from URL
  const path = url.replace(/^https?:\/\/[^/]+/, "");
  if (path === "/" || path === "") return "Home";

  return (
    path
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/[-_]/g, " ")
      .replace(/\.[^.]+$/, "")
      .replace(/\b\w/g, (c) => c.toUpperCase()) || "Page"
  );
}

function categorizeEvent(eventName: string): string {
  const name = eventName.toLowerCase();

  if (name.includes("click") || name.includes("tap")) return "Interaction";
  if (name.includes("submit") || name.includes("form")) return "Form";
  if (
    name.includes("purchase") ||
    name.includes("checkout") ||
    name.includes("buy")
  )
    return "E-commerce";
  if (
    name.includes("signup") ||
    name.includes("register") ||
    name.includes("login")
  )
    return "Authentication";
  if (name.includes("search")) return "Search";
  if (name.includes("video") || name.includes("play") || name.includes("watch"))
    return "Media";
  if (name.includes("download")) return "Download";
  if (name.includes("share") || name.includes("social")) return "Social";
  if (name.includes("error") || name.includes("fail")) return "Error";

  return "Custom";
}

function formatSegmentConditions(conditions: unknown): string {
  if (!conditions || !Array.isArray(conditions)) return "";

  return conditions
    .map((c: { field?: string; operator?: string; value?: string }) => {
      return `${c.field || ""} ${c.operator || ""} ${c.value || ""}`;
    })
    .join(", ");
}
