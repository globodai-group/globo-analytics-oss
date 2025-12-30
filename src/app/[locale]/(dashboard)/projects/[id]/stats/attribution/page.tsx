import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, DollarSign, MousePointerClick, Info } from "lucide-react";
import { getAttributionAnalysisAction } from "@/lib/actions/attribution";
import { AttributionModel } from "@prisma/client";
import { ProjectDateRangePicker } from "@/components/analytics/project-date-range-picker";
import { AttributionModelPicker } from "@/components/attribution/attribution-model-picker";
import { AttributionChart } from "@/components/attribution/attribution-chart";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string; model?: string }>;
}

interface ChannelAttribution {
  channel: string;
  conversions: number;
  revenue: number;
  percentage: number;
}

interface AttributionData {
  channels: ChannelAttribution[];
  totalConversions: number;
  totalRevenue: number;
  avgTouchpoints: number;
}

export default async function AttributionPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { from, to, model } = await searchParams;
  const projectId = parseInt(id);
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("attribution");

  if (!session?.user) {
    redirect("/login");
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });

  if (!project) {
    notFound();
  }

  // Default date range: last 30 days
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(now.getDate() - 30);

  const dateRange = {
    from: from ? new Date(from) : defaultFrom,
    to: to ? new Date(to) : now,
  };

  // Default model: LAST_CLICK
  const selectedModel = (model as AttributionModel) || AttributionModel.LAST_CLICK;

  const result = await getAttributionAnalysisAction(projectId, selectedModel, dateRange, locale);
  const data = result.success ? (result.data as AttributionData) : null;

  const modelDescriptions: Record<AttributionModel, string> = {
    LAST_CLICK: t("modelDescriptions.LAST_CLICK"),
    FIRST_CLICK: t("modelDescriptions.FIRST_CLICK"),
    LINEAR: t("modelDescriptions.LINEAR"),
    TIME_DECAY: t("modelDescriptions.TIME_DECAY"),
    POSITION_BASED: t("modelDescriptions.POSITION_BASED"),
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-start sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href={`/projects/${projectId}/stats`} className="shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold truncate">{t("title")}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          <ProjectDateRangePicker projectId={projectId} />
          <AttributionModelPicker
            projectId={projectId}
            currentModel={selectedModel}
            locale={locale}
          />
        </div>
      </div>

      {/* Model Description */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-5 w-5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{modelDescriptions[selectedModel]}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div>
              <p className="font-medium">{t(`models.${selectedModel}`)}</p>
              <p className="text-sm text-muted-foreground">{modelDescriptions[selectedModel]}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {data && (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("conversions")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalConversions.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("revenue")}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.totalRevenue.toLocaleString(locale, {
                  style: "currency",
                  currency: "EUR",
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("avgTouchpoints")}</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.avgTouchpoints}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attribution Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("channel")}</CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Répartition des conversions par canal"
              : "Conversion distribution by channel"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data && data.channels.length > 0 ? (
            <AttributionChart channels={data.channels} locale={locale} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {locale === "fr"
                ? "Aucune donnée d'attribution pour cette période"
                : "No attribution data for this period"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Table */}
      {data && data.channels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{locale === "fr" ? "Détails par canal" : "Channel Details"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">{t("channel")}</th>
                    <th className="text-right py-3 px-4 font-medium">{t("conversions")}</th>
                    <th className="text-right py-3 px-4 font-medium">{t("revenue")}</th>
                    <th className="text-right py-3 px-4 font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.channels.map((channel) => (
                    <tr key={channel.channel} className="border-b">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: getChannelColor(channel.channel),
                            }}
                          />
                          <span className="font-medium capitalize">{channel.channel}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">
                        {channel.conversions.toLocaleString(locale, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="text-right py-3 px-4">
                        {channel.revenue.toLocaleString(locale, {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </td>
                      <td className="text-right py-3 px-4 font-medium">{channel.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getChannelColor(channel: string): string {
  const colors: Record<string, string> = {
    organic: "#22c55e",
    paid: "#3b82f6",
    social: "#ec4899",
    email: "#f59e0b",
    direct: "#6b7280",
    referral: "#8b5cf6",
  };
  return colors[channel.toLowerCase()] || "#6b7280";
}
