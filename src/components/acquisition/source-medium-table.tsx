"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Loader2, ExternalLink } from "lucide-react";
import { getSourceMediumAction, type SourceMediumData } from "@/lib/actions/acquisition";

interface SourceMediumTableProps {
  projectId: number;
  dateRange: { from: Date; to: Date };
}

export function SourceMediumTable({ projectId, dateRange }: SourceMediumTableProps) {
  const locale = useLocale();
  const [data, setData] = useState<SourceMediumData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const perPage = 10;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const result = await getSourceMediumAction(projectId, dateRange, { page, perPage });

      if (result.success && result.data) {
        setData(result.data.data);
        setTotalPages(result.data.totalPages);
        setTotal(result.data.total);
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

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat(locale, {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading && data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{locale === "fr" ? "Source / Médium" : "Source / Medium"}</CardTitle>
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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{locale === "fr" ? "Source / Médium" : "Source / Medium"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{locale === "fr" ? "Source / Médium" : "Source / Medium"}</CardTitle>
            <CardDescription>
              {locale === "fr"
                ? "Analyse détaillée des sources de trafic"
                : "Detailed traffic source analysis"}
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono">
            {formatNumber(total)} {locale === "fr" ? "sources" : "sources"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{locale === "fr" ? "Source / Médium" : "Source / Medium"}</TableHead>
                <TableHead className="text-right">
                  {locale === "fr" ? "Utilisateurs" : "Users"}
                </TableHead>
                <TableHead className="text-right">
                  {locale === "fr" ? "Nouveaux" : "New Users"}
                </TableHead>
                <TableHead className="text-right">
                  {locale === "fr" ? "Sessions" : "Sessions"}
                </TableHead>
                <TableHead className="text-right">
                  {locale === "fr" ? "Rebond" : "Bounce Rate"}
                </TableHead>
                <TableHead className="text-right">
                  {locale === "fr" ? "Durée moy." : "Avg. Duration"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={`${row.source}-${row.medium}-${index}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{row.source}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-muted-foreground">{row.medium}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(row.visitors)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(row.newUsers)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(row.sessions)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPercentage(row.bounceRate)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatDuration(row.avgDuration)}
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {locale === "fr" ? "Aucune donnée" : "No data"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              {locale === "fr" ? `Page ${page} sur ${totalPages}` : `Page ${page} of ${totalPages}`}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
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
