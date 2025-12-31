import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ContactForm } from "./contact-form";

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <div className="container max-w-2xl py-12">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ContactForm />
        </CardContent>
      </Card>
    </div>
  );
}
