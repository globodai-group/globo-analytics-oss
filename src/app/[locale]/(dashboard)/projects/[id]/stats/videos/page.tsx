import { redirect, notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Play,
  CheckCircle2,
  Clock,
  Users,
  Video,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { getVideoOverviewAction, getVideoStatsAction } from "@/lib/actions/video-analytics";

interface VideoStatsPageProps {
  params: Promise<{ id: string }>;
}

export default async function VideoStatsPage({ params }: VideoStatsPageProps) {
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
  const dateRange = { startDate, endDate };

  const [overviewResult, videosResult] = await Promise.all([
    getVideoOverviewAction(projectId, dateRange),
    getVideoStatsAction(projectId, dateRange, 20),
  ]);

  const overview = overviewResult.data;
  const videos = videosResult.data || [];

  const t = {
    title: locale === "fr" ? "Analytics Vidéo" : "Video Analytics",
    subtitle:
      locale === "fr" ? "Suivez l'engagement de vos vidéos" : "Track video engagement metrics",
    back: locale === "fr" ? "Retour aux stats" : "Back to Stats",
    overview: locale === "fr" ? "Vue d'ensemble" : "Overview",
    totalVideos: locale === "fr" ? "Vidéos uniques" : "Unique Videos",
    totalStarts: locale === "fr" ? "Lectures" : "Plays",
    totalCompletes: locale === "fr" ? "Complètes" : "Completes",
    completionRate: locale === "fr" ? "Taux de complétion" : "Completion Rate",
    watchTime: locale === "fr" ? "Temps de visionnage" : "Watch Time",
    topVideo: locale === "fr" ? "Top Vidéo" : "Top Video",
    videoPerformance: locale === "fr" ? "Performance des vidéos" : "Video Performance",
    video: locale === "fr" ? "Vidéo" : "Video",
    plays: locale === "fr" ? "Lectures" : "Plays",
    completes: locale === "fr" ? "Complètes" : "Completes",
    completion: locale === "fr" ? "Complétion" : "Completion",
    avgProgress: locale === "fr" ? "Progression moy." : "Avg. Progress",
    viewers: locale === "fr" ? "Spectateurs" : "Viewers",
    noData: locale === "fr" ? "Aucune donnée vidéo disponible" : "No video data available",
    setupInstructions:
      locale === "fr"
        ? "Pour commencer à suivre les vidéos, ajoutez le code suivant à votre site:"
        : "To start tracking videos, add the following code to your site:",
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

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

      {overview && overview.totalVideos > 0 ? (
        <>
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  {t.totalVideos}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{overview.totalVideos}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Play className="h-3 w-3" />
                  {t.totalStarts}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{overview.totalStarts.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {t.totalCompletes}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{overview.totalCompletes.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {t.completionRate}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold">{overview.avgCompletionRate}%</p>
                  <Progress value={overview.avgCompletionRate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {t.watchTime}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatDuration(overview.totalWatchTime)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  {t.topVideo}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium truncate">{overview.topVideo || "-"}</p>
              </CardContent>
            </Card>
          </div>

          {/* Video Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                {t.videoPerformance}
              </CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Performance détaillée de chaque vidéo"
                  : "Detailed performance for each video"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {videos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.video}</TableHead>
                      <TableHead className="text-right">{t.plays}</TableHead>
                      <TableHead className="text-right">{t.completes}</TableHead>
                      <TableHead className="text-right">{t.completion}</TableHead>
                      <TableHead className="text-right">{t.avgProgress}</TableHead>
                      <TableHead className="text-right">{t.viewers}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {videos.map((video) => (
                      <TableRow key={video.videoId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Play className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{video.videoTitle || video.videoId}</p>
                              {video.videoDuration && (
                                <p className="text-xs text-muted-foreground">
                                  {formatDuration(video.videoDuration)}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {video.starts.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {video.completes.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              video.completionRate >= 50
                                ? "default"
                                : video.completionRate >= 25
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {video.completionRate}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={video.avgProgress} className="w-16 h-2" />
                            <span className="text-sm text-muted-foreground w-10">
                              {video.avgProgress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {video.uniqueViewers.toLocaleString()}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">{t.noData}</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t.noData}</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">{t.setupInstructions}</p>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-w-full">
              <code>{`// Video start
gr.video('start', {
  video_id: 'abc123',
  title: 'My Video',
  duration: 120 // seconds
});

// Progress milestone (25%, 50%, 75%)
gr.video('progress', {
  video_id: 'abc123',
  progress: 50
});

// Video complete
gr.video('complete', {
  video_id: 'abc123'
});`}</code>
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
