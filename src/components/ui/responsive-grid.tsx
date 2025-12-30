import { cn } from "@/lib/utils";

type GridCols = 1 | 2 | 3 | 4 | 5 | 6 | 12;
type GridGap = "none" | "xs" | "sm" | "md" | "lg" | "xl";

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  /** Number of columns at each breakpoint */
  cols?: {
    /** Base columns (mobile, <640px) */
    base?: GridCols;
    /** Small screens (>=640px) */
    sm?: GridCols;
    /** Medium screens (>=768px) */
    md?: GridCols;
    /** Large screens (>=1024px) */
    lg?: GridCols;
    /** Extra large screens (>=1280px) */
    xl?: GridCols;
  };
  /** Gap between grid items */
  gap?: GridGap;
  /** HTML element to render as */
  as?: "div" | "ul" | "section";
}

const gapClasses: Record<GridGap, string> = {
  none: "gap-0",
  xs: "gap-2",
  sm: "gap-3 sm:gap-4",
  md: "gap-4 sm:gap-6",
  lg: "gap-6 sm:gap-8",
  xl: "gap-8 sm:gap-10 lg:gap-12",
};

const colClasses: Record<GridCols, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  12: "grid-cols-12",
};

/**
 * Responsive grid component with standardized column and gap configurations
 *
 * @example
 * ```tsx
 * // Cards that go from 1 column on mobile to 3 on large screens
 * <ResponsiveGrid cols={{ base: 1, sm: 2, lg: 3 }} gap="md">
 *   <Card />
 *   <Card />
 *   <Card />
 * </ResponsiveGrid>
 * ```
 */
export function ResponsiveGrid({
  children,
  className = "",
  cols = { base: 1, sm: 2, lg: 3 },
  gap = "md",
  as: Component = "div",
}: ResponsiveGridProps) {
  const getColClasses = () => {
    const classes: string[] = [];

    if (cols.base) classes.push(colClasses[cols.base]);
    if (cols.sm) classes.push(`sm:${colClasses[cols.sm]}`);
    if (cols.md) classes.push(`md:${colClasses[cols.md]}`);
    if (cols.lg) classes.push(`lg:${colClasses[cols.lg]}`);
    if (cols.xl) classes.push(`xl:${colClasses[cols.xl]}`);

    return classes.join(" ");
  };

  return (
    <Component
      data-slot="responsive-grid"
      className={cn("grid", getColClasses(), gapClasses[gap], className)}
    >
      {children}
    </Component>
  );
}

/**
 * Auto-fit grid that automatically determines column count based on min-width
 *
 * @example
 * ```tsx
 * <AutoGrid minItemWidth={250} gap="md">
 *   <Card />
 *   <Card />
 *   <Card />
 * </AutoGrid>
 * ```
 */
export function AutoGrid({
  children,
  className = "",
  minItemWidth = 280,
  gap = "md",
  as: Component = "div",
}: {
  children: React.ReactNode;
  className?: string;
  /** Minimum width of each grid item in pixels */
  minItemWidth?: number;
  gap?: GridGap;
  as?: "div" | "ul" | "section";
}) {
  return (
    <Component
      data-slot="auto-grid"
      className={cn("grid", gapClasses[gap], className)}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(min(${minItemWidth}px, 100%), 1fr))`,
      }}
    >
      {children}
    </Component>
  );
}

/**
 * Two-column layout with responsive stacking
 * Useful for sidebar + main content patterns
 */
export function TwoColumn({
  children,
  className = "",
  sidebarWidth = "w-64 lg:w-80",
  sidebarPosition = "left",
  stackBelow = "lg",
}: {
  children: React.ReactNode;
  className?: string;
  /** Width class for the sidebar */
  sidebarWidth?: string;
  /** Position of the sidebar */
  sidebarPosition?: "left" | "right";
  /** Breakpoint below which columns stack */
  stackBelow?: "sm" | "md" | "lg";
}) {
  const stackClass = {
    sm: "flex-col sm:flex-row",
    md: "flex-col md:flex-row",
    lg: "flex-col lg:flex-row",
  };

  return (
    <div
      data-slot="two-column"
      data-sidebar-width={sidebarWidth}
      data-sidebar-position={sidebarPosition}
      className={cn(
        "flex gap-6 lg:gap-8",
        stackClass[stackBelow],
        sidebarPosition === "right" && "flex-row-reverse",
        className,
      )}
    >
      {children}
    </div>
  );
}
