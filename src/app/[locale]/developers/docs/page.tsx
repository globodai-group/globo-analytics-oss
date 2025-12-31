import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Code,
  Key,
  BarChart3,
  Target,
  Users,
  FileText,
  Shield,
} from "lucide-react";

export default async function ApiDocsPage() {
  const locale = await getLocale();

  const t = {
    title: locale === "fr" ? "Documentation API" : "API Documentation",
    subtitle:
      locale === "fr"
        ? "Intégrez GloboAnalytics Analytics dans vos applications"
        : "Integrate GloboAnalytics Analytics into your applications",
    back: locale === "fr" ? "Retour" : "Back",
    authentication: locale === "fr" ? "Authentification" : "Authentication",
    endpoints: locale === "fr" ? "Endpoints" : "Endpoints",
    examples: locale === "fr" ? "Exemples" : "Examples",
    rateLimit: locale === "fr" ? "Limites" : "Rate Limits",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/account/developers">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{t.title}</h1>
              <p className="text-muted-foreground">{t.subtitle}</p>
            </div>
          </div>
          <Badge variant="outline">v2.0</Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="auth" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="auth">{t.authentication}</TabsTrigger>
            <TabsTrigger value="endpoints">{t.endpoints}</TabsTrigger>
            <TabsTrigger value="examples">{t.examples}</TabsTrigger>
            <TabsTrigger value="limits">{t.rateLimit}</TabsTrigger>
          </TabsList>

          {/* Authentication */}
          <TabsContent value="auth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  OAuth 2.0 Authentication
                </CardTitle>
                <CardDescription>
                  {locale === "fr"
                    ? "GloboAnalytics utilise OAuth 2.0 pour l'authentification API."
                    : "GloboAnalytics uses OAuth 2.0 for API authentication."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">1. Authorization Request</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`GET /api/oauth/authorize?
  client_id=YOUR_CLIENT_ID
  &redirect_uri=https://your-app.com/callback
  &response_type=code
  &scope=read:stats read:projects
  &state=random_state_string`}</code>
                  </pre>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">2. Token Exchange</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`POST /api/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTHORIZATION_CODE
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&redirect_uri=https://your-app.com/callback`}</code>
                  </pre>

                  <p className="text-sm text-muted-foreground">
                    {locale === "fr" ? "Réponse:" : "Response:"}
                  </p>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`{
  "access_token": "gra_...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "grr_...",
  "scope": "read:stats read:projects"
}`}</code>
                  </pre>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">3. Using the Token</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`GET /api/v2/projects
Authorization: Bearer YOUR_ACCESS_TOKEN`}</code>
                  </pre>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Available Scopes</h4>
                  <div className="grid gap-2">
                    {[
                      { scope: "read:stats", desc: "View analytics data" },
                      { scope: "read:projects", desc: "View projects" },
                      { scope: "write:projects", desc: "Create/edit projects" },
                      { scope: "read:goals", desc: "View goals" },
                      { scope: "write:goals", desc: "Create/edit goals" },
                      { scope: "read:segments", desc: "View segments" },
                      { scope: "write:segments", desc: "Create/edit segments" },
                      { scope: "read:reports", desc: "View reports" },
                      { scope: "write:reports", desc: "Create/edit reports" },
                    ].map((item) => (
                      <div
                        key={item.scope}
                        className="flex items-center gap-4 text-sm"
                      >
                        <code className="bg-muted px-2 py-1 rounded font-mono">
                          {item.scope}
                        </code>
                        <span className="text-muted-foreground">
                          {item.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Endpoints */}
          <TabsContent value="endpoints" className="space-y-6">
            {/* Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Projects
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <EndpointRow
                  method="GET"
                  path="/api/v2/projects"
                  description="List all projects"
                />
                <EndpointRow
                  method="GET"
                  path="/api/v2/projects/:id"
                  description="Get project details"
                />
                <EndpointRow
                  method="POST"
                  path="/api/v2/projects"
                  description="Create a new project"
                />
                <EndpointRow
                  method="PUT"
                  path="/api/v2/projects/:id"
                  description="Update a project"
                />
                <EndpointRow
                  method="DELETE"
                  path="/api/v2/projects/:id"
                  description="Delete a project"
                />
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <EndpointRow
                  method="GET"
                  path="/api/v2/stats/:projectId/overview"
                  description="Get overview stats"
                />
                <EndpointRow
                  method="GET"
                  path="/api/v2/stats/:projectId/visitors"
                  description="Get visitor data"
                />
                <EndpointRow
                  method="GET"
                  path="/api/v2/stats/:projectId/pages"
                  description="Get page analytics"
                />
                <EndpointRow
                  method="GET"
                  path="/api/v2/stats/:projectId/sources"
                  description="Get traffic sources"
                />
                <EndpointRow
                  method="GET"
                  path="/api/v2/stats/:projectId/geo"
                  description="Get geographic data"
                />
              </CardContent>
            </Card>

            {/* Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <EndpointRow
                  method="GET"
                  path="/api/v2/projects/:id/goals"
                  description="List project goals"
                />
                <EndpointRow
                  method="POST"
                  path="/api/v2/projects/:id/goals"
                  description="Create a goal"
                />
                <EndpointRow
                  method="GET"
                  path="/api/v2/goals/:goalId/conversions"
                  description="Get goal conversions"
                />
              </CardContent>
            </Card>

            {/* Segments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Segments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <EndpointRow
                  method="GET"
                  path="/api/v2/projects/:id/segments"
                  description="List project segments"
                />
                <EndpointRow
                  method="POST"
                  path="/api/v2/projects/:id/segments"
                  description="Create a segment"
                />
                <EndpointRow
                  method="GET"
                  path="/api/v2/segments/:id/apply"
                  description="Apply segment to stats"
                />
              </CardContent>
            </Card>

            {/* Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <EndpointRow
                  method="GET"
                  path="/api/v2/projects/:id/reports"
                  description="List scheduled reports"
                />
                <EndpointRow
                  method="POST"
                  path="/api/v2/projects/:id/reports"
                  description="Create a scheduled report"
                />
                <EndpointRow
                  method="POST"
                  path="/api/v2/reports/:id/send"
                  description="Send report immediately"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Examples */}
          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>JavaScript / Node.js</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`const response = await fetch('https://globorank.com/api/v2/projects', {
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  }
});

const projects = await response.json();
console.log(projects);`}</code>
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Python</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`import requests

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://globorank.com/api/v2/projects',
    headers=headers
)

