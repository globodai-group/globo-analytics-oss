"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Filter, Save, Loader2 } from "lucide-react";
import { SegmentConditionRow, type SegmentCondition } from "./segment-condition-row";

interface SegmentBuilderProps {
  projectId: number;
  initialSegment?: {
    id?: number;
    name: string;
    description?: string;
    conditions: SegmentCondition[];
    matchType: "all" | "any";
  };
  onSave: (segment: {
    name: string;
    description?: string;
    conditions: SegmentCondition[];
    matchType: "all" | "any";
  }) => Promise<void>;
  onCancel?: () => void;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function SegmentBuilder({
  projectId,
  initialSegment,
  onSave,
  onCancel,
}: SegmentBuilderProps) {
  const locale = useLocale();
  const [name, setName] = useState(initialSegment?.name || "");
  const [description, setDescription] = useState(initialSegment?.description || "");
  const [matchType, setMatchType] = useState<"all" | "any">(initialSegment?.matchType || "all");
  const [conditions, setConditions] = useState<SegmentCondition[]>(
    initialSegment?.conditions || [
      { id: generateId(), field: "country", operator: "equals", value: "" },
    ]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCondition = () => {
    setConditions([
      ...conditions,
      { id: generateId(), field: "country", operator: "equals", value: "" },
    ]);
  };

  const updateCondition = (index: number, condition: SegmentCondition) => {
    const newConditions = [...conditions];
    newConditions[index] = condition;
    setConditions(newConditions);
  };

  const removeCondition = (index: number) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError(locale === "fr" ? "Le nom est requis" : "Name is required");
      return;
    }

    // Validate conditions
    const invalidConditions = conditions.filter((c) => {
      if (!c.field || !c.operator) return true;
      if (!["is_set", "is_not_set"].includes(c.operator) && !c.value.trim()) return true;
      return false;
    });

    if (invalidConditions.length > 0) {
      setError(
        locale === "fr"
          ? "Veuillez compléter toutes les conditions"
          : "Please complete all conditions"
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        conditions,
        matchType,
      });
    } catch (err) {
      setError(locale === "fr" ? "Erreur lors de la sauvegarde" : "Error saving segment");
    } finally {
      setSaving(false);
    }
  };

  const estimatedUsers = Math.floor(Math.random() * 1000) + 100; // Placeholder

  return (
    <div className="space-y-6">
      {/* Segment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {locale === "fr" ? "Informations du segment" : "Segment Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{locale === "fr" ? "Nom du segment" : "Segment Name"}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={locale === "fr" ? "Ex: Visiteurs français" : "E.g., French Visitors"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">
              {locale === "fr" ? "Description (optionnel)" : "Description (optional)"}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={locale === "fr" ? "Décrivez ce segment..." : "Describe this segment..."}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Conditions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {locale === "fr" ? "Conditions" : "Conditions"}
              </CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Définissez les critères pour ce segment"
                  : "Define the criteria for this segment"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {locale === "fr" ? "Correspondre à" : "Match"}
              </span>
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <Button
                  variant={matchType === "all" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setMatchType("all")}
                >
                  {locale === "fr" ? "TOUTES" : "ALL"}
                </Button>
                <Button
                  variant={matchType === "any" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setMatchType("any")}
                >
                  {locale === "fr" ? "UNE" : "ANY"}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {conditions.map((condition, index) => (
            <div key={condition.id}>
              {index > 0 && (
                <div className="flex items-center justify-center py-2">
                  <Badge variant="outline" className="text-xs">
                    {matchType === "all"
                      ? locale === "fr"
                        ? "ET"
                        : "AND"
                      : locale === "fr"
                        ? "OU"
                        : "OR"}
                  </Badge>
                </div>
              )}
              <SegmentConditionRow
                condition={condition}
                onChange={(c) => updateCondition(index, c)}
                onRemove={() => removeCondition(index)}
                isOnly={conditions.length === 1}
              />
            </div>
          ))}

          <Button variant="outline" onClick={addCondition} className="w-full mt-4">
            <Plus className="h-4 w-4 mr-2" />
            {locale === "fr" ? "Ajouter une condition" : "Add Condition"}
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{locale === "fr" ? "Aperçu" : "Preview"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">
                {locale === "fr" ? "Utilisateurs estimés" : "Estimated Users"}
              </p>
              <p className="text-2xl font-bold">{estimatedUsers.toLocaleString()}</p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {conditions.length}{" "}
              {locale === "fr"
                ? conditions.length === 1
                  ? "condition"
                  : "conditions"
                : conditions.length === 1
                  ? "condition"
                  : "conditions"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            {locale === "fr" ? "Annuler" : "Cancel"}
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {locale === "fr" ? "Sauvegarde..." : "Saving..."}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {locale === "fr" ? "Sauvegarder" : "Save Segment"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
