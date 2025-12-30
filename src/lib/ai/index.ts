/**
 * AI Service - Claude Haiku integration for smart analytics
 *
 * Uses Anthropic's Claude Haiku model for cost-effective AI features:
 * - Auto-generate funnels based on user behavior data
 * - Smart segment suggestions
 * - Anomaly detection insights
 * - Natural language query to filters
 */

import Anthropic from "@anthropic-ai/sdk";
import { getEnv, features } from "../env";
import { logger, logError } from "../logger";

// Singleton client
let anthropicClient: Anthropic | null = null;

/**
 * Get Anthropic client instance
 */
function getClient(): Anthropic | null {
  if (!features.hasAI) {
    return null;
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: getEnv().ANTHROPIC_API_KEY,
    });
  }

  return anthropicClient;
}

/**
 * Funnel suggestion from AI
 */
export interface FunnelSuggestion {
  name: string;
  description: string;
  steps: {
    name: string;
    type: "pageview" | "event" | "goal";
    value: string;
  }[];
  reasoning: string;
}

/**
 * Segment suggestion from AI
 */
export interface SegmentSuggestion {
  name: string;
  description: string;
  conditions: {
    field: string;
    operator: string;
    value: string;
  }[];
  reasoning: string;
}

/**
 * Analytics insight from AI
 */
export interface AnalyticsInsight {
  type: "anomaly" | "trend" | "opportunity" | "warning";
  title: string;
  description: string;
  metric: string;
  suggestion?: string;
}

/**
 * Generate funnel suggestions based on analytics data
 */
