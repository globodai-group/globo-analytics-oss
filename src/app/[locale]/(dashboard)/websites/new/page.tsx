import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { WebsiteForm } from "@/components/websites/website-form";

export default async function NewWebsitePage() {
  const t = await getTranslations();

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
          <h1 className="text-2xl font-bold">{t("websites.addNew")}</h1>
          <p className="text-muted-foreground">{t("stats.startTracking")}</p>
        </div>
      </div>

      {/* Form */}
      <WebsiteForm />
    </div>
  );
}
