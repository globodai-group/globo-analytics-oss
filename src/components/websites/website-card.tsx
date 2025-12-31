"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
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
  Star,
  Lock,
  Unlock,
  MoreHorizontal,
  ExternalLink,
  Settings,
  BarChart3,
  Eye,
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

interface Website {
  id: number;
  domain: string;
  url: string;
  privacy: number;
  excludeBots: boolean;
  pageviewsMonth: number;
  favoritedAt: Date | null;
}

interface WebsiteCardProps {
  website: Website;
}

export function WebsiteCard({ website }: WebsiteCardProps) {
  const router = useRouter();
  const t = useTranslations();

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

  const privacy = privacyLabels[website.privacy as keyof typeof privacyLabels];
  const PrivacyIcon = privacy.icon;

  const handleCardClick = () => {
    router.push(`/websites/${website.id}/stats`);
  };

  return (
    <Card
      className="relative group hover:border-primary/50 transition-colors cursor-pointer"
      onClick={handleCardClick}
    >
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
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <WebsiteFavoriteButton
              websiteId={website.id}
              isFavorite={!!website.favoritedAt}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
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
                    {t("websites.visitSite")}
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
}
