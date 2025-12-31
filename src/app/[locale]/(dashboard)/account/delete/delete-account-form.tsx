"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Trash2 } from "lucide-react";
import { deleteAccountAction } from "@/lib/actions/account";

const deleteSchema = z.object({
  confirmation: z.string(),
});

type DeleteInput = z.infer<typeof deleteSchema>;

interface DeleteAccountFormProps {
  locale: string;
}

export function DeleteAccountForm({ locale }: DeleteAccountFormProps) {
  const t = useTranslations("account.delete");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const confirmText = "DELETE";

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<DeleteInput>({
    resolver: zodResolver(deleteSchema),
    defaultValues: {
      confirmation: "",
    },
  });

  const confirmationValue = watch("confirmation");
  const isConfirmValid = confirmationValue === confirmText;

  async function onSubmit(data: DeleteInput) {
    if (data.confirmation !== confirmText) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await deleteAccountAction(data.confirmation, locale);

      if (result.success) {
        toast.success(
          locale === "fr"
            ? "Votre compte a été supprimé"
            : "Your account has been deleted",
        );
        await signOut({ callbackUrl: "/" });
      } else {
        toast.error(result.error || "Failed to delete account");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) {
      reset();
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground space-y-2">
        <p>
          {locale === "fr"
            ? "La suppression de votre compte entraînera :"
            : "Deleting your account will:"}
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>
            {locale === "fr"
              ? "Supprimer tous vos sites web et leurs statistiques"
              : "Delete all your websites and their statistics"}
          </li>
          <li>
            {locale === "fr"
              ? "Annuler votre abonnement actif"
              : "Cancel your active subscription"}
          </li>
          <li>
            {locale === "fr"
              ? "Supprimer toutes vos données personnelles"
              : "Delete all your personal data"}
          </li>
        </ul>
      </div>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            {t("button")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{t("confirmTitle")}</DialogTitle>
              <DialogDescription>{t("confirmDescription")}</DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="confirmation">
                  {locale === "fr"
                    ? `Tapez "${confirmText}" pour confirmer`
                    : `Type "${confirmText}" to confirm`}
                </Label>
                <Input
                  id="confirmation"
                  {...register("confirmation")}
                  placeholder={confirmText}
                  autoComplete="off"
                  disabled={isLoading}
                />
                {errors.confirmation && (
                  <p className="text-sm text-destructive">
                    {errors.confirmation.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                {locale === "fr" ? "Annuler" : "Cancel"}
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={!isConfirmValid || isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("button")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
