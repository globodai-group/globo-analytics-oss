import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Eye, TrendingUp, Plus, FolderKanban } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const t = await getTranslations();

  if (!session?.user?.id) {
    return null;
  }

  // Date range for this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch real data from database
  const [
    _websitesCount,
    projectsCount,
    totalVisitors,
    totalPageviews,
    totalSessions,
    bouncedSessions,
    recentProjects,
  ] = await Promise.all([
    // Count websites
    prisma.website.count({
      where: { userId: session.user.id },
    }),
    // Count projects
    prisma.project.count({
      where: { userId: session.user.id },
    }),
    // Total visitors this month (from projects)
    prisma.visitor.count({
      where: {
        project: { userId: session.user.id },
        firstSeenAt: { gte: startOfMonth },
      },
    }),
    // Total pageviews this month
    prisma.projectSession.aggregate({
      where: {
        project: { userId: session.user.id },
        startedAt: { gte: startOfMonth },
      },
      _sum: { pageviews: true },
    }),
    // Total sessions for bounce rate calculation
    prisma.projectSession.count({
      where: {
        project: { userId: session.user.id },
        startedAt: { gte: startOfMonth },
      },
    }),
    // Bounced sessions
    prisma.projectSession.count({
      where: {
        project: { userId: session.user.id },
        startedAt: { gte: startOfMonth },
        isBounce: true,
      },
    }),
    // Recent projects
    prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        domains: { take: 1 },
        _count: { select: { visitors: true } },
      },
    }),
  ]);

  const pageviewsCount = totalPageviews._sum.pageviews || 0;
  const bounceRate =
    totalSessions > 0 ? Math.round((bouncedSessions / totalSessions) * 100) : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
          {t("dashboard.welcome", { name: session?.user?.name || "User" })}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t("dashboard.overview")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t("dashboard.stats.projects")}
          value={projectsCount.toString()}
          icon={FolderKanban}
        />
        <StatsCard
          title={t("dashboard.stats.visitors")}
          value={totalVisitors.toLocaleString()}
          description={t("dashboard.stats.thisMonth")}
          icon={Users}
        />
        <StatsCard
          title={t("dashboard.stats.pageviews")}
          value={pageviewsCount.toLocaleString()}
          description={t("dashboard.stats.thisMonth")}
          icon={Eye}
        />
        <StatsCard
          title={t("dashboard.stats.bounceRate")}
          value={`${bounceRate}%`}
          description={t("dashboard.stats.thisMonth")}
          icon={TrendingUp}
        />
      </div>

      {/* Quick Actions & Recent Projects */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/websites/new">
              <Button className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                {t("dashboard.addWebsite")}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>{t("projects.title")}</CardTitle>
            <CardDescription>
              {recentProjects.length > 0
                ? t("dashboard.recentProjects")
                : t("stats.noDataYet")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentProjects.length > 0 ? (
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}/stats`}
                    className="flex items-center justify-between p-3 sm:p-4 min-h-[60px] rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FolderKanban className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.domains[0]?.domain || "No domain"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {project._count.visitors.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("stats.visitors")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  {t("stats.startTracking")}
                </p>
                <Link href="/projects/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("projects.addNew")}
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-xl sm:text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
