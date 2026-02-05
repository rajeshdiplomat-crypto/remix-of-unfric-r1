import { ArrowLeft, BarChart3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmotionEntry } from "./types";
import { PatternsDashboardEnhanced } from "./PatternsDashboardEnhanced";

interface EmotionsPageInsightsProps {
  entries: EmotionEntry[];
  onBack: () => void;
  onDateClick?: (date: string, entries: EmotionEntry[]) => void;
}

export function EmotionsPageInsights({ entries, onBack, onDateClick }: EmotionsPageInsightsProps) {
  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Header Section - Clean & Simple */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-3 bg-primary/10 text-primary">
            <Sparkles className="h-3 w-3" />
            Your Patterns
          </div>

          <h1 className="text-3xl md:text-4xl font-light mb-2">
            Insights & <span className="font-bold text-primary">Analytics</span>
          </h1>

          <p className="text-muted-foreground text-sm">
            Discover patterns based on {entries.length} check-in{entries.length !== 1 ? "s" : ""}.
          </p>
        </div>

        <Button variant="outline" onClick={onBack} className="gap-2 rounded-xl w-fit">
          <ArrowLeft className="h-4 w-4" />
          Back to Check-in
        </Button>
      </div>

      {/* Patterns Dashboard */}
      <PatternsDashboardEnhanced entries={entries} onDateClick={onDateClick} />
    </div>
  );
}
