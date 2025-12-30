"use client";

import { useSyncExternalStore } from "react";

/**
 * Hook to detect if a media query matches
 * Uses useSyncExternalStore for proper React 18+ compatibility
 *
 * @param query - CSS media query string (e.g., "(max-width: 639px)")
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = (callback: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", callback);
    return () => media.removeEventListener("change", callback);
  };

  const getSnapshot = () => {
    return window.matchMedia(query).matches;
  };

  const getServerSnapshot = () => {
    // Default to false during SSR
    return false;
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Tailwind breakpoints:
// sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px

/**
 * Hook to detect if viewport is mobile (<640px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 639px)");
}

/**
 * Hook to detect if viewport is tablet (640px - 1023px)
 */
export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 640px) and (max-width: 1023px)");
}

/**
 * Hook to detect if viewport is desktop (>=1024px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

/**
 * Hook to detect if viewport is small mobile (<=375px)
 * Useful for iPhone SE and similar small devices
 */
export function useIsSmallMobile(): boolean {
  return useMediaQuery("(max-width: 375px)");
}

/**
 * Hook to detect if device prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/**
 * Hook to detect if device is in portrait orientation
 */
export function useIsPortrait(): boolean {
  return useMediaQuery("(orientation: portrait)");
}

/**
 * Hook to detect if device is in landscape orientation
 */
export function useIsLandscape(): boolean {
  return useMediaQuery("(orientation: landscape)");
}
