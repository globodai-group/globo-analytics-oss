"use client";

/**
 * AI Suggestions Component - Display AI-generated insights and suggestions
 */

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, Loader2, Lightbulb, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  getAIFunnelSuggestionsAction,
  getAISegmentSuggestionsAction,
  getAIInsightsAction,
} from "@/lib/actions/ai";
import type { FunnelSuggestion, SegmentSuggestion, AnalyticsInsight } from "@/lib/ai";

interface AISuggestionsProps {
  projectId: number;
  type: "funnels" | "segments" | "insights";
  onApplyFunnel?: (suggestion: FunnelSuggestion) => void;
  onApplySegment?: (suggestion: SegmentSuggestion) => void;
}

export function AISuggestions({
  projectId,
  type,
  onApplyFunnel,
  onApplySegment,
}: AISuggestionsProps) {
  const t = useTranslations("ai");
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<
    FunnelSuggestion[] | SegmentSuggestion[] | AnalyticsInsight[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      let result;

      switch (type) {
        case "funnels":
          result = await getAIFunnelSuggestionsAction(projectId);
          break;
        case "segments":
          result = await getAISegmentSuggestionsAction(projectId);
          break;
        case "insights":
          result = await getAIInsightsAction(projectId);
          break;
      }

      if (result.success) {
        setSuggestions(result.data);
        setIsOpen(true);
      } else {
        setError(result.error);
      }
    });
  };

  const getInsightIcon = (insightType: string) => {
    switch (insightType) {
      case "trend":
        return <TrendingUp className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "opportunity":
        return <Target className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getInsightColor = (insightType: string) => {
    switch (insightType) {
      case "trend":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "opportunity":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-dashed border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">
                {type === "funnels" && t("suggestFunnels")}
                {type === "segments" && t("suggestSegments")}
                {type === "insights" && t("generateInsights")}
              </CardTitle>
            </div>
            {!suggestions && (
              <Button size="sm" onClick={handleGenerate} disabled={isPending} className="gap-2">
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("generating")}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {t("generate")}
                  </>
                )}
              </Button>
            )}
            {suggestions && suggestions.length > 0 && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isOpen ? t("hide") : t("show")} ({suggestions.length})
                </Button>
              </CollapsibleTrigger>
            )}
          </div>
          <CardDescription>
            {type === "funnels" && t("funnelsDescription")}
            {type === "segments" && t("segmentsDescription")}
            {type === "insights" && t("insightsDescription")}
          </CardDescription>
        </CardHeader>

        {error && (
          <CardContent className="pt-0">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        )}

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* Funnel Suggestions */}
            {type === "funnels" &&
              (suggestions as FunnelSuggestion[])?.map((suggestion, index) => (
                <div key={index} className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{suggestion.name}</h4>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </div>
                    {onApplyFunnel && (
                      <Button size="sm" variant="outline" onClick={() => onApplyFunnel(suggestion)}>
                        {t("apply")}
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.steps.map((step, stepIndex) => (
                      <Badge key={stepIndex} variant="secondary">
                        {stepIndex + 1}. {step.name}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground italic">{suggestion.reasoning}</p>
                </div>
              ))}

            {/* Segment Suggestions */}
            {type === "segments" &&
              (suggestions as SegmentSuggestion[])?.map((suggestion, index) => (
                <div key={index} className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{suggestion.name}</h4>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </div>
                    {onApplySegment && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onApplySegment(suggestion)}
                      >
                        {t("apply")}
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.conditions.map((condition, condIndex) => (
                      <Badge key={condIndex} variant="outline">
                        {condition.field} {condition.operator} {condition.value}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground italic">{suggestion.reasoning}</p>
                </div>
              ))}

            {/* Insights */}
            {type === "insights" &&
              (suggestions as AnalyticsInsight[])?.map((insight, index) => (
                <div key={index} className="rounded-lg border bg-card p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded ${getInsightColor(insight.type)}`}>
                      {getInsightIcon(insight.type)}
                    </span>
                    <h4 className="font-medium">{insight.title}</h4>
                    <Badge variant="outline" className="ml-auto">
                      {insight.metric}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                  {insight.suggestion && (
                    <p className="text-sm text-primary">💡 {insight.suggestion}</p>
                  )}
                </div>
              ))}

            {suggestions && suggestions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">{t("noSuggestions")}</p>
            )}

            {suggestions && suggestions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerate}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {t("regenerate")}
              </Button>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
