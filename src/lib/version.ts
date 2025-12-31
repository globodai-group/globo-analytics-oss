/**
 * Application version utilities
 * Version is injected at build time from package.json via next.config.ts
 */

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev";

/**
 * Get formatted version string for display
 */
export function getVersionString(): string {
  return `v${APP_VERSION}`;
}

/**
 * Log version to console (for debugging)
 * Only logs once per session
 */
let hasLoggedVersion = false;
export function logVersion(): void {
  if (!hasLoggedVersion && typeof window !== "undefined") {
    console.info(
      `%c GloboAnalytics OSS ${getVersionString()} `,
      "background: #6366f1; color: white; padding: 2px 8px; border-radius: 4px;",
    );
    hasLoggedVersion = true;
  }
}
