"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, LucideIcon } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Generic type for delete action results (supports both old and new ActionResult types)
interface DeleteActionResult {
  success?: boolean;
  message?: string;
  error?: string;
}

/**
 * Resource type configuration for translations
 */
type ResourceType =
  | "goal"
  | "funnel"
  | "segment"
  | "alert"
  | "dimension"
  | "project"
  | "report"
  | "website";

const resourceTranslations: Record<
  ResourceType,
  {
    title: { fr: string; en: string };
    description: { fr: string; en: string };
    successMessage: { fr: string; en: string };
  }
> = {
  goal: {
    title: {
      fr: "Voulez-vous vraiment supprimer cet objectif ?",
      en: "Are you sure you want to delete this goal?",
    },
    description: {
      fr: 'L\'objectif "{name}" et toutes ses données de conversion seront définitivement supprimés.',
      en: 'The goal "{name}" and all its conversion data will be permanently deleted.',
    },
    successMessage: {
      fr: "Objectif supprimé",
      en: "Goal deleted",
    },
  },
  funnel: {
    title: {
      fr: "Voulez-vous vraiment supprimer ce tunnel ?",
      en: "Are you sure you want to delete this funnel?",
    },
    description: {
      fr: 'Le tunnel "{name}" et toutes ses données seront définitivement supprimés.',
      en: 'The funnel "{name}" and all its data will be permanently deleted.',
    },
    successMessage: {
      fr: "Tunnel supprimé",
      en: "Funnel deleted",
    },
  },
  segment: {
    title: {
      fr: "Voulez-vous vraiment supprimer ce segment ?",
      en: "Are you sure you want to delete this segment?",
    },
    description: {
      fr: 'Le segment "{name}" sera définitivement supprimé.',
      en: 'The segment "{name}" will be permanently deleted.',
    },
    successMessage: {
      fr: "Segment supprimé",
      en: "Segment deleted",
    },
  },
  alert: {
    title: {
      fr: "Voulez-vous vraiment supprimer cette alerte ?",
      en: "Are you sure you want to delete this alert?",
    },
    description: {
      fr: 'L\'alerte "{name}" sera définitivement supprimée.',
      en: 'The alert "{name}" will be permanently deleted.',
    },
    successMessage: {
      fr: "Alerte supprimée",
      en: "Alert deleted",
    },
  },
  dimension: {
    title: {
      fr: "Voulez-vous vraiment supprimer cette dimension ?",
      en: "Are you sure you want to delete this dimension?",
    },
    description: {
      fr: 'La dimension "{name}" et toutes ses valeurs seront définitivement supprimées.',
      en: 'The dimension "{name}" and all its values will be permanently deleted.',
    },
    successMessage: {
      fr: "Dimension supprimée",
      en: "Dimension deleted",
    },
  },
  project: {
    title: {
      fr: "Voulez-vous vraiment supprimer ce projet ?",
      en: "Are you sure you want to delete this project?",
    },
    description: {
      fr: 'Le projet "{name}" et toutes ses données seront définitivement supprimés. Cette action est irréversible.',
      en: 'The project "{name}" and all its data will be permanently deleted. This action cannot be undone.',
    },
    successMessage: {
      fr: "Projet supprimé",
      en: "Project deleted",
    },
  },
  report: {
    title: {
      fr: "Voulez-vous vraiment supprimer ce rapport ?",
      en: "Are you sure you want to delete this report?",
    },
    description: {
      fr: 'Le rapport "{name}" sera définitivement supprimé.',
      en: 'The report "{name}" will be permanently deleted.',
    },
    successMessage: {
      fr: "Rapport supprimé",
      en: "Report deleted",
    },
  },
  website: {
    title: {
      fr: "Voulez-vous vraiment supprimer ce site ?",
      en: "Are you sure you want to delete this website?",
    },
    description: {
      fr: 'Le site "{name}" et toutes ses données seront définitivement supprimés.',
      en: 'The website "{name}" and all its data will be permanently deleted.',
    },
    successMessage: {
      fr: "Site supprimé",
      en: "Website deleted",
    },
  },
};

interface DeleteResourceDialogProps {
  resourceId: number;
  resourceName: string;
  resourceType: ResourceType;
  deleteAction: (id: number, locale: string) => Promise<DeleteActionResult>;
  locale: string;
  /**
   * Type of trigger:
   * - "dropdown" for DropdownMenuItem
   * - "button" for standalone Button with text
   * - "icon" for icon-only ghost button
   */
  triggerType?: "dropdown" | "button" | "icon";
  /**
   * Custom icon for the trigger (defaults to Trash2)
   */
  icon?: LucideIcon;
  /**
   * Callback after successful deletion
   */
  onSuccess?: () => void;
  /**
   * Custom redirect path after deletion (if not using onSuccess)
   */
  redirectTo?: string;
}

export function DeleteResourceDialog({
  resourceId,
  resourceName,
  resourceType,
  deleteAction,
  locale,
  triggerType = "dropdown",
  icon: Icon = Trash2,
  onSuccess,
  redirectTo,
}: DeleteResourceDialogProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const translations = resourceTranslations[resourceType];
  const lang = locale === "fr" ? "fr" : "en";

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAction(resourceId, locale);
      if (result.success) {
        toast.success(result.message || translations.successMessage[lang]);
        if (onSuccess) {
          onSuccess();
        } else if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(
        lang === "fr" ? "Une erreur est survenue" : "An error occurred",
      );
    } finally {
      setIsDeleting(false);
      setShowDialog(false);
    }
  };

  const deleteLabel = lang === "fr" ? "Supprimer" : "Delete";
  const deletingLabel = lang === "fr" ? "Suppression..." : "Deleting...";
  const cancelLabel = lang === "fr" ? "Annuler" : "Cancel";

  const trigger =
    triggerType === "dropdown" ? (
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          setShowDialog(true);
        }}
        className="text-destructive"
      >
        <Icon className="h-4 w-4 mr-2" />
        {deleteLabel}
      </DropdownMenuItem>
    ) : triggerType === "icon" ? (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowDialog(true)}
        className="text-destructive hover:text-destructive"
      >
        <Icon className="h-4 w-4" />
      </Button>
    ) : (
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setShowDialog(true)}
      >
        <Icon className="h-4 w-4 mr-2" />
        {deleteLabel}
      </Button>
    );

  return (
    <>
      {trigger}

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.title[lang]}</AlertDialogTitle>
            <AlertDialogDescription>
              {translations.description[lang].replace("{name}", resourceName)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {cancelLabel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {deletingLabel}
                </>
              ) : (
                deleteLabel
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
