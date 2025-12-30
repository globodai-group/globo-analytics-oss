"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AttributionModel } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AttributionModelPickerProps {
  projectId: number;
  currentModel: AttributionModel;
  locale: string;
}

export function AttributionModelPicker({ projectId, currentModel }: AttributionModelPickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("attribution");

  const models: { value: AttributionModel; label: string }[] = [
    { value: "LAST_CLICK", label: t("models.LAST_CLICK") },
    { value: "FIRST_CLICK", label: t("models.FIRST_CLICK") },
    { value: "LINEAR", label: t("models.LINEAR") },
    { value: "TIME_DECAY", label: t("models.TIME_DECAY") },
    { value: "POSITION_BASED", label: t("models.POSITION_BASED") },
  ];

  const handleModelChange = (model: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("model", model);
    router.push(`/projects/${projectId}/stats/attribution?${params.toString()}`);
  };

  return (
    <Select value={currentModel} onValueChange={handleModelChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder={t("model")} />
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model.value} value={model.value}>
            {model.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
