import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  SegmentCondition,
  SegmentRule,
  SegmentOperator,
  SegmentField,
} from "@/lib/actions/segments";

/**
 * Build a Prisma WHERE clause from a segment condition
 * This is used to filter visitors/sessions based on segment rules
 */
export function buildSegmentWhereClause(
  conditions: SegmentCondition,
  tablePrefix: "visitor" | "session" = "visitor"
): Prisma.VisitorWhereInput | Prisma.ProjectSessionWhereInput {
  const buildRuleCondition = (rule: SegmentRule): object => {
    const { field, operator, value } = rule;

    // Map segment fields to database fields
    const fieldMapping: Record<SegmentField, string> = {
      country: "country",
      city: "city",
      browser: "browser",
      os: "os",
      device: "device",
      platform: "platform",
      language: "language",
      referrer: tablePrefix === "session" ? "referrer" : "firstReferrer",
      landing_page: tablePrefix === "session" ? "entryPage" : "entryPage",
      exit_page: "exitPage",
      page_path: "currentPage",
      utm_source: tablePrefix === "session" ? "utmSource" : "firstUtmSource",
      utm_medium: tablePrefix === "session" ? "utmMedium" : "firstUtmMedium",
      utm_campaign: tablePrefix === "session" ? "utmCampaign" : "firstUtmCampaign",
      traffic_source: "trafficSource",
      is_new_user: "isNewUser",
      session_count: "totalSessions",
      page_views: tablePrefix === "session" ? "pageviews" : "totalPageviews",
      engagement_time: tablePrefix === "session" ? "engagementTime" : "totalEngagementTime",
      custom_dimension_1: "customDimension1",
      custom_dimension_2: "customDimension2",
      custom_dimension_3: "customDimension3",
      custom_dimension_4: "customDimension4",
      custom_dimension_5: "customDimension5",
    };

    const dbField = fieldMapping[field] || field;

    // Build operator condition
    const buildOperatorCondition = (op: SegmentOperator, val: unknown): object => {
      switch (op) {
        case "equals":
          return { [dbField]: val };
        case "not_equals":
          return { [dbField]: { not: val } };
        case "contains":
          return { [dbField]: { contains: val as string, mode: "insensitive" } };
        case "not_contains":
          return { NOT: { [dbField]: { contains: val as string, mode: "insensitive" } } };
        case "starts_with":
          return { [dbField]: { startsWith: val as string, mode: "insensitive" } };
        case "ends_with":
          return { [dbField]: { endsWith: val as string, mode: "insensitive" } };
        case "greater_than":
          return { [dbField]: { gt: Number(val) } };
        case "less_than":
          return { [dbField]: { lt: Number(val) } };
        case "in":
          return { [dbField]: { in: Array.isArray(val) ? val : [val] } };
        case "not_in":
          return { [dbField]: { notIn: Array.isArray(val) ? val : [val] } };
        case "is_set":
          return { [dbField]: { not: null } };
        case "is_not_set":
          return { [dbField]: null };
        default:
          return {};
      }
    };

    return buildOperatorCondition(operator, value);
  };

  // Build conditions array
  const ruleConditions = conditions.rules.map(buildRuleCondition);

  // Combine with AND or OR
  if (conditions.type === "AND") {
    return { AND: ruleConditions };
  } else {
    return { OR: ruleConditions };
  }
}

/**
 * Get segment by ID and verify access
 */
export async function getSegmentWithAccess(segmentId: number, userId: string) {
  const segment = await prisma.segment.findFirst({
    where: {
      id: segmentId,
      OR: [{ userId }, { isShared: true }],
    },
    include: {
      project: true,
    },
  });

  return segment;
}

/**
 * Apply segment filter to visitor query
 */
export async function getSegmentedVisitorIds(
  projectId: number,
  segmentId: number,
  userId: string,
  dateRange?: { from: Date; to: Date }
): Promise<string[]> {
  const segment = await getSegmentWithAccess(segmentId, userId);
  if (!segment) return [];

  const conditions = segment.conditions as unknown as SegmentCondition;
  const whereClause = buildSegmentWhereClause(conditions, "visitor") as Prisma.VisitorWhereInput;

  const visitors = await prisma.visitor.findMany({
    where: {
      projectId,
      ...whereClause,
      ...(dateRange
        ? {
            lastSeenAt: {
              gte: dateRange.from,
              lte: dateRange.to,
            },
          }
        : {}),
    },
    select: { id: true },
  });

  return visitors.map((v) => v.id);
}

/**
 * Apply segment filter to session query
 */
export async function getSegmentedSessionIds(
  projectId: number,
  segmentId: number,
  userId: string,
  dateRange?: { from: Date; to: Date }
): Promise<string[]> {
  const segment = await getSegmentWithAccess(segmentId, userId);
  if (!segment) return [];

  const conditions = segment.conditions as unknown as SegmentCondition;
  const whereClause = buildSegmentWhereClause(
    conditions,
    "session"
  ) as Prisma.ProjectSessionWhereInput;

  const sessions = await prisma.projectSession.findMany({
    where: {
      projectId,
      ...whereClause,
      ...(dateRange
        ? {
            startedAt: {
              gte: dateRange.from,
              lte: dateRange.to,
            },
          }
        : {}),
    },
    select: { id: true },
  });

  return sessions.map((s) => s.id);
}

