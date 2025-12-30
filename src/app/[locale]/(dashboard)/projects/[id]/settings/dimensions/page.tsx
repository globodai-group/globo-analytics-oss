import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Settings, Hash, Users, Eye, EyeOff } from "lucide-react";
import { DimensionForm } from "@/components/dimensions/dimension-form";
import { DimensionDeleteButton } from "@/components/dimensions/dimension-delete-button";
import { DimensionToggleButton } from "@/components/dimensions/dimension-toggle-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getMaxSlotsForUser(): Promise<number> {
  // In OSS, slots are based on license tier
  // Community: 20 slots, Pro/Enterprise: 200 slots
  const { getCurrentTier } = await import("@/lib/license/validator");
  const tier = await getCurrentTier();
  return tier === "community" ? 20 : 200;
}

export default async function DimensionsSettingsPage({ params }: PageProps) {
  const { id } = await params;
  const projectId = parseInt(id);
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dimensions");

  if (!session?.user) {
    redirect("/login");
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: {
      customDimensions: {
        orderBy: { slot: "asc" },
        include: {
          _count: {
            select: { values: true },
          },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const maxSlots = await getMaxSlotsForUser();
  const usedSlots = project.customDimensions.length;
  const availableSlots = maxSlots - usedSlots;

  // Get next available slot
  const usedSlotNumbers = new Set(project.customDimensions.map((d) => d.slot));
  let nextSlot = 1;
  for (let i = 1; i <= maxSlots; i++) {
    if (!usedSlotNumbers.has(i)) {
      nextSlot = i;
      break;
    }
  }

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case "HIT":
        return <Eye className="h-4 w-4" />;
      case "SESSION":
        return <Hash className="h-4 w-4" />;
      case "VISITOR":
        return <Users className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getScopeBadgeVariant = (scope: string): "default" | "secondary" | "outline" => {
    switch (scope) {
      case "HIT":
        return "default";
      case "SESSION":
        return "secondary";
      case "VISITOR":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {/* Usage Info */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t("usage")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>{t("slotsUsed", { used: usedSlots, max: maxSlots })}</span>
                <span className="text-muted-foreground">
                  {availableSlots} {t("available")}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(usedSlots / maxSlots) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Dimension */}
      {availableSlots > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {t("addNew")}
            </CardTitle>
            <CardDescription>{t("addNewDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <DimensionForm
              projectId={projectId}
              locale={locale}
              nextSlot={nextSlot}
              maxSlots={maxSlots}
              usedSlots={Array.from(usedSlotNumbers)}
            />
          </CardContent>
        </Card>
      )}

      {/* Existing Dimensions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("configured")}</CardTitle>
          <CardDescription>
            {project.customDimensions.length === 0
              ? t("noDimensions")
              : t("dimensionsCount", { count: project.customDimensions.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {project.customDimensions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("noDimensionsDescription")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {project.customDimensions.map((dimension) => (
                <div
                  key={dimension.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-mono font-bold">
                      {dimension.slot}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{dimension.name}</span>
                        {!dimension.isActive && (
                          <Badge variant="secondary" className="gap-1">
                            <EyeOff className="h-3 w-3" />
                            {t("inactive")}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant={getScopeBadgeVariant(dimension.scope)} className="gap-1">
                          {getScopeIcon(dimension.scope)}
                          {t(`scopes.${dimension.scope}`)}
                        </Badge>
                        <span>•</span>
                        <span>
                          {dimension._count.values} {t("values")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DimensionToggleButton
                      dimensionId={dimension.id}
                      isActive={dimension.isActive}
                    />
                    <DimensionDeleteButton
                      dimensionId={dimension.id}
                      dimensionName={dimension.name}
                      locale={locale}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tracker Integration Guide */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">{t("integration.title")}</CardTitle>
          <CardDescription>{t("integration.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">{t("integration.setDimension")}</h4>
              <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
                <code>{`// ${t("integration.setExample")}
gr('set', 'dimension1', 'premium_user');
gr('set', 'dimension2', 'category_electronics');`}</code>
              </pre>
            </div>
            <div>
              <h4 className="font-medium mb-2">{t("integration.withEvent")}</h4>
              <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
                <code>{`// ${t("integration.eventExample")}
gr('event', 'purchase', {
  dimension1: 'premium_user',
  dimension5: 'mobile_app'
});`}</code>
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
