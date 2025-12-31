import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Globe,
  Settings,
  Code,
  ExternalLink,
  Activity,
} from "lucide-react";
import { StatsPageClient } from "./stats-page-client";

interface StatsPageProps {
  params: Promise<{ id: string }>;
}

export default async function StatsPage({ params }: StatsPageProps) {
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
  });

  if (!website) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/websites">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{website.domain}</h1>
              <a
                href={website.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                {website.url}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/websites/${website.id}/stats/realtime`}>
            <Button variant="outline" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              {t("stats.realtime")}
            </Button>
          </Link>
          <Link href={`/websites/${website.id}/tracking`}>
            <Button variant="outline" size="sm">
              <Code className="h-4 w-4 mr-2" />
              {t("websites.trackingCode")}
            </Button>
          </Link>
          <Link href={`/websites/${website.id}/edit`}>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              {t("websites.settings")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Content - Client Component */}
      <StatsPageClient websiteId={website.id} locale={locale} />
    </div>
  );
}
