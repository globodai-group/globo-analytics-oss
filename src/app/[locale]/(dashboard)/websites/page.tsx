import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Plus,
  Star,
  Lock,
  Unlock,
  Eye,
  MoreHorizontal,
  ExternalLink,
  Settings,
  BarChart3,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WebsiteFavoriteButton } from "@/components/websites/website-favorite-button";
import { WebsiteDeleteButton } from "@/components/websites/website-delete-button";

export default async function WebsitesPage() {
  const session = await auth();
  const t = await getTranslations();

  if (!session?.user?.id) {
    return null;
  }

  const websites = await prisma.website.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: [{ favoritedAt: "desc" }, { createdAt: "desc" }],
  });

  const privacyLabels = {
    0: {
      label: t("websites.privacyOptions.public"),
      icon: Unlock,
      variant: "secondary" as const,
    },
    1: {
      label: t("websites.privacyOptions.private"),
      icon: Lock,
      variant: "default" as const,
    },
    2: {
      label: t("websites.privacyOptions.password"),
      icon: Lock,
      variant: "outline" as const,
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("websites.title")}</h1>
          <p className="text-muted-foreground">
            {websites.length === 0
              ? t("stats.noDataYet")
              : `${websites.length} ${websites.length === 1 ? "site" : "sites"}`}
          </p>
        </div>
        <Link href="/websites/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("websites.addNew")}
          </Button>
        </Link>
      </div>

      {/* Websites List */}
      {websites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Globe className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {t("stats.noDataYet")}
            </h2>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {t("stats.startTracking")}
            </p>
            <Link href="/websites/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("websites.addNew")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {websites.map((website) => {
            const privacy =
              privacyLabels[website.privacy as keyof typeof privacyLabels];
            const PrivacyIcon = privacy.icon;

            return (
              <Card key={website.id} className="relative group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base truncate">
                          {website.domain}
                        </CardTitle>
                        <CardDescription className="truncate">
                          {website.url}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <WebsiteFavoriteButton
                        websiteId={website.id}
                        isFavorite={!!website.favoritedAt}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/websites/${website.id}/stats`}>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              {t("dashboard.viewStats")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a
                              href={website.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              {t("common.viewAll")}
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/websites/${website.id}/edit`}>
                              <Settings className="h-4 w-4 mr-2" />
                              {t("websites.edit")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/websites/${website.id}/tracking`}>
                              <Eye className="h-4 w-4 mr-2" />
                              {t("websites.trackingCode")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <WebsiteDeleteButton
                            websiteId={website.id}
                            websiteName={website.domain}
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={privacy.variant}>
                        <PrivacyIcon className="h-3 w-3 mr-1" />
                        {privacy.label}
                      </Badge>
                      {website.excludeBots && (
                        <Badge variant="outline" className="text-xs">
                          No bots
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {website.pageviewsMonth.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("stats.pageviews")}
                      </p>
                    </div>
                  </div>
                </CardContent>
                {website.favoritedAt && (
                  <div className="absolute top-2 left-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
