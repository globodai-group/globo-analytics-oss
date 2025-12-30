import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { OAuthClientForm } from "@/components/developers/oauth-client-form";

export default async function NewDeveloperAppPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/account/developers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {locale === "fr" ? "Nouvelle Application" : "New Application"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "fr"
              ? "Créez une application OAuth pour accéder à l'API"
              : "Create an OAuth application to access the API"}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "fr" ? "Informations de l'application" : "Application Details"}
          </CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Ces informations seront affichées lors de l'autorisation."
              : "This information will be displayed during authorization."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OAuthClientForm locale={locale} />
        </CardContent>
      </Card>
    </div>
  );
}
