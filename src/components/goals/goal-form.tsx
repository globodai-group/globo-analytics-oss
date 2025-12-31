"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Target,
  MousePointerClick,
  Clock,
  FileText,
  ShoppingCart,
} from "lucide-react";
import { createGoalAction, updateGoalAction } from "@/lib/actions/goals";
import { toast } from "sonner";
import { GoalType, UrlMatchType, Goal } from "@prisma/client";

const goalFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.nativeEnum(GoalType),
  isActive: z.boolean(),
  // URL
  urlMatch: z.string().optional(),
  urlMatchType: z.nativeEnum(UrlMatchType).optional(),
  // Event
  eventName: z.string().optional(),
  eventCategory: z.string().optional(),
  eventAction: z.string().optional(),
  eventLabel: z.string().optional(),
  eventValue: z.number().optional(),
  // Duration
  durationSeconds: z.number().optional(),
  // Pages
  minPages: z.number().optional(),
  // Revenue
  revenueTracking: z.boolean(),
  defaultRevenue: z.number().optional(),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

interface GoalFormProps {
  projectId: number;
  locale: string;
  goal?: Goal;
}

const goalTypeIcons = {
  URL: <FileText className="h-5 w-5" />,
  EVENT: <MousePointerClick className="h-5 w-5" />,
  DURATION: <Clock className="h-5 w-5" />,
  PAGES_PER_SESSION: <FileText className="h-5 w-5" />,
  ECOMMERCE: <ShoppingCart className="h-5 w-5" />,
};

export function GoalForm({ projectId, locale, goal }: GoalFormProps) {
  const t = useTranslations("goals");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: goal?.name || "",
      description: goal?.description || "",
      type: goal?.type || "URL",
      isActive: goal?.isActive ?? true,
      urlMatch: goal?.urlMatch || "",
      urlMatchType: goal?.urlMatchType || "CONTAINS",
      eventName: goal?.eventName || "",
      eventCategory: goal?.eventCategory || "",
      eventAction: goal?.eventAction || "",
      eventLabel: goal?.eventLabel || "",
      eventValue: goal?.eventValue || undefined,
      durationSeconds: goal?.durationSeconds || 60,
      minPages: goal?.minPages || 3,
      revenueTracking: goal?.revenueTracking || false,
      defaultRevenue: goal?.defaultRevenue || undefined,
    },
  });

  const watchType = form.watch("type");
  const watchRevenueTracking = form.watch("revenueTracking");

  async function onSubmit(data: GoalFormValues) {
    setIsSubmitting(true);
    try {
      const result = goal
        ? await updateGoalAction(goal.id, data, locale)
        : await createGoalAction(projectId, data, locale);

      if (result.success) {
        toast.success(result.message);
        router.push(`/projects/${projectId}/goals`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(
        locale === "fr" ? "Une erreur est survenue" : "An error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {locale === "fr" ? "Informations de base" : "Basic Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        locale === "fr"
                          ? "Ex: Inscription newsletter"
                          : "E.g.: Newsletter signup"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        locale === "fr"
                          ? "Description optionnelle..."
                          : "Optional description..."
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t("active")}</FormLabel>
                    <FormDescription>
                      {locale === "fr"
                        ? "Suivre les conversions pour cet objectif"
                        : "Track conversions for this goal"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Goal Type */}
        <Card>
          <CardHeader>
            <CardTitle>{t("type")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {(Object.keys(GoalType) as GoalType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => field.onChange(type)}
                          className={`flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 ${
                            field.value === type
                              ? "border-primary bg-muted/50"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {goalTypeIcons[type]}
                            <span className="font-medium">
                              {t(`typeOptions.${type}`)}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {t(`typeDescriptions.${type}`)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Type-specific fields */}
        {watchType === "URL" && (
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === "fr" ? "Configuration URL" : "URL Configuration"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="urlMatchType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("urlMatchType")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("urlMatchType")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(UrlMatchType) as UrlMatchType[]).map(
                          (type) => (
                            <SelectItem key={type} value={type}>
                              {t(`urlMatchTypes.${type}`)}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="urlMatch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("urlMatch")}</FormLabel>
                    <FormControl>
                      <Input placeholder="/thank-you" {...field} />
                    </FormControl>
                    <FormDescription>
                      {locale === "fr"
                        ? "L'URL ou le pattern à matcher pour déclencher la conversion"
                        : "The URL or pattern to match to trigger the conversion"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {watchType === "EVENT" && (
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === "fr"
                  ? "Configuration événement"
                  : "Event Configuration"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="eventName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("eventName")}</FormLabel>
                    <FormControl>
                      <Input placeholder="signup_complete" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="eventCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("eventCategory")}</FormLabel>
                      <FormControl>
                        <Input placeholder="form" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventAction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("eventAction")}</FormLabel>
                      <FormControl>
                        <Input placeholder="submit" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="eventLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("eventLabel")}</FormLabel>
                      <FormControl>
                        <Input placeholder="newsletter" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("eventValue")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {watchType === "DURATION" && (
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === "fr"
                  ? "Configuration durée"
                  : "Duration Configuration"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="durationSeconds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("durationSeconds")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="60"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {locale === "fr"
                        ? "Durée minimum de session en secondes pour déclencher la conversion"
                        : "Minimum session duration in seconds to trigger the conversion"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {watchType === "PAGES_PER_SESSION" && (
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === "fr"
                  ? "Configuration pages"
                  : "Pages Configuration"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="minPages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("minPages")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={2}
                        placeholder="3"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {locale === "fr"
                        ? "Nombre minimum de pages vues pour déclencher la conversion"
                        : "Minimum number of page views to trigger the conversion"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Revenue Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>{t("revenueTracking")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="revenueTracking"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t("revenueTracking")}
                    </FormLabel>
                    <FormDescription>
                      {t("revenueTrackingDescription")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {watchRevenueTracking && (
              <FormField
                control={form.control}
                name="defaultRevenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("defaultRevenue")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="0.00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {locale === "fr"
                        ? "Valeur monétaire par défaut si non fournie par l'événement"
                        : "Default monetary value if not provided by the event"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            {locale === "fr" ? "Annuler" : "Cancel"}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {locale === "fr" ? "Enregistrement..." : "Saving..."}
              </>
            ) : goal ? (
              locale === "fr" ? (
                "Mettre à jour"
              ) : (
                "Update"
              )
            ) : locale === "fr" ? (
              "Créer l'objectif"
            ) : (
              "Create goal"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
