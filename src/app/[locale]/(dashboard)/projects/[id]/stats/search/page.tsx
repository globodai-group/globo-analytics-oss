import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Search, AlertCircle, TrendingUp, Hash } from "lucide-react";
import { getSiteSearchAnalyticsAction } from "@/lib/actions/site-search";
import { ProjectDateRangePicker } from "@/components/analytics/project-date-range-picker";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

interface SearchTerm {
  term: string;
  count: number;
  percentage: number;
  avgResultsCount: number;
}

interface SearchAnalytics {
  topSearchTerms: SearchTerm[];
  noResultsSearches: SearchTerm[];
  totalSearches: number;
  uniqueSearchTerms: number;
  searchesWithNoResults: number;
  avgResultsPerSearch: number;
}

export default async function SiteSearchPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { from, to } = await searchParams;
  const projectId = parseInt(id);
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("siteSearch");

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

  const result = await getSiteSearchAnalyticsAction(projectId, dateRange, locale);
  const data = result.success ? (result.data as SearchAnalytics) : null;

  const noResultsRate =
    data && data.totalSearches > 0
      ? Math.round((data.searchesWithNoResults / data.totalSearches) * 100)
      : 0;

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
        <div className="flex justify-end">
          <ProjectDateRangePicker projectId={projectId} />
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalSearches")}</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalSearches.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("uniqueTerms")}</CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.uniqueSearchTerms.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("avgResults")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.avgResultsPerSearch}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("noResultsRate")}</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{noResultsRate}%</div>
              <p className="text-xs text-muted-foreground">
                {data.searchesWithNoResults.toLocaleString()} {t("searches")}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Search Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              {t("topSearchTerms")}
            </CardTitle>
            <CardDescription>{t("topSearchTermsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {data && data.topSearchTerms.length > 0 ? (
              <div className="space-y-3">
                {data.topSearchTerms.map((term, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate max-w-[200px]" title={term.term}>
                        &quot;{term.term}&quot;
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {term.avgResultsCount} {t("results")}
                        </Badge>
                        <span className="font-medium">{term.count}</span>
                      </div>
                    </div>
                    <Progress value={term.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">{t("noData")}</div>
            )}
          </CardContent>
        </Card>

        {/* No Results Searches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {t("noResultsSearches")}
            </CardTitle>
            <CardDescription>{t("noResultsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {data && data.noResultsSearches.length > 0 ? (
              <div className="space-y-3">
                {data.noResultsSearches.map((term, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className="font-medium truncate max-w-[200px] text-destructive"
                        title={term.term}
                      >
                        &quot;{term.term}&quot;
                      </span>
                      <span className="font-medium">{term.count}</span>
                    </div>
                    <Progress value={term.percentage} className="h-2 [&>div]:bg-destructive" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t("allSearchesHaveResults")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Integration Guide */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("integration.title")}</CardTitle>
          <CardDescription>{t("integration.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium mb-2">{t("integration.trackSearch")}</p>
            <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
              {`// Track a search
gr('event', 'search', {
  search_term: 'your search query',
  results_count: 10
});`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
