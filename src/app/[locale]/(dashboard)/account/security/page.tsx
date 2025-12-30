import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordForm } from "./password-form";
import { TwoFactorSection } from "./two-factor-section";

export default async function SecurityPage() {
  const session = await auth();
  const t = await getTranslations("account.security");
  const locale = await getLocale();

  if (!session?.user?.id) {
    return null;
  }

  const [user, passkeyCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
        tfaEnabled: true,
        tfaDefaultMethod: true,
        totpVerified: true,
        recoveryCodes: true,
      },
    }),
    prisma.passkey.count({ where: { userId: session.user.id } }),
  ]);

  if (!user) {
    return null;
  }

  const hasPassword = !!user.password;

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>{t("changePassword")}</CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Modifiez votre mot de passe pour sécuriser votre compte"
              : "Update your password to keep your account secure"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasPassword ? (
            <PasswordForm locale={locale} />
          ) : (
            <p className="text-muted-foreground">
              {locale === "fr"
                ? "Vous vous êtes connecté avec un compte social. Le mot de passe n'est pas disponible."
                : "You signed in with a social account. Password is not available."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <TwoFactorSection
        enabled={user.tfaEnabled}
        defaultMethod={user.tfaDefaultMethod}
        totpEnabled={user.totpVerified}
        passkeyCount={passkeyCount}
        recoveryCodesCount={user.recoveryCodes.length}
        locale={locale}
      />
    </div>
  );
}
