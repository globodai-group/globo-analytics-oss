import { redirect, notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2 } from "lucide-react";
import { OAuthAuthorizeForm } from "@/components/oauth/oauth-authorize-form";

interface OAuthAuthorizePageProps {
  searchParams: Promise<{
    client_id?: string;
    redirect_uri?: string;
    scope?: string;
    state?: string;
  }>;
}

export default async function OAuthAuthorizePage({ searchParams }: OAuthAuthorizePageProps) {
  const params = await searchParams;
  const session = await auth();
  const locale = await getLocale();

  // Redirect to login if not authenticated
  if (!session?.user?.id) {
    const currentUrl = new URL(
      "/oauth/authorize",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    );
    Object.entries(params).forEach(([key, value]) => {
      if (value) currentUrl.searchParams.set(key, value);
    });
    redirect(`/login?callbackUrl=${encodeURIComponent(currentUrl.toString())}`);
  }

  const { client_id, redirect_uri, scope, state } = params;

  if (!client_id || !redirect_uri) {
    notFound();
  }

  // Find client
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId: client_id },
    include: {
      user: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  if (!client || !client.isActive) {
    notFound();
  }

  // Validate redirect URI
  if (!client.redirectUris.includes(redirect_uri)) {
    notFound();
  }

  const scopes = scope ? scope.split(" ") : [];

  // Scope descriptions
  const scopeDescriptions: Record<string, { en: string; fr: string }> = {
    "read:stats": {
      en: "View your analytics data",
      fr: "Voir vos données analytics",
    },
    "read:projects": {
      en: "View your projects",
      fr: "Voir vos projets",
    },
    "write:projects": {
      en: "Create and modify projects",
      fr: "Créer et modifier des projets",
    },
    "read:goals": {
      en: "View your goals",
      fr: "Voir vos objectifs",
    },
    "write:goals": {
      en: "Create and modify goals",
      fr: "Créer et modifier des objectifs",
    },
    "read:segments": {
      en: "View your segments",
      fr: "Voir vos segments",
    },
    "write:segments": {
      en: "Create and modify segments",
      fr: "Créer et modifier des segments",
    },
    "read:reports": {
      en: "View your reports",
      fr: "Voir vos rapports",
    },
    "write:reports": {
      en: "Create and modify reports",
      fr: "Créer et modifier des rapports",
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{locale === "fr" ? "Autoriser l'accès" : "Authorize Access"}</CardTitle>
          <CardDescription>
            <span className="font-medium text-foreground">{client.name}</span>{" "}
            {locale === "fr"
              ? "demande l'accès à votre compte"
              : "is requesting access to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* App Info */}
          <div className="text-center text-sm text-muted-foreground">
            {client.description && <p className="mb-2">{client.description}</p>}
            <p>
              {locale === "fr" ? "Par" : "By"} {client.user.firstName} {client.user.lastName}
            </p>
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <p className="text-sm font-medium">
              {locale === "fr" ? "Cette application pourra :" : "This app will be able to:"}
            </p>
            <div className="space-y-2">
              {scopes.map((scopeKey) => (
                <div key={scopeKey} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{scopeDescriptions[scopeKey]?.[locale as "en" | "fr"] || scopeKey}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scopes badges */}
          <div className="flex flex-wrap gap-2 justify-center">
            {scopes.map((s) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
          </div>

          {/* Authorization Form */}
          <OAuthAuthorizeForm
            clientId={client.id}
            clientPublicId={client_id}
            redirectUri={redirect_uri}
            scopes={scopes}
            state={state}
            locale={locale}
          />

          {/* Security notice */}
          <p className="text-xs text-center text-muted-foreground">
            {locale === "fr"
              ? "Vous pouvez révoquer cet accès à tout moment depuis les paramètres de votre compte."
              : "You can revoke this access at any time from your account settings."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
