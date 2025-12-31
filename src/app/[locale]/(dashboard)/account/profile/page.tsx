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
import { ProfileForm } from "./profile-form";
import { DeleteAccountSection } from "./delete-account-section";

export default async function ProfilePage() {
  const session = await auth();
  const t = await getTranslations("account.profile");
  const tDelete = await getTranslations("account.delete");
  const locale = await getLocale();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      image: true,
      locale: true,
      timezone: true,
    },
  });

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={user} locale={locale} />
        </CardContent>
      </Card>

      <DeleteAccountSection
        title={tDelete("title")}
        description={tDelete("description")}
        buttonText={tDelete("button")}
        confirmText={tDelete("confirm")}
        cancelText={tDelete("cancel")}
        warningText={tDelete("warning")}
      />
    </div>
  );
}
