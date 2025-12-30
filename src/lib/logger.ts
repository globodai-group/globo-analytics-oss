/**
 * Structured Logging with Pino
 *
 * Features:
 * - JSON output for production
 * - Pretty printing for development
 * - Request context tracking
 * - Performance timing
 * - Sensitive data masking
 */

import pino from "pino";

// Sensitive fields to redact
const redactPaths = [
  "password",
  "token",
  "apiToken",
  "secret",
  "authorization",
  "cookie",
  "*.password",
  "*.token",
  "*.secret",
  "req.headers.authorization",
  "req.headers.cookie",
];

/**
 * Create logger instance
 */
function createLogger() {
  const isDev = process.env.NODE_ENV === "development";
  const level = process.env.LOG_LEVEL || (isDev ? "debug" : "info");

  const options: pino.LoggerOptions = {
    level,
    redact: {
      paths: redactPaths,
      censor: "[REDACTED]",
    },
    formatters: {
      level: (label) => ({ level: label }),
      bindings: (bindings) => ({
        pid: bindings.pid,
        hostname: bindings.hostname,
        service: "globo-analytics",
      }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  // Pretty printing for development
  if (isDev) {
    return pino({
      ...options,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      },
    });
  }

  return pino(options);
}

// Singleton logger instance
export const logger = createLogger();

/**
 * Create child logger with context
 */
export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

/**
 * Request logger middleware
 */
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  context?: Record<string, unknown>
) {
  const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

  logger[level]({
    type: "request",
    method,
    path,
    statusCode,
    durationMs,
    ...context,
  });
}

/**
 * Performance timing utility
 */
export function createTimer() {
  const start = performance.now();

  return {
    elapsed: () => Math.round(performance.now() - start),
    log: (message: string, context?: Record<string, unknown>) => {
      logger.info({
        type: "timing",
        message,
        durationMs: Math.round(performance.now() - start),
        ...context,
      });
    },
  };
}

/**
 * Analytics event logger
 */
export function logAnalyticsEvent(
  projectId: number,
  eventType: string,
  visitorId: string,
  context?: Record<string, unknown>
) {
  logger.debug({
    type: "analytics",
    projectId,
    eventType,
    visitorId,
    ...context,
  });
}

/**
 * Error logger with stack trace
 */
export function logError(error: Error | unknown, context?: Record<string, unknown>) {
  if (error instanceof Error) {
    logger.error({
      type: "error",
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context,
    });
  } else {
    logger.error({
      type: "error",
      message: String(error),
      ...context,
    });
  }
}

/**
 * Security event logger
 */
export function logSecurityEvent(
  event:
    | "auth_success"
    | "auth_failure"
    | "rate_limit"
    | "suspicious_activity"
    | "invalid_url"
    | "hmac_missing"
    | "hmac_replay"
    | "hmac_invalid",
  details: {
    ip?: string;
    userId?: string;
    projectId?: number;
    reason?: string;
    field?: string;
    value?: string;
    tid?: string;
  }
) {
  logger.warn({
    type: "security",
    event,
    ...details,
  });
}

/**
 * Audit logger for important actions
 */
export function logAudit(
  action: string,
  userId: string,
  resource: string,
  resourceId: string | number,
  details?: Record<string, unknown>
) {
  logger.info({
    type: "audit",
    action,
    userId,
    resource,
    resourceId,
    ...details,
  });
}

export default logger;
