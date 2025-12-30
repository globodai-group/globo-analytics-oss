"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteAccountAction } from "@/lib/actions/account";
import { toast } from "sonner";

interface DeleteAccountSectionProps {
  title: string;
  description: string;
  buttonText: string;
  confirmText: string;
  cancelText: string;
  warningText: string;
}

export function DeleteAccountSection({
  title,
  description,
  buttonText,
  confirmText,
  cancelText,
  warningText,
}: DeleteAccountSectionProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [open, setOpen] = useState(false);
  const locale = useLocale();

  const expectedText = locale === "fr" ? "SUPPRIMER" : "DELETE";

  async function handleDelete() {
    if (confirmInput !== expectedText) {
      toast.error(
        locale === "fr"
          ? `Tapez "${expectedText}" pour confirmer`
          : `Type "${expectedText}" to confirm`,
      );
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteAccountAction(confirmInput, locale);
      if (result.success) {
        toast.success(locale === "fr" ? "Compte supprimé" : "Account deleted");
        signOut({ callbackUrl: "/" });
      } else {
        toast.error(result.error || "Failed to delete account");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{warningText}</p>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isDeleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              {buttonText}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription>{warningText}</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-2">
                {locale === "fr"
                  ? `Tapez "${expectedText}" pour confirmer:`
                  : `Type "${expectedText}" to confirm:`}
              </p>
              <Input
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={expectedText}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmInput("")}>
                {cancelText}
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || confirmInput !== expectedText}
              >
                {isDeleting ? "..." : confirmText}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
