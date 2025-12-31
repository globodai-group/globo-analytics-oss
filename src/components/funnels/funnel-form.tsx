"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FunnelStepType } from "@prisma/client";
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createFunnelAction, updateFunnelAction } from "@/lib/actions/funnels";
import { toast } from "sonner";

const funnelStepSchema = z.object({
  name: z.string().min(1, "Step name is required"),
  type: z.nativeEnum(FunnelStepType),
  urlPattern: z.string().optional(),
  eventName: z.string().optional(),
  goalId: z.number().optional(),
});

const funnelFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isActive: z.boolean(),
  steps: z.array(funnelStepSchema).min(2, "At least 2 steps are required"),
});

type FunnelFormData = z.infer<typeof funnelFormSchema>;

interface FunnelFormProps {
  projectId: number;
  locale: string;
  goals: { id: number; name: string }[];
  funnel?: {
    id: number;
    name: string;
    description?: string | null;
    isActive: boolean;
    steps: {
      id: number;
      position: number;
      name: string;
      type: FunnelStepType;
      urlPattern?: string | null;
      eventName?: string | null;
      goalId?: number | null;
    }[];
  };
}

export function FunnelForm({
  projectId,
  locale,
  goals,
  funnel,
}: FunnelFormProps) {
  const router = useRouter();
  const t = useTranslations("funnels");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FunnelFormData>({
    resolver: zodResolver(funnelFormSchema),
    defaultValues: {
      name: funnel?.name || "",
      description: funnel?.description || "",
      isActive: funnel?.isActive ?? true,
      steps: funnel?.steps.map((s) => ({
        name: s.name,
        type: s.type,
        urlPattern: s.urlPattern || undefined,
        eventName: s.eventName || undefined,
        goalId: s.goalId || undefined,
      })) || [
        { name: "", type: FunnelStepType.URL, urlPattern: "" },
        { name: "", type: FunnelStepType.URL, urlPattern: "" },
      ],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "steps",
  });

  async function onSubmit(data: FunnelFormData) {
    setIsSubmitting(true);

    const input = {
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      steps: data.steps.map((step, index) => ({
        position: index + 1,
        name: step.name,
        type: step.type,
        urlPattern: step.urlPattern,
        eventName: step.eventName,
        goalId: step.goalId,
      })),
    };

    const result = funnel
      ? await updateFunnelAction(funnel.id, input, locale)
      : await createFunnelAction(projectId, input, locale);

    if (result.success) {
      toast.success(result.message);
      router.push(`/projects/${projectId}/funnels`);
      router.refresh();
    } else {
      toast.error(result.error);
    }

    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("name")}</Label>
          <Input
            id="name"
            placeholder={t("namePlaceholder")}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t("description")}</Label>
          <Textarea
            id="description"
            placeholder={t("descriptionPlaceholder")}
            {...register("description")}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>{t("active")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("activeDescription")}
            </p>
          </div>
          <Switch
            checked={watch("isActive")}
            onCheckedChange={(checked) => setValue("isActive", checked)}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">{t("steps")}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ name: "", type: FunnelStepType.URL, urlPattern: "" })
            }
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            {t("addStep")}
          </Button>
        </div>

        {errors.steps && typeof errors.steps.message === "string" && (
          <p className="text-sm text-destructive">{errors.steps.message}</p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex gap-3 p-4 border rounded-lg bg-muted/30"
            >
              <div className="flex items-center">
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                <span className="ml-2 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {index + 1}
                </span>
              </div>

              <div className="flex-1 grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t("stepName")}</Label>
                  <Input
                    placeholder={t("stepNamePlaceholder")}
                    {...register(`steps.${index}.name`)}
                  />
                  {errors.steps?.[index]?.name && (
                    <p className="text-xs text-destructive">
                      {errors.steps[index].name?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">{t("stepType")}</Label>
                  <Select
                    value={watch(`steps.${index}.type`)}
                    onValueChange={(value) =>
                      setValue(`steps.${index}.type`, value as FunnelStepType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FunnelStepType.URL}>
                        {t("stepTypes.URL")}
                      </SelectItem>
                      <SelectItem value={FunnelStepType.EVENT}>
                        {t("stepTypes.EVENT")}
                      </SelectItem>
                      <SelectItem value={FunnelStepType.GOAL}>
                        {t("stepTypes.GOAL")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  {watch(`steps.${index}.type`) === FunnelStepType.URL && (
                    <>
                      <Label className="text-xs">{t("urlPattern")}</Label>
                      <Input
                        placeholder="/checkout"
                        {...register(`steps.${index}.urlPattern`)}
                      />
                    </>
                  )}
                  {watch(`steps.${index}.type`) === FunnelStepType.EVENT && (
                    <>
                      <Label className="text-xs">{t("eventName")}</Label>
                      <Input
                        placeholder="purchase"
                        {...register(`steps.${index}.eventName`)}
                      />
                    </>
                  )}
                  {watch(`steps.${index}.type`) === FunnelStepType.GOAL && (
                    <>
                      <Label className="text-xs">{t("selectGoal")}</Label>
                      <Select
                        value={watch(`steps.${index}.goalId`)?.toString() || ""}
                        onValueChange={(value) =>
                          setValue(`steps.${index}.goalId`, parseInt(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("selectGoalPlaceholder")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {goals.map((goal) => (
                            <SelectItem
                              key={goal.id}
                              value={goal.id.toString()}
                            >
                              {goal.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>
              </div>

              {fields.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {funnel ? t("update") : t("create")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