export async function suggestFunnels(data: {
  topPages: { path: string; pageviews: number }[];
  topEvents: { name: string; count: number }[];
  goals: { name: string; type: string }[];
  industry?: string;
}): Promise<FunnelSuggestion[]> {
  const client = getClient();
  if (!client) {
    logger.warn({
      type: "ai",
      event: "no_client",
      message: "AI features disabled",
    });
    return [];
  }

  const prompt = `You are an analytics expert. Based on the following website data, suggest 2-3 conversion funnels that would be valuable to track.

TOP PAGES (by pageviews):
${data.topPages.map((p) => `- ${p.path}: ${p.pageviews} views`).join("\n")}

TOP EVENTS:
${data.topEvents.map((e) => `- ${e.name}: ${e.count} occurrences`).join("\n")}

EXISTING GOALS:
${data.goals.map((g) => `- ${g.name} (${g.type})`).join("\n")}

${data.industry ? `INDUSTRY: ${data.industry}` : ""}

Respond with a JSON array of funnel suggestions. Each funnel should have:
- name: Short descriptive name
- description: What this funnel measures
- steps: Array of 3-5 steps, each with name, type (pageview/event/goal), and value
- reasoning: Why this funnel is valuable

Focus on realistic conversion paths based on the actual data provided.`;

  try {
    const response = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      logger.warn({
        type: "ai",
        event: "no_json",
        response: text.substring(0, 200),
      });
      return [];
    }

    const suggestions = JSON.parse(jsonMatch[0]) as FunnelSuggestion[];

    logger.info({
      type: "ai",
      event: "funnels_suggested",
      count: suggestions.length,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    return suggestions;
  } catch (error) {
    logError(error, { context: "ai", operation: "suggestFunnels" });
    return [];
  }
}

/**
 * Generate segment suggestions based on visitor data
 */
export async function suggestSegments(data: {
  countries: { code: string; visitors: number }[];
  devices: { type: string; visitors: number }[];
  sources: { source: string; visitors: number }[];
  browsers: { name: string; visitors: number }[];
  avgSessionDuration: number;
  bounceRate: number;
}): Promise<SegmentSuggestion[]> {
  const client = getClient();
  if (!client) {
    return [];
  }

  const prompt = `You are an analytics expert. Based on the following visitor data, suggest 2-3 audience segments that would be valuable for analysis.

VISITOR COUNTRIES:
${data.countries
  .slice(0, 10)
  .map((c) => `- ${c.code}: ${c.visitors} visitors`)
  .join("\n")}

DEVICES:
${data.devices.map((d) => `- ${d.type}: ${d.visitors} visitors`).join("\n")}

TRAFFIC SOURCES:
${data.sources
  .slice(0, 10)
  .map((s) => `- ${s.source}: ${s.visitors} visitors`)
  .join("\n")}

BROWSERS:
${data.browsers
  .slice(0, 5)
  .map((b) => `- ${b.name}: ${b.visitors} visitors`)
  .join("\n")}

METRICS:
- Average session duration: ${Math.round(data.avgSessionDuration)}s
- Bounce rate: ${(data.bounceRate * 100).toFixed(1)}%

Respond with a JSON array of segment suggestions. Each segment should have:
- name: Short descriptive name
- description: What this segment represents
- conditions: Array of conditions with field, operator (equals/contains/greater_than/less_than), and value
- reasoning: Why this segment is valuable

Available fields: country, device, browser, source, medium, campaign, landing_page, session_duration, page_count

Focus on actionable segments based on the actual data provided.`;

  try {
    const response = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const suggestions = JSON.parse(jsonMatch[0]) as SegmentSuggestion[];

    logger.info({
      type: "ai",
      event: "segments_suggested",
      count: suggestions.length,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    return suggestions;
  } catch (error) {
    logError(error, { context: "ai", operation: "suggestSegments" });
    return [];
  }
}

/**
 * Generate insights from analytics data
 */
export async function generateInsights(data: {
  currentPeriod: {
    pageviews: number;
    visitors: number;
    sessions: number;
    bounceRate: number;
    avgDuration: number;
  };
  previousPeriod: {
    pageviews: number;
    visitors: number;
    sessions: number;
    bounceRate: number;
    avgDuration: number;
  };
  topChanges: { metric: string; change: number }[];
}): Promise<AnalyticsInsight[]> {
  const client = getClient();
  if (!client) {
    return [];
  }

  const prompt = `You are an analytics expert. Analyze the following metrics and provide 2-3 actionable insights.

CURRENT PERIOD:
- Pageviews: ${data.currentPeriod.pageviews}
- Unique visitors: ${data.currentPeriod.visitors}
- Sessions: ${data.currentPeriod.sessions}
- Bounce rate: ${(data.currentPeriod.bounceRate * 100).toFixed(1)}%
- Avg session duration: ${Math.round(data.currentPeriod.avgDuration)}s

PREVIOUS PERIOD:
- Pageviews: ${data.previousPeriod.pageviews}
- Unique visitors: ${data.previousPeriod.visitors}
- Sessions: ${data.previousPeriod.sessions}
- Bounce rate: ${(data.previousPeriod.bounceRate * 100).toFixed(1)}%
- Avg session duration: ${Math.round(data.previousPeriod.avgDuration)}s

TOP CHANGES:
${data.topChanges.map((c) => `- ${c.metric}: ${c.change > 0 ? "+" : ""}${(c.change * 100).toFixed(1)}%`).join("\n")}

Respond with a JSON array of insights. Each insight should have:
- type: "anomaly" | "trend" | "opportunity" | "warning"
- title: Short headline
- description: Detailed explanation
- metric: The main metric this relates to
- suggestion: (optional) Actionable recommendation

Focus on significant changes and actionable insights.`;

  try {
    const response = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const insights = JSON.parse(jsonMatch[0]) as AnalyticsInsight[];

    logger.info({
      type: "ai",
      event: "insights_generated",
      count: insights.length,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    return insights;
  } catch (error) {
    logError(error, { context: "ai", operation: "generateInsights" });
    return [];
  }
}

/**
 * Convert natural language query to segment filters
 */
export async function queryToFilters(query: string): Promise<{
  filters: { field: string; operator: string; value: string }[];
  interpretation: string;
} | null> {
  const client = getClient();
  if (!client) {
    return null;
  }

  const prompt = `You are an analytics assistant. Convert the following natural language query into structured filters.

QUERY: "${query}"

Available filter fields:
- country (ISO code like US, FR, DE)
- device (desktop, mobile, tablet)
- browser (Chrome, Firefox, Safari, Edge)
- os (Windows, macOS, iOS, Android, Linux)
- source (google, facebook, twitter, direct, etc.)
- medium (organic, cpc, referral, social, email)
- campaign (campaign name)
- landing_page (URL path)
- exit_page (URL path)
- session_duration (seconds)
- page_count (number)

Available operators: equals, not_equals, contains, not_contains, greater_than, less_than, starts_with, ends_with

Respond with a JSON object:
{
  "filters": [{ "field": "...", "operator": "...", "value": "..." }],
  "interpretation": "What the query is asking for in plain terms"
}

If the query cannot be converted, return an empty filters array with an explanation in interpretation.`;

  try {
    const response = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const result = JSON.parse(jsonMatch[0]) as {
      filters: { field: string; operator: string; value: string }[];
      interpretation: string;
    };

    logger.info({
      type: "ai",
      event: "query_parsed",
      query: query.substring(0, 50),
      filterCount: result.filters.length,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    return result;
  } catch (error) {
    logError(error, { context: "ai", operation: "queryToFilters", query });
    return null;
  }
}
