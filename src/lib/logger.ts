/**
 * Simple logger for OSS version
 * Uses pino for structured logging
 */

import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});

export function logError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  logger.error({
    type: "error",
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  });
}

export default logger;
