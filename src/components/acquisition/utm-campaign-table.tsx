"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Target, TrendingUp } from "lucide-react";
import {
  getUtmCampaignsAction,
  type UtmCampaignData,
} from "@/lib/actions/acquisition";

interface UtmCampaignTableProps {
  projectId: number;
  dateRange: { from: Date; to: Date };
}

export function UtmCampaignTable({
  projectId,
  dateRange,
}: UtmCampaignTableProps) {
  const locale = useLocale();
  const [data, setData] = useState<UtmCampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const result = await getUtmCampaignsAction(projectId, dateRange);

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to load data");
      }

      setLoading(false);
    }

    fetchData();
  }, [projectId, dateRange]);

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat(locale).format(value);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {locale === "fr" ? "Campagnes UTM" : "UTM Campaigns"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            {locale === "fr" ? "Chargement..." : "Loading..."}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {locale === "fr" ? "Campagnes UTM" : "UTM Campaigns"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalVisitors = data.reduce((sum, c) => sum + c.visitors, 0);
  const totalConversions = data.reduce((sum, c) => sum + c.conversions, 0);
  const totalRevenue = data.reduce((sum, c) => sum + c.revenue, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {locale === "fr" ? "Campagnes UTM" : "UTM Campaigns"}
            </CardTitle>
            <CardDescription>
              {locale === "fr"
                ? "Performance de vos campagnes marketing"
                : "Marketing campaign performance"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="font-mono">
              {data.length} {locale === "fr" ? "campagnes" : "campaigns"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {locale === "fr" ? "Total visiteurs" : "Total Visitors"}
            </p>
            <p className="text-2xl font-bold">{formatNumber(totalVisitors)}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {locale === "fr" ? "Conversions" : "Conversions"}
            </p>
            <p className="text-2xl font-bold text-green-600">
              {formatNumber(totalConversions)}
            </p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {locale === "fr" ? "Revenu" : "Revenue"}
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {locale === "fr" ? "Campagne" : "Campaign"}
                </TableHead>
                <TableHead>{locale === "fr" ? "Source" : "Source"}</TableHead>
                <TableHead>{locale === "fr" ? "Medium" : "Medium"}</TableHead>
                <TableHead className="text-right">
                  {locale === "fr" ? "Visiteurs" : "Visitors"}
                </TableHead>
                <TableHead className="text-right">
                  {locale === "fr" ? "Conversions" : "Conversions"}
                </TableHead>
                <TableHead className="text-right">
                  {locale === "fr" ? "Revenu" : "Revenue"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((campaign, index) => (
                <TableRow key={`${campaign.campaign}-${index}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{campaign.campaign}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {campaign.source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {campaign.medium}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(campaign.visitors)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-600">
                    {formatNumber(campaign.conversions)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-blue-600">
                    {formatCurrency(campaign.revenue)}
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    {locale === "fr"
                      ? "Aucune campagne UTM détectée"
                      : "No UTM campaigns detected"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