projects = response.json()
print(projects)`}</code>
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>cURL</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`curl -X GET "https://globorank.com/api/v2/projects" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json"`}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rate Limits */}
          <TabsContent value="limits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {locale === "fr" ? "Limites de requêtes" : "Rate Limits"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold">Free Plan</h4>
                    <p className="text-2xl font-bold mt-2">100</p>
                    <p className="text-sm text-muted-foreground">
                      {locale === "fr"
                        ? "requêtes par minute"
                        : "requests per minute"}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold">Pro Plan</h4>
                    <p className="text-2xl font-bold mt-2">1000</p>
                    <p className="text-sm text-muted-foreground">
                      {locale === "fr"
                        ? "requêtes par minute"
                        : "requests per minute"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">
                    {locale === "fr"
                      ? "En-têtes de réponse"
                      : "Response Headers"}
                  </h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <code>X-RateLimit-Limit</code>
                      <span className="text-muted-foreground">
                        {locale === "fr" ? "Limite totale" : "Total limit"}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <code>X-RateLimit-Remaining</code>
                      <span className="text-muted-foreground">
                        {locale === "fr"
                          ? "Requêtes restantes"
                          : "Remaining requests"}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <code>X-RateLimit-Reset</code>
                      <span className="text-muted-foreground">
                        {locale === "fr"
                          ? "Timestamp de reset"
                          : "Reset timestamp"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                    {locale === "fr"
                      ? "Dépassement de limite"
                      : "Rate Limit Exceeded"}
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    {locale === "fr"
                      ? "En cas de dépassement, vous recevrez une erreur 429. Attendez le reset avant de réessayer."
                      : "When exceeded, you'll receive a 429 error. Wait for the reset before retrying."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EndpointRow({
  method,
  path,
  description,
}: {
  method: string;
  path: string;
  description: string;
}) {
  const methodColors: Record<string, string> = {
    GET: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    POST: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    PUT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <div className="flex items-center gap-4 p-2 rounded hover:bg-muted transition-colors">
      <Badge className={methodColors[method]}>{method}</Badge>
      <code className="flex-1 text-sm font-mono">{path}</code>
      <span className="text-sm text-muted-foreground">{description}</span>
    </div>
  );
}
