"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { updatePreferencesAction } from "@/lib/actions/account";

const preferencesSchema = z.object({
  locale: z.string(),
  timezone: z.string(),
});

type PreferencesInput = z.infer<typeof preferencesSchema>;

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Shanghai", label: "Shanghai" },
  { value: "Australia/Sydney", label: "Sydney" },
];

interface PreferencesFormProps {
  userLocale: string;
  userTimezone: string;
  currentLocale: string;
}

export function PreferencesForm({
  userLocale,
  userTimezone,
  currentLocale,
}: PreferencesFormProps) {
  const t = useTranslations("account.preferences");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  const { handleSubmit, setValue, watch } = useForm<PreferencesInput>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      locale: userLocale,
      timezone: userTimezone,
    },
  });

  const selectedLocale = watch("locale");
  const selectedTimezone = watch("timezone");

  async function onSubmit(data: PreferencesInput) {
    setIsLoading(true);
    try {
      const result = await updatePreferencesAction(data);

      if (result.success) {
        toast.success(t("updated"));

        // If locale changed, redirect to the new locale
        if (data.locale !== currentLocale) {
          const newPath = pathname.replace(
            `/${currentLocale}`,
            `/${data.locale}`,
          );
          router.push(newPath);
        }
      } else {
        toast.error(result.error || "Failed to update preferences");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md">
      {/* Language */}
      <div className="space-y-2">
        <Label>{t("language")}</Label>
        <Select
          value={selectedLocale}
          onValueChange={(value) => setValue("locale", value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timezone */}
      <div className="space-y-2">
        <Label>{t("timezone")}</Label>
        <Select
          value={selectedTimezone}
          onValueChange={(value) => setValue("timezone", value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Theme - Read only, uses system */}
      <div className="space-y-2">
        <Label>{t("theme")}</Label>
        <Select value="system" disabled>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">{t("themeOptions.light")}</SelectItem>
            <SelectItem value="dark">{t("themeOptions.dark")}</SelectItem>
            <SelectItem value="system">{t("themeOptions.system")}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {currentLocale === "fr"
            ? "Le thème suit automatiquement les préférences de votre système."
            : "Theme automatically follows your system preferences."}
        </p>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {tCommon("save")}
      </Button>
    </form>
  );
}
