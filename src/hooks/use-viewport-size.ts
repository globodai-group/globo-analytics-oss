"use client";

import { useSyncExternalStore } from "react";

interface ViewportSize {
  /** Viewport width in pixels */
  width: number;
  /** Viewport height in pixels */
  height: number;
  /** true if width < 640px */
  isMobile: boolean;
  /** true if width >= 640px and < 1024px */
  isTablet: boolean;
  /** true if width >= 1024px */
  isDesktop: boolean;
  /** Current Tailwind breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' */
  breakpoint: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
}

/**
 * Get Tailwind breakpoint from width
 */
function getBreakpoint(width: number): ViewportSize["breakpoint"] {
  if (width >= 1536) return "2xl";
  if (width >= 1280) return "xl";
  if (width >= 1024) return "lg";
  if (width >= 768) return "md";
  if (width >= 640) return "sm";
  return "xs";
}

/**
 * Get current viewport size
 */
function getViewportSize(): ViewportSize {
  if (typeof window === "undefined") {
    // SSR default - assume desktop
    return {
      width: 1024,
      height: 768,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      breakpoint: "lg",
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  return {
    width,
    height,
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
    breakpoint: getBreakpoint(width),
  };
}

// Server snapshot for SSR
const serverSnapshot: ViewportSize = {
  width: 1024,
  height: 768,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  breakpoint: "lg",
};

/**
 * Hook to get current viewport size and responsive breakpoint information
 * Uses useSyncExternalStore for proper React 18+ compatibility
 *
 * @returns ViewportSize object with width, height, and breakpoint flags
 *
 * @example
 * ```tsx
 * const { isMobile, isDesktop, breakpoint } = useViewportSize();
 *
 * if (isMobile) {
 *   return <MobileLayout />;
 * }
 * ```
 */
export function useViewportSize(): ViewportSize {
  const subscribe = (callback: () => void) => {
    window.addEventListener("resize", callback, { passive: true });
    return () => window.removeEventListener("resize", callback);
  };

  const getSnapshot = () => getViewportSize();
  const getServerSnapshot = () => serverSnapshot;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

interface WindowDimensions {
  width: number;
  height: number;
}

// Server snapshot for dimensions
const dimensionsServerSnapshot: WindowDimensions = { width: 1024, height: 768 };

/**
 * Hook to get viewport dimensions only (width and height)
 * Uses useSyncExternalStore for proper React 18+ compatibility
 * Lighter alternative when breakpoint info is not needed
 */
export function useWindowDimensions(): WindowDimensions {
  const subscribe = (callback: () => void) => {
    window.addEventListener("resize", callback, { passive: true });
    return () => window.removeEventListener("resize", callback);
  };

  const getSnapshot = (): WindowDimensions => {
    if (typeof window === "undefined") {
      return dimensionsServerSnapshot;
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  };

  const getServerSnapshot = () => dimensionsServerSnapshot;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