/**
 * Get segment statistics (preview how many users match)
 */
export async function getSegmentPreview(
  projectId: number,
  conditions: SegmentCondition,
  dateRange?: { from: Date; to: Date }
): Promise<{
  matchingVisitors: number;
  matchingSessions: number;
  totalVisitors: number;
  totalSessions: number;
  percentage: number;
}> {
  const visitorWhereClause = buildSegmentWhereClause(
    conditions,
    "visitor"
  ) as Prisma.VisitorWhereInput;
  const sessionWhereClause = buildSegmentWhereClause(
    conditions,
    "session"
  ) as Prisma.ProjectSessionWhereInput;

  const dateFilter = dateRange
    ? {
        lastSeenAt: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      }
    : {};

  const sessionDateFilter = dateRange
    ? {
        startedAt: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      }
    : {};

  const [matchingVisitors, matchingSessions, totalVisitors, totalSessions] = await Promise.all([
    prisma.visitor.count({
      where: {
        projectId,
        ...visitorWhereClause,
        ...dateFilter,
      },
    }),
    prisma.projectSession.count({
      where: {
        projectId,
        ...sessionWhereClause,
        ...sessionDateFilter,
      },
    }),
    prisma.visitor.count({
      where: {
        projectId,
        ...dateFilter,
      },
    }),
    prisma.projectSession.count({
      where: {
        projectId,
        ...sessionDateFilter,
      },
    }),
  ]);

  const percentage = totalVisitors > 0 ? Math.round((matchingVisitors / totalVisitors) * 100) : 0;

  return {
    matchingVisitors,
    matchingSessions,
    totalVisitors,
    totalSessions,
    percentage,
  };
}

/**
 * Available fields for segment builder with metadata
 */
export const SEGMENT_FIELDS = [
  // Geography
  { id: "country", label: "Country", category: "geography", type: "string" },
  { id: "city", label: "City", category: "geography", type: "string" },
  { id: "language", label: "Language", category: "geography", type: "string" },

  // Technology
  { id: "browser", label: "Browser", category: "technology", type: "string" },
  { id: "os", label: "Operating System", category: "technology", type: "string" },
  {
    id: "device",
    label: "Device Type",
    category: "technology",
    type: "enum",
    options: ["desktop", "mobile", "tablet"],
  },
  {
    id: "platform",
    label: "Platform",
    category: "technology",
    type: "enum",
    options: ["web", "ios", "android", "server"],
  },

  // Traffic Sources
  { id: "referrer", label: "Referrer", category: "acquisition", type: "string" },
  { id: "utm_source", label: "UTM Source", category: "acquisition", type: "string" },
  { id: "utm_medium", label: "UTM Medium", category: "acquisition", type: "string" },
  { id: "utm_campaign", label: "UTM Campaign", category: "acquisition", type: "string" },
  {
    id: "traffic_source",
    label: "Traffic Source",
    category: "acquisition",
    type: "enum",
    options: ["direct", "organic", "paid", "social", "referral", "email"],
  },

  // Behavior
  { id: "landing_page", label: "Landing Page", category: "behavior", type: "string" },
  { id: "exit_page", label: "Exit Page", category: "behavior", type: "string" },
  { id: "page_path", label: "Page Path", category: "behavior", type: "string" },

  // User Attributes
  { id: "is_new_user", label: "New User", category: "user", type: "boolean" },
  { id: "session_count", label: "Session Count", category: "user", type: "number" },
  { id: "page_views", label: "Page Views", category: "user", type: "number" },
  { id: "engagement_time", label: "Engagement Time (s)", category: "user", type: "number" },

  // Custom Dimensions
  { id: "custom_dimension_1", label: "Custom Dimension 1", category: "custom", type: "string" },
  { id: "custom_dimension_2", label: "Custom Dimension 2", category: "custom", type: "string" },
  { id: "custom_dimension_3", label: "Custom Dimension 3", category: "custom", type: "string" },
  { id: "custom_dimension_4", label: "Custom Dimension 4", category: "custom", type: "string" },
  { id: "custom_dimension_5", label: "Custom Dimension 5", category: "custom", type: "string" },
] as const;

/**
 * Available operators by field type
 */
export const OPERATORS_BY_TYPE: Record<string, { id: SegmentOperator; label: string }[]> = {
  string: [
    { id: "equals", label: "equals" },
    { id: "not_equals", label: "does not equal" },
    { id: "contains", label: "contains" },
    { id: "not_contains", label: "does not contain" },
    { id: "starts_with", label: "starts with" },
    { id: "ends_with", label: "ends with" },
    { id: "is_set", label: "is set" },
    { id: "is_not_set", label: "is not set" },
  ],
  number: [
    { id: "equals", label: "equals" },
    { id: "not_equals", label: "does not equal" },
    { id: "greater_than", label: "greater than" },
    { id: "less_than", label: "less than" },
    { id: "is_set", label: "is set" },
    { id: "is_not_set", label: "is not set" },
  ],
  enum: [
    { id: "equals", label: "equals" },
    { id: "not_equals", label: "does not equal" },
    { id: "in", label: "is one of" },
    { id: "not_in", label: "is not one of" },
  ],
  boolean: [
    { id: "equals", label: "is" },
    { id: "not_equals", label: "is not" },
  ],
};
