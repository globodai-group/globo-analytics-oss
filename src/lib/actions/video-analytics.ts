"use server";

import { prisma } from "@/lib/prisma";
import { VideoEventType } from "@prisma/client";
import { hasProjectAccess } from "./with-project-ownership";
import type { ActionResult } from "@/lib/types/actions";

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface VideoStats {
  videoId: string;
  videoTitle: string | null;
  videoDuration: number | null;
  starts: number;
  completes: number;
  completionRate: number;
  avgProgress: number;
  uniqueViewers: number;
}

interface VideoOverview {
  totalVideos: number;
  totalStarts: number;
  totalCompletes: number;
  avgCompletionRate: number;
  totalWatchTime: number;
  topVideo: string | null;
}

interface VideoEngagement {
  progress: number;
  viewers: number;
  dropoffRate: number;
}

/**
 * Get video analytics overview
 */
export async function getVideoOverviewAction(
  projectId: number,
  dateRange: DateRange,
): Promise<ActionResult<VideoOverview>> {
  try {
    const isOwner = await hasProjectAccess(projectId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized" };
    }

    // Run all queries in parallel for better performance
    const [events, uniqueVideos, topVideoStats, progressEvents] =
      await Promise.all([
        // Get all video events in date range
        prisma.videoEvent.groupBy({
          by: ["eventType"],
          where: {
            projectId,
            createdAt: {
              gte: dateRange.startDate,
              lte: dateRange.endDate,
            },
          },
          _count: true,
        }),
        // Get unique videos
        prisma.videoEvent.findMany({
          where: {
            projectId,
            createdAt: {
              gte: dateRange.startDate,
              lte: dateRange.endDate,
            },
          },
          distinct: ["videoId"],
          select: { videoId: true },
        }),
        // Get top video by starts
        prisma.videoEvent.groupBy({
          by: ["videoId", "videoTitle"],
          where: {
            projectId,
            eventType: "START",
            createdAt: {
              gte: dateRange.startDate,
              lte: dateRange.endDate,
            },
          },
          _count: true,
          orderBy: {
            _count: { videoId: "desc" },
          },
          take: 1,
        }),
        // Get progress events for watch time calculation
        prisma.videoEvent.findMany({
          where: {
            projectId,
            eventType: "PROGRESS",
            createdAt: {
              gte: dateRange.startDate,
              lte: dateRange.endDate,
            },
          },
          select: { progress: true, videoDuration: true },
        }),
      ]);

    const starts = events.find((e) => e.eventType === "START")?._count || 0;
    const completes =
      events.find((e) => e.eventType === "COMPLETE")?._count || 0;

    let totalWatchTime = 0;
    progressEvents.forEach((e) => {
      if (e.progress && e.videoDuration) {
        totalWatchTime += (e.progress / 100) * e.videoDuration;
      }
    });

    return {
      success: true,
      data: {
        totalVideos: uniqueVideos.length,
        totalStarts: starts,
        totalCompletes: completes,
        avgCompletionRate:
          starts > 0 ? Math.round((completes / starts) * 100) : 0,
        totalWatchTime: Math.round(totalWatchTime),
        topVideo:
          topVideoStats[0]?.videoTitle || topVideoStats[0]?.videoId || null,
      },
    };
  } catch (error) {
    console.error("Error getting video overview:", error);
    return { success: false, error: "Failed to get video overview" };
  }
}

/**
 * Get stats for all videos - OPTIMIZED VERSION
 * Uses batch queries instead of N+1 pattern
 */
