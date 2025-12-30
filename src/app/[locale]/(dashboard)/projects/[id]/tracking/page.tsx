import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Code, CheckCircle2, Globe, Smartphone } from "lucide-react";
import { TrackingCodeCopy } from "@/components/websites/tracking-code-copy";
import { CopyButton } from "@/components/copy-button";

interface TrackingCodePageProps {
  params: Promise<{ id: string }>;
}

function generateProjectTrackingCode(trackingId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://globoanalytics.io";

  return `<!-- GloboAnalytics Analytics -->
<script async src="${baseUrl}/js/tracker.js" data-tid="${trackingId}"></script>
<!-- End GloboAnalytics Analytics -->`;
}

function generateMobileSDKCode(trackingId: string, platform: string): string {
  if (platform === "ios" || platform === "both") {
    return `// iOS - Swift
import GloboAnalyticsSDK

// In AppDelegate or App init
GloboAnalytics.configure(projectId: "${trackingId}")

// Track pageview
GloboAnalytics.trackPageview(path: "/home")

// Track custom event
GloboAnalytics.trackEvent(name: "button_click", properties: ["button": "signup"])`;
  }

  return `// Android - Kotlin
import io.globorank.sdk.GloboAnalytics

// In Application class
GloboAnalytics.configure(this, "${trackingId}")

// Track pageview
GloboAnalytics.trackPageview("/home")

// Track custom event
GloboAnalytics.trackEvent("button_click", mapOf("button" to "signup"))`;
}

export default async function ProjectTrackingCodePage({ params }: TrackingCodePageProps) {
  const { id } = await params;
  const session = await auth();
  const t = await getTranslations();
  const locale = await getLocale();

  if (!session?.user?.id) {
    return null;
  }

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    notFound();
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      trackingId: true,
      platform: true,
    },
  });

  if (!project) {
    notFound();
  }

  const webTrackingCode = generateProjectTrackingCode(project.trackingId);
  const mobileTrackingCode = generateMobileSDKCode(project.trackingId, project.platform);

  const showWeb = project.platform === "web" || project.platform === "both";
  const showMobile = project.platform === "mobile" || project.platform === "both";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/projects/${project.id}/stats`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t("projects.trackingCode")}</h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
      </div>

      {/* Success Message */}
      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <CardContent className="flex items-start gap-4 py-4">
          <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">
              {locale === "fr" ? "Projet créé avec succès !" : "Project created successfully!"}
            </p>
            <p className="text-sm text-green-800 dark:text-green-200">
              {locale === "fr"
                ? "Intégrez le code de tracking pour commencer à collecter des données."
                : "Integrate the tracking code to start collecting data."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tracking ID */}
      <Card>
        <CardHeader>
          <CardTitle>{t("projects.trackingId")}</CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Votre identifiant unique de tracking"
              : "Your unique tracking identifier"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm">
              {project.trackingId}
            </code>
            <CopyButton text={project.trackingId} />
          </div>
        </CardContent>
      </Card>

      {/* Tracking Code */}
      {project.platform === "both" ? (
        <Tabs defaultValue="web" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="web" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Web
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile
            </TabsTrigger>
          </TabsList>
          <TabsContent value="web">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  {t("projects.trackingCode")} - Web
                </CardTitle>
                <CardDescription>{t("projects.trackingCodeDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <TrackingCodeCopy code={webTrackingCode} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="mobile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  {t("projects.trackingCode")} - Mobile SDK
                </CardTitle>
                <CardDescription>
                  {locale === "fr"
                    ? "Intégrez le SDK dans votre application mobile"
                    : "Integrate the SDK into your mobile app"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrackingCodeCopy code={mobileTrackingCode} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : showWeb ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              {t("projects.trackingCode")}
            </CardTitle>
            <CardDescription>{t("projects.trackingCodeDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <TrackingCodeCopy code={webTrackingCode} />
          </CardContent>
        </Card>
      ) : showMobile ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              {t("projects.trackingCode")} - Mobile SDK
            </CardTitle>
            <CardDescription>
              {locale === "fr"
                ? "Intégrez le SDK dans votre application mobile"
                : "Integrate the SDK into your mobile app"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrackingCodeCopy code={mobileTrackingCode} />
          </CardContent>
        </Card>
      ) : null}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "fr" ? "Instructions d'installation" : "Installation Instructions"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">
              {locale === "fr" ? "1. Copiez le code" : "1. Copy the code"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {locale === "fr"
                ? "Cliquez sur le bouton 'Copier' ci-dessus pour copier le code de tracking."
                : "Click the 'Copy' button above to copy the tracking code."}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">
              {showWeb
                ? locale === "fr"
                  ? "2. Ajoutez-le à votre site"
                  : "2. Add it to your website"
                : locale === "fr"
                  ? "2. Ajoutez-le à votre application"
                  : "2. Add it to your app"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {showWeb
                ? locale === "fr"
                  ? "Collez le code juste avant la balise </head> de votre site web."
                  : "Paste the code just before the </head> tag of your website."
                : locale === "fr"
                  ? "Ajoutez le SDK et initialisez-le dans votre application."
                  : "Add the SDK and initialize it in your app."}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">
              {locale === "fr" ? "3. Vérifiez l'installation" : "3. Verify installation"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {locale === "fr"
                ? "Visitez votre application et vérifiez que les données apparaissent en temps réel."
                : "Visit your application and check that data appears in real-time."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Link href={`/projects/${project.id}/stats`}>
          <Button>{locale === "fr" ? "Voir les stats" : "View stats"}</Button>
        </Link>
      </div>
    </div>
  );
}
