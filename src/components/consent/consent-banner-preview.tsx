"use client";

import { Button } from "@/components/ui/button";

interface ConsentBannerPreviewProps {
  position: string;
  text: string;
  privacyUrl: string;
  locale: string;
}

export function ConsentBannerPreview({
  position,
  text,
  privacyUrl,
  locale,
}: ConsentBannerPreviewProps) {
  const positionClass =
    position === "top"
      ? "top-0"
      : position === "center"
        ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg max-w-md"
        : "bottom-0";

  return (
    <div className="relative bg-muted rounded-lg h-64 overflow-hidden">
      {/* Page preview background */}
      <div className="absolute inset-0 p-4">
        <div className="h-4 w-32 bg-background/50 rounded mb-2" />
        <div className="h-2 w-48 bg-background/30 rounded mb-4" />
        <div className="grid grid-cols-3 gap-2 opacity-30">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-background/40 rounded" />
          ))}
        </div>
      </div>

      {/* Banner preview */}
      <div
        className={`absolute left-0 right-0 ${positionClass} bg-background border shadow-lg p-4 z-10`}
      >
        <p className="text-sm mb-3">{text}</p>
        {privacyUrl && (
          <a
            href={privacyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline mb-3 block"
          >
            {locale === "fr"
              ? "Politique de confidentialité"
              : "Privacy Policy"}
          </a>
        )}
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="default">
            {locale === "fr" ? "Tout accepter" : "Accept All"}
          </Button>
          <Button size="sm" variant="outline">
            {locale === "fr" ? "Nécessaires" : "Necessary Only"}
          </Button>
          <Button size="sm" variant="ghost">
            {locale === "fr" ? "Personnaliser" : "Customize"}
          </Button>
        </div>
      </div>
    </div>
  );
}
