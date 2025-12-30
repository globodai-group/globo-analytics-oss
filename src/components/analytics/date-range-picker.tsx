"use client";

import * as React from "react";
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

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "month"
  | "last_month"
  | "custom";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (
    range: DateRange | undefined,
    preset: DateRangePreset,
  ) => void;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const locale = useLocale();
  const t = useTranslations("stats");
  const [open, setOpen] = React.useState(false);
  const [selectedPreset, setSelectedPreset] =
    React.useState<DateRangePreset>("30d");

  const dateLocale = locale === "fr" ? fr : enUS;

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
      getRange: () => ({
        from: subDays(new Date(), 6),
        to: new Date(),
      }),
    },
    {
      value: "30d",
      label: t("dateRange.last30Days"),
      getRange: () => ({
        from: subDays(new Date(), 29),
        to: new Date(),
      }),
    },
    {
      value: "month",
      label: t("dateRange.thisMonth"),
      getRange: () => ({
        from: startOfMonth(new Date()),
        to: new Date(),
      }),
    },
    {
      value: "last_month",
      label: t("dateRange.lastMonth"),
      getRange: () => {
        const lastMonth = subMonths(new Date(), 1);
        return {
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        };
      },
    },
  ];

  const handlePresetClick = (preset: DateRangePreset) => {
    const presetConfig = presets.find((p) => p.value === preset);
    if (presetConfig) {
      const range = presetConfig.getRange();
      setSelectedPreset(preset);
      onDateRangeChange(range, preset);
      setOpen(false);
    }
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setSelectedPreset("custom");
    onDateRangeChange(range, "custom");
  };

  const formatDateRange = () => {
    if (!dateRange?.from) {
      return t("dateRange.selectRange");
    }

    if (dateRange.to) {
      // Same day
      if (dateRange.from.toDateString() === dateRange.to.toDateString()) {
        return format(dateRange.from, "PPP", { locale: dateLocale });
      }
      return `${format(dateRange.from, "PP", { locale: dateLocale })} - ${format(dateRange.to, "PP", { locale: dateLocale })}`;
    }

    return format(dateRange.from, "PPP", { locale: dateLocale });
  };

  // Initialize with default range on mount
  React.useEffect(() => {
    if (!dateRange) {
      const defaultPreset = presets.find((p) => p.value === "30d");
      if (defaultPreset) {
        onDateRangeChange(defaultPreset.getRange(), "30d");
      }
    }
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-start text-left font-normal", className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets sidebar */}
          <div className="border-r p-2 space-y-1">
            {presets.map((preset) => (
              <Button
                key={preset.value}
                variant={
                  selectedPreset === preset.value ? "secondary" : "ghost"
                }
                size="sm"
                className="w-full justify-start"
                onClick={() => handlePresetClick(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Calendar */}
          <div>
            <Calendar
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleCalendarSelect}
              numberOfMonths={2}
              locale={dateLocale}
              disabled={{ after: new Date() }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
