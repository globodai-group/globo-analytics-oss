"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Key, Trash2, Pencil, Check, X, Loader2 } from "lucide-react";
import { getUserPasskeysAction, deletePasskeyAction, renamePasskeyAction } from "@/lib/actions/tfa";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS } from "date-fns/locale";

interface Passkey {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  deviceType: string | null;
  backedUp: boolean;
}

interface PasskeyListProps {
  locale: string;
}

export function PasskeyList({ locale }: PasskeyListProps) {
  const router = useRouter();
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const t = {
    noPasskeys: locale === "fr" ? "Aucune clé configurée" : "No keys configured",
    lastUsed: locale === "fr" ? "Dernière utilisation" : "Last used",
    never: locale === "fr" ? "Jamais" : "Never",
    created: locale === "fr" ? "Créée" : "Created",
    deleteTitle: locale === "fr" ? "Supprimer cette clé ?" : "Delete this key?",
    deleteDescription:
      locale === "fr"
        ? "Cette action est irréversible. Vous ne pourrez plus utiliser cette clé pour vous connecter."
        : "This action cannot be undone. You will no longer be able to use this key to sign in.",
    cancel: locale === "fr" ? "Annuler" : "Cancel",
    delete: locale === "fr" ? "Supprimer" : "Delete",
    synced: locale === "fr" ? "Synchronisée" : "Synced",
  };

  useEffect(() => {
    async function loadPasskeys() {
      const result = await getUserPasskeysAction(locale);
      if (result.success && result.data) {
        setPasskeys(result.data.passkeys as Passkey[]);
      }
      setIsLoading(false);
    }
    loadPasskeys();
  }, [locale]);

  async function handleDelete(passkeyId: string) {
    setIsDeleting(true);
    const result = await deletePasskeyAction(passkeyId, locale);
    setIsDeleting(false);
    setDeletingId(null);

    if (result.success) {
      setPasskeys((prev) => prev.filter((p) => p.id !== passkeyId));
      toast.success(locale === "fr" ? "Clé supprimée" : "Key deleted");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleRename(passkeyId: string) {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }

    setIsSaving(true);
    const result = await renamePasskeyAction(passkeyId, editName.trim(), locale);
    setIsSaving(false);

    if (result.success) {
      setPasskeys((prev) =>
        prev.map((p) => (p.id === passkeyId ? { ...p, name: editName.trim() } : p))
      );
      toast.success(locale === "fr" ? "Nom mis à jour" : "Name updated");
    } else {
      toast.error(result.error);
    }

    setEditingId(null);
  }

  function startEditing(passkey: Passkey) {
    setEditingId(passkey.id);
    setEditName(passkey.name);
  }

  const dateLocale = locale === "fr" ? fr : enUS;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (passkeys.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-2 mt-4">
        {passkeys.map((passkey) => (
          <div
            key={passkey.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
          >
            <div className="flex items-center gap-3">
              <Key className="h-4 w-4 text-muted-foreground" />
              <div>
                {editingId === passkey.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-7 w-48"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(passkey.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleRename(passkey.id)}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{passkey.name}</p>
                      {passkey.backedUp && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {t.synced}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.lastUsed}:{" "}
                      {passkey.lastUsedAt
                        ? formatDistanceToNow(new Date(passkey.lastUsedAt), {
                            addSuffix: true,
                            locale: dateLocale,
                          })
                        : t.never}
                    </p>
                  </>
                )}
              </div>
            </div>
            {editingId !== passkey.id && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => startEditing(passkey)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeletingId(passkey.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
