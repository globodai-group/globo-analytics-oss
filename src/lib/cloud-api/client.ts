/**
 * GloboCloud API Client
 *
 * This client handles all communication with the GloboAnalytics Cloud API.
 * Premium features (80% of advanced functionality) are processed through
 * our cloud servers, ensuring they cannot be bypassed.
 *
 * The data flow:
 * 1. Your instance collects raw data locally
 * 2. For premium features, data is sent to our API
 * 3. We process it (ML, AI, aggregation) and return results
 * 4. Results can be cached locally, but processing happens on our side
 *
 * @example
 * ```ts
 * const cloud = new GloboCloudClient();
 *
 * // Get heatmap data (processed on our servers)
 * const heatmap = await cloud.heatmaps.get(projectId, { page: "/pricing" });
 *
 * // Get AI insights (Claude-powered, runs on our infrastructure)
 * const insights = await cloud.ai.getInsights(projectId, dateRange);
 * ```
 */

import { logger } from "../logger";

const CLOUD_API_URL =
  process.env.GLOBO_CLOUD_URL || "https://api.globoanalytics.com";
const CLOUD_API_VERSION = "v1";

export interface CloudAPIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface CloudAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: CloudAPIError;
  meta?: {
    requestId: string;
    processingTime: number;
    cached: boolean;
  };
}

/**
 * License tier required for each feature
 */
export const FEATURE_REQUIREMENTS = {
  // Analytics (via API)
  heatmaps: "pro",
  sessionRecording: "pro",
  botDetection: "pro",
  abTesting: "pro",
  retentionAnalysis: "pro",
  userJourney: "pro",
  advancedFunnels: "pro",
  advancedSegments: "pro",
  attribution: "pro",
  cohorts: "pro",

  // AI (via API - Enterprise only)
  aiInsights: "enterprise",
  predictiveAnalytics: "enterprise",
  anomalyDetection: "enterprise",
  naturalLanguageQuery: "enterprise",

  // Export (via API)
  pdfExport: "pro",
  scheduledReports: "pro",
  customReports: "enterprise",
} as const;

export type CloudFeature = keyof typeof FEATURE_REQUIREMENTS;

/**
 * Main GloboCloud API Client
 */
export class GloboCloudClient {
  private licenseKey: string;
  private instanceId: string;
  private baseUrl: string;

  constructor(options?: { licenseKey?: string; instanceId?: string }) {
    this.licenseKey = options?.licenseKey || process.env.LICENSE_KEY || "";
    this.instanceId = options?.instanceId || this.generateInstanceId();
    this.baseUrl = `${CLOUD_API_URL}/${CLOUD_API_VERSION}`;
  }

  private generateInstanceId(): string {
    // Generate a consistent instance ID based on environment
    const crypto = require("crypto");
    const hostname = process.env.HOSTNAME || "localhost";
    const appUrl = process.env.NEXTAUTH_URL || "";
    return crypto
      .createHash("sha256")
      .update(`${hostname}:${appUrl}`)
      .digest("hex")
      .slice(0, 16);
  }

