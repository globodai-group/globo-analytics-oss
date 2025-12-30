import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectDateRangePicker } from "@/components/analytics/project-date-range-picker";
import { ChannelBreakdownCard } from "@/components/acquisition/channel-breakdown";
import { SourceMediumTable } from "@/components/acquisition/source-medium-table";
import { UtmCampaignTable } from "@/components/acquisition/utm-campaign-table";
import { subDays } from "date-fns";
import { TrendingUp, Users, Target, Link as LinkIcon } from "lucide-react";

interface AcquisitionPageProps {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function AcquisitionPage({ params, searchParams }: AcquisitionPageProps) {
  const { id, locale } = await params;
  const { from, to } = await searchParams;

  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const projectId = parseInt(id, 10);
  if (isNaN(projectId)) {
    redirect(`/${locale}/projects`);
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: session.user.id,
    },
  });

  if (!project) {
    redirect(`/${locale}/projects`);
  }

  const t = await getTranslations();

  // Parse date range from search params or default to last 30 days
  const endDate = to ? new Date(to) : new Date();
  const startDate = from ? new Date(from) : subDays(endDate, 30);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            {locale === "fr" ? "Acquisition" : "Acquisition"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "fr"
              ? `Analyse des sources de trafic pour ${project.name}`
              : `Traffic source analysis for ${project.name}`}
          </p>
        </div>
        <ProjectDateRangePicker projectId={project.id} />
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {locale === "fr" ? "Sources actives" : "Active Sources"}
            </CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              {locale === "fr" ? "Cette période" : "This period"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {locale === "fr" ? "Trafic organique" : "Organic Traffic"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              {locale === "fr" ? "% du total" : "% of total"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {locale === "fr" ? "Campagnes UTM" : "UTM Campaigns"}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              {locale === "fr" ? "Actives" : "Active"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {locale === "fr" ? "Taux de conversion" : "Conversion Rate"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              {locale === "fr" ? "Moyenne" : "Average"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Channel Breakdown */}
      <ChannelBreakdownCard projectId={project.id} dateRange={{ from: startDate, to: endDate }} />

      {/* Source/Medium Table */}
      <SourceMediumTable projectId={project.id} dateRange={{ from: startDate, to: endDate }} />

      {/* UTM Campaigns */}
      <UtmCampaignTable projectId={project.id} dateRange={{ from: startDate, to: endDate }} />
    </div>
  );
}
