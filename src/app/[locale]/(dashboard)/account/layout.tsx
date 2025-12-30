import { getTranslations } from "next-intl/server";

interface AccountLayoutProps {
  children: React.ReactNode;
}

export default async function AccountLayout({ children }: AccountLayoutProps) {
  const t = await getTranslations("account");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("profile.description")}</p>
      </div>
      {children}
    </div>
  );
}
