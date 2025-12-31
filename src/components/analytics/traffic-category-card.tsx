"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Users,
  Bot,
  Search,
  Share2,
  Wrench,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { getTrafficCategoryStatsAction } from "@/lib/actions/stats";

interface TrafficCategoryCardProps {
  projectId: number;
  dateRange: { from: Date; to: Date };
}

// Category colors matching the plan
const CATEGORY_COLORS: Record<string, string> = {
  human: "#22c55e", // green
  ai_agent: "#3b82f6", // blue (highlighted)
  search_engine: "#6b7280", // gray
  social_bot: "#8b5cf6", // purple
  seo_tool: "#f59e0b", // orange
  malicious: "#ef4444", // red
  unknown_bot: "#9ca3af", // muted
};

// Category icons - reserved for future use
const _CATEGORY_ICONS: Record<string, React.ElementType> = {
  human: Users,
  ai_agent: Bot,
  search_engine: Search,
  social_bot: Share2,
  seo_tool: Wrench,
  malicious: Shield,
  unknown_bot: AlertTriangle,
};

export function TrafficCategoryCard({
  projectId,
  dateRange,
}: TrafficCategoryCardProps) {
  const locale = useLocale();
  const [data, setData] = useState<{
    categories: { category: string; count: number; percentage: number }[];
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const result = await getTrafficCategoryStatsAction(projectId, dateRange);

      if (result.success && result.data) {
        setData({
          categories: result.data.categories,
          total: result.data.total,
        });
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
          <CardTitle className="text-lg">
            {locale === "fr" ? "Catégories de trafic" : "Traffic Categories"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
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
          <CardTitle className="text-lg">
            {locale === "fr" ? "Catégories de trafic" : "Traffic Categories"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-red-500">
            {error || (locale === "fr" ? "Aucune donnée" : "No data")}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for PieChart
  const chartData = data.categories.map((cat) => ({
    name: getCategoryLabel(cat.category),
    value: cat.count,
    percentage: cat.percentage,
    category: cat.category,
  }));

  // Custom label renderer for pie chart
  const renderCustomLabel = (props: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
  }) => {
    const {
      cx = 0,
      cy = 0,
      midAngle = 0,
      innerRadius = 0,
      outerRadius = 0,
      percent = 0,
    } = props;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

    if (percent < 0.05) return null; // Don't show labels for <5%

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const hasAiAgents = data.categories.some(
    (cat) => cat.category === "ai_agent",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="h-5 w-5" />
          {locale === "fr" ? "Catégories de trafic" : "Traffic Categories"}
        </CardTitle>
        <CardDescription>
          {locale === "fr"
            ? "Répartition du trafic humain vs automatisé"
            : "Breakdown of human vs automated traffic"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        <div className="h-48 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CATEGORY_COLORS[entry.category] || "#9ca3af"}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatNumber(Number(value ?? 0))}
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "none",
                  borderRadius: "6px",
                  color: "white",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Legend - outside chart for better mobile layout */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center">
          {chartData.map((entry) => (
            <div key={entry.category} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: CATEGORY_COLORS[entry.category] || "#9ca3af",
                }}
              />
              <span className="text-xs text-muted-foreground">
                {entry.name} ({formatPercentage(entry.percentage)})
              </span>
            </div>
          ))}
        </div>

        {/* AI Agents Note */}
        {hasAiAgents && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start sm:items-center gap-2">
              <Bot className="h-4 w-4 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                {locale === "fr"
                  ? "Les agents IA (ChatGPT, Claude, Perplexity) sont comptés comme du trafic légitime."
                  : "AI agents (ChatGPT, Claude, Perplexity) are counted as legitimate traffic."}
              </span>
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">
                {locale === "fr" ? "Total de visites" : "Total Visits"}
              </p>
              <p className="text-lg font-semibold">
                {formatNumber(data.total)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">
                {locale === "fr" ? "Catégories" : "Categories"}
              </p>
              <p className="text-lg font-semibold">{data.categories.length}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
