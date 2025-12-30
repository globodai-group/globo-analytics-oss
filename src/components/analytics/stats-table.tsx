"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface StatsTableRow {
  label: string;
  count: number;
  percentage: number;
}

interface StatsTableProps {
  data: StatsTableRow[];
  title?: string;
  labelHeader?: string;
  countHeader?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function StatsTable({
  data,
  title,
  labelHeader,
  countHeader,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className,
}: StatsTableProps) {
  const locale = useLocale();
  const t = useTranslations("stats");

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

  return (
    <div className={className}>
      {title && <h3 className="font-semibold mb-4">{title}</h3>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{labelHeader || t("table.name")}</TableHead>
            <TableHead className="text-right w-24">{countHeader || t("table.count")}</TableHead>
            <TableHead className="text-right w-24">%</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                {t("noData")}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-xs" title={row.label}>
                      {row.label || t("unknown")}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(row.count)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatPercentage(row.percentage)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            {t("pagination.page", { current: currentPage, total: totalPages })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
