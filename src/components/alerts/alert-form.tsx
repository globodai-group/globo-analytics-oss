"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { createAlertAction } from "@/lib/actions/alerts";
import { toast } from "sonner";
import { AlertMetric, AlertCondition, CompareType } from "@prisma/client";

const alertSchema = z.object({
  name: z.string().min(1, "Name is required"),
  metric: z.nativeEnum(AlertMetric),
  condition: z.nativeEnum(AlertCondition),
  threshold: z.number().min(0),
  compareType: z.nativeEnum(CompareType),
  emailEnabled: z.boolean(),
  webhookUrl: z.string().url().optional().or(z.literal("")),
  slackWebhook: z.string().url().optional().or(z.literal("")),
});

type AlertFormData = z.infer<typeof alertSchema>;

interface AlertFormProps {
  projectId: number;
  locale: string;
}

export function AlertForm({ projectId, locale }: AlertFormProps) {
  const router = useRouter();
  const t = useTranslations("alerts");
  const tCommon = useTranslations("common");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      name: "",
      metric: "VISITORS",
      condition: "GREATER_THAN",
      threshold: 100,
      compareType: "ABSOLUTE",
      emailEnabled: true,
      webhookUrl: "",
      slackWebhook: "",
    },
  });

  const emailEnabled = watch("emailEnabled");
  const metric = watch("metric");
  const condition = watch("condition");
  const compareType = watch("compareType");

  const metrics: AlertMetric[] = [
    "VISITORS",
    "PAGEVIEWS",
    "BOUNCE_RATE",
    "AVG_SESSION_DURATION",
    "CONVERSIONS",
    "REVENUE",
  ];

  const conditions: AlertCondition[] = [
    "GREATER_THAN",
    "LESS_THAN",
    "INCREASE_BY_PERCENT",
    "DECREASE_BY_PERCENT",
  ];

  const compareTypes: CompareType[] = [
    "ABSOLUTE",
    "PREVIOUS_DAY",
    "PREVIOUS_WEEK",
    "PREVIOUS_MONTH",
  ];

  async function onSubmit(data: AlertFormData) {
    setIsLoading(true);
    const result = await createAlertAction(
      projectId,
      {
        name: data.name,
        metric: data.metric,
        condition: data.condition,
        threshold: data.threshold,
        compareType: data.compareType,
        emailEnabled: data.emailEnabled,
        webhookUrl: data.webhookUrl || undefined,
        slackWebhook: data.slackWebhook || undefined,
      },
      locale,
    );

    if (result.success) {
      toast.success(result.message);
      router.push(`/projects/${projectId}/alerts`);
    } else {
      toast.error(result.error);
    }

    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          placeholder={
            locale === "fr" ? "ex: Alerte visiteurs" : "e.g., Visitors alert"
          }
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Metric */}
      <div className="space-y-2">
        <Label>{t("metric")}</Label>
        <Select
          value={metric}
          onValueChange={(value) => setValue("metric", value as AlertMetric)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {metrics.map((m) => (
              <SelectItem key={m} value={m}>
                {t(`metrics.${m}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Condition */}
      <div className="space-y-2">
        <Label>{t("condition")}</Label>
        <Select
          value={condition}
          onValueChange={(value) =>
            setValue("condition", value as AlertCondition)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {conditions.map((c) => (
              <SelectItem key={c} value={c}>
                {t(`conditions.${c}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Threshold */}
      <div className="space-y-2">
        <Label htmlFor="threshold">{t("threshold")}</Label>
        <Input
          id="threshold"
          type="number"
          step="0.01"
          {...register("threshold", { valueAsNumber: true })}
        />
        {errors.threshold && (
          <p className="text-sm text-destructive">{errors.threshold.message}</p>
        )}
      </div>

      {/* Compare Type */}
      <div className="space-y-2">
        <Label>{t("compareType")}</Label>
        <Select
          value={compareType}
          onValueChange={(value) =>
            setValue("compareType", value as CompareType)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {compareTypes.map((c) => (
              <SelectItem key={c} value={c}>
                {t(`compareTypes.${c}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <hr className="my-6" />

      {/* Notifications Section */}
      <div className="space-y-4">
        <h3 className="font-medium">{t("notifications")}</h3>

        {/* Email */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="emailEnabled">{t("emailEnabled")}</Label>
            <p className="text-sm text-muted-foreground">
              {locale === "fr"
                ? "Recevoir les alertes par email"
                : "Receive alerts by email"}
            </p>
          </div>
          <Switch
            id="emailEnabled"
            checked={emailEnabled}
            onCheckedChange={(checked) => setValue("emailEnabled", checked)}
          />
        </div>

        {/* Webhook */}
        <div className="space-y-2">
          <Label htmlFor="webhookUrl">{t("webhookUrl")}</Label>
          <Input
            id="webhookUrl"
            type="url"
            placeholder="https://..."
            {...register("webhookUrl")}
          />
        </div>

        {/* Slack */}
        <div className="space-y-2">
          <Label htmlFor="slackWebhook">{t("slackWebhook")}</Label>
          <Input
            id="slackWebhook"
            type="url"
            placeholder="https://hooks.slack.com/..."
            {...register("slackWebhook")}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          {tCommon("cancel")}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {tCommon("create")}
        </Button>
      </div>
    </form>
  );
}
