import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Plus,
  Bell,
  BellOff,
  Clock,
  Mail,
  Webhook,
} from "lucide-react";
import { getProjectAlertsAction } from "@/lib/actions/alerts";
import { Badge } from "@/components/ui/badge";
import { AlertDeleteButton } from "@/components/alerts/alert-delete-button";
import { AlertToggleButton } from "@/components/alerts/alert-toggle-button";
import { AlertMetric, AlertCondition, CompareType } from "@prisma/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface AlertData {
  id: number;
  name: string;
  metric: AlertMetric;
  condition: AlertCondition;
  threshold: number;
  compareType: CompareType;
  isActive: boolean;
  emailEnabled: boolean;
  webhookUrl: string | null;
  slackWebhook: string | null;
  lastTriggered: Date | null;
  consecutiveHits: number;
}

export default async function AlertsPage({ params }: PageProps) {
  const { id } = await params;
  const projectId = parseInt(id);
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("alerts");

  if (!session?.user) {
    redirect("/login");
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });

  if (!project) {
    notFound();
  }

  const result = await getProjectAlertsAction(projectId, locale);
  const alerts =
    result.success && result.data ? (result.data.alerts as AlertData[]) : [];

  const formatCondition = (
    condition: AlertCondition,
    threshold: number,
    compareType: CompareType,
  ) => {
    const conditionText = t(`conditions.${condition}`);
    const compareText =
      compareType !== "ABSOLUTE"
        ? ` (${t(`compareTypes.${compareType}`)})`
        : "";
    return `${conditionText} ${threshold}${compareText}`;
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}/stats`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <Link href={`/projects/${projectId}/alerts/new`}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("addNew")}
          </Button>
        </Link>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">{t("noAlerts")}</h3>
            <p className="text-muted-foreground text-center max-w-sm mt-2">
              {locale === "fr"
                ? "Créez des alertes pour être notifié quand vos métriques changent."
                : "Create alerts to get notified when your metrics change."}
            </p>
            <Link href={`/projects/${projectId}/alerts/new`} className="mt-4">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t("addNew")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {alert.isActive ? (
                      <Bell className="h-5 w-5 text-primary" />
                    ) : (
                      <BellOff className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{alert.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {t(`metrics.${alert.metric}`)}{" "}
                        {formatCondition(
                          alert.condition,
                          alert.threshold,
                          alert.compareType,
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.isActive ? "default" : "secondary"}>
                      {alert.isActive ? t("active") : t("inactive")}
                    </Badge>
                    <AlertToggleButton
                      alertId={alert.id}
                      isActive={alert.isActive}
                      locale={locale}
                    />
                    <AlertDeleteButton
                      alertId={alert.id}
                      alertName={alert.name}
                      locale={locale}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  {/* Notifications */}
                  <div className="flex items-center gap-4">
                    {alert.emailEnabled && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                      </div>
                    )}
                    {alert.webhookUrl && (
                      <div className="flex items-center gap-1">
                        <Webhook className="h-4 w-4" />
                        <span>Webhook</span>
                      </div>
                    )}
                    {alert.slackWebhook && (
                      <div className="flex items-center gap-1">
                        <span className="font-bold">#</span>
                        <span>Slack</span>
                      </div>
                    )}
                  </div>

                  {/* Last triggered */}
                  {alert.lastTriggered && (
                    <div className="flex items-center gap-1 ml-auto">
                      <Clock className="h-4 w-4" />
                      <span>
                        {t("lastTriggered")}:{" "}
                        {new Date(alert.lastTriggered).toLocaleDateString(
                          locale,
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
