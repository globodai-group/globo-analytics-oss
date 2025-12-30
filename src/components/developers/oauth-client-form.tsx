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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createOAuthClientAction, OAUTH_SCOPES } from "@/lib/actions/oauth";
import { toast } from "sonner";
import { Loader2, Plus, X, Copy, Check } from "lucide-react";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  redirectUris: z
    .array(z.string().url("Invalid URL"))
    .min(1, "At least one redirect URI is required"),
  scopes: z.array(z.string()).min(1, "At least one scope is required"),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface OAuthClientFormProps {
  locale: string;
  initialData?: {
    id: number;
    name: string;
    description: string | null;
    redirectUris: string[];
    scopes: string[];
  };
}

export function OAuthClientForm({ locale, initialData }: OAuthClientFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUri, setNewUri] = useState("");
  const [credentials, setCredentials] = useState<{
    clientId: string;
    clientSecret: string;
  } | null>(null);
  const [copied, setCopied] = useState<"id" | "secret" | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      redirectUris: initialData?.redirectUris || [],
      scopes: initialData?.scopes || [],
    },
  });

  const redirectUris = watch("redirectUris");
  const scopes = watch("scopes");

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);

    try {
      const result = await createOAuthClientAction(data, locale);

      if (result.success && result.data) {
        setCredentials(result.data);
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(locale === "fr" ? "Une erreur est survenue" : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addUri = () => {
    try {
      new URL(newUri);
      if (!redirectUris.includes(newUri)) {
        setValue("redirectUris", [...redirectUris, newUri]);
      }
      setNewUri("");
    } catch {
      toast.error(locale === "fr" ? "URL invalide" : "Invalid URL");
    }
  };

  const removeUri = (uri: string) => {
    setValue(
      "redirectUris",
      redirectUris.filter((u) => u !== uri)
    );
  };

  const toggleScope = (scope: string) => {
    if (scopes.includes(scope)) {
      setValue(
        "scopes",
        scopes.filter((s) => s !== scope)
      );
    } else {
      setValue("scopes", [...scopes, scope]);
    }
  };

  const handleCopy = async (text: string, type: "id" | "secret") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const t = {
    name: locale === "fr" ? "Nom de l'application" : "Application Name",
    namePlaceholder: locale === "fr" ? "Mon application" : "My Application",
    description: locale === "fr" ? "Description" : "Description",
    descriptionPlaceholder:
      locale === "fr"
        ? "Une brève description de votre application..."
        : "A brief description of your application...",
    redirectUris: locale === "fr" ? "URIs de redirection" : "Redirect URIs",
    redirectUrisHint:
      locale === "fr"
        ? "URLs vers lesquelles les utilisateurs seront redirigés après autorisation"
        : "URLs where users will be redirected after authorization",
    addUri: locale === "fr" ? "Ajouter" : "Add",
    scopes: locale === "fr" ? "Permissions" : "Permissions",
    scopesHint:
      locale === "fr"
        ? "Sélectionnez les permissions dont votre application a besoin"
        : "Select the permissions your application needs",
    submit: initialData
      ? locale === "fr"
        ? "Mettre à jour"
        : "Update"
      : locale === "fr"
        ? "Créer l'application"
        : "Create Application",
    cancel: locale === "fr" ? "Annuler" : "Cancel",
    credentialsTitle: locale === "fr" ? "Identifiants de l'application" : "Application Credentials",
    credentialsWarning:
      locale === "fr"
        ? "Copiez ces identifiants maintenant. Le secret ne sera plus affiché."
        : "Copy these credentials now. The secret won't be shown again.",
    done: locale === "fr" ? "Terminé" : "Done",
  };

  // Show credentials after creation
  if (credentials) {
    return (
      <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
        <CardHeader>
          <CardTitle className="text-green-800 dark:text-green-200">{t.credentialsTitle}</CardTitle>
          <CardDescription className="text-green-700 dark:text-green-300">
            {t.credentialsWarning}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Client ID</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-white dark:bg-black rounded border text-sm font-mono">
                {credentials.clientId}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(credentials.clientId, "id")}
              >
                {copied === "id" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Client Secret</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-white dark:bg-black rounded border text-sm font-mono break-all">
                {credentials.clientSecret}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(credentials.clientSecret, "secret")}
              >
                {copied === "secret" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button className="w-full" onClick={() => router.push("/account/developers")}>
            {t.done}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">{t.name}</Label>
        <Input id="name" placeholder={t.namePlaceholder} {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">{t.description}</Label>
        <Textarea
          id="description"
          placeholder={t.descriptionPlaceholder}
          rows={3}
          {...register("description")}
        />
      </div>

      {/* Redirect URIs */}
      <div className="space-y-2">
        <Label>{t.redirectUris}</Label>
        <p className="text-sm text-muted-foreground">{t.redirectUrisHint}</p>
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://example.com/callback"
            value={newUri}
            onChange={(e) => setNewUri(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUri();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addUri}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {redirectUris.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {redirectUris.map((uri) => (
              <div
                key={uri}
                className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm"
              >
                <code className="text-xs">{uri}</code>
                <button
                  type="button"
                  onClick={() => removeUri(uri)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {errors.redirectUris && (
          <p className="text-sm text-destructive">{errors.redirectUris.message}</p>
        )}
      </div>

      {/* Scopes */}
      <div className="space-y-2">
        <Label>{t.scopes}</Label>
        <p className="text-sm text-muted-foreground">{t.scopesHint}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {OAUTH_SCOPES.map((scope) => (
            <div key={scope.value} className="flex items-center space-x-2">
              <Checkbox
                id={`scope-${scope.value}`}
                checked={scopes.includes(scope.value)}
                onCheckedChange={() => toggleScope(scope.value)}
              />
              <label htmlFor={`scope-${scope.value}`} className="text-sm cursor-pointer">
                <span className="font-mono text-xs">{scope.value}</span>
                <span className="text-muted-foreground ml-2">- {scope.label}</span>
              </label>
            </div>
          ))}
        </div>
        {errors.scopes && <p className="text-sm text-destructive">{errors.scopes.message}</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t.submit}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/account/developers")}>
          {t.cancel}
        </Button>
      </div>
    </form>
  );
}
