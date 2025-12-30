"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DimensionScope } from "@prisma/client";
import { Loader2, Info } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { createCustomDimensionAction } from "@/lib/actions/custom-dimensions";
import { toast } from "sonner";

const dimensionFormSchema = z.object({
  slot: z.number().min(1).max(200),
  name: z.string().min(1, "Name is required").max(100),
  scope: z.nativeEnum(DimensionScope),
});

type DimensionFormData = z.infer<typeof dimensionFormSchema>;

interface DimensionFormProps {
  projectId: number;
  locale: string;
  nextSlot: number;
  maxSlots: number;
  usedSlots: number[];
}

export function DimensionForm({
  projectId,
  locale,
  nextSlot,
  maxSlots,
  usedSlots,
}: DimensionFormProps) {
  const router = useRouter();
  const t = useTranslations("dimensions");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DimensionFormData>({
    resolver: zodResolver(dimensionFormSchema),
    defaultValues: {
      slot: nextSlot,
      name: "",
      scope: DimensionScope.HIT,
    },
  });

  const currentScope = watch("scope");

  async function onSubmit(data: DimensionFormData) {
    setIsSubmitting(true);
    const result = await createCustomDimensionAction(projectId, data, locale);

    if (result.success) {
      toast.success(result.message);
      reset({ slot: nextSlot + 1, name: "", scope: DimensionScope.HIT });
      router.refresh();
    } else {
      toast.error(result.error);
    }

    setIsSubmitting(false);
  }

  // Generate available slot options
  const availableSlots = [];
  for (let i = 1; i <= maxSlots; i++) {
    if (!usedSlots.includes(i)) {
      availableSlots.push(i);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Slot */}
        <div className="space-y-2">
          <Label htmlFor="slot">{t("slot")}</Label>
          <Select
            value={watch("slot")?.toString()}
            onValueChange={(value) => setValue("slot", parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selectSlot")} />
            </SelectTrigger>
            <SelectContent>
              {availableSlots.slice(0, 20).map((slot) => (
                <SelectItem key={slot} value={slot.toString()}>
                  dimension{slot}
                </SelectItem>
              ))}
              {availableSlots.length > 20 && (
                <SelectItem value="more" disabled>
                  ... {t("moreSlots", { count: availableSlots.length - 20 })}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {errors.slot && <p className="text-sm text-destructive">{errors.slot.message}</p>}
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">{t("name")}</Label>
          <Input id="name" placeholder={t("namePlaceholder")} {...register("name")} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        {/* Scope */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="scope">{t("scope")}</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{t("scopeTooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select
            value={currentScope}
            onValueChange={(value) => setValue("scope", value as DimensionScope)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DimensionScope.HIT}>
                <div className="flex flex-col">
                  <span>{t("scopes.HIT")}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("scopeDescriptions.HIT")}
                  </span>
                </div>
              </SelectItem>
              <SelectItem value={DimensionScope.SESSION}>
                <div className="flex flex-col">
                  <span>{t("scopes.SESSION")}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("scopeDescriptions.SESSION")}
                  </span>
                </div>
              </SelectItem>
              <SelectItem value={DimensionScope.VISITOR}>
                <div className="flex flex-col">
                  <span>{t("scopes.VISITOR")}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("scopeDescriptions.VISITOR")}
                  </span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {t("create")}
      </Button>
    </form>
  );
}
