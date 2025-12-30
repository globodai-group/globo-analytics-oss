"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveConsentConfigAction } from "@/lib/actions/consent";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ConsentMode } from "@prisma/client";

// SECURITY: Must match VALID_BANNER_POSITIONS in consent.ts
const VALID_BANNER_POSITIONS = ["top", "bottom", "center"] as const;

const configSchema = z.object({
  requireConsent: z.boolean(),
  consentMode: z.nativeEnum(ConsentMode),
  bannerPosition: z.enum(VALID_BANNER_POSITIONS),
  bannerText: z.string().optional(),
  privacyUrl: z.string().url().optional().or(z.literal("")),
  consentDuration: z.number().min(1).max(730),
});

type ConfigFormData = z.infer<typeof configSchema>;

interface ConsentConfigFormProps {
  projectId: number;
  locale: string;
  initialData?: {
    requireConsent: boolean;
    consentMode: ConsentMode;
    bannerPosition: (typeof VALID_BANNER_POSITIONS)[number];
    bannerText: string;
    privacyUrl: string;
    consentDuration: number;
  };
}

export function ConsentConfigForm({ projectId, locale, initialData }: ConsentConfigFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      requireConsent: initialData?.requireConsent ?? true,
      consentMode: initialData?.consentMode ?? "EXPLICIT",
      bannerPosition: initialData?.bannerPosition ?? "bottom",
      bannerText: initialData?.bannerText ?? "",
      privacyUrl: initialData?.privacyUrl ?? "",
      consentDuration: initialData?.consentDuration ?? 365,
    },
  });

  const requireConsent = watch("requireConsent");

  const onSubmit = async (data: ConfigFormData) => {
    setIsSubmitting(true);

    try {
      const result = await saveConsentConfigAction(projectId, data, locale);

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(locale === "fr" ? "Une erreur est survenue" : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const t = {
    requireConsent: locale === "fr" ? "Exiger le consentement" : "Require Consent",
    requireConsentDesc:
      locale === "fr"
        ? "Les visiteurs doivent donner leur consentement avant le tracking."
        : "Visitors must consent before tracking begins.",
    mode: locale === "fr" ? "Mode de consentement" : "Consent Mode",
    modeExplicit: locale === "fr" ? "Explicite (Opt-in)" : "Explicit (Opt-in)",
    modeImplicit: locale === "fr" ? "Implicite (Opt-out)" : "Implicit (Opt-out)",
    modeDisabled: locale === "fr" ? "Désactivé" : "Disabled",
    position: locale === "fr" ? "Position de la bannière" : "Banner Position",
    positionBottom: locale === "fr" ? "Bas" : "Bottom",
    positionTop: locale === "fr" ? "Haut" : "Top",
    positionCenter: locale === "fr" ? "Centre (modal)" : "Center (modal)",
    bannerText: locale === "fr" ? "Texte de la bannière" : "Banner Text",
    bannerTextPlaceholder:
      locale === "fr"
        ? "Nous utilisons des cookies pour améliorer votre expérience..."
        : "We use cookies to improve your experience...",
    privacyUrl: locale === "fr" ? "URL de la politique de confidentialité" : "Privacy Policy URL",
    privacyUrlPlaceholder: "https://example.com/privacy",
    duration: locale === "fr" ? "Durée du consentement (jours)" : "Consent Duration (days)",
    save: locale === "fr" ? "Enregistrer" : "Save",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Require Consent Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t.requireConsent}</Label>
          <p className="text-sm text-muted-foreground">{t.requireConsentDesc}</p>
        </div>
        <Switch
          checked={requireConsent}
          onCheckedChange={(checked) => setValue("requireConsent", checked)}
        />
      </div>

      {requireConsent && (
        <>
          {/* Consent Mode */}
          <div className="space-y-2">
            <Label>{t.mode}</Label>
            <Select
              value={watch("consentMode")}
              onValueChange={(value) => setValue("consentMode", value as ConsentMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPLICIT">{t.modeExplicit}</SelectItem>
                <SelectItem value="IMPLICIT">{t.modeImplicit}</SelectItem>
                <SelectItem value="DISABLED">{t.modeDisabled}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Banner Position */}
          <div className="space-y-2">
            <Label>{t.position}</Label>
            <Select
              value={watch("bannerPosition")}
              onValueChange={(value) =>
                setValue("bannerPosition", value as (typeof VALID_BANNER_POSITIONS)[number])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom">{t.positionBottom}</SelectItem>
                <SelectItem value="top">{t.positionTop}</SelectItem>
                <SelectItem value="center">{t.positionCenter}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Banner Text */}
          <div className="space-y-2">
            <Label htmlFor="bannerText">{t.bannerText}</Label>
            <Textarea
              id="bannerText"
              placeholder={t.bannerTextPlaceholder}
              rows={3}
              {...register("bannerText")}
            />
          </div>

          {/* Privacy URL */}
          <div className="space-y-2">
            <Label htmlFor="privacyUrl">{t.privacyUrl}</Label>
            <Input
              id="privacyUrl"
              type="url"
              placeholder={t.privacyUrlPlaceholder}
              {...register("privacyUrl")}
            />
            {errors.privacyUrl && (
              <p className="text-sm text-destructive">{errors.privacyUrl.message}</p>
            )}
          </div>

          {/* Consent Duration */}
          <div className="space-y-2">
            <Label htmlFor="consentDuration">{t.duration}</Label>
            <Input
              id="consentDuration"
              type="number"
              min={1}
              max={730}
              {...register("consentDuration", { valueAsNumber: true })}
            />
            {errors.consentDuration && (
              <p className="text-sm text-destructive">{errors.consentDuration.message}</p>
            )}
          </div>
        </>
      )}

      {/* Submit */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t.save}
      </Button>
    </form>
  );
}
