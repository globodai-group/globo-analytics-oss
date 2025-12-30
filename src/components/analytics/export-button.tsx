"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename?: string;
  className?: string;
}

export function ExportButton({ data, filename = "export", className }: ExportButtonProps) {
  const t = useTranslations("stats");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    if (data.length === 0) return;

    setIsExporting(true);

    try {
      // Get all keys from the first row
      const headers = Object.keys(data[0]);

      // Create CSV content
      const csvContent = [
        // Header row
        headers.join(","),
        // Data rows
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = row[header];
              // Handle values that contain commas, quotes, or newlines
              if (
                typeof value === "string" &&
                (value.includes(",") || value.includes('"') || value.includes("\n"))
              ) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value ?? "";
            })
            .join(",")
        ),
      ].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting || data.length === 0}
      className={className}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {t("export")}
    </Button>
  );
}
