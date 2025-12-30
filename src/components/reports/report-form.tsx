"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createReportAction, updateReportAction } from "@/lib/actions/scheduled-reports";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { ReportFrequency, ReportDateRange, ReportFormat } from "@prisma/client";

const reportSchema = z.object({
  name: z.string().min(1, "Name is required"),
  metrics: z.array(z.string()).min(1, "At least one metric is required"),
  segmentId: z.number().optional(),
  dateRange: z.nativeEnum(ReportDateRange),
  frequency: z.nativeEnum(ReportFrequency),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  hour: z.number().min(0).max(23),
  timezone: z.string(),
  recipients: z.array(z.string().email()).min(1, "At least one recipient is required"),
  format: z.nativeEnum(ReportFormat),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportFormProps {
  projectId: number;
  segments: { id: number; name: string }[];
  locale: string;
  initialData?: {
    id: number;
    name: string;
    metrics: string[];
    segmentId?: number | null;
    dateRange: ReportDateRange;
    frequency: ReportFrequency;
    dayOfWeek?: number | null;
    dayOfMonth?: number | null;
    hour: number;
    timezone: string;
    recipients: string[];
    format: ReportFormat;
  };
}

const AVAILABLE_METRICS = [
  { value: "visitors", label: { en: "Visitors", fr: "Visiteurs" } },
  { value: "pageviews", label: { en: "Pageviews", fr: "Pages vues" } },
  { value: "sessions", label: { en: "Sessions", fr: "Sessions" } },
  { value: "bounceRate", label: { en: "Bounce Rate", fr: "Taux de rebond" } },
  { value: "avgSessionDuration", label: { en: "Avg. Session Duration", fr: "Durée moy. session" } },
  { value: "conversions", label: { en: "Conversions", fr: "Conversions" } },
  { value: "revenue", label: { en: "Revenue", fr: "Revenus" } },
  { value: "topPages", label: { en: "Top Pages", fr: "Pages populaires" } },
  { value: "topSources", label: { en: "Top Sources", fr: "Sources principales" } },
  { value: "topCountries", label: { en: "Top Countries", fr: "Pays principaux" } },
];

const DAYS_OF_WEEK = [
  { value: 0, label: { en: "Sunday", fr: "Dimanche" } },
  { value: 1, label: { en: "Monday", fr: "Lundi" } },
  { value: 2, label: { en: "Tuesday", fr: "Mardi" } },
  { value: 3, label: { en: "Wednesday", fr: "Mercredi" } },
  { value: 4, label: { en: "Thursday", fr: "Jeudi" } },
  { value: 5, label: { en: "Friday", fr: "Vendredi" } },
  { value: 6, label: { en: "Saturday", fr: "Samedi" } },
];

const TIMEZONES = [
  "Europe/Paris",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
];

export function ReportForm({ projectId, segments, locale, initialData }: ReportFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      name: initialData?.name || "",
      metrics: initialData?.metrics || [],
      segmentId: initialData?.segmentId ?? undefined,
      dateRange: initialData?.dateRange || "LAST_7_DAYS",
      frequency: initialData?.frequency || "WEEKLY",
      dayOfWeek: initialData?.dayOfWeek ?? 1,
      dayOfMonth: initialData?.dayOfMonth ?? 1,
      hour: initialData?.hour ?? 9,
      timezone: initialData?.timezone || "Europe/Paris",
      recipients: initialData?.recipients || [],
      format: initialData?.format || "PDF",
    },
  });

  const frequency = watch("frequency");
  const metrics = watch("metrics");
  const recipients = watch("recipients");

  const onSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true);

    try {
      const result = initialData
        ? await updateReportAction(initialData.id, data, locale)
        : await createReportAction(projectId, data, locale);

      if (result.success) {
        toast.success(result.message);
        router.push(`/projects/${projectId}/reports`);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(locale === "fr" ? "Une erreur est survenue" : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMetric = (metric: string) => {
    const current = metrics || [];
    if (current.includes(metric)) {
      setValue(
        "metrics",
        current.filter((m) => m !== metric)
      );
    } else {
      setValue("metrics", [...current, metric]);
    }
  };

  const addRecipient = () => {
    if (newRecipient && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newRecipient)) {
      const current = recipients || [];
      if (!current.includes(newRecipient)) {
        setValue("recipients", [...current, newRecipient]);
      }
      setNewRecipient("");
    }
  };

  const removeRecipient = (email: string) => {
    setValue(
      "recipients",
      (recipients || []).filter((r) => r !== email)
    );
  };

  const t = {
    name: locale === "fr" ? "Nom du rapport" : "Report Name",
    namePlaceholder: locale === "fr" ? "Rapport hebdomadaire" : "Weekly Report",
    metrics: locale === "fr" ? "Métriques à inclure" : "Metrics to Include",
    segment: locale === "fr" ? "Segment (optionnel)" : "Segment (optional)",
    allData: locale === "fr" ? "Toutes les données" : "All data",
    dateRange: locale === "fr" ? "Période" : "Date Range",
    frequency: locale === "fr" ? "Fréquence" : "Frequency",
    dayOfWeek: locale === "fr" ? "Jour de la semaine" : "Day of Week",
    dayOfMonth: locale === "fr" ? "Jour du mois" : "Day of Month",
    hour: locale === "fr" ? "Heure d'envoi" : "Send Time",
    timezone: locale === "fr" ? "Fuseau horaire" : "Timezone",
    recipients: locale === "fr" ? "Destinataires" : "Recipients",
    addRecipient: locale === "fr" ? "Ajouter" : "Add",
    format: locale === "fr" ? "Format" : "Format",
    submit: initialData
      ? locale === "fr"
        ? "Mettre à jour"
        : "Update"
      : locale === "fr"
        ? "Créer le rapport"
        : "Create Report",
    cancel: locale === "fr" ? "Annuler" : "Cancel",
  };

  const frequencyOptions = [
    { value: "DAILY", label: locale === "fr" ? "Quotidien" : "Daily" },
    { value: "WEEKLY", label: locale === "fr" ? "Hebdomadaire" : "Weekly" },
    { value: "MONTHLY", label: locale === "fr" ? "Mensuel" : "Monthly" },
  ];

  const dateRangeOptions = [
    { value: "YESTERDAY", label: locale === "fr" ? "Hier" : "Yesterday" },
    { value: "LAST_7_DAYS", label: locale === "fr" ? "7 derniers jours" : "Last 7 days" },
    { value: "LAST_30_DAYS", label: locale === "fr" ? "30 derniers jours" : "Last 30 days" },
    { value: "LAST_MONTH", label: locale === "fr" ? "Mois dernier" : "Last month" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">{t.name}</Label>
        <Input id="name" placeholder={t.namePlaceholder} {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      {/* Metrics */}
      <div className="space-y-2">
        <Label>{t.metrics}</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {AVAILABLE_METRICS.map((metric) => (
            <div key={metric.value} className="flex items-center space-x-2">
              <Checkbox
                id={`metric-${metric.value}`}
                checked={metrics?.includes(metric.value)}
                onCheckedChange={() => toggleMetric(metric.value)}
              />
              <label htmlFor={`metric-${metric.value}`} className="text-sm cursor-pointer">
                {metric.label[locale as "en" | "fr"]}
              </label>
            </div>
          ))}
        </div>
        {errors.metrics && <p className="text-sm text-destructive">{errors.metrics.message}</p>}
      </div>

      {/* Segment */}
      <div className="space-y-2">
        <Label>{t.segment}</Label>
        <Select
          value={watch("segmentId")?.toString() || "all"}
          onValueChange={(value) =>
            setValue("segmentId", value === "all" ? undefined : parseInt(value))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allData}</SelectItem>
            {segments.map((segment) => (
              <SelectItem key={segment.id} value={segment.id.toString()}>
                {segment.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <Label>{t.dateRange}</Label>
        <Select
          value={watch("dateRange")}
          onValueChange={(value) => setValue("dateRange", value as ReportDateRange)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dateRangeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Frequency */}
      <div className="space-y-2">
        <Label>{t.frequency}</Label>
        <Select
          value={watch("frequency")}
          onValueChange={(value) => setValue("frequency", value as ReportFrequency)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {frequencyOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Day of Week (for weekly) */}
      {frequency === "WEEKLY" && (
        <div className="space-y-2">
          <Label>{t.dayOfWeek}</Label>
          <Select
            value={watch("dayOfWeek")?.toString()}
            onValueChange={(value) => setValue("dayOfWeek", parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS_OF_WEEK.map((day) => (
                <SelectItem key={day.value} value={day.value.toString()}>
                  {day.label[locale as "en" | "fr"]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Day of Month (for monthly) */}
      {frequency === "MONTHLY" && (
        <div className="space-y-2">
          <Label>{t.dayOfMonth}</Label>
          <Select
            value={watch("dayOfMonth")?.toString()}
            onValueChange={(value) => setValue("dayOfMonth", parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                <SelectItem key={day} value={day.toString()}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Hour */}
      <div className="space-y-2">
        <Label>{t.hour}</Label>
        <Select
          value={watch("hour")?.toString()}
          onValueChange={(value) => setValue("hour", parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
              <SelectItem key={hour} value={hour.toString()}>
                {hour.toString().padStart(2, "0")}:00
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timezone */}
      <div className="space-y-2">
        <Label>{t.timezone}</Label>
        <Select value={watch("timezone")} onValueChange={(value) => setValue("timezone", value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Recipients */}
      <div className="space-y-2">
        <Label>{t.recipients}</Label>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="email@example.com"
            value={newRecipient}
            onChange={(e) => setNewRecipient(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addRecipient();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addRecipient}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {recipients && recipients.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {recipients.map((email) => (
              <div
                key={email}
                className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm"
              >
                {email}
                <button
                  type="button"
                  onClick={() => removeRecipient(email)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {errors.recipients && (
          <p className="text-sm text-destructive">{errors.recipients.message}</p>
        )}
      </div>

      {/* Format */}
      <div className="space-y-2">
        <Label>{t.format}</Label>
        <Select
          value={watch("format")}
          onValueChange={(value) => setValue("format", value as ReportFormat)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PDF">PDF</SelectItem>
            <SelectItem value="CSV">CSV</SelectItem>
            <SelectItem value="EXCEL">Excel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t.submit}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/projects/${projectId}/reports`)}
        >
          {t.cancel}
        </Button>
      </div>
    </form>
  );
}
