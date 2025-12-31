import { cn } from "@/lib/utils";

type ContainerSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Maximum width of the container */
  size?: ContainerSize;
  /** Whether to apply horizontal padding (default: true) */
  padding?: boolean;
  /** Center the container (default: true) */
  center?: boolean;
  /** HTML element to render as */
  as?: "div" | "section" | "article" | "main" | "aside";
}

const sizeClasses: Record<ContainerSize, string> = {
  sm: "max-w-2xl", // 672px
  md: "max-w-4xl", // 896px
  lg: "max-w-6xl", // 1152px
  xl: "max-w-7xl", // 1280px
  "2xl": "max-w-screen-2xl", // 1536px
  full: "max-w-full",
};

/**
 * Responsive container component with standardized padding and max-width
 *
 * @example
 * ```tsx
 * <Container size="xl" padding>
 *   <h1>Page content</h1>
 * </Container>
 * ```
 */
export function Container({
  children,
  className = "",
  size = "xl",
  padding = true,
  center = true,
  as: Component = "div",
}: ContainerProps) {
  return (
    <Component
      data-slot="container"
      className={cn(
        "w-full",
        sizeClasses[size],
        center && "mx-auto",
        padding && "px-4 sm:px-6 lg:px-8",
        className,
      )}
    >
      {children}
    </Component>
  );
}

/**
 * Full-width section with responsive vertical padding
 */
export function Section({
  children,
  className = "",
  as: Component = "section",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Component
      data-slot="section"
      className={cn("w-full py-8 sm:py-12 lg:py-16", className)}
      {...props}
    >
      {children}
    </Component>
  );
}
