import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Key, Zap } from "lucide-react";
import { getLicenseStatus } from "@/lib/license/validator";

export default async function PlanPage() {
  const session = await auth();
  const t = await getTranslations("account.plan");
  const locale = await getLocale();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      websites: {
        select: { id: true },
      },
    },
  });

  if (!user) {
    return null;
  }

  // Get license status from validator
  const licenseStatus = await getLicenseStatus();

  const websiteCount = user.websites.length;
  const websiteLimit = licenseStatus.limits.domains.max || 3;
  const websitePercentage = Math.min((websiteCount / websiteLimit) * 100, 100);

  // Calculate pageviews (sum from all websites this month)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const pageviewsData = await prisma.stat.aggregate({
    where: {
      websiteId: { in: user.websites.map((w) => w.id) },
      name: "pageviews",
      date: { gte: startOfMonth },
    },
    _sum: { count: true },
  });

  const pageviews = Number(pageviewsData._sum?.count || 0);
  const pageviewLimit = licenseStatus.limits.pageviews.max || 10000;
  const pageviewPercentage = Math.min((pageviews / pageviewLimit) * 100, 100);

  const isActive = licenseStatus.status === "active";
  const isPro = licenseStatus.tier !== "community";

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                {t("currentPlan")}
              </CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Détails de votre licence actuelle"
                  : "Details of your current license"}
              </CardDescription>
            </div>
            <Badge variant={isPro ? "default" : "secondary"}>
              {licenseStatus.tierName}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Websites Usage */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{locale === "fr" ? "Sites web" : "Websites"}</span>
              <span>
                {websiteCount} / {websiteLimit === 0 ? "∞" : websiteLimit}
              </span>
            </div>
            {websiteLimit > 0 && <Progress value={websitePercentage} />}
          </div>

          {/* Pageviews Usage */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {locale === "fr"
                  ? "Pages vues ce mois"
                  : "Pageviews this month"}
              </span>
              <span>
                {pageviews.toLocaleString()} /{" "}
                {pageviewLimit === 0 ? "∞" : pageviewLimit.toLocaleString()}
              </span>
            </div>
            {pageviewLimit > 0 && <Progress value={pageviewPercentage} />}
          </div>

          {/* License Info */}
          {isPro && isActive ? (
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">
                    {locale === "fr" ? "Licence active" : "Active License"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {licenseStatus.organization} • {licenseStatus.daysRemaining}{" "}
                    {locale === "fr" ? "jours restants" : "days remaining"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">
                    {locale === "fr"
                      ? "Version Community"
                      : "Community Edition"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {locale === "fr"
                      ? "Configurez LICENSE_KEY pour débloquer plus de fonctionnalités"
                      : "Set LICENSE_KEY env var to unlock more features"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
