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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  ArrowUpDown,
  FileText,
  ArrowRightFromLine,
  ArrowLeftFromLine,
  Clock,
  TrendingDown,
} from "lucide-react";
import {
  getPagePerformanceAction,
  type PagePerformanceStats,
} from "@/lib/actions/stats";

interface PagePerformanceTableProps {
  projectId: number;
  dateRange: { from: Date; to: Date };
}

type SortField =
  | "pageviews"
  | "entrances"
  | "exits"
  | "bounceRate"
  | "exitRate"
  | "avgTimeOnPage";
type SortOrder = "asc" | "desc";

export function PagePerformanceTable({
  projectId,
  dateRange,
}: PagePerformanceTableProps) {
  const locale = useLocale();
  const [data, setData] = useState<PagePerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("pageviews");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const perPage = 20;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const result = await getPagePerformanceAction(projectId, dateRange, {
        page,
        perPage,
      });

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to load data");
      }

      setLoading(false);
    }

    fetchData();
  }, [projectId, dateRange, page]);

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat(locale).format(value);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field)
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return <ArrowUpDown className="h-3 w-3 ml-1" />;
  };

  const filteredAndSortedPages =
    data?.pages
      .filter((p) => p.path.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }) || [];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          {locale === "fr" ? "Chargement..." : "Loading..."}
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64 text-red-500">
          {error || (locale === "fr" ? "Aucune donnée" : "No data")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {locale === "fr" ? "Performance des pages" : "Page Performance"}
            </CardTitle>
            <CardDescription>
              {locale === "fr"
                ? "Analyse détaillée de chaque page"
                : "Detailed analysis of each page"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                  locale === "fr" ? "Rechercher une page..." : "Search pages..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <FileText className="h-8 w-8 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">
                {formatNumber(data.total)}
              </div>
              <div className="text-xs text-muted-foreground">
                {locale === "fr" ? "Pages uniques" : "Unique pages"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <ArrowRightFromLine className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold">
                {formatNumber(
                  data.pages.reduce((sum, p) => sum + p.entrances, 0),
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {locale === "fr" ? "Entrées totales" : "Total entrances"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <ArrowLeftFromLine className="h-8 w-8 text-orange-500" />
            <div>
              <div className="text-2xl font-bold">
                {formatNumber(data.pages.reduce((sum, p) => sum + p.exits, 0))}
              </div>
              <div className="text-xs text-muted-foreground">
                {locale === "fr" ? "Sorties totales" : "Total exits"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <TrendingDown className="h-8 w-8 text-red-500" />
            <div>
              <div className="text-2xl font-bold">
                {formatPercentage(
                  data.pages.length > 0
                    ? data.pages.reduce((sum, p) => sum + p.bounceRate, 0) /
                        data.pages.length
                    : 0,
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {locale === "fr" ? "Taux de rebond moyen" : "Avg bounce rate"}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">
                  {locale === "fr" ? "Page" : "Page"}
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("pageviews")}
                >
                  <div className="flex items-center justify-end">
                    {locale === "fr" ? "Vues" : "Pageviews"}
                    {getSortIcon("pageviews")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("entrances")}
                >
                  <div className="flex items-center justify-end">
                    <ArrowRightFromLine className="h-3 w-3 mr-1" />
                    {locale === "fr" ? "Entrées" : "Entrances"}
                    {getSortIcon("entrances")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("exits")}
                >
                  <div className="flex items-center justify-end">
                    <ArrowLeftFromLine className="h-3 w-3 mr-1" />
                    {locale === "fr" ? "Sorties" : "Exits"}
                    {getSortIcon("exits")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("avgTimeOnPage")}
                >
                  <div className="flex items-center justify-end">
                    <Clock className="h-3 w-3 mr-1" />
                    {locale === "fr" ? "Durée moy." : "Avg time"}
                    {getSortIcon("avgTimeOnPage")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("bounceRate")}
                >
                  <div className="flex items-center justify-end">
                    {locale === "fr" ? "Rebond" : "Bounce"}
                    {getSortIcon("bounceRate")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("exitRate")}
                >
                  <div className="flex items-center justify-end">
                    {locale === "fr" ? "Sortie" : "Exit"}
                    {getSortIcon("exitRate")}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedPages.map((pageData, index) => (
                <TableRow key={`${pageData.path}-${index}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span
                        className="font-mono text-sm truncate max-w-[300px]"
                        title={pageData.path}
                      >
                        {pageData.path}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(pageData.pageviews)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-600">
                    {formatNumber(pageData.entrances)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-orange-600">
                    {formatNumber(pageData.exits)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatDuration(pageData.avgTimeOnPage)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        pageData.bounceRate > 70
                          ? "destructive"
                          : pageData.bounceRate > 50
                            ? "secondary"
                            : "default"
                      }
                      className="font-mono"
                    >
                      {formatPercentage(pageData.bounceRate)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPercentage(pageData.exitRate)}
                  </TableCell>
                </TableRow>
              ))}
              {filteredAndSortedPages.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    {search
                      ? locale === "fr"
                        ? "Aucune page trouvée"
                        : "No pages found"
                      : locale === "fr"
                        ? "Aucune donnée"
                        : "No data"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {locale === "fr"
                ? `Page ${page} sur ${data.totalPages}`
                : `Page ${page} of ${data.totalPages}`}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
