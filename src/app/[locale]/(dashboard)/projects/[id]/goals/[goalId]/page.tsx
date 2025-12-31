import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Users, DollarSign } from "lucide-react";
import { GoalForm } from "@/components/goals/goal-form";
import { subDays, format } from "date-fns";
import { fr, enUS } from "date-fns/locale";

interface GoalDetailPageProps {
  params: Promise<{ id: string; goalId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function GoalDetailPage({
  params,
  searchParams,
}: GoalDetailPageProps) {
  const { id, goalId } = await params;
  const { from, to } = await searchParams;
  const session = await auth();
  const t = await getTranslations("goals");
  const locale = await getLocale();
  const dateLocale = locale === "fr" ? fr : enUS;

  if (!session?.user?.id) {
    return null;
  }

  const projectId = parseInt(id);
  const goalIdNum = parseInt(goalId);
  if (isNaN(projectId) || isNaN(goalIdNum)) {
    notFound();
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

  const goal = await prisma.goal.findFirst({
    where: {
      id: goalIdNum,
      projectId,
    },
  });

  if (!goal) {
    notFound();
  }

  // Date range
  const endDate = to ? new Date(to) : new Date();
  const startDate = from ? new Date(from) : subDays(endDate, 30);

  // Fetch stats
  const [conversionsCount, revenueAgg, uniqueVisitorsResult, _dailyData] =
    await Promise.all([
      prisma.goalConversion.count({
        where: {
          goalId: goalIdNum,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.goalConversion.aggregate({
        where: {
          goalId: goalIdNum,
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { revenue: true },
      }),
      prisma.goalConversion.groupBy({
        by: ["visitorId"],
        where: {
          goalId: goalIdNum,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.goalConversion.groupBy({
        by: ["createdAt"],
        where: {
          goalId: goalIdNum,
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: true,
        _sum: { revenue: true },
      }),
    ]);

  const totalRevenue = revenueAgg._sum.revenue || 0;
  const uniqueVisitors = uniqueVisitorsResult.length;

  // Get total visitors for conversion rate
  const totalProjectVisitors = await prisma.visitor.count({
    where: {
      projectId,
      lastSeenAt: { gte: startDate, lte: endDate },
    },
  });

  const conversionRate =
    totalProjectVisitors > 0
      ? (uniqueVisitors / totalProjectVisitors) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}/goals`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{goal.name}</h1>
          <p className="text-muted-foreground">
            {t(`typeOptions.${goal.type}`)}
            {goal.description && ` - ${goal.description}`}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("conversions")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversionsCount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(startDate, "d MMM", { locale: dateLocale })} -{" "}
              {format(endDate, "d MMM yyyy", { locale: dateLocale })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("uniqueVisitors")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {uniqueVisitors.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {locale === "fr"
                ? "Visiteurs ayant converti"
                : "Visitors who converted"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("conversionRate")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversionRate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {uniqueVisitors} / {totalProjectVisitors.toLocaleString()}{" "}
              {locale === "fr" ? "visiteurs" : "visitors"}
            </p>
          </CardContent>
        </Card>

        {goal.revenueTracking && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("revenue")}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat(locale, {
                  style: "currency",
                  currency: "EUR",
                }).format(totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("avgRevenue")}:{" "}
                {new Intl.NumberFormat(locale, {
                  style: "currency",
                  currency: "EUR",
                }).format(
                  conversionsCount > 0 ? totalRevenue / conversionsCount : 0,
                )}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Form */}
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{t("edit")}</CardTitle>
          </CardHeader>
          <CardContent>
            <GoalForm projectId={projectId} locale={locale} goal={goal} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