  /**
   * Make an authenticated request to the Cloud API
   */
  private async request<T>(
    endpoint: string,
    options: {
      method?: "GET" | "POST" | "PUT" | "DELETE";
      body?: unknown;
      timeout?: number;
    } = {}
  ): Promise<CloudAPIResponse<T>> {
    const { method = "GET", body, timeout = 30000 } = options;

    if (!this.licenseKey) {
      return {
        success: false,
        error: {
          code: "NO_LICENSE",
          message:
            "License key required. Get one at https://globoanalytics.com/pricing",
        },
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-License-Key": this.licenseKey,
          "X-Instance-Id": this.instanceId,
          "X-Client-Version": process.env.npm_package_version || "1.0.0",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 402) {
          return {
            success: false,
            error: {
              code: "UPGRADE_REQUIRED",
              message:
                data.message || "This feature requires a higher license tier",
              details: { requiredTier: data.requiredTier },
            },
          };
        }

        if (response.status === 401) {
          return {
            success: false,
            error: {
              code: "INVALID_LICENSE",
              message: "Invalid or expired license key",
            },
          };
        }

        if (response.status === 429) {
          return {
            success: false,
            error: {
              code: "RATE_LIMITED",
              message: "Too many requests. Please try again later.",
              details: { retryAfter: response.headers.get("Retry-After") },
            },
          };
        }

        return {
          success: false,
          error: {
            code: data.code || "API_ERROR",
            message: data.message || "An error occurred",
          },
        };
      }

      return {
        success: true,
        data: data.data,
        meta: data.meta,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        return {
          success: false,
          error: {
            code: "TIMEOUT",
            message: "Request timed out",
          },
        };
      }

      logger.error({
        type: "cloud_api",
        event: "request_failed",
        endpoint,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: "Failed to connect to GloboCloud",
        },
      };
    }
  }

  /**
   * Check if a feature is available with current license
   */
  async checkFeature(feature: CloudFeature): Promise<boolean> {
    const result = await this.request<{ available: boolean }>(
      `/license/check-feature`,
      {
        method: "POST",
        body: { feature },
      }
    );
    return result.success && result.data?.available === true;
  }

  /**
   * Get current license status
   */
  async getLicenseStatus(): Promise<
    CloudAPIResponse<{
      tier: string;
      features: string[];
      expiresAt: string;
      usage: {
        domains: { current: number; max: number };
        pageviews: { current: number; max: number };
      };
    }>
  > {
    return this.request("/license/status");
  }

  // ==========================================================================
  // HEATMAPS API (Pro+)
  // ==========================================================================

  heatmaps = {
    /**
     * Get aggregated heatmap data for a page
     */
    get: async (
      projectId: number,
      options: {
        page: string;
        type: "click" | "scroll" | "move";
        dateFrom: string;
        dateTo: string;
        device?: "desktop" | "mobile" | "tablet";
      }
    ) => {
      return this.request<{
        points: Array<{ x: number; y: number; value: number }>;
        viewport: { width: number; height: number };
        totalEvents: number;
      }>("/heatmaps/aggregate", {
        method: "POST",
        body: { projectId, ...options },
      });
    },

    /**
     * Send click events for heatmap generation
     */
    track: async (
      projectId: number,
      events: Array<{
        page: string;
        x: number;
        y: number;
        viewportWidth: number;
        viewportHeight: number;
        timestamp: number;
        sessionId: string;
      }>
    ) => {
      return this.request<{ processed: number }>("/heatmaps/track", {
        method: "POST",
        body: { projectId, events },
      });
    },
  };

  // ==========================================================================
  // SESSION RECORDING API (Pro+)
  // ==========================================================================

  recordings = {
    /**
     * Upload a session recording
     */
    upload: async (
      projectId: number,
      recording: {
        sessionId: string;
        events: unknown[]; // rrweb events
        metadata: {
          duration: number;
          pages: string[];
          startedAt: string;
          userAgent: string;
          viewport: { width: number; height: number };
        };
      }
    ) => {
      return this.request<{
        recordingId: string;
        status: "processing" | "ready";
      }>("/recordings/upload", {
        method: "POST",
        body: { projectId, ...recording },
        timeout: 60000, // Longer timeout for uploads
      });
    },

    /**
     * Get a processed recording
     */
    get: async (recordingId: string) => {
      return this.request<{
        id: string;
        events: unknown[];
        metadata: Record<string, unknown>;
        thumbnail: string;
        status: "processing" | "ready" | "error";
      }>(`/recordings/${recordingId}`);
    },

    /**
     * List recordings for a project
     */
    list: async (
      projectId: number,
      options?: {
        page?: number;
        limit?: number;
        dateFrom?: string;
        dateTo?: string;
      }
    ) => {
      const params = new URLSearchParams({
        projectId: projectId.toString(),
        ...(options?.page && { page: options.page.toString() }),
        ...(options?.limit && { limit: options.limit.toString() }),
        ...(options?.dateFrom && { dateFrom: options.dateFrom }),
        ...(options?.dateTo && { dateTo: options.dateTo }),
      });

      return this.request<{
        recordings: Array<{
          id: string;
          sessionId: string;
          duration: number;
          pages: string[];
          thumbnail: string;
          createdAt: string;
        }>;
        total: number;
        page: number;
        pages: number;
      }>(`/recordings?${params}`);
    },

    /**
     * Delete a recording
     */
    delete: async (recordingId: string) => {
      return this.request<{ deleted: boolean }>(
        `/recordings/${recordingId}`,
        { method: "DELETE" }
      );
    },
  };

  // ==========================================================================
  // BOT DETECTION API (Pro+)
  // ==========================================================================

  botDetection = {
    /**
     * Classify a visitor as human or bot
     */
    classify: async (
      data: {
        userAgent: string;
        ip?: string;
        behavioralSignals?: {
          mouseMovements: number;
          keystrokes: number;
          scrollEvents: number;
          sessionDuration: number;
          pageviews: number;
        };
      }
    ) => {
      return this.request<{
        isBot: boolean;
        confidence: number;
        category:
          | "human"
          | "search_engine"
          | "social_bot"
          | "ai_agent"
          | "seo_tool"
          | "malicious"
          | "unknown_bot";
        details: {
          userAgentMatch: boolean;
          behaviorScore: number;
          ipReputation: number;
        };
      }>("/ml/bot-classify", {
        method: "POST",
        body: data,
      });
    },

    /**
     * Batch classify multiple visitors
     */
    batchClassify: async (
      visitors: Array<{
        visitorId: string;
        userAgent: string;
        ip?: string;
        behavioralSignals?: {
          mouseMovements: number;
          keystrokes: number;
          scrollEvents: number;
        };
      }>
    ) => {
      return this.request<{
        results: Array<{
          visitorId: string;
          isBot: boolean;
          category: string;
          confidence: number;
        }>;
      }>("/ml/bot-classify/batch", {
        method: "POST",
        body: { visitors },
      });
    },
  };

  // ==========================================================================
  // AI INSIGHTS API (Enterprise)
  // ==========================================================================

  ai = {
    /**
     * Get AI-generated insights for a project
     */
    getInsights: async (
      projectId: number,
      options: {
        dateFrom: string;
        dateTo: string;
        focus?: "traffic" | "conversion" | "engagement" | "all";
      }
    ) => {
      return this.request<{
        insights: Array<{
          id: string;
          type: "trend" | "anomaly" | "opportunity" | "warning";
          title: string;
          description: string;
          impact: "high" | "medium" | "low";
          metric: string;
          change: number;
          recommendation?: string;
        }>;
        summary: string;
        generatedAt: string;
      }>("/ai/insights", {
        method: "POST",
        body: { projectId, ...options },
        timeout: 60000, // AI processing can take longer
      });
    },

    /**
     * Get funnel suggestions based on traffic patterns
     */
    suggestFunnels: async (projectId: number) => {
      return this.request<{
        suggestions: Array<{
          name: string;
          description: string;
          steps: Array<{
            name: string;
            type: "URL" | "EVENT";
            pattern: string;
          }>;
          estimatedConversionRate: number;
          confidence: number;
        }>;
      }>("/ai/suggest-funnels", {
        method: "POST",
        body: { projectId },
      });
    },

    /**
     * Get segment suggestions
     */
    suggestSegments: async (projectId: number) => {
      return this.request<{
        suggestions: Array<{
          name: string;
          description: string;
          conditions: Array<{
            field: string;
            operator: string;
            value: string;
          }>;
          estimatedSize: number;
          characteristics: string[];
        }>;
      }>("/ai/suggest-segments", {
        method: "POST",
        body: { projectId },
      });
    },

    /**
     * Natural language query
     */
    query: async (
      projectId: number,
      question: string,
      options?: { dateFrom?: string; dateTo?: string }
    ) => {
      return this.request<{
        answer: string;
        data?: Record<string, unknown>;
        visualization?: {
          type: "chart" | "table" | "number";
          config: Record<string, unknown>;
        };
        sources: string[];
      }>("/ai/query", {
        method: "POST",
        body: { projectId, question, ...options },
        timeout: 60000,
      });
    },

    /**
     * Predictive analytics
     */
    predict: async (
      projectId: number,
      options: {
        metric: "traffic" | "conversions" | "revenue" | "churn";
        horizon: "7d" | "30d" | "90d";
      }
    ) => {
      return this.request<{
        predictions: Array<{
          date: string;
          value: number;
          lowerBound: number;
          upperBound: number;
        }>;
        trend: "up" | "down" | "stable";
        confidence: number;
        factors: Array<{
          name: string;
          impact: number;
          description: string;
        }>;
      }>("/ai/predict", {
        method: "POST",
        body: { projectId, ...options },
      });
    },
  };

  // ==========================================================================
  // ANALYTICS PROCESSING API (Pro+)
  // ==========================================================================

  analytics = {
    /**
     * Get advanced funnel analysis
     */
    funnelAnalysis: async (
      projectId: number,
      funnelId: number,
      options: { dateFrom: string; dateTo: string }
    ) => {
      return this.request<{
        steps: Array<{
          name: string;
          visitors: number;
          dropOff: number;
          dropOffRate: number;
          avgTimeToNext: number;
        }>;
        overallConversionRate: number;
        bottleneck: { step: number; reason: string };
      }>("/analytics/funnel", {
        method: "POST",
        body: { projectId, funnelId, ...options },
      });
    },

    /**
     * Get retention cohort analysis
     */
    retentionAnalysis: async (
      projectId: number,
      options: {
        dateFrom: string;
        dateTo: string;
        cohortSize: "day" | "week" | "month";
      }
    ) => {
      return this.request<{
        cohorts: Array<{
          date: string;
          size: number;
          retention: number[]; // Percentage retained for each period
        }>;
        averageRetention: number[];
      }>("/analytics/retention", {
        method: "POST",
        body: { projectId, ...options },
      });
    },

    /**
     * Get user journey/flow analysis
     */
    userJourney: async (
      projectId: number,
      options: {
        dateFrom: string;
        dateTo: string;
        entryPage?: string;
        depth?: number;
      }
    ) => {
      return this.request<{
        nodes: Array<{
          id: string;
          page: string;
          visitors: number;
        }>;
        links: Array<{
          source: string;
          target: string;
          value: number;
        }>;
        topPaths: Array<{
          path: string[];
          count: number;
          conversionRate: number;
        }>;
      }>("/analytics/user-journey", {
        method: "POST",
        body: { projectId, ...options },
      });
    },

    /**
     * Get attribution analysis
     */
    attribution: async (
      projectId: number,
      options: {
        dateFrom: string;
        dateTo: string;
        goalId?: number;
        model:
          | "last_click"
          | "first_click"
          | "linear"
          | "time_decay"
          | "position_based";
      }
    ) => {
      return this.request<{
        channels: Array<{
          channel: string;
          conversions: number;
          revenue: number;
          attribution: number;
        }>;
        touchpoints: {
          average: number;
          median: number;
          distribution: Array<{ count: number; percentage: number }>;
        };
      }>("/analytics/attribution", {
        method: "POST",
        body: { projectId, ...options },
      });
    },

    /**
     * A/B test analysis
     */
    abTestAnalysis: async (
      projectId: number,
      testId: number,
      options?: { dateFrom?: string; dateTo?: string }
    ) => {
      return this.request<{
        variants: Array<{
          id: string;
          name: string;
          visitors: number;
          conversions: number;
          conversionRate: number;
          confidence: number;
          improvement: number;
        }>;
        winner: string | null;
        statisticalSignificance: number;
        sampleSizeRequired: number;
        currentSampleSize: number;
        estimatedEndDate: string | null;
      }>("/analytics/ab-test", {
        method: "POST",
        body: { projectId, testId, ...options },
      });
    },
  };

  // ==========================================================================
  // EXPORT API (Pro+)
  // ==========================================================================

  export = {
    /**
     * Generate PDF report
     */
    pdf: async (
      projectId: number,
      options: {
        dateFrom: string;
        dateTo: string;
        sections: string[];
        branding?: {
          logo?: string;
          primaryColor?: string;
          companyName?: string;
        };
      }
    ) => {
      return this.request<{
        downloadUrl: string;
        expiresAt: string;
      }>("/export/pdf", {
        method: "POST",
        body: { projectId, ...options },
        timeout: 120000, // PDF generation can take time
      });
    },

    /**
     * Schedule a recurring report
     */
    scheduleReport: async (
      projectId: number,
      config: {
        name: string;
        frequency: "daily" | "weekly" | "monthly";
        sections: string[];
        recipients: string[];
        format: "pdf" | "csv" | "excel";
        dayOfWeek?: number;
        dayOfMonth?: number;
        hour?: number;
        timezone?: string;
      }
    ) => {
      return this.request<{
        reportId: string;
        nextRun: string;
      }>("/export/schedule", {
        method: "POST",
        body: { projectId, ...config },
      });
    },
  };
}

// Singleton instance
let cloudClient: GloboCloudClient | null = null;

export function getCloudClient(): GloboCloudClient {
  if (!cloudClient) {
    cloudClient = new GloboCloudClient();
  }
  return cloudClient;
}

export default GloboCloudClient;
