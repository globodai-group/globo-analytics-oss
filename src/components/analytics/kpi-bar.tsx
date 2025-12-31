"use client";

import { useLocale } from "next-intl";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIMetric {
  id: string;
  label: string;
  value: number | string;
  previousValue?: number;
  format?: "number" | "percent" | "time" | "currency";
  inverted?: boolean; // For metrics where lower is better (bounce rate)
}

interface KPIBarProps {
  metrics: KPIMetric[];
  selectedMetric?: string;
  onSelectMetric?: (id: string) => void;
}

export function KPIBar({
  metrics,
  selectedMetric,
  onSelectMetric,
}: KPIBarProps) {
  const locale = useLocale();

  const formatValue = (value: number | string, format?: string) => {
    if (typeof value === "string") return value;

    switch (format) {
      case "percent":
        return `${value.toFixed(1)}%`;
      case "time":
        if (value < 60) return `${value}s`;
        const minutes = Math.floor(value / 60);
        const secs = value % 60;
        if (minutes < 60) return `${minutes}m ${secs}s`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
      case "currency":
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency: "EUR",
          maximumFractionDigits: 0,
        }).format(value);
      default:
        if (value >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}K`;
        }
        return new Intl.NumberFormat(locale).format(value);
    }
  };

  const getChange = (
    current: number | string,
    previous?: number,
    inverted?: boolean,
  ) => {
    if (typeof current !== "number" || !previous || previous === 0) {
      return null;
    }
    const change = ((current - previous) / previous) * 100;
    const isPositive = inverted ? change < 0 : change > 0;
    return { value: change, isPositive };
  };

  return (
    <div className="flex items-stretch border rounded-lg bg-card divide-x overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      {metrics.map((metric) => {
        const change = getChange(
          metric.value,
          metric.previousValue,
          metric.inverted,
        );
        const isSelected = selectedMetric === metric.id;

        return (
          <button
            key={metric.id}
            onClick={() => onSelectMetric?.(metric.id)}
            className={cn(
              "flex-1 min-w-[100px] sm:min-w-[120px] px-2.5 sm:px-4 py-2.5 sm:py-3 text-left transition-colors hover:bg-muted/50",
              isSelected && "bg-primary/5 border-b-2 border-b-primary",
              onSelectMetric && "cursor-pointer",
            )}
          >
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">
              {metric.label}
            </p>
            <div className="flex items-baseline gap-1 sm:gap-2 mt-0.5 sm:mt-1">
              <span className="text-base sm:text-xl font-semibold tabular-nums">
                {formatValue(metric.value, metric.format)}
              </span>
              {change !== null && (
                <span
                  className={cn(
                    "hidden sm:flex items-center text-xs font-medium",
                    change.isPositive
                      ? "text-green-600 dark:text-green-500"
                      : "text-red-600 dark:text-red-500",
                  )}
                >
                  {change.value >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                  )}
                  {change.value > 0 ? "+" : ""}
                  {change.value.toFixed(1)}%
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
