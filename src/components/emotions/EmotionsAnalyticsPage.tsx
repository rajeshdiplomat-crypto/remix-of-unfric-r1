import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { EmotionEntry } from "./types";
import { PatternsDashboardEnhanced } from "./PatternsDashboardEnhanced";

interface EmotionsAnalyticsPageProps {
  entries: EmotionEntry[];
  onBack: () => void;
  onDateClick?: (date: string, entries: EmotionEntry[]) => void;
}

export function EmotionsAnalyticsPage({ entries, onBack, onDateClick }: EmotionsAnalyticsPageProps) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 animate-fade-in">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Check-in
      </Button>

      {/* Dashboard */}
      <PatternsDashboardEnhanced entries={entries} onDateClick={onDateClick} />
    </div>
  );
}
