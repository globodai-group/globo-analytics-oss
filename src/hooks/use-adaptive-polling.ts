"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface UseAdaptivePollingOptions {
  /** Polling interval when tab is visible and user is active (default: 5000ms) */
  activeInterval?: number;
  /** Polling interval when tab is in background (default: 30000ms) */
  backgroundInterval?: number;
  /** Time of inactivity before pausing polling (default: 300000ms = 5min) */
  idleTimeout?: number;
  /** Whether polling is enabled (default: true) */
  enabled?: boolean;
}

interface UseAdaptivePollingReturn {
  /** Whether polling is currently active */
  isPolling: boolean;
  /** Whether user is considered idle */
  isIdle: boolean;
  /** Manually trigger a poll */
  poll: () => void;
  /** Pause polling */
  pause: () => void;
  /** Resume polling */
  resume: () => void;
}

/**
 * Adaptive polling hook that adjusts refresh rate based on:
 * - Tab visibility (visible vs background)
 * - User activity (active vs idle)
 *
 * Behavior:
 * - Tab visible + active: polls at activeInterval (5s default)
 * - Tab in background: polls at backgroundInterval (30s default)
 * - Idle for > idleTimeout: pauses polling
 * - Resumes on any user activity
 */
export function useAdaptivePolling(
  callback: () => void | Promise<void>,
  options: UseAdaptivePollingOptions = {}
): UseAdaptivePollingReturn {
  const {
    activeInterval = 5000,
    backgroundInterval = 30000,
    idleTimeout = 300000, // 5 minutes
    enabled = true,
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);

  // Use state for values that need to be read during render (returned from hook)
  const [isPolling, setIsPolling] = useState(false);
  const [isIdle, setIsIdle] = useState(false);

  // Get current interval based on visibility
  const getCurrentInterval = useCallback(() => {
    if (typeof document === "undefined") return activeInterval;
    return document.visibilityState === "visible" ? activeInterval : backgroundInterval;
  }, [activeInterval, backgroundInterval]);

  // Check if user is idle
  const checkIdle = useCallback(() => {
    const now = Date.now();
    const timeSinceActivity = now - lastActivityRef.current;
    return timeSinceActivity >= idleTimeout;
  }, [idleTimeout]);

  // Execute callback
  const executeCallback = useCallback(async () => {
    if (isPausedRef.current || !enabled) return;

    // Check for idle before polling
    if (checkIdle()) {
      setIsIdle(true);
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    try {
      await callback();
    } catch (error) {
      console.error("[useAdaptivePolling] Callback error:", error);
    }
  }, [callback, enabled, checkIdle]);

  // Start or restart polling with current interval
  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!enabled || isPausedRef.current) return;

    const interval = getCurrentInterval();
    setIsPolling(true);
    setIsIdle(false);

    intervalRef.current = setInterval(() => {
      executeCallback();
    }, interval);
  }, [enabled, getCurrentInterval, executeCallback]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Handle user activity - use a ref to track wasIdle to avoid stale closure
  const wasIdleRef = useRef(false);
  const handleActivity = useCallback(() => {
    wasIdleRef.current = isIdle;
    lastActivityRef.current = Date.now();
    setIsIdle(false);

    // Resume polling if was idle
    if (wasIdleRef.current && enabled && !isPausedRef.current) {
      startPolling();
      // Execute immediately on resume
      executeCallback();
    }
  }, [enabled, startPolling, executeCallback, isIdle]);

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    if (!enabled || isPausedRef.current) return;

    // Restart polling with new interval when visibility changes
    startPolling();

    // If becoming visible, execute immediately
    if (document.visibilityState === "visible") {
      executeCallback();
    }
  }, [enabled, startPolling, executeCallback]);

  // Public methods
  const poll = useCallback(() => {
    executeCallback();
  }, [executeCallback]);

  const pause = useCallback(() => {
    isPausedRef.current = true;
    stopPolling();
  }, [stopPolling]);

  const resume = useCallback(() => {
    isPausedRef.current = false;
    handleActivity();
    startPolling();
  }, [handleActivity, startPolling]);

  // Setup effect
  useEffect(() => {
    // Initialize lastActivityRef on first render (avoids impure Date.now() during render)
    if (!isInitializedRef.current) {
      lastActivityRef.current = Date.now();
      isInitializedRef.current = true;
    }

    if (!enabled) {
      // Clear interval without triggering state update in effect body
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Activity events
    const activityEvents = ["mousemove", "keydown", "scroll", "touchstart", "click"];

    // Throttled activity handler (max once per second)
    let lastActivityCall = 0;
    const throttledActivity = () => {
      const now = Date.now();
      if (now - lastActivityCall >= 1000) {
        lastActivityCall = now;
        handleActivity();
      }
    };

    // Add listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, throttledActivity, { passive: true });
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Start polling - deferred to avoid synchronous setState in effect
    // This is intentional for polling initialization
    queueMicrotask(() => {
      startPolling();
      executeCallback();
    });

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, throttledActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopPolling();
    };
  }, [enabled, handleActivity, handleVisibilityChange, startPolling, stopPolling, executeCallback]);

  return {
    isPolling,
    isIdle,
    poll,
    pause,
    resume,
  };
}
