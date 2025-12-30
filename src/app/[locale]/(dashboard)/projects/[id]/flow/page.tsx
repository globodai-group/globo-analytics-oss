import { redirect, notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Workflow,
  ArrowRightFromLine,
  ArrowRightToLine,
  ArrowRight,
  Users,
  Route,
} from "lucide-react";
import { getUserFlowAnalysisAction } from "@/lib/actions/user-flow";

interface FlowPageProps {
  params: Promise<{ id: string }>;
}

export default async function FlowPage({ params }: FlowPageProps) {
  const { id } = await params;
  const projectId = parseInt(id);
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user?.id) {
    redirect("/login");
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

  // Default to last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const dateRange = { from: startDate, to: endDate };

  const flowResult = await getUserFlowAnalysisAction(projectId, dateRange, locale);
  const flowData = flowResult.data;

  const t = {
    title: locale === "fr" ? "Flux Utilisateurs" : "User Flow",
    subtitle:
      locale === "fr"
        ? "Visualisez les parcours de navigation de vos visiteurs"
        : "Visualize your visitors navigation paths",
    back: locale === "fr" ? "Retour aux stats" : "Back to Stats",
    totalSessions: locale === "fr" ? "Sessions analysées" : "Sessions Analyzed",
    topPages: locale === "fr" ? "Pages principales" : "Top Pages",
    entryPages: locale === "fr" ? "Pages d'entrée" : "Entry Pages",
    exitPages: locale === "fr" ? "Pages de sortie" : "Exit Pages",
    topTransitions: locale === "fr" ? "Transitions principales" : "Top Transitions",
    page: locale === "fr" ? "Page" : "Page",
    sessions: locale === "fr" ? "Sessions" : "Sessions",
    from: locale === "fr" ? "De" : "From",
    to: locale === "fr" ? "Vers" : "To",
    count: locale === "fr" ? "Nombre" : "Count",
    noData: locale === "fr" ? "Aucune donnée de flux disponible" : "No flow data available",
    setupInstructions:
      locale === "fr"
        ? "Le flux utilisateur sera disponible une fois que vous aurez du trafic sur votre site."
        : "User flow will be available once you have traffic on your site.",
  };

  const hasData = flowData && flowData.totalSessions > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}/stats`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>
        <Badge variant="outline">{project.name}</Badge>
      </div>

      {hasData ? (
        <>
          {/* Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {t.totalSessions}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{flowData.totalSessions.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Route className="h-3 w-3" />
                  {t.topPages}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{flowData.nodes.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Workflow className="h-3 w-3" />
                  {t.topTransitions}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{flowData.links.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Entry & Exit Pages */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Entry Pages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightFromLine className="h-5 w-5" />
                  {t.entryPages}
                </CardTitle>
                <CardDescription>
                  {locale === "fr"
                    ? "Premières pages visitées par les utilisateurs"
                    : "First pages visited by users"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.page}</TableHead>
                      <TableHead className="text-right">{t.sessions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flowData.topEntryPages.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {index + 1}
                            </Badge>
                            <span className="font-mono text-sm truncate max-w-[200px]">
                              {entry.page || "/"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {entry.count.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Exit Pages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightToLine className="h-5 w-5" />
                  {t.exitPages}
                </CardTitle>
                <CardDescription>
                  {locale === "fr"
                    ? "Dernières pages visitées avant de quitter"
                    : "Last pages visited before leaving"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.page}</TableHead>
                      <TableHead className="text-right">{t.sessions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flowData.topExitPages.map((exit, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {index + 1}
                            </Badge>
                            <span className="font-mono text-sm truncate max-w-[200px]">
                              {exit.page || "/"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {exit.count.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Top Transitions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                {t.topTransitions}
              </CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Parcours les plus fréquents entre les pages"
                  : "Most common paths between pages"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {flowData.links.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.from}</TableHead>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>{t.to}</TableHead>
                      <TableHead className="text-right">{t.count}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flowData.links.slice(0, 15).map((link, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <span className="font-mono text-sm truncate max-w-[180px] block">
                            {link.source || "/"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm truncate max-w-[180px] block">
                            {link.target || "/"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{link.value}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {locale === "fr"
                    ? "Pas assez de données pour afficher les transitions"
                    : "Not enough data to show transitions"}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t.noData}</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">{t.setupInstructions}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
