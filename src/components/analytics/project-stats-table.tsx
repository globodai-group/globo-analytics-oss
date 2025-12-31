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

interface StatsTableRow {
  label: string;
  count: number;
  percentage: number;
}

interface ProjectStatsTableProps {
  data: StatsTableRow[];
  labelHeader?: string;
  countHeader?: string;
  className?: string;
}

export function ProjectStatsTable({
  data,
  labelHeader,
  countHeader,
  className,
}: ProjectStatsTableProps) {
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{labelHeader || t("table.name")}</TableHead>
            <TableHead className="text-right w-24">
              {countHeader || t("table.count")}
            </TableHead>
            <TableHead className="text-right w-24">%</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center text-muted-foreground py-8"
              >
                {t("noData")}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  <span className="truncate max-w-xs block" title={row.label}>
                    {row.label || t("unknown")}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.count)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatPercentage(row.percentage)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
