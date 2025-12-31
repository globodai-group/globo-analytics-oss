"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, Filter } from "lucide-react";
import {
  createSegmentAction,
  updateSegmentAction,
} from "@/lib/actions/segments";
import { SEGMENT_FIELDS, OPERATORS_BY_TYPE } from "@/lib/analytics/segments";
import { toast } from "sonner";
import type {
  SegmentCondition,
  SegmentRule,
  SegmentField,
  SegmentOperator,
} from "@/lib/actions/segments";
import type { Segment } from "@prisma/client";

interface SegmentFormProps {
  projectId: number;
  locale: string;
  segment?: Segment;
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export function SegmentForm({ projectId, locale, segment }: SegmentFormProps) {
  const t = useTranslations("segments");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState(segment?.name || "");
  const [description, setDescription] = useState(segment?.description || "");
  const [isShared, setIsShared] = useState(segment?.isShared || false);

  // Parse existing conditions or create default
  const existingConditions = segment?.conditions as
    | SegmentCondition
    | undefined;
  const [conditionType, setConditionType] = useState<"AND" | "OR">(
    existingConditions?.type || "AND",
  );
  const [rules, setRules] = useState<SegmentRule[]>(
    existingConditions?.rules || [
      { id: generateId(), field: "country", operator: "equals", value: "" },
    ],
  );

  const addRule = () => {
    setRules([
      ...rules,
      { id: generateId(), field: "country", operator: "equals", value: "" },
    ]);
  };

  const removeRule = (id: string) => {
    if (rules.length > 1) {
      setRules(rules.filter((r) => r.id !== id));
    }
  };

  const updateRule = (id: string, field: keyof SegmentRule, value: unknown) => {
    setRules(
      rules.map((r) => {
        if (r.id === id) {
          const updated = { ...r, [field]: value };

          // Reset operator and value when field changes
          if (field === "field") {
            const fieldDef = SEGMENT_FIELDS.find((f) => f.id === value);
            const operators = OPERATORS_BY_TYPE[fieldDef?.type || "string"];
            updated.operator = operators?.[0]?.id || "equals";
            updated.value = "";
          }

          return updated;
        }
        return r;
      }),
    );
  };

  const getFieldType = (fieldId: string) => {
    return SEGMENT_FIELDS.find((f) => f.id === fieldId)?.type || "string";
  };

  const getFieldOptions = (fieldId: string) => {
    const field = SEGMENT_FIELDS.find((f) => f.id === fieldId);
    return field?.type === "enum" ? field.options : undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const conditions: SegmentCondition = {
      type: conditionType,
      rules: rules.filter(
        (r) => r.value !== "" || ["is_set", "is_not_set"].includes(r.operator),
      ),
    };

    try {
      const result = segment
        ? await updateSegmentAction(
            segment.id,
            { name, description, conditions, isShared },
            locale,
          )
        : await createSegmentAction(
            projectId,
            { name, description, conditions, isShared },
            locale,
          );

      if (result.success) {
        toast.success(result.message);
        router.push(`/projects/${projectId}/segments`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(
        locale === "fr" ? "Une erreur est survenue" : "An error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group fields by category
  const fieldsByCategory = SEGMENT_FIELDS.reduce(
    (acc, field) => {
      if (!acc[field.category]) {
        acc[field.category] = [];
      }
      acc[field.category].push(field);
      return acc;
    },
    {} as Record<string, Array<(typeof SEGMENT_FIELDS)[number]>>,
  );

  const categoryLabels: Record<string, { en: string; fr: string }> = {
    geography: { en: "Geography", fr: "Géographie" },
    technology: { en: "Technology", fr: "Technologie" },
    acquisition: { en: "Acquisition", fr: "Acquisition" },
    behavior: { en: "Behavior", fr: "Comportement" },
    user: { en: "User", fr: "Utilisateur" },
    custom: { en: "Custom", fr: "Personnalisé" },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {locale === "fr" ? "Informations de base" : "Basic Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                locale === "fr"
                  ? "Ex: Visiteurs français"
                  : "E.g.: French visitors"
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                locale === "fr"
                  ? "Description optionnelle..."
                  : "Optional description..."
              }
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">{t("shared")}</Label>
              <p className="text-sm text-muted-foreground">
                {locale === "fr"
                  ? "Permettre aux autres utilisateurs du projet de voir ce segment"
                  : "Allow other project users to see this segment"}
              </p>
            </div>
            <Switch checked={isShared} onCheckedChange={setIsShared} />
          </div>
        </CardContent>
      </Card>

      {/* Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("conditions")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Condition Type */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant={conditionType === "AND" ? "default" : "outline"}
              onClick={() => setConditionType("AND")}
              className="flex-1"
            >
              {t("matchAll")}
            </Button>
            <Button
              type="button"
              variant={conditionType === "OR" ? "default" : "outline"}
              onClick={() => setConditionType("OR")}
              className="flex-1"
            >
              {t("matchAny")}
            </Button>
          </div>

          {/* Rules */}
          <div className="space-y-3">
            {rules.map((rule, _index) => (
              <div
                key={rule.id}
                className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30"
              >
                <div className="flex-1 grid gap-3 md:grid-cols-3">
                  {/* Field Select */}
                  <div className="space-y-1">
                    <Label className="text-xs">{t("field")}</Label>
                    <Select
                      value={rule.field}
                      onValueChange={(value) =>
                        updateRule(rule.id, "field", value as SegmentField)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(fieldsByCategory).map(
                          ([category, fields]) => (
                            <div key={category}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                {categoryLabels[category]?.[
                                  locale === "fr" ? "fr" : "en"
                                ] || category}
                              </div>
                              {fields.map((field) => (
                                <SelectItem key={field.id} value={field.id}>
                                  {field.label}
                                </SelectItem>
                              ))}
                            </div>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Operator Select */}
                  <div className="space-y-1">
                    <Label className="text-xs">{t("operator")}</Label>
                    <Select
                      value={rule.operator}
                      onValueChange={(value) =>
                        updateRule(
                          rule.id,
                          "operator",
                          value as SegmentOperator,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS_BY_TYPE[getFieldType(rule.field)]?.map(
                          (op) => (
                            <SelectItem key={op.id} value={op.id}>
                              {op.label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Value Input */}
                  {!["is_set", "is_not_set"].includes(rule.operator) && (
                    <div className="space-y-1">
                      <Label className="text-xs">{t("value")}</Label>
                      {getFieldOptions(rule.field) ? (
                        <Select
                          value={rule.value as string}
                          onValueChange={(value) =>
                            updateRule(rule.id, "value", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("value")} />
                          </SelectTrigger>
                          <SelectContent>
                            {getFieldOptions(rule.field)?.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : getFieldType(rule.field) === "number" ? (
                        <Input
                          type="number"
                          value={rule.value as string}
                          onChange={(e) =>
                            updateRule(rule.id, "value", e.target.value)
                          }
                          placeholder="0"
                        />
                      ) : (
                        <Input
                          value={rule.value as string}
                          onChange={(e) =>
                            updateRule(rule.id, "value", e.target.value)
                          }
                          placeholder={t("value")}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                {rules.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRule(rule.id)}
                    className="mt-6 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Add Rule Button */}
          <Button
            type="button"
            variant="outline"
            onClick={addRule}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("addCondition")}
          </Button>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          {locale === "fr" ? "Annuler" : "Cancel"}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {locale === "fr" ? "Enregistrement..." : "Saving..."}
            </>
          ) : segment ? (
            locale === "fr" ? (
              "Mettre à jour"
            ) : (
              "Update"
            )
          ) : locale === "fr" ? (
            "Créer le segment"
          ) : (
            "Create segment"
          )}
        </Button>
      </div>
    </form>
  );
}
