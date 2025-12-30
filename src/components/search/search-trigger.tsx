"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Detect Mac platform without causing sync setState in effect
function useIsMac() {
  return useSyncExternalStore(
    () => () => {}, // subscribe - no-op, platform doesn't change
    () => navigator.platform.toUpperCase().indexOf("MAC") >= 0, // client snapshot
    () => false // server snapshot (default to non-Mac)
  );
}

interface SearchTriggerProps {
  className?: string;
  variant?: "default" | "compact";
}

export function SearchTrigger({ className, variant = "default" }: SearchTriggerProps) {
  const t = useTranslations("search");
  const isMac = useIsMac();

  const handleClick = useCallback(() => {
    // Dispatch keyboard event to trigger command palette
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  }, []);

  if (variant === "compact") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className={cn("h-9 w-9", className)}
        aria-label={t("openSearch")}
      >
        <Search className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className={cn(
        "relative h-9 w-full justify-start rounded-md bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64",
        className
      )}
    >
      <Search className="mr-2 h-4 w-4" />
      <span className="hidden lg:inline-flex">{t("placeholder")}</span>
      <span className="inline-flex lg:hidden">{t("search")}</span>
      <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
        {isMac ? "⌘" : "Ctrl"}K
      </kbd>
    </Button>
  );
}
