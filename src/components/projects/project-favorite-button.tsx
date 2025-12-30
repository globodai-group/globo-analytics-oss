"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleProjectFavoriteAction } from "@/lib/actions/projects";
import { toast } from "sonner";

interface ProjectFavoriteButtonProps {
  projectId: number;
  isFavorite: boolean;
}

export function ProjectFavoriteButton({ projectId, isFavorite }: ProjectFavoriteButtonProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  const [isLoading, setIsLoading] = useState(false);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);

    const result = await toggleProjectFavoriteAction(projectId);

    if (result.success) {
      setFavorite(!favorite);
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
