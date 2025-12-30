"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { clientLogger } from "@/lib/client-logger";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { StatType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DateRangePicker,
  StatsTable,
  ExportButton,
  type StatsTableRow,
} from "@/components/analytics";
import { getStatsByTypeAction, exportStatsAction } from "@/lib/actions/stats";
import { Loader2 } from "lucide-react";

interface StatsDetailClientProps {
  websiteId: number;
  statType: StatType;
  locale: string;
  filter?: string[];
}

export function StatsDetailClient({
  websiteId,
  statType,
  filter,
}: StatsDetailClientProps) {
  const t = useTranslations("stats");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [data, setData] = useState<StatsTableRow[]>([]);
  const [exportData, setExportData] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    setIsLoading(true);
    try {
      const result = await getStatsByTypeAction(
        websiteId,
        statType,
        { from: dateRange.from, to: dateRange.to },
        currentPage,
        20,
      );

      if (result.success && result.data) {
        let filteredData = result.data.data;

        // Apply filter for search engines or social networks
        if (filter) {
          filteredData = filteredData.filter((item) =>
            filter.some((pattern) =>
              item.value.toLowerCase().includes(pattern),
            ),
          );
        }

        setData(
          filteredData.map((row) => ({
            label: row.value,
            count: row.count,
            percentage: row.percentage,
          })),
        );
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages);
      }

      // Load export data
      const exportResult = await exportStatsAction(websiteId, statType, {
        from: dateRange.from,
        to: dateRange.to,
      });
      if (exportResult.success && exportResult.data) {
        setExportData(exportResult.data);
      }
    } catch (error) {
      clientLogger.error("Error loading stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [websiteId, statType, dateRange, currentPage, filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
        />
        <ExportButton data={exportData} filename={`stats-${statType}`} />
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {total.toLocaleString()}{" "}
              {t("noData") === "Aucune donnée disponible"
                ? "résultats"
                : "results"}
            </span>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isLoading && data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t("noData")}
            </div>
          ) : (
            <StatsTable
              data={data}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
