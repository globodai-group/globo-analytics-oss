import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateTrackingCode } from "@/lib/tracking";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Code, CheckCircle2 } from "lucide-react";
import { TrackingCodeCopy } from "@/components/websites/tracking-code-copy";

interface TrackingCodePageProps {
  params: Promise<{ id: string }>;
}

export default async function TrackingCodePage({
  params,
}: TrackingCodePageProps) {
  const { id } = await params;
  const session = await auth();
  const t = await getTranslations();
  const locale = await getLocale();

  if (!session?.user?.id) {
    return null;
  }

  const websiteId = parseInt(id);
  if (isNaN(websiteId)) {
    notFound();
  }

  const website = await prisma.website.findFirst({
    where: {
      id: websiteId,
      userId: session.user.id,
    },
    select: {
      id: true,
      domain: true,
    },
  });

  if (!website) {
    notFound();
  }

  const trackingCode = generateTrackingCode();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/websites">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t("websites.trackingCode")}</h1>
          <p className="text-muted-foreground">{website.domain}</p>
        </div>
      </div>

      {/* Success Message */}
      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <CardContent className="flex items-start gap-4 py-4">
          <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">
              {locale === "fr"
                ? "Site ajouté avec succès !"
                : "Website added successfully!"}
            </p>
            <p className="text-sm text-green-800 dark:text-green-200">
              {locale === "fr"
                ? "Copiez le code ci-dessous et ajoutez-le à votre site pour commencer à collecter des données."
                : "Copy the code below and add it to your website to start collecting data."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            {t("websites.trackingCode")}
          </CardTitle>
          <CardDescription>
            {t("websites.trackingCodeDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrackingCodeCopy code={trackingCode} />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "fr"
              ? "Instructions d'installation"
              : "Installation Instructions"}
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
              {locale === "fr"
                ? "2. Ajoutez-le à votre site"
                : "2. Add it to your website"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {locale === "fr"
                ? "Collez le code juste avant la balise </head> de votre site web."
                : "Paste the code just before the </head> tag of your website."}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">
              {locale === "fr"
                ? "3. Vérifiez l'installation"
                : "3. Verify installation"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {locale === "fr"
                ? "Visitez votre site et vérifiez que les données apparaissent dans votre tableau de bord."
                : "Visit your website and check that data appears in your dashboard."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Link href="/websites">
          <Button>{locale === "fr" ? "Terminé" : "Done"}</Button>
        </Link>
      </div>
    </div>
  );
}
