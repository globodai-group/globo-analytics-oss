import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Key, Code, ExternalLink } from "lucide-react";
import { OAuthClientCard } from "@/components/developers/oauth-client-card";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";

export default async function DevelopersPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [clients, user] = await Promise.all([
    prisma.oAuthClient.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { tokens: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { apiToken: true },
    }),
  ]);

  const dateLocale = locale === "fr" ? fr : enUS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/account">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {locale === "fr" ? "Développeurs" : "Developers"}
            </h1>
            <p className="text-muted-foreground">
              {locale === "fr"
                ? "Gérez vos applications OAuth et accédez à l'API"
                : "Manage your OAuth applications and API access"}
            </p>
          </div>
        </div>
        <Link href="/account/developers/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {locale === "fr" ? "Nouvelle application" : "New Application"}
          </Button>
        </Link>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Code className="h-4 w-4" />
              {locale === "fr" ? "Documentation API" : "API Documentation"}
            </CardTitle>
            <CardDescription>
              {locale === "fr"
                ? "Consultez la documentation complète de l'API"
                : "View the complete API documentation"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/developers/docs">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                {locale === "fr"
                  ? "Voir la documentation"
                  : "View Documentation"}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="h-4 w-4" />
              {locale === "fr" ? "Token API personnel" : "Personal API Token"}
            </CardTitle>
            <CardDescription>
              {locale === "fr"
                ? "Utilisez votre token pour des scripts personnels"
                : "Use your token for personal scripts"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <code className="block p-2 bg-muted rounded text-xs font-mono break-all">
              {user?.apiToken ||
                (locale === "fr" ? "Aucun token généré" : "No token generated")}
            </code>
          </CardContent>
        </Card>
      </div>

      {/* OAuth Applications */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {locale === "fr" ? "Applications OAuth" : "OAuth Applications"}
        </h2>

        {clients.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Key className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {locale === "fr" ? "Aucune application" : "No applications"}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {locale === "fr"
                  ? "Créez une application OAuth pour intégrer GloboAnalytics à vos services."
                  : "Create an OAuth application to integrate GloboAnalytics with your services."}
              </p>
              <Link href="/account/developers/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  {locale === "fr"
                    ? "Créer une application"
                    : "Create Application"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {clients.map((client) => (
              <OAuthClientCard
                key={client.id}
                client={{
                  id: client.id,
                  clientId: client.clientId,
                  name: client.name,
                  description: client.description,
                  redirectUris: client.redirectUris,
                  scopes: client.scopes,
                  isActive: client.isActive,
                  createdAt: client.createdAt,
                  tokenCount: client._count.tokens,
                }}
                locale={locale}
                dateLocale={dateLocale}
              />
            ))}
          </div>
        )}
      </div>

      {/* OAuth Flow Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {locale === "fr" ? "Comment utiliser OAuth" : "How to use OAuth"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Badge>1</Badge>
              <h4 className="font-medium">
                {locale === "fr" ? "Autorisation" : "Authorization"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {locale === "fr"
                  ? "Redirigez l'utilisateur vers /api/oauth/authorize"
                  : "Redirect user to /api/oauth/authorize"}
              </p>
            </div>
            <div className="space-y-2">
              <Badge>2</Badge>
              <h4 className="font-medium">
                {locale === "fr" ? "Échange de code" : "Code Exchange"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {locale === "fr"
                  ? "Échangez le code contre un token via /api/oauth/token"
                  : "Exchange code for token via /api/oauth/token"}
              </p>
            </div>
            <div className="space-y-2">
              <Badge>3</Badge>
              <h4 className="font-medium">
                {locale === "fr" ? "Appels API" : "API Calls"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {locale === "fr"
                  ? "Utilisez le token dans l'en-tête Authorization"
                  : "Use token in Authorization header"}
              </p>
            </div>
          </div>

          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
            <code>{`# Authorization URL
GET /api/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  response_type=code&
  scope=read:stats read:projects

# Token Exchange
POST /api/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=AUTHORIZATION_CODE&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET&
redirect_uri=YOUR_REDIRECT_URI

# API Request
GET /api/v2/projects
Authorization: Bearer ACCESS_TOKEN`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
