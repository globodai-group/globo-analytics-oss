"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { clientLogger } from "@/lib/client-logger";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Monitor, Smartphone, Tablet, Pause } from "lucide-react";
import { useAdaptivePolling } from "@/hooks/use-adaptive-polling";

interface RealtimeUser {
  id: string;
  currentPage: string;
  currentTitle?: string;
  country?: string;
  city?: string;
  device?: string;
  platform: string;
}

interface RealTimeWidgetProps {
  projectId: number;
  initialCount?: number;
}

export function RealTimeWidget({
  projectId,
  initialCount = 0,
}: RealTimeWidgetProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [activeUsers, setActiveUsers] = useState(initialCount);
  const [realtimeUsers, setRealtimeUsers] = useState<RealtimeUser[]>([]);
  const [isLive, setIsLive] = useState(true);

  // Fetch realtime data callback
  const fetchRealtime = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/realtime`);
      if (res.ok) {
        const data = await res.json();
        setActiveUsers(data.count || 0);
        setRealtimeUsers(data.users || []);
        setIsLive(true);
      }
    } catch (error) {
      clientLogger.error("Failed to fetch realtime data:", error);
      setIsLive(false);
    }
  }, [projectId]);

  // Use adaptive polling:
  // - 5s when tab is visible and user is active
  // - 30s when tab is in background
  // - Pauses after 5 minutes of inactivity
  const { isIdle } = useAdaptivePolling(fetchRealtime, {
    activeInterval: 5000,
    backgroundInterval: 30000,
    idleTimeout: 300000, // 5 minutes
    enabled: true,
  });

  const getDeviceIcon = (device?: string) => {
    if (!device) return Monitor;
    const d = device.toLowerCase();
    if (d.includes("mobile") || d.includes("phone")) return Smartphone;
    if (d.includes("tablet") || d.includes("ipad")) return Tablet;
    return Monitor;
  };

  return (
    <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:border-green-900 dark:from-green-950 dark:to-emerald-950">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              {isLive && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-green-700 dark:text-green-400">
                  {activeUsers}
                </span>
                <Badge
                  variant="outline"
                  className={
                    isIdle
                      ? "border-yellow-300 bg-yellow-100 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900 dark:text-yellow-400"
                      : isLive
                        ? "border-green-300 bg-green-100 text-green-700 dark:border-green-800 dark:bg-green-900 dark:text-green-400"
                        : "border-red-300 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-900 dark:text-red-400"
                  }
                >
                  {isIdle ? (
                    <span className="flex items-center gap-1">
                      <Pause className="h-3 w-3" />
                      {locale === "fr" ? "PAUSE" : "PAUSED"}
                    </span>
                  ) : isLive ? (
                    "LIVE"
                  ) : (
                    "OFFLINE"
                  )}
                </Badge>
              </div>
              <p className="text-sm text-green-600 dark:text-green-500">
                {locale === "fr"
                  ? `utilisateur${activeUsers !== 1 ? "s" : ""} actif${activeUsers !== 1 ? "s" : ""} en ce moment`
                  : `active user${activeUsers !== 1 ? "s" : ""} right now`}
              </p>
            </div>
          </div>

          {/* Active users preview */}
          {realtimeUsers.length > 0 && (
            <div className="hidden md:flex items-center gap-4">
              <div className="flex -space-x-2">
                {realtimeUsers.slice(0, 5).map((user, i) => {
                  const DeviceIcon = getDeviceIcon(user.device);
                  return (
                    <div
                      key={user.id}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-green-200 dark:bg-gray-800 dark:border-green-800"
                      title={user.currentPage}
                    >
                      <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  );
                })}
                {realtimeUsers.length > 5 && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 border-2 border-green-200 text-xs font-medium text-green-700 dark:bg-green-900 dark:border-green-800 dark:text-green-400">
                    +{realtimeUsers.length - 5}
                  </div>
                )}
              </div>

              {/* Top pages preview */}
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">
                  {locale === "fr" ? "Pages actives:" : "Active pages:"}
                </p>
                <p className="truncate max-w-[200px]">
                  {[...new Set(realtimeUsers.map((u) => u.currentPage))]
                    .slice(0, 3)
                    .join(", ")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Expanded view when more users */}
        {realtimeUsers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {/* Countries */}
              <div>
                <p className="text-muted-foreground mb-1">
                  {locale === "fr" ? "Pays" : "Countries"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {[
                    ...new Set(
                      realtimeUsers.map((u) => u.country).filter(Boolean),
                    ),
                  ]
                    .slice(0, 3)
                    .map((country) => (
                      <Badge
                        key={country}
                        variant="secondary"
                        className="text-xs"
                      >
                        {country}
                      </Badge>
                    ))}
                </div>
              </div>

              {/* Devices */}
              <div>
                <p className="text-muted-foreground mb-1">
                  {locale === "fr" ? "Appareils" : "Devices"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {[
                    ...new Set(
                      realtimeUsers.map((u) => u.device).filter(Boolean),
                    ),
                  ]
                    .slice(0, 3)
                    .map((device) => (
                      <Badge
                        key={device}
                        variant="secondary"
                        className="text-xs"
                      >
                        {device}
                      </Badge>
                    ))}
                </div>
              </div>

              {/* Platform breakdown */}
              <div className="col-span-2">
                <p className="text-muted-foreground mb-1">
                  {locale === "fr" ? "Plateformes" : "Platforms"}
                </p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1">
                    <Monitor className="h-4 w-4" />
                    <span>
                      {realtimeUsers.filter((u) => u.platform === "web").length}{" "}
                      Web
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Smartphone className="h-4 w-4" />
                    <span>
                      {realtimeUsers.filter((u) => u.platform !== "web").length}{" "}
                      Mobile
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
