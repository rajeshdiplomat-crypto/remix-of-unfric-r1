import { ArrowLeft, BarChart3 } from "lucide-react";
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
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-2 bg-primary/10 text-primary">
            <BarChart3 className="h-3 w-3" />
            Your Patterns
          </div>
          <h1 className="text-2xl md:text-3xl font-light">
            Insights & <span className="font-bold text-primary">Analytics</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Discover patterns based on {entries.length} check-in{entries.length !== 1 ? "s" : ""}.
          </p>
        </div>

        <Button variant="outline" onClick={onBack} className="gap-2 rounded-xl">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Patterns Dashboard - Contains all stats and insights */}
      <div className="border-2 border-border rounded-2xl p-6 bg-card">
        <PatternsDashboardEnhanced entries={entries} onDateClick={onDateClick} />
      </div>
    </div>
  );
}
