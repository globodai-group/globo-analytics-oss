"use client";

import { useTranslations } from "next-intl";

interface ChannelAttribution {
  channel: string;
  conversions: number;
  revenue: number;
  percentage: number;
}

interface AttributionChartProps {
  channels: ChannelAttribution[];
  locale: string;
}

const channelColors: Record<string, string> = {
  organic: "#22c55e",
  paid: "#3b82f6",
  social: "#ec4899",
  email: "#f59e0b",
  direct: "#6b7280",
  referral: "#8b5cf6",
};

function getChannelColor(channel: string): string {
  return channelColors[channel.toLowerCase()] || "#6b7280";
}

export function AttributionChart({ channels, locale }: AttributionChartProps) {
  const t = useTranslations("attribution");

  if (channels.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {locale === "fr" ? "Aucune donnée" : "No data"}
      </div>
    );
  }

  const maxConversions = Math.max(...channels.map((c) => c.conversions), 1);

  return (
    <div className="space-y-6">
      {/* Bar Chart Visualization */}
      <div className="space-y-4">
        {channels.map((channel) => (
          <div key={channel.channel} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getChannelColor(channel.channel) }}
                />
                <span className="font-medium capitalize">{channel.channel}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  {channel.conversions.toLocaleString(locale, { maximumFractionDigits: 2 })}{" "}
                  {t("conversions").toLowerCase()}
                </span>
                <span className="font-medium">{channel.percentage}%</span>
              </div>
            </div>
            <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-lg transition-all"
                style={{
                  width: `${(channel.conversions / maxConversions) * 100}%`,
                  backgroundColor: getChannelColor(channel.channel),
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Pie Chart Summary */}
      <div className="flex items-center justify-center gap-6 pt-6 border-t flex-wrap">
        {channels.slice(0, 6).map((channel) => (
          <div key={channel.channel} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getChannelColor(channel.channel) }}
            />
            <span className="text-sm capitalize">{channel.channel}</span>
            <span className="text-sm font-medium">{channel.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
