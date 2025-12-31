"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { clientLogger } from "@/lib/client-logger";

interface Segment {
  id: number;
  name: string;
  description?: string;
  conditions: unknown;
  matchType: "all" | "any";
}

interface SegmentContextValue {
  /** Currently active segment ID */
  activeSegmentId: number | null;
  /** Currently active segment data */
  activeSegment: Segment | null;
  /** Available segments for the current project */
  segments: Segment[];
  /** Whether segments are being loaded */
  loading: boolean;
  /** Set the active segment */
  setActiveSegment: (segment: Segment | null) => void;
  /** Set the active segment by ID */
  setActiveSegmentId: (id: number | null) => void;
  /** Clear the active segment */
  clearSegment: () => void;
  /** Load segments for a project */
  loadSegments: (projectId: number) => Promise<void>;
  /** Add a new segment to the list */
  addSegment: (segment: Segment) => void;
  /** Remove a segment from the list */
  removeSegment: (id: number) => void;
  /** Update a segment in the list */
  updateSegment: (segment: Segment) => void;
}

const SegmentContext = createContext<SegmentContextValue | null>(null);

interface SegmentProviderProps {
  children: ReactNode;
}

export function SegmentProvider({ children }: SegmentProviderProps) {
  const [activeSegment, setActiveSegmentState] = useState<Segment | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);

  const setActiveSegment = useCallback((segment: Segment | null) => {
    setActiveSegmentState(segment);
  }, []);

  const setActiveSegmentId = useCallback(
    (id: number | null) => {
      if (id === null) {
        setActiveSegmentState(null);
      } else {
        const segment = segments.find((s) => s.id === id);
        setActiveSegmentState(segment || null);
      }
    },
    [segments],
  );

  const clearSegment = useCallback(() => {
    setActiveSegmentState(null);
  }, []);

  const loadSegments = useCallback(async (projectId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/segments`);
      if (res.ok) {
        const data = await res.json();
        setSegments(data.segments || []);
      }
    } catch (error) {
      clientLogger.error("Failed to load segments:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addSegment = useCallback((segment: Segment) => {
    setSegments((prev) => [...prev, segment]);
  }, []);

  const removeSegment = useCallback(
    (id: number) => {
      setSegments((prev) => prev.filter((s) => s.id !== id));
      if (activeSegment?.id === id) {
        setActiveSegmentState(null);
      }
    },
    [activeSegment],
  );

  const updateSegment = useCallback(
    (segment: Segment) => {
      setSegments((prev) =>
        prev.map((s) => (s.id === segment.id ? segment : s)),
      );
      if (activeSegment?.id === segment.id) {
        setActiveSegmentState(segment);
      }
    },
    [activeSegment],
  );

  const value: SegmentContextValue = {
    activeSegmentId: activeSegment?.id || null,
    activeSegment,
    segments,
    loading,
    setActiveSegment,
    setActiveSegmentId,
    clearSegment,
    loadSegments,
    addSegment,
    removeSegment,
    updateSegment,
  };

  return (
    <SegmentContext.Provider value={value}>{children}</SegmentContext.Provider>
  );
}

export function useSegment() {
  const context = useContext(SegmentContext);
  if (!context) {
    throw new Error("useSegment must be used within a SegmentProvider");
  }
  return context;
}

/**
 * Segment selector component for use in header/toolbar
 */
export function SegmentSelector({
  projectId: _projectId,
}: {
  projectId: number;
}) {
  // This would be imported from another file but keeping it simple for now
  return null;
}
