import { notFound, redirect } from "next/navigation";
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
import { ArrowLeft, Shield, Users, PieChart } from "lucide-react";
import { ConsentConfigForm } from "@/components/consent/consent-config-form";
import { ConsentBannerPreview } from "@/components/consent/consent-banner-preview";

interface ConsentSettingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConsentSettingsPage({
  params,
}: ConsentSettingsPageProps) {
  const { id } = await params;
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user?.id) {
    redirect("/login");
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
  });

  if (!project) {
    notFound();
  }

  const config = await prisma.consentConfig.findUnique({
    where: { projectId },
  });

  // Get consent stats
  const [totalVisitors, consentedVisitors, analyticsConsent, marketingConsent] =
    await Promise.all([
      prisma.visitorConsent.count({
        where: { projectId },
      }),
      prisma.visitorConsent.count({
        where: {
          projectId,
          consentedAt: { not: null },
        },
      }),
      prisma.visitorConsent.count({
        where: {
          projectId,
          analytics: true,
        },
      }),
      prisma.visitorConsent.count({
        where: {
          projectId,
          marketing: true,
        },
      }),
    ]);

  const consentRate =
    totalVisitors > 0
      ? Math.round((consentedVisitors / totalVisitors) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/projects/${project.id}/settings`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {locale === "fr" ? "Gestion du Consentement" : "Consent Management"}
          </h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              {locale === "fr" ? "Visiteurs" : "Visitors"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisitors}</div>
            <p className="text-xs text-muted-foreground">
              {locale === "fr" ? "Total avec décision" : "Total with decision"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              {locale === "fr" ? "Taux de consentement" : "Consent Rate"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consentRate}%</div>
            <p className="text-xs text-muted-foreground">
              {consentedVisitors}{" "}
              {locale === "fr" ? "ont consenti" : "consented"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4 text-purple-500" />
              {locale === "fr" ? "Analytics" : "Analytics"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsConsent}</div>
            <p className="text-xs text-muted-foreground">
              {locale === "fr" ? "Ont accepté analytics" : "Accepted analytics"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4 text-orange-500" />
              {locale === "fr" ? "Marketing" : "Marketing"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketingConsent}</div>
            <p className="text-xs text-muted-foreground">
              {locale === "fr" ? "Ont accepté marketing" : "Accepted marketing"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === "fr" ? "Configuration" : "Configuration"}
            </CardTitle>
            <CardDescription>
              {locale === "fr"
                ? "Configurez la bannière de consentement GDPR/CCPA."
                : "Configure your GDPR/CCPA consent banner."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConsentConfigForm
              projectId={project.id}
              locale={locale}
              initialData={
                config
                  ? {
                      requireConsent: config.requireConsent,
                      consentMode: config.consentMode,
                      // SECURITY: Validate bannerPosition from DB, fallback to "bottom"
                      bannerPosition: (["top", "bottom", "center"].includes(
                        config.bannerPosition,
                      )
                        ? config.bannerPosition
                        : "bottom") as "top" | "bottom" | "center",
                      bannerText: config.bannerText || "",
                      privacyUrl: config.privacyUrl || "",
                      consentDuration: config.consentDuration,
                    }
                  : undefined
              }
            />
          </CardContent>
        </Card>

        {/* Preview and Code */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{locale === "fr" ? "Aperçu" : "Preview"}</CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Prévisualisation de la bannière de consentement."
                  : "Preview of the consent banner."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConsentBannerPreview
                position={config?.bannerPosition || "bottom"}
                text={
                  config?.bannerText ||
                  (locale === "fr"
                    ? "Nous utilisons des cookies pour améliorer votre expérience."
                    : "We use cookies to improve your experience.")
                }
                privacyUrl={config?.privacyUrl || ""}
                locale={locale}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {locale === "fr" ? "Code d'intégration" : "Integration Code"}
              </CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Ajoutez ce code avant le script de tracking."
                  : "Add this code before the tracking script."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                <code>{`<!-- GloboAnalytics Consent Banner -->
<script src="${process.env.NEXT_PUBLIC_APP_URL || ""}/js/consent-banner.js"
        data-project="${project.trackingId}">
</script>

<!-- Then add the tracking script -->
<script src="${process.env.NEXT_PUBLIC_APP_URL || ""}/js/tracker.js"
        data-tid="${project.trackingId}"
        data-consent-required="${config?.requireConsent ?? true}">
</script>`}</code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
