import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { features } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Filter,
  Users,
  Share2,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SegmentCondition } from "@/lib/actions/segments";
import { SegmentDeleteButton } from "@/components/segments/segment-delete-button";
import { AISuggestions } from "@/components/ai/ai-suggestions";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS } from "date-fns/locale";

interface SegmentsPageProps {
  params: Promise<{ id: string }>;
}

export default async function SegmentsPage({ params }: SegmentsPageProps) {
  const { id } = await params;
  const session = await auth();
  const t = await getTranslations("segments");
  const locale = await getLocale();
  const dateLocale = locale === "fr" ? fr : enUS;

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

  // Get segments: user's own + shared
  const segments = await prisma.segment.findMany({
    where: {
      projectId,
      OR: [{ userId: session.user.id }, { isShared: true }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
    },
  });

  // Count rules for each segment
  const segmentsWithRuleCount = segments.map((segment) => {
    const conditions = segment.conditions as unknown as SegmentCondition;
    return {
      ...segment,
      ruleCount: conditions?.rules?.length || 0,
      isOwner: segment.userId === session.user.id,
    };
  });

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
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <Link href={`/projects/${projectId}/segments/new`}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("addNew")}
          </Button>
        </Link>
      </div>

      {/* AI Suggestions */}
      {features.hasAI && (
        <AISuggestions projectId={projectId} type="segments" />
      )}

      {/* Segments List */}
      {segmentsWithRuleCount.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Filter className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("noSegments")}</h3>
            <p className="text-muted-foreground mb-4">
              {locale === "fr"
                ? "Créez votre premier segment pour filtrer vos données"
                : "Create your first segment to filter your data"}
            </p>
            <Link href={`/projects/${projectId}/segments/new`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("addNew")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {segmentsWithRuleCount.map((segment) => (
            <Card
              key={segment.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{segment.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/projects/${projectId}/segments/${segment.id}`}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          {locale === "fr" ? "Modifier" : "Edit"}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        {locale === "fr" ? "Dupliquer" : "Duplicate"}
                      </DropdownMenuItem>
                      {segment.isOwner && (
                        <SegmentDeleteButton
                          segmentId={segment.id}
                          segmentName={segment.name}
                          locale={locale}
                        />
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {segment.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {segment.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {segment.ruleCount} {locale === "fr" ? "règles" : "rules"}
                    </span>
                  </div>
                  {segment.isShared && (
                    <Badge variant="secondary" className="gap-1">
                      <Share2 className="h-3 w-3" />
                      {t("shared")}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {locale === "fr" ? "Par" : "By"}{" "}
                    {segment.user.firstName
                      ? `${segment.user.firstName} ${segment.user.lastName}`
                      : segment.user.email}
                  </span>
                  <span>
                    {formatDistanceToNow(new Date(segment.createdAt), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Link
                    href={`/projects/${projectId}/stats?segment=${segment.id}`}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      {t("applyToStats")}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
