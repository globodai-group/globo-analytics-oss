"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiDocumentationProps {
  locale: string;
}

interface Endpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: { en: string; fr: string };
  params?: {
    name: string;
    type: string;
    required: boolean;
    description: { en: string; fr: string };
  }[];
  body?: {
    name: string;
    type: string;
    required: boolean;
    description: { en: string; fr: string };
  }[];
  response: string;
  example: { curl: string; javascript: string; python: string };
}

const methodColors = {
  GET: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  POST: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  PATCH:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const endpoints: Endpoint[] = [
  {
    method: "GET",
    path: "/api/v1/account",
    description: {
      en: "Get current account information including plan details and usage.",
      fr: "Obtenir les informations du compte actuel incluant les détails du plan et l'utilisation.",
    },
    response: `{
  "id": "user_123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "locale": "en",
  "timezone": "UTC",
  "plan": {
    "id": 1,
    "name": "Pro",
    "status": "active",
    "expiresAt": null,
    "limits": {
      "websites": 10,
      "pageviews": 100000
    }
  },
  "usage": {
    "websites": 3
  },
  "createdAt": "2024-01-01T00:00:00.000Z"
}`,
    example: {
      curl: `curl -X GET "https://api.globorank.com/api/v1/account" \\
  -H "Authorization: Bearer YOUR_API_TOKEN"`,
      javascript: `const response = await fetch('https://api.globorank.com/api/v1/account', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_TOKEN'
  }
});
const account = await response.json();`,
      python: `import requests

response = requests.get(
    'https://api.globorank.com/api/v1/account',
    headers={'Authorization': 'Bearer YOUR_API_TOKEN'}
)
account = response.json()`,
    },
  },
  {
    method: "GET",
    path: "/api/v1/websites",
    description: {
      en: "List all websites for the authenticated user with pagination support.",
      fr: "Lister tous les sites web de l'utilisateur authentifié avec pagination.",
    },
    params: [
      {
        name: "page",
        type: "number",
        required: false,
        description: {
          en: "Page number (default: 1)",
          fr: "Numéro de page (défaut: 1)",
        },
      },
      {
        name: "limit",
        type: "number",
        required: false,
        description: {
          en: "Items per page (default: 20, max: 100)",
          fr: "Éléments par page (défaut: 20, max: 100)",
        },
      },
    ],
    response: `{
  "data": [
    {
      "id": 1,
      "url": "https://example.com",
      "domain": "example.com",
      "privacy": 0,
      "excludeBots": true,
      "pageviewsMonth": 1500,
      "isFavorite": false,
      "createdAt": "2024-01-15T00:00:00.000Z",
      "updatedAt": "2024-01-20T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}`,
    example: {
      curl: `curl -X GET "https://api.globorank.com/api/v1/websites?page=1&limit=20" \\
  -H "Authorization: Bearer YOUR_API_TOKEN"`,
      javascript: `const response = await fetch('https://api.globorank.com/api/v1/websites?page=1&limit=20', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_TOKEN'
  }
});
const { data, pagination } = await response.json();`,
      python: `import requests

response = requests.get(
    'https://api.globorank.com/api/v1/websites',
    headers={'Authorization': 'Bearer YOUR_API_TOKEN'},
    params={'page': 1, 'limit': 20}
)
result = response.json()`,
    },
  },
  {
    method: "POST",
    path: "/api/v1/websites",
    description: {
      en: "Create a new website to track.",
      fr: "Créer un nouveau site web à suivre.",
    },
    body: [
      {
        name: "url",
        type: "string",
        required: true,
        description: {
          en: "Full URL of the website (must be valid URL)",
          fr: "URL complète du site (doit être une URL valide)",
        },
      },
      {
        name: "privacy",
        type: "number",
        required: false,
        description: {
          en: "Privacy level: 0=Public, 1=Private, 2=Password protected",
          fr: "Niveau de confidentialité: 0=Public, 1=Privé, 2=Protégé par mot de passe",
        },
      },
      {
        name: "excludeBots",
        type: "boolean",
        required: false,
        description: {
          en: "Exclude bot traffic (default: false)",
          fr: "Exclure le trafic des bots (défaut: false)",
        },
      },
      {
        name: "excludeIps",
        type: "string",
        required: false,
        description: {
          en: "IPs to exclude (newline separated, supports wildcards and CIDR)",
          fr: "IPs à exclure (séparées par lignes, supporte wildcards et CIDR)",
        },
      },
      {
        name: "excludeParams",
        type: "string",
        required: false,
        description: {
          en: "URL params to exclude from tracking",
          fr: "Paramètres URL à exclure du tracking",
        },
      },
    ],
    response: `{
  "id": 2,
  "url": "https://newsite.com",
  "domain": "newsite.com",
  "privacy": 0,
  "excludeBots": false,
  "createdAt": "2024-01-25T00:00:00.000Z"
}`,
    example: {
      curl: `curl -X POST "https://api.globorank.com/api/v1/websites" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://newsite.com", "excludeBots": true}'`,
      javascript: `const response = await fetch('https://api.globorank.com/api/v1/websites', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://newsite.com',
    excludeBots: true
  })
});
const website = await response.json();`,
      python: `import requests

response = requests.post(
    'https://api.globorank.com/api/v1/websites',
    headers={
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    json={'url': 'https://newsite.com', 'excludeBots': True}
)
website = response.json()`,
    },
  },
  {
    method: "GET",
    path: "/api/v1/websites/{id}",
    description: {
      en: "Get details of a specific website.",
      fr: "Obtenir les détails d'un site web spécifique.",
    },
    params: [
      {
        name: "id",
        type: "number",
        required: true,
        description: { en: "Website ID", fr: "ID du site web" },
      },
    ],
    response: `{
  "id": 1,
  "url": "https://example.com",
  "domain": "example.com",
  "privacy": 0,
  "excludeBots": true,
  "excludeIps": null,
  "excludeParams": null,
  "pageviewsMonth": 1500,
  "isFavorite": false,
  "createdAt": "2024-01-15T00:00:00.000Z",
  "updatedAt": "2024-01-20T00:00:00.000Z"
}`,
    example: {
      curl: `curl -X GET "https://api.globorank.com/api/v1/websites/1" \\
  -H "Authorization: Bearer YOUR_API_TOKEN"`,
      javascript: `const response = await fetch('https://api.globorank.com/api/v1/websites/1', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_TOKEN'
  }
});
const website = await response.json();`,
      python: `import requests

response = requests.get(
    'https://api.globorank.com/api/v1/websites/1',
    headers={'Authorization': 'Bearer YOUR_API_TOKEN'}
)
website = response.json()`,
    },
  },
  {
    method: "PATCH",
    path: "/api/v1/websites/{id}",
    description: {
      en: "Update website settings.",
      fr: "Mettre à jour les paramètres du site web.",
    },
    params: [
      {
        name: "id",
        type: "number",
        required: true,
        description: { en: "Website ID", fr: "ID du site web" },
      },
    ],
    body: [
      {
        name: "privacy",
        type: "number",
        required: false,
        description: {
          en: "Privacy level: 0=Public, 1=Private, 2=Password protected",
          fr: "Niveau de confidentialité: 0=Public, 1=Privé, 2=Protégé par mot de passe",
        },
      },
      {
        name: "excludeBots",
        type: "boolean",
        required: false,
        description: {
          en: "Exclude bot traffic",
          fr: "Exclure le trafic des bots",
        },
      },
      {
        name: "excludeIps",
        type: "string",
        required: false,
        description: { en: "IPs to exclude", fr: "IPs à exclure" },
      },
      {
        name: "excludeParams",
        type: "string",
        required: false,
        description: {
          en: "URL params to exclude",
          fr: "Paramètres URL à exclure",
        },
      },
    ],
    response: `{
  "id": 1,
  "url": "https://example.com",
  "domain": "example.com",
  "privacy": 1,
  "excludeBots": true,
  "excludeIps": "192.168.1.*",
  "excludeParams": "utm_source,utm_medium",
  "updatedAt": "2024-01-25T00:00:00.000Z"
}`,
    example: {
      curl: `curl -X PATCH "https://api.globorank.com/api/v1/websites/1" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"privacy": 1, "excludeBots": true}'`,
      javascript: `const response = await fetch('https://api.globorank.com/api/v1/websites/1', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer YOUR_API_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    privacy: 1,
    excludeBots: true
  })
});
const website = await response.json();`,
      python: `import requests

response = requests.patch(
    'https://api.globorank.com/api/v1/websites/1',
    headers={
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    json={'privacy': 1, 'excludeBots': True}
)
website = response.json()`,
    },
  },
  {
    method: "DELETE",
    path: "/api/v1/websites/{id}",
    description: {
      en: "Delete a website and all its analytics data.",
      fr: "Supprimer un site web et toutes ses données analytiques.",
    },
    params: [
      {
        name: "id",
        type: "number",
        required: true,
        description: { en: "Website ID", fr: "ID du site web" },
      },
    ],
    response: `{
  "success": true
}`,
    example: {
      curl: `curl -X DELETE "https://api.globorank.com/api/v1/websites/1" \\
  -H "Authorization: Bearer YOUR_API_TOKEN"`,
      javascript: `const response = await fetch('https://api.globorank.com/api/v1/websites/1', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer YOUR_API_TOKEN'
  }
});
const result = await response.json();`,
      python: `import requests

response = requests.delete(
    'https://api.globorank.com/api/v1/websites/1',
    headers={'Authorization': 'Bearer YOUR_API_TOKEN'}
)
result = response.json()`,
    },
  },
  {
    method: "GET",
    path: "/api/v1/stats/{id}",
    description: {
      en: "Get analytics statistics for a website. Returns overview data by default, or specific stat type if specified.",
      fr: "Obtenir les statistiques analytiques d'un site web. Retourne les données d'aperçu par défaut, ou un type de stat spécifique si précisé.",
    },
    params: [
      {
        name: "id",
        type: "number",
        required: true,
        description: { en: "Website ID", fr: "ID du site web" },
      },
      {
        name: "type",
        type: "string",
        required: false,
        description: {
          en: "Stat type: visitors, pageviews, page, landing_page, referrer, browser, os, device, country, city, continent, language, resolution, campaign, event",
          fr: "Type de stat: visitors, pageviews, page, landing_page, referrer, browser, os, device, country, city, continent, language, resolution, campaign, event",
        },
      },
      {
        name: "from",
        type: "string",
        required: false,
        description: {
          en: "Start date (ISO 8601, default: 30 days ago)",
          fr: "Date de début (ISO 8601, défaut: 30 jours)",
        },
      },
      {
        name: "to",
        type: "string",
        required: false,
        description: {
          en: "End date (ISO 8601, default: now)",
          fr: "Date de fin (ISO 8601, défaut: maintenant)",
        },
      },
      {
        name: "page",
        type: "number",
        required: false,
        description: {
          en: "Page number for stat type data",
          fr: "Numéro de page pour les données de type stat",
        },
      },
      {
        name: "limit",
        type: "number",
        required: false,
        description: {
          en: "Items per page (max: 100)",
          fr: "Éléments par page (max: 100)",
        },
      },
    ],
    response: `// Overview (no type specified)
{
  "websiteId": 1,
  "dateRange": { "from": "2024-01-01", "to": "2024-01-31" },
  "overview": {
    "visitors": 5000,
    "pageviews": 15000
  },
  "chart": {
    "visitors": [{ "date": "2024-01-01", "count": 150 }, ...],
    "pageviews": [{ "date": "2024-01-01", "count": 450 }, ...]
  }
}

// With type specified (e.g., type=browser)
{
  "websiteId": 1,
  "type": "browser",
  "dateRange": { "from": "2024-01-01", "to": "2024-01-31" },
  "data": [
    { "value": "Chrome", "count": 3000, "percentage": 60.0 },
    { "value": "Firefox", "count": 1000, "percentage": 20.0 },
    { "value": "Safari", "count": 750, "percentage": 15.0 },
    { "value": "Edge", "count": 250, "percentage": 5.0 }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 4, "totalPages": 1 }
}`,
    example: {
      curl: `# Get overview stats
curl -X GET "https://api.globorank.com/api/v1/stats/1?from=2024-01-01&to=2024-01-31" \\
  -H "Authorization: Bearer YOUR_API_TOKEN"

# Get browser stats
curl -X GET "https://api.globorank.com/api/v1/stats/1?type=browser&from=2024-01-01&to=2024-01-31" \\
  -H "Authorization: Bearer YOUR_API_TOKEN"`,
      javascript: `// Get overview stats
const response = await fetch(
  'https://api.globorank.com/api/v1/stats/1?from=2024-01-01&to=2024-01-31',
  {
    method: 'GET',
    headers: { 'Authorization': 'Bearer YOUR_API_TOKEN' }
  }
);
const stats = await response.json();

// Get browser stats
const browserResponse = await fetch(
  'https://api.globorank.com/api/v1/stats/1?type=browser',
  {
    method: 'GET',
    headers: { 'Authorization': 'Bearer YOUR_API_TOKEN' }
  }
);
const browserStats = await browserResponse.json();`,
      python: `import requests

# Get overview stats
response = requests.get(
    'https://api.globorank.com/api/v1/stats/1',
    headers={'Authorization': 'Bearer YOUR_API_TOKEN'},
    params={'from': '2024-01-01', 'to': '2024-01-31'}
)
stats = response.json()

# Get browser stats
browser_response = requests.get(
    'https://api.globorank.com/api/v1/stats/1',
    headers={'Authorization': 'Bearer YOUR_API_TOKEN'},
    params={'type': 'browser'}
)
browser_stats = browser_response.json()`,
    },
  },
];

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

function EndpointCard({
  endpoint,
  locale,
}: {
  endpoint: Endpoint;
  locale: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="mb-4">
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge
              className={cn("font-mono text-xs", methodColors[endpoint.method])}
            >
              {endpoint.method}
            </Badge>
            <code className="text-sm font-mono">{endpoint.path}</code>
          </div>
          {expanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
        <CardDescription>
          {locale === "fr" ? endpoint.description.fr : endpoint.description.en}
        </CardDescription>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6">
          {/* Parameters */}
          {endpoint.params && endpoint.params.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">
                {locale === "fr" ? "Paramètres" : "Parameters"}
              </h4>
              <div className="space-y-2">
                {endpoint.params.map((param) => (
                  <div
                    key={param.name}
                    className="flex items-start gap-2 text-sm"
                  >
                    <code className="bg-muted px-2 py-1 rounded font-mono">
                      {param.name}
                    </code>
                    <span className="text-muted-foreground">
                      ({param.type})
                    </span>
                    {param.required && (
                      <Badge variant="outline" className="text-xs">
                        {locale === "fr" ? "requis" : "required"}
                      </Badge>
                    )}
                    <span className="text-muted-foreground">
                      —{" "}
                      {locale === "fr"
                        ? param.description.fr
                        : param.description.en}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request Body */}
          {endpoint.body && endpoint.body.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">
                {locale === "fr" ? "Corps de la requête" : "Request Body"}
              </h4>
              <div className="space-y-2">
                {endpoint.body.map((field) => (
                  <div
                    key={field.name}
                    className="flex items-start gap-2 text-sm"
                  >
                    <code className="bg-muted px-2 py-1 rounded font-mono">
                      {field.name}
                    </code>
                    <span className="text-muted-foreground">
                      ({field.type})
                    </span>
                    {field.required && (
                      <Badge variant="outline" className="text-xs">
                        {locale === "fr" ? "requis" : "required"}
                      </Badge>
                    )}
                    <span className="text-muted-foreground">
                      —{" "}
                      {locale === "fr"
                        ? field.description.fr
                        : field.description.en}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Response */}
          <div>
            <h4 className="font-semibold mb-2">
              {locale === "fr" ? "Réponse" : "Response"}
            </h4>
            <CodeBlock code={endpoint.response} language="json" />
          </div>

          {/* Examples */}
          <div>
            <h4 className="font-semibold mb-2">
              {locale === "fr" ? "Exemples" : "Examples"}
            </h4>
            <Tabs defaultValue="curl">
              <TabsList>
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
              </TabsList>
              <TabsContent value="curl" className="mt-2">
                <CodeBlock code={endpoint.example.curl} language="bash" />
              </TabsContent>
              <TabsContent value="javascript" className="mt-2">
                <CodeBlock
                  code={endpoint.example.javascript}
                  language="javascript"
                />
              </TabsContent>
              <TabsContent value="python" className="mt-2">
                <CodeBlock code={endpoint.example.python} language="python" />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function ApiDocumentation({ locale }: ApiDocumentationProps) {
  const baseUrl = "https://api.globorank.com";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Getting Started */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">
          {locale === "fr" ? "Démarrage rapide" : "Getting Started"}
        </h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">
                {locale === "fr" ? "URL de base" : "Base URL"}
              </h3>
              <code className="bg-muted px-3 py-2 rounded block">
                {baseUrl}
              </code>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                {locale === "fr" ? "Authentification" : "Authentication"}
              </h3>
              <p className="text-muted-foreground mb-2">
                {locale === "fr"
                  ? "Toutes les requêtes API nécessitent un token Bearer dans l'en-tête Authorization. Vous pouvez générer un token API dans les paramètres de votre compte."
                  : "All API requests require a Bearer token in the Authorization header. You can generate an API token in your account settings."}
              </p>
              <CodeBlock
                code="Authorization: Bearer YOUR_API_TOKEN"
                language="text"
              />
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                {locale === "fr" ? "Limite de requêtes" : "Rate Limiting"}
              </h3>
              <p className="text-muted-foreground">
                {locale === "fr"
                  ? "L'API est limitée à 100 requêtes par minute par adresse IP. Les réponses incluent des en-têtes de limite de taux."
                  : "The API is limited to 100 requests per minute per IP address. Responses include rate limit headers."}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                {locale === "fr" ? "Codes d'erreur" : "Error Codes"}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <code className="bg-muted px-2 py-1 rounded">400</code> —{" "}
                  {locale === "fr" ? "Requête invalide" : "Bad Request"}
                </div>
                <div>
                  <code className="bg-muted px-2 py-1 rounded">401</code> —{" "}
                  {locale === "fr" ? "Non autorisé" : "Unauthorized"}
                </div>
                <div>
                  <code className="bg-muted px-2 py-1 rounded">403</code> —{" "}
                  {locale === "fr" ? "Interdit" : "Forbidden"}
                </div>
                <div>
                  <code className="bg-muted px-2 py-1 rounded">404</code> —{" "}
                  {locale === "fr" ? "Non trouvé" : "Not Found"}
                </div>
                <div>
                  <code className="bg-muted px-2 py-1 rounded">409</code> —{" "}
                  {locale === "fr" ? "Conflit" : "Conflict"}
                </div>
                <div>
                  <code className="bg-muted px-2 py-1 rounded">429</code> —{" "}
                  {locale === "fr" ? "Trop de requêtes" : "Too Many Requests"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Endpoints */}
      <section>
        <h2 className="text-2xl font-bold mb-4">
          {locale === "fr" ? "Endpoints" : "Endpoints"}
        </h2>

        {/* Account */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-muted-foreground">
            {locale === "fr" ? "Compte" : "Account"}
          </h3>
          {endpoints
            .filter((e) => e.path.includes("/account"))
            .map((endpoint) => (
              <EndpointCard
                key={`${endpoint.method}-${endpoint.path}`}
                endpoint={endpoint}
                locale={locale}
              />
            ))}
        </div>

        {/* Websites */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-muted-foreground">
            {locale === "fr" ? "Sites Web" : "Websites"}
          </h3>
          {endpoints
            .filter((e) => e.path.includes("/websites"))
            .map((endpoint) => (
              <EndpointCard
                key={`${endpoint.method}-${endpoint.path}`}
                endpoint={endpoint}
                locale={locale}
              />
            ))}
        </div>

        {/* Stats */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-muted-foreground">
            {locale === "fr" ? "Statistiques" : "Statistics"}
          </h3>
          {endpoints
            .filter((e) => e.path.includes("/stats"))
            .map((endpoint) => (
              <EndpointCard
                key={`${endpoint.method}-${endpoint.path}`}
                endpoint={endpoint}
                locale={locale}
              />
            ))}
        </div>
      </section>
    </div>
  );
}
