"use client";

import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  previousValue?: number;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  previousValue,
  icon: Icon,
  description,
  className,
}: StatsCardProps) {
  const locale = useLocale();

  const formatNumber = (val: number | string) => {
    if (typeof val === "string") return val;
    return new Intl.NumberFormat(locale).format(val);
  };

  // Calculate percentage change
  let changePercent: number | null = null;
  let trend: "up" | "down" | "neutral" = "neutral";

  if (typeof value === "number" && typeof previousValue === "number" && previousValue > 0) {
    changePercent = ((value - previousValue) / previousValue) * 100;
    trend = changePercent > 0 ? "up" : changePercent < 0 ? "down" : "neutral";
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{formatNumber(value)}</div>
          {changePercent !== null && (
            <div
              className={cn(
                "flex items-center text-xs font-medium",
                trend === "up" && "text-green-600 dark:text-green-500",
                trend === "down" && "text-red-600 dark:text-red-500",
                trend === "neutral" && "text-muted-foreground"
              )}
            >
              {trend === "up" && <TrendingUp className="h-3 w-3 mr-0.5" />}
              {trend === "down" && <TrendingDown className="h-3 w-3 mr-0.5" />}
              {trend === "neutral" && <Minus className="h-3 w-3 mr-0.5" />}
              {changePercent > 0 ? "+" : ""}
              {changePercent.toFixed(1)}%
            </div>
          )}
        </div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}
