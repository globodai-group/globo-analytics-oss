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
import { Progress } from "@/components/ui/progress";
import {
  Search,
  ArrowRight,
  Link,
  Share2,
  DollarSign,
  Mail,
  HelpCircle,
  Loader2,
} from "lucide-react";
import {
  getChannelBreakdownAction,
  type ChannelBreakdown,
} from "@/lib/actions/acquisition";

interface ChannelBreakdownCardProps {
  projectId: number;
  dateRange: { from: Date; to: Date };
}

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  Search: Search,
  ArrowRight: ArrowRight,
  Link: Link,
  Share2: Share2,
  DollarSign: DollarSign,
  Mail: Mail,
  HelpCircle: HelpCircle,
};

const CHANNEL_COLORS: Record<string, string> = {
  organic: "bg-green-500",
  direct: "bg-blue-500",
  referral: "bg-purple-500",
  social: "bg-pink-500",
  paid: "bg-orange-500",
  email: "bg-yellow-500",
  unknown: "bg-gray-500",
};

const CHANNEL_LABELS: Record<string, { en: string; fr: string }> = {
  organic: { en: "Organic Search", fr: "Recherche organique" },
  direct: { en: "Direct", fr: "Direct" },
  referral: { en: "Referral", fr: "Référencement" },
  social: { en: "Social", fr: "Réseaux sociaux" },
  paid: { en: "Paid Search", fr: "Recherche payante" },
  email: { en: "Email", fr: "Email" },
  unknown: { en: "Unknown", fr: "Inconnu" },
};

export function ChannelBreakdownCard({
  projectId,
  dateRange,
}: ChannelBreakdownCardProps) {
  const locale = useLocale();
  const [data, setData] = useState<ChannelBreakdown[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const result = await getChannelBreakdownAction(projectId, dateRange);

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to load data");
      }

      setLoading(false);
    }

    fetchData();
  }, [projectId, dateRange]);

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat(locale).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat(locale, {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "fr" ? "Canaux d'acquisition" : "Acquisition Channels"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
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
          <CardTitle>
            {locale === "fr" ? "Canaux d'acquisition" : "Acquisition Channels"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-red-500">
            {error || (locale === "fr" ? "Aucune donnée" : "No data")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {locale === "fr" ? "Canaux d'acquisition" : "Acquisition Channels"}
        </CardTitle>
        <CardDescription>
          {locale === "fr"
            ? "Répartition du trafic par canal d'acquisition"
            : "Traffic breakdown by acquisition channel"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((channel) => {
            const IconComponent = CHANNEL_ICONS[channel.icon] || HelpCircle;
            const colorClass = CHANNEL_COLORS[channel.channel] || "bg-gray-500";
            const label =
              CHANNEL_LABELS[channel.channel]?.[locale as "en" | "fr"] ||
              channel.channel;

            return (
              <Card key={channel.channel} className="relative overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${colorClass} text-white`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{label}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPercentage(channel.percentage)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {locale === "fr" ? "Visiteurs" : "Visitors"}
                      </span>
                      <span className="font-medium">
                        {formatNumber(channel.visitors)}
                      </span>
                    </div>
                    <Progress value={channel.percentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {data.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            {locale === "fr" ? "Aucune donnée disponible" : "No data available"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
