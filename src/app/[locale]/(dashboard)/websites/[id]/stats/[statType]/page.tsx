import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { StatType } from "@prisma/client";
import { StatsDetailClient } from "./stats-detail-client";

// Valid stat types that match our StatType enum
const VALID_STAT_TYPES: Record<string, StatType> = {
  pages: "page",
  "landing-pages": "landing_page",
  referrers: "referrer",
  "search-engines": "referrer",
  "social-networks": "referrer",
  campaigns: "campaign",
  continents: "continent",
  countries: "country",
  cities: "city",
  languages: "language",
  browsers: "browser",
  "operating-systems": "os",
  "screen-resolutions": "resolution",
  devices: "device",
  events: "event",
};

// Labels for each stat type
const STAT_LABELS: Record<string, { en: string; fr: string }> = {
  pages: { en: "Pages", fr: "Pages" },
  "landing-pages": { en: "Landing Pages", fr: "Pages d'entrée" },
  referrers: { en: "Referrers", fr: "Référents" },
  "search-engines": { en: "Search Engines", fr: "Moteurs de recherche" },
  "social-networks": { en: "Social Networks", fr: "Réseaux sociaux" },
  campaigns: { en: "Campaigns", fr: "Campagnes" },
  continents: { en: "Continents", fr: "Continents" },
  countries: { en: "Countries", fr: "Pays" },
  cities: { en: "Cities", fr: "Villes" },
  languages: { en: "Languages", fr: "Langues" },
  browsers: { en: "Browsers", fr: "Navigateurs" },
  "operating-systems": {
    en: "Operating Systems",
    fr: "Systèmes d'exploitation",
  },
  "screen-resolutions": { en: "Screen Resolutions", fr: "Résolutions d'écran" },
  devices: { en: "Devices", fr: "Appareils" },
  events: { en: "Events", fr: "Événements" },
};

// Search engine patterns
const SEARCH_ENGINES = [
  "google",
  "bing",
  "yahoo",
  "duckduckgo",
  "baidu",
  "yandex",
  "ecosia",
  "qwant",
];

// Social network patterns
const SOCIAL_NETWORKS = [
  "facebook",
  "twitter",
  "instagram",
  "linkedin",
  "pinterest",
  "reddit",
  "tiktok",
  "youtube",
  "whatsapp",
  "telegram",
];

interface StatsDetailPageProps {
  params: Promise<{ id: string; statType: string }>;
}

export default async function StatsDetailPage({
  params,
}: StatsDetailPageProps) {
  const { id, statType } = await params;
  const session = await auth();
  const _t = await getTranslations("stats");
  const locale = await getLocale();

  if (!session?.user?.id) {
    return null;
  }

  // Validate stat type
  if (!VALID_STAT_TYPES[statType]) {
    notFound();
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

  const label = STAT_LABELS[statType];
  const title = locale === "fr" ? label.fr : label.en;

  // Determine filter for search engines and social networks
  let filter: string[] | undefined;
  if (statType === "search-engines") {
    filter = SEARCH_ENGINES;
  } else if (statType === "social-networks") {
    filter = SOCIAL_NETWORKS;
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
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{website.domain}</p>
        </div>
      </div>

      {/* Stats Content */}
      <StatsDetailClient
        websiteId={website.id}
        statType={VALID_STAT_TYPES[statType]}
        locale={locale}
        filter={filter}
      />
    </div>
  );
}
