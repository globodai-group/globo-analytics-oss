"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Globe,
  Monitor,
  Smartphone,
  Loader2,
  Languages,
  MonitorSmartphone,
  Chrome,
  Apple,
} from "lucide-react";
import { getTechnologyStatsAction, type TechnologyStats } from "@/lib/actions/stats";

interface TechnologyOverviewProps {
  projectId: number;
  dateRange: { from: Date; to: Date };
}

// Browser icons mapping
const getBrowserIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("chrome")) return Chrome;
  if (lower.includes("safari")) return Apple;
  if (lower.includes("firefox")) return Globe;
  if (lower.includes("edge")) return Globe;
  return Globe;
};

// Device icons mapping
const getDeviceIcon = (platform: string) => {
  const lower = platform.toLowerCase();
  if (lower.includes("mobile")) return Smartphone;
  return Monitor;
};

export function TechnologyOverview({ projectId, dateRange }: TechnologyOverviewProps) {
  const locale = useLocale();
  const [data, setData] = useState<TechnologyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const result = await getTechnologyStatsAction(projectId, dateRange);

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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        {locale === "fr" ? "Chargement..." : "Loading..."}
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64 text-red-500">
          {error || (locale === "fr" ? "Aucune donnée" : "No data")}
        </CardContent>
      </Card>
    );
  }

  // Group browsers by name for collapsible view
  const browserGroups = data.browsers.reduce(
    (acc, browser) => {
      if (!acc[browser.name]) {
        acc[browser.name] = [];
      }
      acc[browser.name].push(browser);
      return acc;
    },
    {} as Record<string, typeof data.browsers>
  );

  // Group OS by name for collapsible view
  const osGroups = data.operatingSystems.reduce(
    (acc, os) => {
      if (!acc[os.name]) {
        acc[os.name] = [];
      }
      acc[os.name].push(os);
      return acc;
    },
    {} as Record<string, typeof data.operatingSystems>
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Platform Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MonitorSmartphone className="h-4 w-4 text-blue-500" />
              {locale === "fr" ? "Plateformes" : "Platforms"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.platforms.map((platform) => {
                const Icon = getDeviceIcon(platform.platform);
                return (
                  <div key={platform.platform} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {platform.platform}
                      </span>
                      <span className="font-medium">{formatPercentage(platform.percentage)}</span>
                    </div>
                    <Progress value={platform.percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Browser */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4 text-green-500" />
              {locale === "fr" ? "Navigateur principal" : "Top Browser"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.browsers.length > 0 && (
              <div className="space-y-2">
                <div className="text-3xl font-bold">{data.browsers[0].name}</div>
                <div className="text-sm text-muted-foreground">
                  {formatNumber(data.browsers[0].users)}{" "}
                  {locale === "fr" ? "utilisateurs" : "users"} (
                  {formatPercentage(data.browsers[0].percentage)})
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {data.browsers.slice(0, 5).map((b) => (
                    <Badge key={`${b.name}-${b.version}`} variant="secondary" className="text-xs">
                      {b.name} {b.version}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top OS */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Monitor className="h-4 w-4 text-purple-500" />
              {locale === "fr" ? "Système principal" : "Top OS"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.operatingSystems.length > 0 && (
              <div className="space-y-2">
                <div className="text-3xl font-bold">{data.operatingSystems[0].name}</div>
                <div className="text-sm text-muted-foreground">
                  {formatNumber(data.operatingSystems[0].users)}{" "}
                  {locale === "fr" ? "utilisateurs" : "users"} (
                  {formatPercentage(data.operatingSystems[0].percentage)})
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {data.operatingSystems.slice(0, 5).map((o) => (
                    <Badge key={`${o.name}-${o.version}`} variant="secondary" className="text-xs">
                      {o.name} {o.version}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="browsers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browsers" className="gap-2">
            <Globe className="h-4 w-4" />
            {locale === "fr" ? "Navigateurs" : "Browsers"}
          </TabsTrigger>
          <TabsTrigger value="os" className="gap-2">
            <Monitor className="h-4 w-4" />
            {locale === "fr" ? "Systèmes" : "Operating Systems"}
          </TabsTrigger>
          <TabsTrigger value="languages" className="gap-2">
            <Languages className="h-4 w-4" />
            {locale === "fr" ? "Langues" : "Languages"}
          </TabsTrigger>
        </TabsList>

        {/* Browsers Tab */}
        <TabsContent value="browsers">
          <Card>
            <CardHeader>
              <CardTitle>{locale === "fr" ? "Navigateurs" : "Browsers"}</CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Répartition des navigateurs et versions"
                  : "Browser and version breakdown"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{locale === "fr" ? "Navigateur" : "Browser"}</TableHead>
                      <TableHead>{locale === "fr" ? "Version" : "Version"}</TableHead>
                      <TableHead className="text-right">
                        {locale === "fr" ? "Utilisateurs" : "Users"}
                      </TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.browsers.map((browser, index) => {
                      const Icon = getBrowserIcon(browser.name);
                      return (
                        <TableRow key={`${browser.name}-${browser.version}-${index}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{browser.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{browser.version || "-"}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(browser.users)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatPercentage(browser.percentage)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {data.browsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          {locale === "fr" ? "Aucune donnée" : "No data"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operating Systems Tab */}
        <TabsContent value="os">
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === "fr" ? "Systèmes d'exploitation" : "Operating Systems"}
              </CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Répartition des systèmes et versions"
                  : "OS and version breakdown"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{locale === "fr" ? "Système" : "Operating System"}</TableHead>
                      <TableHead>{locale === "fr" ? "Version" : "Version"}</TableHead>
                      <TableHead className="text-right">
                        {locale === "fr" ? "Utilisateurs" : "Users"}
                      </TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.operatingSystems.map((os, index) => (
                      <TableRow key={`${os.name}-${os.version}-${index}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{os.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{os.version || "-"}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(os.users)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatPercentage(os.percentage)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {data.operatingSystems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          {locale === "fr" ? "Aucune donnée" : "No data"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Languages Tab */}
        <TabsContent value="languages">
          <Card>
            <CardHeader>
              <CardTitle>{locale === "fr" ? "Langues" : "Languages"}</CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Langues utilisées par vos visiteurs"
                  : "Languages used by your visitors"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{locale === "fr" ? "Langue" : "Language"}</TableHead>
                      <TableHead className="text-right">
                        {locale === "fr" ? "Utilisateurs" : "Users"}
                      </TableHead>
                      <TableHead className="text-right">%</TableHead>
                      <TableHead className="w-[200px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.languages.map((lang, index) => (
                      <TableRow key={`${lang.language}-${index}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Languages className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{lang.language}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(lang.users)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatPercentage(lang.percentage)}
                        </TableCell>
                        <TableCell>
                          <Progress value={lang.percentage} className="h-2" />
                        </TableCell>
                      </TableRow>
                    ))}
                    {data.languages.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          {locale === "fr" ? "Aucune donnée" : "No data"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
