import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Target,
  TrendingUp,
  DollarSign,
  MousePointerClick,
  Clock,
  FileText,
  ShoppingCart,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GoalType } from "@prisma/client";
import { subDays } from "date-fns";
import { GoalDeleteButton } from "@/components/goals/goal-delete-button";
import { GoalToggleButton } from "@/components/goals/goal-toggle-button";

interface GoalsPageProps {
  params: Promise<{ id: string }>;
}

const goalTypeIcons: Record<GoalType, React.ReactNode> = {
  URL: <FileText className="h-4 w-4" />,
  EVENT: <MousePointerClick className="h-4 w-4" />,
  DURATION: <Clock className="h-4 w-4" />,
  PAGES_PER_SESSION: <FileText className="h-4 w-4" />,
  ECOMMERCE: <ShoppingCart className="h-4 w-4" />,
};

export default async function GoalsPage({ params }: GoalsPageProps) {
  const { id } = await params;
  const session = await auth();
  const t = await getTranslations("goals");
  const locale = await getLocale();

  if (!session?.user?.id) {
    return null;
  }

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
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

  // Fetch goals with conversion counts for last 30 days
  const thirtyDaysAgo = subDays(new Date(), 30);

  const goals = await prisma.goal.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      conversions: {
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
        select: {
          id: true,
          revenue: true,
        },
      },
    },
  });

  // Calculate stats for each goal
  const goalsWithStats = goals.map((goal) => ({
    ...goal,
    conversionsCount: goal.conversions.length,
    totalRevenue: goal.conversions.reduce(
      (sum, c) => sum + (c.revenue || 0),
      0,
    ),
    conversions: undefined, // Remove raw conversions from the object
  }));

  // Total conversions across all goals
  const totalConversions = goalsWithStats.reduce(
    (sum, g) => sum + g.conversionsCount,
    0,
  );
  const totalRevenue = goalsWithStats.reduce(
    (sum, g) => sum + g.totalRevenue,
    0,
  );
  const activeGoals = goalsWithStats.filter((g) => g.isActive).length;

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
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <Link href={`/projects/${projectId}/goals/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("addNew")}
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("title")}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeGoals} {t("active").toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("conversions")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalConversions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {locale === "fr" ? "30 derniers jours" : "Last 30 days"}
            </p>
          </CardContent>
        </Card>

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
              {locale === "fr" ? "30 derniers jours" : "Last 30 days"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("avgRevenue")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat(locale, {
                style: "currency",
                currency: "EUR",
              }).format(
                totalConversions > 0 ? totalRevenue / totalConversions : 0,
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {locale === "fr" ? "Par conversion" : "Per conversion"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("noGoals")}</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {t("noGoalsDescription")}
            </p>
            <Link href={`/projects/${projectId}/goals/new`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("addNew")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {goalsWithStats.map((goal) => (
            <Card key={goal.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      {goalTypeIcons[goal.type]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{goal.name}</h3>
                        <Badge
                          variant={goal.isActive ? "default" : "secondary"}
                        >
                          {goal.isActive ? t("active") : t("inactive")}
                        </Badge>
                      </div>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {goal.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{t(`typeOptions.${goal.type}`)}</span>
                        {goal.revenueTracking && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {t("revenueTracking")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Stats */}
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {goal.conversionsCount.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t("conversions")}
                      </div>
                    </div>

                    {goal.revenueTracking && (
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {new Intl.NumberFormat(locale, {
                            style: "currency",
                            currency: "EUR",
                          }).format(goal.totalRevenue)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t("revenue")}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/projects/${projectId}/goals/${goal.id}`}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            {t("edit")}
                          </Link>
                        </DropdownMenuItem>
                        <GoalToggleButton
                          goalId={goal.id}
                          isActive={goal.isActive}
                        />
                        <GoalDeleteButton
                          goalId={goal.id}
                          goalName={goal.name}
                          locale={locale}
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
