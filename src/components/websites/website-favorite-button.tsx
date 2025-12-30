"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleFavoriteAction } from "@/lib/actions/websites";
import { toast } from "sonner";

interface WebsiteFavoriteButtonProps {
  websiteId: number;
  isFavorite: boolean;
}

export function WebsiteFavoriteButton({ websiteId, isFavorite }: WebsiteFavoriteButtonProps) {
  const locale = useLocale();
  const [favorite, setFavorite] = useState(isFavorite);
  const [isLoading, setIsLoading] = useState(false);

  async function handleToggle() {
    setIsLoading(true);
    const result = await toggleFavoriteAction(websiteId, locale);

    if (result.success) {
      setFavorite(!favorite);
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }

    setIsLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={handleToggle}
      disabled={isLoading}
    >
      <Star
        className={`h-4 w-4 ${favorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
      />
    </Button>
  );
}
