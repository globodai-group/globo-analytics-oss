"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, CheckCircle, Zap, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface LicenseStatsProps {
  stats: {
    total: number;
    active: number;
    pro: number;
    enterprise: number;
  };
}

export function LicenseStats({ stats }: LicenseStatsProps) {
  const t = useTranslations("admin.licenses.stats");

  const cards = [
    {
      title: t("total"),
      value: stats.total,
      icon: KeyRound,
      className: "text-blue-600",
    },
    {
      title: t("active"),
      value: stats.active,
      icon: CheckCircle,
      className: "text-green-600",
    },
    {
      title: t("pro"),
      value: stats.pro,
      icon: Zap,
      className: "text-purple-600",
    },
    {
      title: t("enterprise"),
      value: stats.enterprise,
      icon: Building2,
      className: "text-orange-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.className}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
