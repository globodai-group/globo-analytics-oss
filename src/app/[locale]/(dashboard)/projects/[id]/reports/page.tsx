import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
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
import {
  ArrowLeft,
  Plus,
  FileText,
  Calendar,
  Clock,
  Users,
  Mail,
} from "lucide-react";
import { ReportDeleteButton } from "@/components/reports/report-delete-button";
import { ReportToggleButton } from "@/components/reports/report-toggle-button";
import { ReportSendButton } from "@/components/reports/report-send-button";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";

interface ReportsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { id } = await params;
  const session = await auth();
  const _t = await getTranslations();
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
  });

  if (!project) {
    notFound();
  }

  const reports = await prisma.scheduledReport.findMany({
    where: { projectId },
    include: {
      segment: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const dateLocale = locale === "fr" ? fr : enUS;

  const frequencyLabels: Record<string, string> = {
    DAILY: locale === "fr" ? "Quotidien" : "Daily",
    WEEKLY: locale === "fr" ? "Hebdomadaire" : "Weekly",
    MONTHLY: locale === "fr" ? "Mensuel" : "Monthly",
  };

  const dateRangeLabels: Record<string, string> = {
    YESTERDAY: locale === "fr" ? "Hier" : "Yesterday",
    LAST_7_DAYS: locale === "fr" ? "7 derniers jours" : "Last 7 days",
    LAST_30_DAYS: locale === "fr" ? "30 derniers jours" : "Last 30 days",
    LAST_MONTH: locale === "fr" ? "Mois dernier" : "Last month",
  };

  const formatLabels: Record<string, string> = {
    PDF: "PDF",
    CSV: "CSV",
    EXCEL: "Excel",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${project.id}/stats`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {locale === "fr" ? "Rapports Programmés" : "Scheduled Reports"}
            </h1>
            <p className="text-muted-foreground">{project.name}</p>
          </div>
        </div>
        <Link href={`/projects/${project.id}/reports/new`}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {locale === "fr" ? "Nouveau rapport" : "New Report"}
          </Button>
        </Link>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {locale === "fr"
                ? "Aucun rapport programmé"
                : "No scheduled reports"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {locale === "fr"
                ? "Créez un rapport programmé pour recevoir des statistiques par email."
                : "Create a scheduled report to receive statistics by email."}
            </p>
            <Link href={`/projects/${project.id}/reports/new`}>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {locale === "fr" ? "Créer un rapport" : "Create Report"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {report.name}
                    </CardTitle>
                    <CardDescription>
                      {report.segment
                        ? `${locale === "fr" ? "Segment" : "Segment"}: ${report.segment.name}`
                        : locale === "fr"
                          ? "Toutes les données"
                          : "All data"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={report.isActive ? "default" : "secondary"}>
                      {report.isActive
                        ? locale === "fr"
                          ? "Actif"
                          : "Active"
                        : locale === "fr"
                          ? "Inactif"
                          : "Inactive"}
                    </Badge>
                    <Badge variant="outline">
                      {formatLabels[report.format]}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                  {/* Frequency */}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{frequencyLabels[report.frequency]}</span>
                  </div>

                  {/* Date Range */}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{dateRangeLabels[report.dateRange]}</span>
                  </div>

                  {/* Recipients */}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {report.recipients.length}{" "}
                      {locale === "fr" ? "destinataire(s)" : "recipient(s)"}
                    </span>
                  </div>

                  {/* Next Run */}
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {report.nextRun
                        ? format(report.nextRun, "PPp", { locale: dateLocale })
                        : "-"}
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {report.metrics.map((metric) => (
                    <Badge key={metric} variant="secondary">
                      {metric}
                    </Badge>
                  ))}
                </div>

                {/* Last Sent */}
                {report.lastSent && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {locale === "fr" ? "Dernier envoi" : "Last sent"}:{" "}
                    {format(report.lastSent, "PPp", { locale: dateLocale })}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <ReportToggleButton
                    reportId={report.id}
                    isActive={report.isActive}
                    locale={locale}
                  />
                  <ReportSendButton reportId={report.id} locale={locale} />
                  <Link href={`/projects/${project.id}/reports/${report.id}`}>
                    <Button variant="outline" size="sm">
                      {locale === "fr" ? "Modifier" : "Edit"}
                    </Button>
                  </Link>
                  <ReportDeleteButton reportId={report.id} locale={locale} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
