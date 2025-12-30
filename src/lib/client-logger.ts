/**
 * Client-side logger - Only logs in development mode
 *
 * Prevents error details from leaking to production console
 */

const isDev = process.env.NODE_ENV === "development";

export const clientLogger = {
  error: (message: string, error?: unknown) => {
    if (isDev) {
      console.error(message, error);
    }
  },
  warn: (message: string, data?: unknown) => {
    if (isDev) {
      console.warn(message, data);
    }
  },
  info: (message: string, data?: unknown) => {
    if (isDev) {
      console.info(message, data);
    }
  },
  debug: (message: string, data?: unknown) => {
    if (isDev) {
      console.debug(message, data);
    }
  },
};
