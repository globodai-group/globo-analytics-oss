"use client";

import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

interface BreakdownRow {
  label: string;
  value: number;
  icon?: React.ReactNode;
}

interface StatsBreakdownTableProps {
  title: string;
  data: BreakdownRow[];
  emptyMessage?: string;
  maxRows?: number;
  showPercentage?: boolean;
  className?: string;
}

export function StatsBreakdownTable({
  title,
  data,
  emptyMessage,
  maxRows = 5,
  showPercentage = true,
  className,
}: StatsBreakdownTableProps) {
  const locale = useLocale();
  const total = data.reduce((acc, row) => acc + row.value, 0);
  const displayData = data.slice(0, maxRows);

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat(locale).format(value);
  };

  if (data.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          {emptyMessage || (locale === "fr" ? "Aucune donnée" : "No data")}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="space-y-2">
        {displayData.map((row, index) => {
          const percentage = total > 0 ? (row.value / total) * 100 : 0;

          return (
            <div key={index} className="group relative">
              {/* Background bar */}
              <div
                className="absolute inset-0 bg-primary/10 rounded transition-all group-hover:bg-primary/15"
                style={{ width: `${percentage}%` }}
              />

              {/* Content */}
              <div className="relative flex items-center justify-between py-2 px-3">
                <div className="flex items-center gap-2 min-w-0">
                  {row.icon && <span className="flex-shrink-0">{row.icon}</span>}
                  <span className="text-sm truncate">{row.label}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-medium tabular-nums">
                    {formatNumber(row.value)}
                  </span>
                  {showPercentage && (
                    <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {data.length > maxRows && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          {locale === "fr" ? `+${data.length - maxRows} autres` : `+${data.length - maxRows} more`}
        </p>
      )}
    </div>
  );
}
