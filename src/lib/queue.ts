/**
 * Event Queue - Batch processing for high-volume analytics
 *
 * Uses BullMQ for reliable job processing with:
 * - Automatic retries
 * - Batch processing
 * - Dead letter queue
 * - Graceful shutdown
 */

import { Queue, Worker, Job } from "bullmq";
import { prisma } from "./prisma";
import { StatType } from "@prisma/client";
import { logger, logError } from "./logger";

// Queue connection options
// Heroku Redis uses TLS with self-signed certificates - must set rejectUnauthorized: false
const connection = process.env.REDIS_URL
  ? {
      url: process.env.REDIS_URL,
      tls: process.env.REDIS_URL.startsWith("rediss://")
        ? { rejectUnauthorized: false }
        : undefined,
    }
  : undefined;

// Stat update job data
interface StatUpdateJob {
  projectId: number;
  name: string;
  value: string;
  date: string; // ISO date string
  domain: string | null;
  count: number;
}

// Event tracking job data
interface EventJob {
  projectId: number;
  visitorId: string;
  sessionId: string | null;
  name: string;
  value: string | null;
  properties: Record<string, unknown> | null;
  createdAt: string;
}

// Queue instances
let statQueue: Queue<StatUpdateJob> | null = null;
let eventQueue: Queue<EventJob> | null = null;
let statWorker: Worker<StatUpdateJob> | null = null;
let eventWorker: Worker<EventJob> | null = null;

/**
 * Get or create stat update queue
 */
export function getStatQueue(): Queue<StatUpdateJob> | null {
  if (!connection) return null;

  if (!statQueue) {
    statQueue = new Queue<StatUpdateJob>("stat-updates", {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });
  }

  return statQueue;
}

/**
 * Get or create event queue
 */
export function getEventQueue(): Queue<EventJob> | null {
  if (!connection) return null;

  if (!eventQueue) {
    eventQueue = new Queue<EventJob>("event-tracking", {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });
  }

  return eventQueue;
}

/**
 * Queue a stat update for batch processing
 */
export async function queueStatUpdate(
  projectId: number,
  name: string,
  value: string,
  date: Date,
  domain: string | null,
  count: number = 1
): Promise<boolean> {
  const queue = getStatQueue();

  if (!queue) {
    // Fallback to direct write if queue unavailable
    return false;
  }

  try {
    await queue.add(
      "stat-update",
      {
        projectId,
        name,
        value,
        date: date.toISOString(),
        domain,
        count,
      },
      {
        // Group by project for batch processing
        jobId: `stat:${projectId}:${name}:${value}:${date.toISOString().split("T")[0]}`,
      }
    );
    return true;
  } catch (error) {
    logError(error, { context: "queue", operation: "queueStatUpdate", projectId });
    return false;
  }
}

/**
 * Queue an event for processing
 */
export async function queueEvent(
  projectId: number,
  visitorId: string,
  sessionId: string | null,
  name: string,
  value: string | null,
  properties: Record<string, unknown> | null
): Promise<boolean> {
  const queue = getEventQueue();

  if (!queue) {
    return false;
  }

  try {
    await queue.add("event", {
      projectId,
      visitorId,
      sessionId,
      name,
      value,
      properties,
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    logError(error, { context: "queue", operation: "queueEvent", projectId });
    return false;
  }
}

/**
 * Start stat worker for batch processing
 */
export function startStatWorker(): Worker<StatUpdateJob> | null {
  if (!connection) return null;

  if (statWorker) return statWorker;

  statWorker = new Worker<StatUpdateJob>(
    "stat-updates",
    async (job: Job<StatUpdateJob>) => {
      const { projectId, name, value, date, domain, count } = job.data;

      await prisma.projectStat.upsert({
        where: {
          projectId_name_value_date_domain: {
            projectId,
            name: name as StatType,
            value,
            date: new Date(date),
            domain: domain || "",
          },
        },
        update: {
          count: { increment: count },
        },
        create: {
          projectId,
          name: name as StatType,
          value,
          date: new Date(date),
          domain,
          count,
        },
      });
    },
    {
      connection,
      concurrency: 10,
      // Process jobs in batches for efficiency
      limiter: {
        max: 100,
        duration: 1000,
      },
    }
  );

  statWorker.on("completed", (job) => {
    logger.debug({ type: "queue", event: "job_completed", queue: "stat-updates", jobId: job.id });
  });

  statWorker.on("failed", (job, err) => {
    logger.error({
      type: "queue",
      event: "job_failed",
      queue: "stat-updates",
      jobId: job?.id,
      error: err.message,
    });
  });

  return statWorker;
}

/**
 * Start event worker
 */
export function startEventWorker(): Worker<EventJob> | null {
  if (!connection) return null;

  if (eventWorker) return eventWorker;

  eventWorker = new Worker<EventJob>(
    "event-tracking",
    async (job: Job<EventJob>) => {
      const { projectId, visitorId, sessionId, name, value, properties, createdAt } = job.data;

      await prisma.projectEvent.create({
        data: {
          projectId,
          visitorId,
          sessionId,
          name,
          value,
          properties: properties as never,
          createdAt: new Date(createdAt),
        },
      });
    },
    {
      connection,
      concurrency: 20,
      limiter: {
        max: 200,
        duration: 1000,
      },
    }
  );

  eventWorker.on("failed", (job, err) => {
    logger.error({
      type: "queue",
      event: "job_failed",
      queue: "event-tracking",
      jobId: job?.id,
      error: err.message,
    });
  });

  return eventWorker;
}

/**
 * Get queue stats for monitoring
 */
export async function getQueueStats(): Promise<{
  stats: { waiting: number; active: number; completed: number; failed: number };
  events: { waiting: number; active: number; completed: number; failed: number };
} | null> {
  const stats = getStatQueue();
  const events = getEventQueue();

  if (!stats || !events) return null;

  try {
    const [statsWaiting, statsActive, statsCompleted, statsFailed] = await Promise.all([
      stats.getWaitingCount(),
      stats.getActiveCount(),
      stats.getCompletedCount(),
      stats.getFailedCount(),
    ]);

    const [eventsWaiting, eventsActive, eventsCompleted, eventsFailed] = await Promise.all([
      events.getWaitingCount(),
      events.getActiveCount(),
      events.getCompletedCount(),
      events.getFailedCount(),
    ]);

    return {
      stats: {
        waiting: statsWaiting,
        active: statsActive,
        completed: statsCompleted,
        failed: statsFailed,
      },
      events: {
        waiting: eventsWaiting,
        active: eventsActive,
        completed: eventsCompleted,
        failed: eventsFailed,
      },
    };
  } catch (error) {
    logError(error, { context: "queue", operation: "getQueueStats" });
    return null;
  }
}

/**
 * Graceful shutdown
 */
export async function closeQueues(): Promise<void> {
  const closePromises: Promise<void>[] = [];

  if (statWorker) {
    closePromises.push(statWorker.close());
  }
  if (eventWorker) {
    closePromises.push(eventWorker.close());
  }
  if (statQueue) {
    closePromises.push(statQueue.close());
  }
  if (eventQueue) {
    closePromises.push(eventQueue.close());
  }

  await Promise.all(closePromises);

  statWorker = null;
  eventWorker = null;
  statQueue = null;
  eventQueue = null;

  logger.info({ type: "queue", event: "shutdown", message: "All queues closed gracefully" });
}
