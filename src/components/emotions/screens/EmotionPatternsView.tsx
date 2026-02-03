import { PatternsDashboardEnhanced } from "../PatternsDashboardEnhanced";
import { EmotionEntry } from "../types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface EmotionPatternsViewProps {
  entries: EmotionEntry[];
  onBack: () => void;
  onDateClick?: (date: string, entries: EmotionEntry[]) => void;
}

/**
 * Screen 3: Patterns / Insights View
 * - Expanded center layout (70-80%)
 * - Charts, trends, entry history
 * - No sliders - pure reflection mode
 */
export function EmotionPatternsView({
  entries,
  onBack,
  onDateClick,
}: EmotionPatternsViewProps) {
  return (
    <div className="space-y-6 py-4">
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="rounded-xl"
          aria-label="Back to check-in"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Check-in
        </Button>
        <h1 className="text-xl font-semibold text-foreground">
          Emotion Patterns
        </h1>
      </div>

      {/* Patterns Dashboard - Full Content */}
      <PatternsDashboardEnhanced
        entries={entries}
        onDateClick={onDateClick}
      />
    </div>
  );
}
