import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PreferencesForm } from "./preferences-form";

export default async function PreferencesPage() {
  const session = await auth();
  const t = await getTranslations("account.preferences");
  const locale = await getLocale();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      locale: true,
      timezone: true,
    },
  });

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <PreferencesForm
          userLocale={user.locale}
          userTimezone={user.timezone}
          currentLocale={locale}
        />
      </CardContent>
    </Card>
  );
}
