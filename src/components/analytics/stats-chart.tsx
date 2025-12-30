"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useLocale } from "next-intl";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";

export interface ChartDataPoint {
  date: string;
  visitors: number;
  pageviews: number;
}

interface StatsChartProps {
  data: ChartDataPoint[];
  className?: string;
}

export function StatsChart({ data, className }: StatsChartProps) {
  const locale = useLocale();
  const dateLocale = locale === "fr" ? fr : enUS;

  const formatXAxis = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "dd MMM", { locale: dateLocale });
    } catch {
      return dateStr;
    }
  };

  const formatTooltipLabel = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "PPPP", { locale: dateLocale });
    } catch {
      return dateStr;
    }
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat(locale).format(value);
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickLine={false}
            axisLine={false}
            tickFormatter={formatNumber}
            width={50}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md">
                    <p className="text-sm font-medium mb-2">
                      {formatTooltipLabel(String(label ?? ""))}
                    </p>
                    {payload.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">{entry.name}:</span>
                        <span className="font-medium">
                          {formatNumber(Number(entry.value) || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="visitors"
            name={locale === "fr" ? "Visiteurs" : "Visitors"}
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorVisitors)"
          />
          <Area
            type="monotone"
            dataKey="pageviews"
            name={locale === "fr" ? "Pages vues" : "Pageviews"}
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPageviews)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
