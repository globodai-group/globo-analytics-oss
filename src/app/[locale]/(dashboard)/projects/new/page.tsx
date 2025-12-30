import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProjectForm } from "@/components/projects/project-form";

export default async function NewProjectPage() {
  const t = await getTranslations();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t("projects.addNew")}</h1>
          <p className="text-muted-foreground">{t("projects.addNewDescription")}</p>
        </div>
      </div>

      {/* Form */}
      <ProjectForm />
    </div>
  );
}
