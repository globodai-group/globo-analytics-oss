import { redirect, notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AttributionModel } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Share2,
  TrendingUp,
  DollarSign,
  MousePointerClick,
  Layers,
} from "lucide-react";
import {
  getAttributionAnalysisAction,
  getAttributionComparisonAction,
} from "@/lib/actions/attribution";

interface AttributionPageProps {
  params: Promise<{ id: string }>;
}

const modelLabels: Record<AttributionModel, { en: string; fr: string }> = {
  LAST_CLICK: { en: "Last Click", fr: "Dernier Clic" },
  FIRST_CLICK: { en: "First Click", fr: "Premier Clic" },
  LINEAR: { en: "Linear", fr: "Linéaire" },
  TIME_DECAY: { en: "Time Decay", fr: "Décroissance temporelle" },
  POSITION_BASED: { en: "Position Based", fr: "Basé sur la position" },
};

const modelDescriptions: Record<AttributionModel, { en: string; fr: string }> =
  {
    LAST_CLICK: {
      en: "100% credit to the last touchpoint before conversion",
      fr: "100% du crédit au dernier point de contact avant la conversion",
    },
    FIRST_CLICK: {
      en: "100% credit to the first touchpoint that introduced the visitor",
      fr: "100% du crédit au premier point de contact qui a introduit le visiteur",
    },
    LINEAR: {
      en: "Equal credit distributed across all touchpoints",
      fr: "Crédit égal distribué sur tous les points de contact",
    },
    TIME_DECAY: {
      en: "More credit to recent touchpoints, less to older ones",
      fr: "Plus de crédit aux points de contact récents, moins aux anciens",
    },
    POSITION_BASED: {
      en: "40% first, 40% last, 20% distributed to middle touchpoints",
      fr: "40% premier, 40% dernier, 20% distribué aux points intermédiaires",
    },
  };

const channelColors: Record<string, string> = {
  organic: "bg-green-500",
  paid: "bg-blue-500",
  social: "bg-purple-500",
  email: "bg-yellow-500",
  referral: "bg-orange-500",
  direct: "bg-gray-500",
  affiliate: "bg-pink-500",
  display: "bg-cyan-500",
};

