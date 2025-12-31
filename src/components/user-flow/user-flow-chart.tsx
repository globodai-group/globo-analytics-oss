"use client";

import { useTranslations } from "next-intl";

interface FlowNode {
  id: string;
  name: string;
  value: number;
}

interface FlowLink {
  source: string;
  target: string;
  value: number;
}

interface UserFlowChartProps {
  nodes: FlowNode[];
  links: FlowLink[];
  locale: string;
}

export function UserFlowChart({ nodes, links, locale }: UserFlowChartProps) {
  const t = useTranslations("userFlow");

  if (nodes.length === 0 || links.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("noData")}
      </div>
    );
  }

  // Find unique sources (entry points) and targets
  const sourcePages = new Set<string>();
  const targetPages = new Set<string>();

  links.forEach((link) => {
    sourcePages.add(link.source);
    targetPages.add(link.target);
  });

  // Entry pages are sources that aren't targets (or have high value as first step)
  const entryPages = Array.from(sourcePages).filter((page) => {
    const asTarget = links.filter((l) => l.target === page);
    const asSource = links.filter((l) => l.source === page);
    return asSource.length > asTarget.length;
  });

  // Calculate max value for scaling
  const maxValue = Math.max(...links.map((l) => l.value), 1);

  // Group links by source for visualization
  const linksBySource = new Map<string, FlowLink[]>();
  links.forEach((link) => {
    const existing = linksBySource.get(link.source) || [];
    existing.push(link);
    linksBySource.set(link.source, existing);
  });

  // Sort and limit for display
  const topLinks = links.slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Simple flow representation */}
      <div className="space-y-4">
        {topLinks.map((link, index) => {
          const widthPercent = Math.max((link.value / maxValue) * 100, 10);

          return (
            <div key={index} className="flex items-center gap-2">
              {/* Source */}
              <div className="w-[200px] text-right">
                <span
                  className="text-sm truncate inline-block max-w-full"
                  title={link.source}
                >
                  {link.source || "/"}
                </span>
              </div>

              {/* Arrow with flow indicator */}
              <div className="flex-1 flex items-center gap-2 min-w-[200px]">
                <div className="flex-1 relative h-8">
                  <div
                    className="absolute inset-y-0 left-0 bg-primary/20 rounded-full transition-all flex items-center justify-center"
                    style={{ width: `${widthPercent}%` }}
                  >
                    <span className="text-xs font-medium text-primary">
                      {link.value.toLocaleString(locale)}
                    </span>
                  </div>
                </div>
                <svg
                  className="h-4 w-4 text-muted-foreground flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </div>

              {/* Target */}
              <div className="w-[200px]">
                <span
                  className="text-sm truncate inline-block max-w-full"
                  title={link.target}
                >
                  {link.target || "/"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary/20" />
          <span className="text-sm text-muted-foreground">
            {t("transitions")}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {locale === "fr"
            ? `${topLinks.length} transitions les plus fréquentes`
            : `Top ${topLinks.length} most frequent transitions`}
        </div>
      </div>
    </div>
  );
}
