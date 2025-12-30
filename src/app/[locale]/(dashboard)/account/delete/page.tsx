import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { DeleteAccountForm } from "./delete-account-form";

export default async function DeleteAccountPage() {
  const session = await auth();
  const t = await getTranslations("account.delete");
  const locale = await getLocale();

  if (!session?.user?.id) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {locale === "fr"
            ? "Cette action est irréversible. Toutes vos données seront supprimées définitivement."
            : "This action is irreversible. All your data will be permanently deleted."}
        </AlertDescription>
      </Alert>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountForm locale={locale} />
        </CardContent>
      </Card>
    </div>
  );
}