export default async function AttributionPage({
  params,
}: AttributionPageProps) {
  const { id } = await params;
  const projectId = parseInt(id);
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: session.user.id,
    },
  });

  if (!project) {
    notFound();
  }

  // Default to last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const dateRange = { from: startDate, to: endDate };

  const [lastClickResult, comparisonResult] = await Promise.all([
    getAttributionAnalysisAction(
      projectId,
      AttributionModel.LAST_CLICK,
      dateRange,
      locale,
    ),
    getAttributionComparisonAction(projectId, dateRange, locale),
  ]);

  const lastClickData = lastClickResult.data;
  const comparisonData = comparisonResult.data;

  const t = {
    title:
      locale === "fr" ? "Attribution Multi-Touch" : "Multi-Touch Attribution",
    subtitle:
      locale === "fr"
        ? "Analysez la contribution de chaque canal à vos conversions"
        : "Analyze each channel's contribution to your conversions",
    back: locale === "fr" ? "Retour aux stats" : "Back to Stats",
    overview: locale === "fr" ? "Vue d'ensemble" : "Overview",
    comparison:
      locale === "fr" ? "Comparaison des modèles" : "Model Comparison",
    totalConversions:
      locale === "fr" ? "Conversions totales" : "Total Conversions",
    totalRevenue: locale === "fr" ? "Revenu total" : "Total Revenue",
    avgTouchpoints:
      locale === "fr" ? "Points de contact moyens" : "Avg. Touchpoints",
    topChannel: locale === "fr" ? "Canal principal" : "Top Channel",
    channel: locale === "fr" ? "Canal" : "Channel",
    conversions: locale === "fr" ? "Conversions" : "Conversions",
    revenue: locale === "fr" ? "Revenu" : "Revenue",
    share: locale === "fr" ? "Part" : "Share",
    noData:
      locale === "fr"
        ? "Aucune donnée d'attribution disponible"
        : "No attribution data available",
    setupInstructions:
      locale === "fr"
        ? "Pour utiliser l'attribution, configurez d'abord des objectifs et assurez-vous que le tracking UTM est actif."
        : "To use attribution, first set up goals and ensure UTM tracking is active.",
  };

  const hasData = lastClickData && lastClickData.totalConversions > 0;
  const topChannel = lastClickData?.channels[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}/stats`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>
        <Badge variant="outline">{project.name}</Badge>
      </div>

      {hasData ? (
        <>
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {t.totalConversions}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {lastClickData.totalConversions}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {t.totalRevenue}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  ${lastClickData.totalRevenue.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <MousePointerClick className="h-3 w-3" />
                  {t.avgTouchpoints}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {lastClickData.avgTouchpoints}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {t.topChannel}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded ${channelColors[topChannel?.channel || "direct"]}`}
                  />
                  <p className="text-lg font-bold capitalize">
                    {topChannel?.channel || "-"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attribution Tabs */}
          <Tabs defaultValue="last_click" className="space-y-4">
            <TabsList className="grid grid-cols-5 w-full max-w-3xl">
              {Object.values(AttributionModel).map((model) => (
                <TabsTrigger key={model} value={model.toLowerCase()}>
                  {modelLabels[model][locale === "fr" ? "fr" : "en"]}
                </TabsTrigger>
              ))}
            </TabsList>

            {comparisonData?.models.map((modelData) => (
              <TabsContent
                key={modelData.model}
                value={modelData.model.toLowerCase()}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="h-5 w-5" />
                      {
                        modelLabels[modelData.model][
                          locale === "fr" ? "fr" : "en"
                        ]
                      }
                    </CardTitle>
                    <CardDescription>
                      {
                        modelDescriptions[modelData.model][
                          locale === "fr" ? "fr" : "en"
                        ]
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {modelData.channels.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t.channel}</TableHead>
                            <TableHead className="text-right">
                              {t.conversions}
                            </TableHead>
                            <TableHead className="text-right">
                              {t.revenue}
                            </TableHead>
                            <TableHead className="text-right">
                              {t.share}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {modelData.channels.map((channel) => (
                            <TableRow key={channel.channel}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-3 h-3 rounded ${channelColors[channel.channel] || "bg-gray-400"}`}
                                  />
                                  <span className="font-medium capitalize">
                                    {channel.channel}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {channel.conversions.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">
                                ${channel.revenue.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Progress
                                    value={channel.percentage}
                                    className="w-16 h-2"
                                  />
                                  <span className="text-sm text-muted-foreground w-12">
                                    {channel.percentage}%
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        {t.noData}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Channel Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === "fr"
                  ? "Comparaison des canaux"
                  : "Channel Comparison"}
              </CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Comment le crédit varie selon le modèle d'attribution"
                  : "How credit varies across attribution models"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lastClickData.channels.slice(0, 5).map((channel) => (
                  <div key={channel.channel} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded ${channelColors[channel.channel] || "bg-gray-400"}`}
                        />
                        <span className="font-medium capitalize">
                          {channel.channel}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {comparisonData?.models.map((modelData) => {
                        const channelData = modelData.channels.find(
                          (c) => c.channel === channel.channel,
                        );
                        return (
                          <div
                            key={modelData.model}
                            className="text-center p-2 bg-muted rounded"
                          >
                            <p className="text-xs text-muted-foreground">
                              {
                                modelLabels[modelData.model][
                                  locale === "fr" ? "fr" : "en"
                                ].split(" ")[0]
                              }
                            </p>
                            <p className="font-medium">
                              {channelData?.percentage || 0}%
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Share2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t.noData}</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {t.setupInstructions}
            </p>
            <div className="flex gap-3">
              <Link href={`/projects/${projectId}/goals`}>
                <Button>
                  {locale === "fr"
                    ? "Configurer les objectifs"
                    : "Set up Goals"}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
