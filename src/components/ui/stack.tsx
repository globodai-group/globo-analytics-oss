import { cn } from "@/lib/utils";

type StackDirection = "row" | "col" | "row-reverse" | "col-reverse";
type StackGap = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type StackAlign = "start" | "center" | "end" | "stretch" | "baseline";
type StackJustify = "start" | "center" | "end" | "between" | "around" | "evenly";

interface StackProps {
  children: React.ReactNode;
  className?: string;
  /** Flex direction */
  direction?: StackDirection;
  /** Responsive: column on mobile, row on sm+ screens */
  responsive?: boolean;
  /** Gap between items */
  gap?: StackGap;
  /** Align items (cross axis) */
  align?: StackAlign;
  /** Justify content (main axis) */
  justify?: StackJustify;
  /** Allow items to wrap */
  wrap?: boolean;
  /** HTML element to render as */
  as?: "div" | "nav" | "ul" | "ol" | "section" | "article" | "header" | "footer";
}

const directionClasses: Record<StackDirection, string> = {
  row: "flex-row",
  col: "flex-col",
  "row-reverse": "flex-row-reverse",
  "col-reverse": "flex-col-reverse",
};

const gapClasses: Record<StackGap, string> = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
  "2xl": "gap-12",
};

const alignClasses: Record<StackAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const justifyClasses: Record<StackJustify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

/**
 * Flexible stack component for consistent flex layouts
 *
 * @example
 * ```tsx
 * // Vertical stack with medium gap
 * <Stack direction="col" gap="md">
 *   <Card />
 *   <Card />
 * </Stack>
 *
 * // Responsive: column on mobile, row on desktop
 * <Stack responsive gap="lg" align="center">
 *   <Icon />
 *   <Text>Label</Text>
 * </Stack>
 * ```
 */
export function Stack({
  children,
  className = "",
  direction = "col",
  responsive = false,
  gap = "md",
  align = "stretch",
  justify = "start",
  wrap = false,
  as: Component = "div",
}: StackProps) {
  return (
    <Component
      data-slot="stack"
      className={cn(
        "flex",
        responsive ? "flex-col sm:flex-row" : directionClasses[direction],
        gapClasses[gap],
        alignClasses[align],
        justifyClasses[justify],
        wrap && "flex-wrap",
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * Horizontal stack shorthand (flex-row)
 */
export function HStack({
  children,
  className = "",
  gap = "md",
  align = "center",
  justify = "start",
  wrap = false,
  as = "div",
}: Omit<StackProps, "direction" | "responsive">) {
  return (
    <Stack
      direction="row"
      gap={gap}
      align={align}
      justify={justify}
      wrap={wrap}
      as={as}
      className={className}
    >
      {children}
    </Stack>
  );
}

/**
 * Vertical stack shorthand (flex-col)
 */
export function VStack({
  children,
  className = "",
  gap = "md",
  align = "stretch",
  justify = "start",
  as = "div",
}: Omit<StackProps, "direction" | "responsive" | "wrap">) {
  return (
    <Stack direction="col" gap={gap} align={align} justify={justify} as={as} className={className}>
      {children}
    </Stack>
  );
}

/**
 * Spacer component to push items apart in a flex container
 */
export function Spacer({ className = "" }: { className?: string }) {
  return <div data-slot="spacer" className={cn("flex-1", className)} aria-hidden="true" />;
}
