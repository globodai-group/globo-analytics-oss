"use client";

import { useState, useEffect } from "react";
import { clientLogger } from "@/lib/client-logger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Eye, Activity, RefreshCw } from "lucide-react";
import { getRealtimeStatsAction } from "@/lib/actions/stats";

interface RealtimeClientProps {
  websiteId: number;
  locale: string;
}

export function RealtimeClient({ websiteId, locale }: RealtimeClientProps) {
  const [activeVisitors, setActiveVisitors] = useState(0);
  const [pageviewsLastHour, setPageviewsLastHour] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const result = await getRealtimeStatsAction(websiteId);
      if (result.success && result.data) {
        setActiveVisitors(result.data.activeVisitors);
        setPageviewsLastHour(result.data.pageviewsLastHour);
        setLastUpdate(new Date());
      }
    } catch (error) {
      clientLogger.error("Error loading realtime stats:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1">
          <Activity className="h-3 w-3 text-green-500 animate-pulse" />
          {locale === "fr" ? "En direct" : "Live"}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {locale === "fr" ? "Dernière mise à jour:" : "Last update:"}{" "}
          {lastUpdate.toLocaleTimeString(locale)}
        </span>
        <button
          onClick={loadData}
          className="p-1 hover:bg-muted rounded"
          title={locale === "fr" ? "Actualiser" : "Refresh"}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {locale === "fr" ? "Visiteurs actifs" : "Active Visitors"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {activeVisitors}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === "fr"
                ? "Sur votre site en ce moment"
                : "On your site right now"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {locale === "fr"
                ? "Pages vues (dernière heure)"
                : "Pageviews (last hour)"}
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{pageviewsLastHour}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === "fr"
                ? "Dans les 60 dernières minutes"
                : "In the last 60 minutes"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-4 py-12">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-primary/40 flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center animate-pulse">
                    <Users className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>
              </div>
              {activeVisitors > 0 && (
                <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-xs text-white font-bold">
                  {activeVisitors > 99 ? "99+" : activeVisitors}
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {activeVisitors === 0
                  ? locale === "fr"
                    ? "Aucun visiteur actif"
                    : "No active visitors"
                  : activeVisitors === 1
                    ? locale === "fr"
                      ? "1 visiteur actif"
                      : "1 active visitor"
                    : locale === "fr"
                      ? `${activeVisitors} visiteurs actifs`
                      : `${activeVisitors} active visitors`}
              </p>
              <p className="text-muted-foreground">
                {locale === "fr"
                  ? "Les données sont actualisées toutes les 30 secondes"
                  : "Data refreshes every 30 seconds"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