export async function getVideoStatsAction(
  projectId: number,
  dateRange: DateRange,
  limit = 20,
): Promise<ActionResult<VideoStats[]>> {
  try {
    const isOwner = await hasProjectAccess(projectId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized" };
    }

    // OPTIMIZATION: Get all data in batch queries instead of per-video queries

    // 1. Get unique videos
    const videos = await prisma.videoEvent.findMany({
      where: {
        projectId,
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      distinct: ["videoId"],
      select: {
        videoId: true,
        videoTitle: true,
        videoDuration: true,
      },
    });

    if (videos.length === 0) {
      return { success: true, data: [] };
    }

    const videoIds = videos.map((v) => v.videoId);

    // 2. Get all events grouped by videoId and eventType in ONE query
    const allEventStats = await prisma.videoEvent.groupBy({
      by: ["videoId", "eventType"],
      where: {
        projectId,
        videoId: { in: videoIds },
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      _count: true,
    });

    // 3. Get all START events to count unique viewers per video in ONE query
    const allStartEvents = await prisma.videoEvent.findMany({
      where: {
        projectId,
        videoId: { in: videoIds },
        eventType: "START",
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      select: { videoId: true, visitorId: true },
    });

    // 4. Get average progress per video in ONE query
    const progressStats = await prisma.videoEvent.groupBy({
      by: ["videoId"],
      where: {
        projectId,
        videoId: { in: videoIds },
        eventType: "PROGRESS",
        progress: { not: null },
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      _avg: { progress: true },
    });

    // OPTIMIZATION: Process all data in memory

    // Group event stats by videoId
    const eventsByVideo = new Map<string, Map<string, number>>();
    for (const stat of allEventStats) {
      if (!eventsByVideo.has(stat.videoId)) {
        eventsByVideo.set(stat.videoId, new Map());
      }
      eventsByVideo.get(stat.videoId)!.set(stat.eventType, stat._count);
    }

    // Count unique viewers per video
    const viewersByVideo = new Map<string, Set<string>>();
    for (const event of allStartEvents) {
      if (!viewersByVideo.has(event.videoId)) {
        viewersByVideo.set(event.videoId, new Set());
      }
      viewersByVideo.get(event.videoId)!.add(event.visitorId);
    }

    // Map progress stats by videoId
    const progressByVideo = new Map<string, number>();
    for (const stat of progressStats) {
      progressByVideo.set(stat.videoId, stat._avg.progress || 0);
    }

    // Build video stats
    const videoStats: VideoStats[] = videos.slice(0, limit).map((video) => {
      const events = eventsByVideo.get(video.videoId) || new Map();
      const starts = events.get("START") || 0;
      const completes = events.get("COMPLETE") || 0;
      const uniqueViewers = viewersByVideo.get(video.videoId)?.size || 0;
      const avgProgress = progressByVideo.get(video.videoId) || 0;

      return {
        videoId: video.videoId,
        videoTitle: video.videoTitle,
        videoDuration: video.videoDuration,
        starts,
        completes,
        completionRate: starts > 0 ? Math.round((completes / starts) * 100) : 0,
        avgProgress: Math.round(avgProgress),
        uniqueViewers,
      };
    });

    // Sort by starts descending
    videoStats.sort((a, b) => b.starts - a.starts);

    return { success: true, data: videoStats };
  } catch (error) {
    console.error("Error getting video stats:", error);
    return { success: false, error: "Failed to get video stats" };
  }
}

/**
 * Get engagement data for a specific video
 */
export async function getVideoEngagementAction(
  projectId: number,
  videoId: string,
  dateRange: DateRange,
): Promise<ActionResult<VideoEngagement[]>> {
  try {
    const isOwner = await hasProjectAccess(projectId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized" };
    }

    // Run queries in parallel
    const [progressEvents, totalStarts] = await Promise.all([
      prisma.videoEvent.findMany({
        where: {
          projectId,
          videoId,
          eventType: "PROGRESS",
          progress: { not: null },
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
        select: { progress: true, visitorId: true },
      }),
      prisma.videoEvent.count({
        where: {
          projectId,
          videoId,
          eventType: "START",
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
      }),
    ]);

    // Group by progress milestones (0, 25, 50, 75, 100)
    const milestones = [0, 25, 50, 75, 100];
    const engagement: VideoEngagement[] = [];

    milestones.forEach((milestone, index) => {
      const viewersAtMilestone = new Set(
        progressEvents
          .filter((e) => (e.progress || 0) >= milestone)
          .map((e) => e.visitorId),
      );

      const viewers = milestone === 0 ? totalStarts : viewersAtMilestone.size;
      const previousViewers =
        index === 0
          ? totalStarts
          : engagement[index - 1]?.viewers || totalStarts;

      engagement.push({
        progress: milestone,
        viewers,
        dropoffRate:
          previousViewers > 0
            ? Math.round(((previousViewers - viewers) / previousViewers) * 100)
            : 0,
      });
    });

    return { success: true, data: engagement };
  } catch (error) {
    console.error("Error getting video engagement:", error);
    return { success: false, error: "Failed to get video engagement" };
  }
}

/**
 * Get recent video events
 */
export async function getRecentVideoEventsAction(
  projectId: number,
  limit = 50,
): Promise<
  ActionResult<
    {
      id: number;
      videoId: string;
      videoTitle: string | null;
      eventType: VideoEventType;
      progress: number | null;
      createdAt: Date;
    }[]
  >
> {
  try {
    const isOwner = await hasProjectAccess(projectId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized" };
    }

    const events = await prisma.videoEvent.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        videoId: true,
        videoTitle: true,
        eventType: true,
        progress: true,
        createdAt: true,
      },
    });

    return { success: true, data: events };
  } catch (error) {
    console.error("Error getting recent video events:", error);
    return { success: false, error: "Failed to get recent video events" };
  }
}
