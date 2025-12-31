"use client";

import { useState, useEffect, useMemo } from "react";
import { useLocale } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, Globe, ArrowLeft, Loader2 } from "lucide-react";
import { getGeoStatsAction } from "@/lib/actions/stats";

// Lazy load Leaflet components to avoid SSR issues
import dynamic from "next/dynamic";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  {
    ssr: false,
  },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  {
    ssr: false,
  },
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  {
    ssr: false,
  },
);
const Tooltip = dynamic(
  () => import("react-leaflet").then((mod) => mod.Tooltip),
  {
    ssr: false,
  },
);

interface GeoMapProps {
  projectId: number;
  dateRange: { from: Date; to: Date };
}

interface CountryData {
  code: string;
  name: string;
  visitors: number;
  sessions: number;
  bounceRate: number;
}

interface CityData {
  name: string;
  country: string;
  visitors: number;
}

// Approximate country center coordinates
const COUNTRY_COORDS: Record<string, [number, number]> = {
  US: [39.8, -98.5],
  GB: [54.0, -2.0],
  FR: [46.2, 2.2],
  DE: [51.2, 10.5],
  CA: [56.1, -106.3],
  AU: [-25.3, 133.8],
  JP: [36.2, 138.3],
  CN: [35.9, 104.2],
  IN: [20.6, 78.9],
  BR: [-14.2, -51.9],
  MX: [23.6, -102.6],
  ES: [40.5, -3.7],
  IT: [41.9, 12.6],
  NL: [52.1, 5.3],
  BE: [50.5, 4.5],
  CH: [46.8, 8.2],
  SE: [60.1, 18.6],
  NO: [60.5, 8.5],
  DK: [56.3, 9.5],
  FI: [61.9, 25.7],
  PL: [51.9, 19.1],
  RU: [61.5, 105.3],
  KR: [35.9, 127.8],
  SG: [1.4, 103.8],
  HK: [22.4, 114.1],
  TW: [23.7, 121.0],
  NZ: [-40.9, 174.9],
  IE: [53.1, -7.7],
  AT: [47.5, 14.6],
  PT: [39.4, -8.2],
  AR: [-38.4, -63.6],
  CL: [-35.7, -71.5],
  CO: [4.6, -74.3],
  ZA: [-30.6, 22.9],
  EG: [26.8, 30.8],
  NG: [9.1, 8.7],
  KE: [-0.0, 37.9],
  MA: [31.8, -7.1],
  TH: [15.9, 100.9],
  VN: [14.1, 108.3],
  ID: [-0.8, 113.9],
  MY: [4.2, 101.9],
  PH: [12.9, 121.8],
  TR: [39.0, 35.2],
  SA: [23.9, 45.1],
  AE: [23.4, 53.8],
  IL: [31.0, 34.9],
};

export function GeoMap({ projectId, dateRange }: GeoMapProps) {
  const locale = useLocale();
  const [data, setData] = useState<{
    countries: CountryData[];
    cities?: CityData[];
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // We're in a "use client" component, so we can check if we're on client
  // Leaflet needs to be mounted on client only
  const isMapReady = typeof window !== "undefined";

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const result = await getGeoStatsAction(
        projectId,
        dateRange,
        selectedCountry || undefined,
      );

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to load data");
      }

      setLoading(false);
    }

    fetchData();
  }, [projectId, dateRange, selectedCountry]);

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat(locale).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat(locale, {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  // Calculate max visitors for scaling circle sizes
  const maxVisitors = useMemo(() => {
    if (!data?.countries.length) return 1;
    return Math.max(...data.countries.map((c) => c.visitors));
  }, [data]);

  // Get circle radius based on visitor count
  const getCircleRadius = (visitors: number) => {
    const minRadius = 5;
    const maxRadius = 30;
    const ratio = visitors / maxVisitors;
    return minRadius + ratio * (maxRadius - minRadius);
  };

  // Get circle color based on visitor intensity
  const getCircleColor = (visitors: number) => {
    const ratio = visitors / maxVisitors;
    if (ratio > 0.7) return "#22c55e"; // green-500
    if (ratio > 0.4) return "#3b82f6"; // blue-500
    if (ratio > 0.2) return "#8b5cf6"; // purple-500
    return "#6b7280"; // gray-500
  };

  if (loading && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {locale === "fr"
              ? "Répartition géographique"
              : "Geographic Distribution"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            {locale === "fr" ? "Chargement de la carte..." : "Loading map..."}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {locale === "fr"
              ? "Répartition géographique"
              : "Geographic Distribution"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-red-500">
            {error || (locale === "fr" ? "Aucune donnée" : "No data")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {locale === "fr"
                ? "Répartition géographique"
                : "Geographic Distribution"}
            </CardTitle>
            <CardDescription>
              {selectedCountry ? (
                <span className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => setSelectedCountry(null)}
                  >
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    {locale === "fr" ? "Retour" : "Back"}
                  </Button>
                  {locale === "fr"
                    ? `Villes en ${selectedCountry}`
                    : `Cities in ${selectedCountry}`}
                </span>
              ) : locale === "fr" ? (
                "Cliquez sur un pays pour voir les villes"
              ) : (
                "Click a country to see cities"
              )}
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono">
            {formatNumber(data.total)}{" "}
            {locale === "fr" ? "visiteurs" : "visitors"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map */}
        <div className="h-80 rounded-lg overflow-hidden border bg-muted/20">
          {isMapReady && (
            <MapContainer
              center={[30, 0]}
              zoom={2}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {data.countries.map((country) => {
                const coords = COUNTRY_COORDS[country.code];
                if (!coords) return null;

                return (
                  <CircleMarker
                    key={country.code}
                    center={coords}
                    radius={getCircleRadius(country.visitors)}
                    pathOptions={{
                      color: getCircleColor(country.visitors),
                      fillColor: getCircleColor(country.visitors),
                      fillOpacity: 0.6,
                      weight: 2,
                    }}
                    eventHandlers={{
                      click: () => setSelectedCountry(country.code),
                    }}
                  >
                    <Tooltip>
                      <div className="text-sm">
                        <strong>{country.name}</strong>
                        <br />
                        {formatNumber(country.visitors)}{" "}
                        {locale === "fr" ? "visiteurs" : "visitors"}
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}
        </div>

        {/* Country/City Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">
                  {selectedCountry
                    ? locale === "fr"
                      ? "Ville"
                      : "City"
                    : locale === "fr"
                      ? "Pays"
                      : "Country"}
                </TableHead>
                <TableHead className="text-right">
                  {locale === "fr" ? "Visiteurs" : "Visitors"}
                </TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedCountry && data.cities
                ? data.cities.slice(0, 10).map((city) => (
                    <TableRow key={city.name}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {city.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(city.visitors)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatPercentage((city.visitors / data.total) * 100)}
                      </TableCell>
                    </TableRow>
                  ))
                : data.countries.slice(0, 10).map((country) => (
                    <TableRow
                      key={country.code}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedCountry(country.code)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor: getCircleColor(country.visitors),
                            }}
                          />
                          <span className="font-medium">{country.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {country.code}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(country.visitors)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatPercentage(
                          (country.visitors / data.total) * 100,
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              {(selectedCountry
                ? !data.cities?.length
                : !data.countries.length) && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    {locale === "fr" ? "Aucune donnée" : "No data"}
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
