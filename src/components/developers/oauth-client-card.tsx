"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Key,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  deleteOAuthClientAction,
  regenerateClientSecretAction,
} from "@/lib/actions/oauth";
import { toast } from "sonner";
import { format, Locale } from "date-fns";

interface OAuthClientCardProps {
  client: {
    id: number;
    clientId: string;
    name: string;
    description: string | null;
    redirectUris: string[];
    scopes: string[];
    isActive: boolean;
    createdAt: Date;
    tokenCount: number;
  };
  locale: string;
  dateLocale: Locale;
}

export function OAuthClientCard({
  client,
  locale,
  dateLocale,
}: OAuthClientCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteOAuthClientAction(client.id, locale);

    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.error);
    }

    setIsDeleting(false);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    const result = await regenerateClientSecretAction(client.id, locale);

    if (result.success && result.data) {
      setNewSecret(result.data.clientSecret);
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.error);
    }

    setIsRegenerating(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {client.name}
            </CardTitle>
            <CardDescription>
              {client.description ||
                (locale === "fr" ? "Aucune description" : "No description")}
            </CardDescription>
          </div>
          <Badge variant={client.isActive ? "default" : "secondary"}>
            {client.isActive
              ? locale === "fr"
                ? "Actif"
                : "Active"
              : locale === "fr"
                ? "Inactif"
                : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Client ID */}
        <div className="space-y-1">
          <p className="text-sm font-medium">Client ID</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 bg-muted rounded text-xs font-mono">
              {client.clientId}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(client.clientId)}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* New Secret (if just regenerated) */}
        {newSecret && (
          <div className="space-y-1 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {locale === "fr"
                ? "Nouveau secret (copiez-le maintenant)"
                : "New secret (copy it now)"}
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-white dark:bg-black rounded text-xs font-mono break-all">
                {newSecret}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(newSecret)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Redirect URIs */}
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {locale === "fr" ? "URIs de redirection" : "Redirect URIs"}
          </p>
          <div className="flex flex-wrap gap-2">
            {client.redirectUris.map((uri, index) => (
              <code
                key={index}
                className="px-2 py-1 bg-muted rounded text-xs font-mono"
              >
                {uri}
              </code>
            ))}
          </div>
        </div>

        {/* Scopes */}
        <div className="space-y-1">
          <p className="text-sm font-medium">Scopes</p>
          <div className="flex flex-wrap gap-2">
            {client.scopes.map((scope) => (
              <Badge key={scope} variant="secondary">
                {scope}
              </Badge>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            {client.tokenCount}{" "}
            {locale === "fr" ? "token(s) actif(s)" : "active token(s)"}
          </span>
          <span>
            {locale === "fr" ? "Créé le" : "Created"}{" "}
            {format(client.createdAt, "PP", { locale: dateLocale })}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Link href={`/account/developers/${client.id}`}>
            <Button variant="outline" size="sm" className="gap-1">
              <ExternalLink className="h-4 w-4" />
              {locale === "fr" ? "Modifier" : "Edit"}
            </Button>
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <RefreshCw className="h-4 w-4" />
                {locale === "fr" ? "Régénérer secret" : "Regenerate Secret"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {locale === "fr"
                    ? "Régénérer le secret"
                    : "Regenerate Secret"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {locale === "fr"
                    ? "Cette action invalidera l'ancien secret et révoquera tous les tokens existants. Les applications devront se réauthentifier."
                    : "This will invalidate the old secret and revoke all existing tokens. Applications will need to reauthenticate."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {locale === "fr" ? "Annuler" : "Cancel"}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                >
                  {isRegenerating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {locale === "fr" ? "Régénérer" : "Regenerate"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                {locale === "fr" ? "Supprimer" : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {locale === "fr"
                    ? "Supprimer l'application"
                    : "Delete Application"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {locale === "fr"
                    ? "Cette action est irréversible. Tous les tokens seront révoqués et l'application ne pourra plus accéder à l'API."
                    : "This action cannot be undone. All tokens will be revoked and the application will no longer be able to access the API."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {locale === "fr" ? "Annuler" : "Cancel"}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {locale === "fr" ? "Supprimer" : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
