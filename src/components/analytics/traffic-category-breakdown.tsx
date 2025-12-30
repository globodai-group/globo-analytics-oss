"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { getTrafficCategoryStatsAction } from "@/lib/actions/stats";

interface TrafficCategoryBreakdownProps {
  projectId: number;
  dateRange: { from: Date; to: Date };
}

type FilterMode = "all" | "human" | "ai_agents";

const CATEGORY_COLORS: Record<string, string> = {
  human: "#22c55e",
  ai_agent: "#3b82f6",
  search_engine: "#6b7280",
  social_bot: "#8b5cf6",
  seo_tool: "#f59e0b",
  malicious: "#ef4444",
  unknown_bot: "#9ca3af",
};

export function TrafficCategoryBreakdown({ projectId, dateRange }: TrafficCategoryBreakdownProps) {
  const locale = useLocale();
  const [data, setData] = useState<{
    categories: { category: string; count: number; percentage: number }[];
    trend: { date: string; human: number; bots: number; ai_agents: number }[];
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const result = await getTrafficCategoryStatsAction(projectId, dateRange);

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to load data");
      }

      setLoading(false);
    }

    fetchData();
  }, [projectId, dateRange]);

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat(locale, {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat(locale).format(value);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, { en: string; fr: string }> = {
      human: { en: "Human Visitors", fr: "Visiteurs humains" },
      ai_agent: { en: "AI Agents", fr: "Agents IA" },
      search_engine: { en: "Search Engines", fr: "Moteurs de recherche" },
      social_bot: { en: "Social Bots", fr: "Bots sociaux" },
      seo_tool: { en: "SEO Tools", fr: "Outils SEO" },
      malicious: { en: "Malicious Bots", fr: "Bots malveillants" },
      unknown_bot: { en: "Unknown Bots", fr: "Bots inconnus" },
    };

    return labels[category]?.[locale as "en" | "fr"] || category;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{locale === "fr" ? "Analyse détaillée" : "Detailed Breakdown"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            {locale === "fr" ? "Chargement..." : "Loading..."}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{locale === "fr" ? "Analyse détaillée" : "Detailed Breakdown"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-red-500">
            {error || (locale === "fr" ? "Aucune donnée" : "No data")}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter categories based on filter mode
  const filteredCategories = data.categories.filter((cat) => {
    if (filterMode === "human") return cat.category === "human";
    if (filterMode === "ai_agents") return cat.category === "ai_agent";
    return true; // "all"
  });

  // Format trend data for chart
  const trendData = data.trend.map((item) => ({
    date: new Date(item.date).toLocaleDateString(locale, { month: "short", day: "numeric" }),
    [locale === "fr" ? "Humain" : "Human"]: item.human,
    [locale === "fr" ? "Bots" : "Bots"]: item.bots,
    [locale === "fr" ? "Agents IA" : "AI Agents"]: item.ai_agents,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {locale === "fr" ? "Analyse détaillée" : "Detailed Breakdown"}
            </CardTitle>
            <CardDescription>
              {locale === "fr"
                ? "Évolution du trafic par catégorie"
                : "Traffic evolution by category"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterMode === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterMode("all")}
            >
              {locale === "fr" ? "Tous" : "All"}
            </Button>
            <Button
              variant={filterMode === "human" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterMode("human")}
            >
              {locale === "fr" ? "Humain" : "Human"}
            </Button>
            <Button
              variant={filterMode === "ai_agents" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterMode("ai_agents")}
            >
              {locale === "fr" ? "Agents IA" : "AI Agents"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trend Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorHuman" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorBots" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Area
                type="monotone"
                dataKey={locale === "fr" ? "Humain" : "Human"}
                stroke="#22c55e"
                fillOpacity={1}
                fill="url(#colorHuman)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey={locale === "fr" ? "Agents IA" : "AI Agents"}
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorAI)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey={locale === "fr" ? "Bots" : "Bots"}
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorBots)"
                stackId="1"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{locale === "fr" ? "Catégorie" : "Category"}</TableHead>
                <TableHead className="text-right">
                  {locale === "fr" ? "Visites" : "Visits"}
                </TableHead>
                <TableHead className="text-right">
                  {locale === "fr" ? "Pourcentage" : "Percentage"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((cat) => (
                <TableRow key={cat.category}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[cat.category] || "#9ca3af" }}
                      />
                      <span className="font-medium">{getCategoryLabel(cat.category)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(cat.count)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPercentage(cat.percentage)}
                  </TableCell>
                </TableRow>
              ))}
              {filteredCategories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    {locale === "fr" ? "Aucune donnée" : "No data"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
