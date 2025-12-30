"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProjectSchema, type CreateProjectInput } from "@/lib/validations/project";
import { createProjectAction, updateProjectAction } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Loader2,
  AlertCircle,
  FolderKanban,
  Shield,
  Bot,
  Clock,
  Smartphone,
  Globe,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";

interface ProjectFormProps {
  project?: {
    id: number;
    name: string;
    platform: string;
    privacy: number;
    excludeBots: boolean;
    sessionTimeout: number;
    engagementThreshold: number;
  };
}

export function ProjectForm({ project }: ProjectFormProps) {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(project?.privacy === 2);

  const isEditing = !!project;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: project?.name || "",
      platform: (project?.platform || "web") as "web" | "mobile" | "both",
      privacy: (project?.privacy?.toString() || "1") as "0" | "1" | "2",
      excludeBots: project?.excludeBots ?? true,
      sessionTimeout: project?.sessionTimeout || 30,
      engagementThreshold: project?.engagementThreshold || 10,
    },
  });

  const privacy = watch("privacy");
  const platform = watch("platform");
  const excludeBots = watch("excludeBots");
  const sessionTimeout = watch("sessionTimeout");
  const engagementThreshold = watch("engagementThreshold");

  async function onSubmit(data: CreateProjectInput) {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("name", data.name);
    formData.set("platform", data.platform);
    formData.set("privacy", data.privacy);
    if (data.password) {
      formData.set("password", data.password);
    }
    formData.set("excludeBots", data.excludeBots.toString());
    formData.set("sessionTimeout", data.sessionTimeout.toString());
    formData.set("engagementThreshold", data.engagementThreshold.toString());

    const result = isEditing
      ? await updateProjectAction(project.id, formData, locale)
      : await createProjectAction(formData, locale);

    if (result.success) {
      toast.success(result.message);
      if (!isEditing && result.data && typeof result.data === "object" && "id" in result.data) {
        router.push(`/projects/${result.data.id}/domains`);
      } else {
        router.push("/projects");
      }
    } else {
      setError(result.error || null);
    }

    setIsLoading(false);
  }

  const platformIcons = {
    web: Globe,
    mobile: Smartphone,
    both: Monitor,
  };

  const PlatformIcon = platformIcons[platform];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Project Name */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            {t("projects.name")}
          </CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Donnez un nom à votre projet (ex: Mon Application)"
              : "Give your project a name (e.g., My Application)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            {...register("name")}
            placeholder={locale === "fr" ? "Mon Application" : "My Application"}
            disabled={isLoading}
          />
          {errors.name && <p className="text-sm text-destructive mt-2">{errors.name.message}</p>}
        </CardContent>
      </Card>

      {/* Platform */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlatformIcon className="h-5 w-5" />
            {t("projects.platform")}
          </CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Sélectionnez le type de plateforme à tracker"
              : "Select the platform type to track"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={platform}
            onValueChange={(value) => setValue("platform", value as "web" | "mobile" | "both")}
            disabled={isLoading || isEditing}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="web">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t("projects.platformOptions.web")}
                </div>
              </SelectItem>
              <SelectItem value="mobile">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  {t("projects.platformOptions.mobile")}
                </div>
              </SelectItem>
              <SelectItem value="both">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  {t("projects.platformOptions.both")}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("projects.privacy")}
          </CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Contrôlez qui peut voir les statistiques"
              : "Control who can view statistics"}
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
              <SelectItem value="0">{t("projects.privacyOptions.public")}</SelectItem>
              <SelectItem value="1">{t("projects.privacyOptions.private")}</SelectItem>
              <SelectItem value="2">{t("projects.privacyOptions.password")}</SelectItem>
            </SelectContent>
          </Select>

          {showPassword && (
            <div className="space-y-2">
              <Label htmlFor="password">
                {locale === "fr" ? "Mot de passe pour les statistiques" : "Password for statistics"}
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

      {/* Session Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {locale === "fr" ? "Paramètres de session" : "Session Settings"}
          </CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Configurez le timeout et l'engagement des sessions"
              : "Configure session timeout and engagement settings"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{locale === "fr" ? "Timeout de session" : "Session timeout"}</Label>
              <span className="text-sm text-muted-foreground">
                {sessionTimeout} {locale === "fr" ? "minutes" : "minutes"}
              </span>
            </div>
            <Slider
              value={[sessionTimeout]}
              onValueChange={(value) => setValue("sessionTimeout", value[0])}
              min={1}
              max={60}
              step={1}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {locale === "fr"
                ? "Durée d'inactivité avant qu'une nouvelle session soit créée"
                : "Inactivity duration before a new session is created"}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{locale === "fr" ? "Seuil d'engagement" : "Engagement threshold"}</Label>
              <span className="text-sm text-muted-foreground">
                {engagementThreshold} {locale === "fr" ? "secondes" : "seconds"}
              </span>
            </div>
            <Slider
              value={[engagementThreshold]}
              onValueChange={(value) => setValue("engagementThreshold", value[0])}
              min={1}
              max={300}
              step={1}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {locale === "fr"
                ? "Temps minimum passé sur une page pour être considéré comme engagé"
                : "Minimum time spent on a page to be considered engaged"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bot Filtering */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {t("projects.excludeBots")}
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
              {locale === "fr" ? "Activer le filtrage des bots" : "Enable bot filtering"}
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

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
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
