import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SegmentForm } from "@/components/segments/segment-form";

interface EditSegmentPageProps {
  params: Promise<{ id: string; segmentId: string }>;
}

export default async function EditSegmentPage({
  params,
}: EditSegmentPageProps) {
  const { id, segmentId } = await params;
  const session = await auth();
  const t = await getTranslations("segments");
  const locale = await getLocale();

  if (!session?.user?.id) {
    return null;
  }

  const projectId = parseInt(id);
  const segmentIdNum = parseInt(segmentId);
  if (isNaN(projectId) || isNaN(segmentIdNum)) {
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

  const segment = await prisma.segment.findFirst({
    where: {
      id: segmentIdNum,
      projectId,
      OR: [{ userId: session.user.id }, { isShared: true }],
    },
  });

  if (!segment) {
    notFound();
  }

  // Only owner can edit
  const isOwner = segment.userId === session.user.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}/segments`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {isOwner
              ? locale === "fr"
                ? "Modifier le segment"
                : "Edit segment"
              : locale === "fr"
                ? "Voir le segment"
                : "View segment"}
          </h1>
          <p className="text-muted-foreground">{segment.name}</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
        {isOwner ? (
          <SegmentForm
            projectId={projectId}
            locale={locale}
            segment={segment}
          />
        ) : (
          <div className="text-muted-foreground">
            {locale === "fr"
              ? "Vous ne pouvez pas modifier ce segment car vous n'en êtes pas le propriétaire."
              : "You cannot edit this segment because you are not the owner."}
          </div>
        )}
      </div>
    </div>
  );
}
