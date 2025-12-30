import { getTranslations, getLocale } from "next-intl/server";
import { ApiDocumentation } from "./api-documentation";

export async function generateMetadata() {
  const t = await getTranslations("developers");
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function DevelopersPage() {
  const t = await getTranslations("developers");
  const locale = await getLocale();

  return (
    <div className="container mx-auto px-4 py-24">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t("title")}</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{t("subtitle")}</p>
      </div>

      {/* API Documentation */}
      <ApiDocumentation locale={locale} />
    </div>
  );
}
