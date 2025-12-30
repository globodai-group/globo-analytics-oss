import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { RealtimeClient } from "./realtime-client";

interface RealtimePageProps {
  params: Promise<{ id: string }>;
}

export default async function RealtimePage({ params }: RealtimePageProps) {
  const { id } = await params;
  const session = await auth();
  const t = await getTranslations("stats");
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
      <div className="flex items-center gap-4">
        <Link href={`/websites/${website.id}/stats`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t("realtime")}</h1>
          <p className="text-muted-foreground">{website.domain}</p>
        </div>
      </div>

      {/* Realtime Content */}
      <RealtimeClient websiteId={website.id} locale={locale} />
    </div>
  );
}
