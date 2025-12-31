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
import { ApiTokenManager } from "./api-token-manager";

export default async function ApiPage() {
  const session = await auth();
  const t = await getTranslations("account.api");
  const locale = await getLocale();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      apiToken: true,
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
        <ApiTokenManager hasToken={!!user.apiToken} locale={locale} />
      </CardContent>
    </Card>
  );
}
