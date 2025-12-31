"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createWebsiteSchema,
  type CreateWebsiteInput,
} from "@/lib/validations/website";
import {
  createWebsiteAction,
  updateWebsiteAction,
} from "@/lib/actions/websites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle, Globe, Shield, Bot, Eye } from "lucide-react";
import { toast } from "sonner";

interface WebsiteFormProps {
  website?: {
    id: number;
    domain: string;
    privacy: number;
    excludeBots: boolean;
    excludeIps: string | null;
    excludeParams: string | null;
  };
}

export function WebsiteForm({ website }: WebsiteFormProps) {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(website?.privacy === 2);

  const isEditing = !!website;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateWebsiteInput>({
    resolver: zodResolver(createWebsiteSchema),
    defaultValues: {
      domain: website?.domain || "",
      privacy: (website?.privacy?.toString() || "1") as "0" | "1" | "2",
      excludeBots: website?.excludeBots ?? true,
      excludeIps: website?.excludeIps || "",
      excludeParams: website?.excludeParams || "",
    },
  });

  const privacy = watch("privacy");
  const excludeBots = watch("excludeBots");

  async function onSubmit(data: CreateWebsiteInput) {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("domain", data.domain);
    formData.set("privacy", data.privacy);
    if (data.password) {
      formData.set("password", data.password);
    }
    formData.set("excludeBots", data.excludeBots.toString());
    formData.set("excludeIps", data.excludeIps || "");
    formData.set("excludeParams", data.excludeParams || "");

    const result = isEditing
      ? await updateWebsiteAction(website.id, formData, locale)
      : await createWebsiteAction(formData, locale);

    if (result.success) {
      toast.success(result.message);
      if (
        !isEditing &&
        result.data &&
        typeof result.data === "object" &&
        "id" in result.data
      ) {
        router.push(`/websites/${result.data.id}/tracking`);
      } else {
        router.push("/websites");
      }
    } else {
      setError(result.error || null);
    }

    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Domain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t("websites.domain")}
          </CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Entrez le domaine de votre site web (ex: example.com)"
              : "Enter your website domain (e.g., example.com)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">https://</span>
            <Input
              {...register("domain")}
              placeholder="example.com"
              disabled={isLoading || isEditing}
              className="flex-1"
            />
          </div>
          {errors.domain && (
            <p className="text-sm text-destructive mt-2">
              {errors.domain.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("websites.privacy")}
          </CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Contrôlez qui peut voir les statistiques de votre site"
              : "Control who can view your website statistics"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={privacy}
            onValueChange={(value) => {
              setValue("privacy", value as "0" | "1" | "2");
              setShowPassword(value === "2");
            }}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">
                {t("websites.privacyOptions.public")}
              </SelectItem>
              <SelectItem value="1">
                {t("websites.privacyOptions.private")}
              </SelectItem>
              <SelectItem value="2">
                {t("websites.privacyOptions.password")}
              </SelectItem>
            </SelectContent>
          </Select>

          {showPassword && (
            <div className="space-y-2">
              <Label htmlFor="password">
                {locale === "fr"
                  ? "Mot de passe pour les statistiques"
                  : "Password for statistics"}
              </Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bot Filtering */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {t("websites.excludeBots")}
          </CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Exclure les robots et crawlers des statistiques"
              : "Exclude bots and crawlers from statistics"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="excludeBots" className="flex-1">
              {locale === "fr"
                ? "Activer le filtrage des bots"
                : "Enable bot filtering"}
            </Label>
            <Switch
              id="excludeBots"
              checked={excludeBots}
              onCheckedChange={(checked) => setValue("excludeBots", checked)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Advanced Exclusions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {locale === "fr" ? "Exclusions avancées" : "Advanced Exclusions"}
          </CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Exclure des adresses IP ou des paramètres URL spécifiques"
              : "Exclude specific IP addresses or URL parameters"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="excludeIps">{t("websites.excludeIps")}</Label>
            <Textarea
              id="excludeIps"
              {...register("excludeIps")}
              placeholder={
                locale === "fr"
                  ? "Une IP par ligne (ex: 192.168.1.1, 10.0.0.*, 192.168.0.0/24)"
                  : "One IP per line (e.g., 192.168.1.1, 10.0.0.*, 192.168.0.0/24)"
              }
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excludeParams">{t("websites.excludeParams")}</Label>
            <Textarea
              id="excludeParams"
              {...register("excludeParams")}
              placeholder={
                locale === "fr"
                  ? "Paramètres séparés par des virgules (ex: utm_source, fbclid, gclid)"
                  : "Comma-separated parameters (e.g., utm_source, fbclid, gclid)"
              }
              disabled={isLoading}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? t("common.save") : t("common.create")}
        </Button>
      </div>
    </form>
  );
}
