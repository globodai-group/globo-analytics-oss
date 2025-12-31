"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DateRangePreset =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "month"
  | "last_month"
  | "custom";

interface ProjectDateRangePickerProps {
  projectId: number;
  className?: string;
}

export function ProjectDateRangePicker({
  projectId: _projectId,
  className,
}: ProjectDateRangePickerProps) {
  const locale = useLocale();
  const t = useTranslations("stats");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [open, setOpen] = React.useState(false);
  const [selectedPreset, setSelectedPreset] =
    React.useState<DateRangePreset>("30d");

  const dateLocale = locale === "fr" ? fr : enUS;

  // Parse dates from URL or use defaults
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    () => {
      if (fromParam && toParam) {
        return { from: new Date(fromParam), to: new Date(toParam) };
      }
      return { from: subDays(new Date(), 29), to: new Date() };
    },
  );

  const presets: {
    value: DateRangePreset;
    label: string;
    getRange: () => DateRange;
  }[] = [
    {
      value: "today",
      label: t("dateRange.today"),
      getRange: () => {
        const today = new Date();
        return { from: today, to: today };
      },
    },
    {
      value: "yesterday",
      label: t("dateRange.yesterday"),
      getRange: () => {
        const yesterday = subDays(new Date(), 1);
        return { from: yesterday, to: yesterday };
      },
    },
    {
      value: "7d",
      label: t("dateRange.last7Days"),
      getRange: () => ({ from: subDays(new Date(), 6), to: new Date() }),
    },
    {
      value: "30d",
      label: t("dateRange.last30Days"),
      getRange: () => ({ from: subDays(new Date(), 29), to: new Date() }),
    },
    {
      value: "month",
      label: t("dateRange.thisMonth"),
      getRange: () => ({ from: startOfMonth(new Date()), to: new Date() }),
    },
    {
      value: "last_month",
      label: t("dateRange.lastMonth"),
      getRange: () => {
        const lastMonth = subMonths(new Date(), 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      },
    },
  ];

  const updateUrl = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      const params = new URLSearchParams(searchParams);
      params.set("from", range.from.toISOString().split("T")[0]);
      params.set("to", range.to.toISOString().split("T")[0]);
      router.push(`?${params.toString()}`);
    }
  };

  const handlePresetClick = (preset: DateRangePreset) => {
    const presetConfig = presets.find((p) => p.value === preset);
    if (presetConfig) {
      const range = presetConfig.getRange();
      setSelectedPreset(preset);
      setDateRange(range);
      updateUrl(range);
      setOpen(false);
    }
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setSelectedPreset("custom");
    setDateRange(range);
    if (range?.from && range?.to) {
      updateUrl(range);
    }
  };

  const formatDateRange = (compact = false) => {
    if (!dateRange?.from) {
      return t("dateRange.selectRange");
    }

    if (dateRange.to) {
      if (dateRange.from.toDateString() === dateRange.to.toDateString()) {
        return format(dateRange.from, compact ? "d MMM" : "PPP", {
          locale: dateLocale,
        });
      }
      const formatStr = compact ? "d MMM" : "PP";
      return `${format(dateRange.from, formatStr, { locale: dateLocale })} - ${format(dateRange.to, compact ? "d MMM yy" : "PP", { locale: dateLocale })}`;
    }

    return format(dateRange.from, compact ? "d MMM" : "PPP", {
      locale: dateLocale,
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal text-xs sm:text-sm px-2 sm:px-3",
            className,
          )}
        >
          <CalendarIcon className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
          <span className="hidden sm:inline truncate">{formatDateRange()}</span>
          <span className="sm:hidden truncate">{formatDateRange(true)}</span>
          <ChevronDown className="ml-1 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 max-w-[calc(100vw-32px)] sm:max-w-none"
        align="end"
        side="bottom"
        sideOffset={4}
        collisionPadding={16}
      >
        {/* Mobile layout: stacked */}
        <div className="flex flex-col sm:flex-row">
          {/* Presets - horizontal scroll on mobile */}
          <div className="flex sm:flex-col gap-1 p-2 border-b sm:border-b-0 sm:border-r overflow-x-auto sm:overflow-visible">
            {presets.map((preset) => (
              <Button
                key={preset.value}
                variant={
                  selectedPreset === preset.value ? "secondary" : "ghost"
                }
                size="sm"
                className="whitespace-nowrap sm:w-full justify-start shrink-0"
                onClick={() => handlePresetClick(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          {/* Calendar - 1 month on mobile, 2 on desktop */}
          <div className="p-2 sm:p-0">
            <Calendar
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleCalendarSelect}
              numberOfMonths={1}
              locale={dateLocale}
              disabled={{ after: new Date() }}
              className="sm:hidden"
            />
            <Calendar
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleCalendarSelect}
              numberOfMonths={2}
              locale={dateLocale}
              disabled={{ after: new Date() }}
              className="hidden sm:block"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
