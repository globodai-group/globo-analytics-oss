import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { WebsiteForm } from "@/components/websites/website-form";

interface EditWebsitePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditWebsitePage({
  params,
}: EditWebsitePageProps) {
  const { id } = await params;
  const session = await auth();
  const t = await getTranslations();

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
    select: {
      id: true,
      domain: true,
      privacy: true,
      excludeBots: true,
      excludeIps: true,
      excludeParams: true,
    },
  });

  if (!website) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/websites">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t("websites.edit")}</h1>
          <p className="text-muted-foreground">{website.domain}</p>
        </div>
      </div>

      {/* Form */}
      <WebsiteForm website={website} />
    </div>
  );
}
