"use client";

import { useTranslations } from "next-intl";

interface FunnelStep {
  position: number;
  name: string;
  visitors: number;
  dropOff: number;
  dropOffRate: number;
  conversionRate: number;
}

interface FunnelChartProps {
  steps: FunnelStep[];
  locale: string;
}

export function FunnelChart({ steps }: FunnelChartProps) {
  const t = useTranslations("funnels");

  if (steps.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">{t("noData")}</div>;
  }

  const maxVisitors = Math.max(...steps.map((s) => s.visitors), 1);

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const widthPercentage = (step.visitors / maxVisitors) * 100;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.position} className="relative">
            {/* Funnel bar */}
            <div className="relative flex justify-center">
              <div
                className="h-16 bg-primary/20 rounded-lg flex items-center justify-between px-4 transition-all"
                style={{
                  width: `${Math.max(widthPercentage, 20)}%`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {step.position}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{step.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {step.visitors.toLocaleString()} {t("visitors")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-green-600">{step.conversionRate}%</p>
                  {step.position > 1 && step.dropOff > 0 && (
                    <p className="text-xs text-destructive">
                      -{step.dropOff.toLocaleString()} ({step.dropOffRate}%)
                    </p>
                  )}
                </div>
              </div>

              {/* Arrow connector */}
              {!isLast && (
                <div className="flex justify-center my-2">
                  <div className="w-0.5 h-6 bg-muted-foreground/30" />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary/20" />
          <span className="text-sm text-muted-foreground">{t("visitors")}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-600" />
          <span className="text-sm text-muted-foreground">{t("conversionRate")}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-destructive" />
          <span className="text-sm text-muted-foreground">{t("dropOff")}</span>
        </div>
      </div>
    </div>
  );
}
