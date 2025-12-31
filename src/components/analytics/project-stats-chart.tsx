"use client";

import { useEffect, useState } from "react";
import { clientLogger } from "@/lib/client-logger";
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
import { Loader2 } from "lucide-react";

interface ChartDataPoint {
  date: string;
  users: number;
  sessions: number;
  pageviews: number;
}

interface ProjectStatsChartProps {
  projectId: number;
  startDate: Date;
  endDate: Date;
}

export function ProjectStatsChart({
  projectId,
  startDate,
  endDate,
}: ProjectStatsChartProps) {
  const locale = useLocale();
  const dateLocale = locale === "fr" ? fr : enUS;
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChartData() {
      try {
        const params = new URLSearchParams({
          from: startDate.toISOString(),
          to: endDate.toISOString(),
        });
        const res = await fetch(
          `/api/v1/projects/${projectId}/chart?${params}`,
        );
        if (res.ok) {
          const chartData = await res.json();
          setData(chartData);
        }
      } catch (error) {
        clientLogger.error("Failed to fetch chart data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchChartData();
  }, [projectId, startDate, endDate]);

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat(locale).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] text-muted-foreground">
        {locale === "fr" ? "Pas de données disponibles" : "No data available"}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="hsl(var(--primary))"
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor="hsl(var(--primary))"
              stopOpacity={0}
            />
          </linearGradient>
          <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="hsl(var(--chart-2))"
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor="hsl(var(--chart-2))"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
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
                    {String(label ?? "")}
                  </p>
                  {payload.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-muted-foreground">
                        {entry.name}:
                      </span>
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
          dataKey="users"
          name={locale === "fr" ? "Utilisateurs" : "Users"}
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorUsers)"
        />
        <Area
          type="monotone"
          dataKey="sessions"
          name={locale === "fr" ? "Sessions" : "Sessions"}
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorSessions)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
