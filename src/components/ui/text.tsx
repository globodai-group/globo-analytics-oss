import React from "react";
import { cn } from "@/lib/utils";

type TextVariant = "h1" | "h2" | "h3" | "h4" | "body" | "body-lg" | "small" | "caption" | "label";

type ElementType = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div" | "label";

interface TextProps {
  children: React.ReactNode;
  className?: string;
  /** Typography variant */
  variant?: TextVariant;
  /** Override the default HTML element */
  as?: ElementType;
  /** Truncate text (true for single line, number for line-clamp) */
  truncate?: boolean | number;
  /** Text color */
  color?: "default" | "muted" | "primary" | "destructive" | "success";
  /** Text alignment */
  align?: "left" | "center" | "right";
  /** Font weight override */
  weight?: "normal" | "medium" | "semibold" | "bold";
}

const variantStyles: Record<TextVariant, string> = {
  h1: "text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight",
  h2: "text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight",
  h3: "text-lg sm:text-xl lg:text-2xl font-semibold",
  h4: "text-base sm:text-lg font-medium",
  "body-lg": "text-base sm:text-lg leading-relaxed",
  body: "text-sm sm:text-base leading-relaxed",
  small: "text-xs sm:text-sm",
  caption: "text-[11px] sm:text-xs",
  label: "text-sm font-medium",
};

const defaultTags: Record<TextVariant, ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  "body-lg": "p",
  body: "p",
  small: "span",
  caption: "span",
  label: "label",
};

const colorClasses: Record<NonNullable<TextProps["color"]>, string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  primary: "text-primary",
  destructive: "text-destructive",
  success: "text-green-600 dark:text-green-500",
};

const alignClasses: Record<NonNullable<TextProps["align"]>, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const weightClasses: Record<NonNullable<TextProps["weight"]>, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

/**
 * Responsive text component with consistent typography scale
 *
 * @example
 * ```tsx
 * <Text variant="h1">Page Title</Text>
 * <Text variant="body" color="muted">Description text</Text>
 * <Text variant="caption" truncate>Long text that will be truncated...</Text>
 * <Text variant="body" truncate={2}>Multi-line text with 2 line clamp</Text>
 * ```
 */
export function Text({
  children,
  className = "",
  variant = "body",
  as,
  truncate = false,
  color = "default",
  align,
  weight,
}: TextProps) {
  const Tag = as || defaultTags[variant];

  const getTruncateClass = () => {
    if (truncate === true) return "truncate";
    if (typeof truncate === "number") {
      // Tailwind line-clamp classes
      const clampClasses: Record<number, string> = {
        1: "line-clamp-1",
        2: "line-clamp-2",
        3: "line-clamp-3",
        4: "line-clamp-4",
        5: "line-clamp-5",
        6: "line-clamp-6",
      };
      return clampClasses[truncate] || `line-clamp-[${truncate}]`;
    }
    return "";
  };

  return (
    <Tag
      data-slot="text"
      data-variant={variant}
      className={cn(
        variantStyles[variant],
        colorClasses[color],
        align && alignClasses[align],
        weight && weightClasses[weight],
        getTruncateClass(),
        className
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * Heading component shortcuts
 */
export function Heading({
  level = 1,
  children,
  className = "",
  ...props
}: Omit<TextProps, "variant" | "as"> & { level?: 1 | 2 | 3 | 4 }) {
  const variants: Record<number, TextVariant> = {
    1: "h1",
    2: "h2",
    3: "h3",
    4: "h4",
  };

  return (
    <Text variant={variants[level]} className={className} {...props}>
      {children}
    </Text>
  );
}

/**
 * Paragraph component shortcut
 */
export function Paragraph({
  children,
  className = "",
  size = "default",
  ...props
}: Omit<TextProps, "variant" | "as"> & { size?: "default" | "large" }) {
  return (
    <Text variant={size === "large" ? "body-lg" : "body"} className={className} {...props}>
      {children}
    </Text>
  );
}

/**
 * Caption component for small supporting text
 */
export function Caption({ children, className = "", ...props }: Omit<TextProps, "variant" | "as">) {
  return (
    <Text variant="caption" color="muted" className={className} {...props}>
      {children}
    </Text>
  );
}
