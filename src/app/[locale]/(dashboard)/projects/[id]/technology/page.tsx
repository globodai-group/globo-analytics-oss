import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProjectDateRangePicker } from "@/components/analytics/project-date-range-picker";
import { TechnologyOverview } from "@/components/analytics/technology-overview";
import { subDays } from "date-fns";

interface TechnologyPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function TechnologyPage({ params, searchParams }: TechnologyPageProps) {
  const { id } = await params;
  const { from, to } = await searchParams;
  const session = await auth();
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
    include: {
      domains: true,
    },
  });

  if (!project) {
    notFound();
  }

  // Date range (default: last 30 days)
  const endDate = to ? new Date(to) : new Date();
  const startDate = from ? new Date(from) : subDays(endDate, 30);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-start sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href={`/projects/${projectId}/stats`} className="shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold truncate">
              {locale === "fr" ? "Technologie" : "Technology"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {locale === "fr"
                ? "Navigateurs, systèmes d'exploitation et appareils"
                : "Browsers, operating systems, and devices"}
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <ProjectDateRangePicker projectId={project.id} />
        </div>
      </div>

      {/* Technology Overview Component */}
      <TechnologyOverview projectId={project.id} dateRange={{ from: startDate, to: endDate }} />
    </div>
  );
}
