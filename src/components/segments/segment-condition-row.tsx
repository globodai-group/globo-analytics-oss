"use client";

import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

export interface SegmentCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface SegmentConditionRowProps {
  condition: SegmentCondition;
  onChange: (condition: SegmentCondition) => void;
  onRemove: () => void;
  isOnly?: boolean;
}

// Available fields for segmentation
const FIELDS = [
  { value: "country", labelEn: "Country", labelFr: "Pays" },
  { value: "city", labelEn: "City", labelFr: "Ville" },
  { value: "browser", labelEn: "Browser", labelFr: "Navigateur" },
  {
    value: "os",
    labelEn: "Operating System",
    labelFr: "Système d'exploitation",
  },
  { value: "device", labelEn: "Device Type", labelFr: "Type d'appareil" },
  { value: "language", labelEn: "Language", labelFr: "Langue" },
  { value: "landing_page", labelEn: "Landing Page", labelFr: "Page d'entrée" },
  {
    value: "traffic_source",
    labelEn: "Traffic Source",
    labelFr: "Source de trafic",
  },
  {
    value: "traffic_category",
    labelEn: "Traffic Category",
    labelFr: "Catégorie de trafic",
  },
  { value: "utm_source", labelEn: "UTM Source", labelFr: "Source UTM" },
  { value: "utm_medium", labelEn: "UTM Medium", labelFr: "Medium UTM" },
  { value: "utm_campaign", labelEn: "UTM Campaign", labelFr: "Campagne UTM" },
  { value: "referrer", labelEn: "Referrer", labelFr: "Référent" },
];

// Available operators
const OPERATORS = [
  { value: "equals", labelEn: "equals", labelFr: "égal à" },
  { value: "not_equals", labelEn: "does not equal", labelFr: "différent de" },
  { value: "contains", labelEn: "contains", labelFr: "contient" },
  {
    value: "not_contains",
    labelEn: "does not contain",
    labelFr: "ne contient pas",
  },
  { value: "starts_with", labelEn: "starts with", labelFr: "commence par" },
  { value: "ends_with", labelEn: "ends with", labelFr: "finit par" },
  { value: "is_set", labelEn: "is set", labelFr: "est défini" },
  { value: "is_not_set", labelEn: "is not set", labelFr: "n'est pas défini" },
];

export function SegmentConditionRow({
  condition,
  onChange,
  onRemove,
  isOnly = false,
}: SegmentConditionRowProps) {
  const locale = useLocale();

  const getFieldLabel = (value: string) => {
    const field = FIELDS.find((f) => f.value === value);
    return locale === "fr" ? field?.labelFr : field?.labelEn;
  };

  const getOperatorLabel = (value: string) => {
    const op = OPERATORS.find((o) => o.value === value);
    return locale === "fr" ? op?.labelFr : op?.labelEn;
  };

  const needsValue = !["is_set", "is_not_set"].includes(condition.operator);

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
      {/* Field Select */}
      <Select
        value={condition.field}
        onValueChange={(value) => onChange({ ...condition, field: value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue
            placeholder={locale === "fr" ? "Champ..." : "Field..."}
          />
        </SelectTrigger>
        <SelectContent>
          {FIELDS.map((field) => (
            <SelectItem key={field.value} value={field.value}>
              {locale === "fr" ? field.labelFr : field.labelEn}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator Select */}
      <Select
        value={condition.operator}
        onValueChange={(value) => onChange({ ...condition, operator: value })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue
            placeholder={locale === "fr" ? "Opérateur..." : "Operator..."}
          />
        </SelectTrigger>
        <SelectContent>
          {OPERATORS.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {locale === "fr" ? op.labelFr : op.labelEn}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value Input */}
      {needsValue && (
        <Input
          value={condition.value}
          onChange={(e) => onChange({ ...condition, value: e.target.value })}
          placeholder={locale === "fr" ? "Valeur..." : "Value..."}
          className="flex-1"
        />
      )}

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        disabled={isOnly}
        className="shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
