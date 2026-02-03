import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { EmotionEntry } from "./types";
import { PatternsDashboardEnhanced } from "./PatternsDashboardEnhanced";
import { cn } from "@/lib/utils";

interface EmotionsAnalyticsPageV2Props {
  entries: EmotionEntry[];
  onBack: () => void;
  onDateClick?: (date: string, entries: EmotionEntry[]) => void;
}

export function EmotionsAnalyticsPageV2({ entries, onBack, onDateClick }: EmotionsAnalyticsPageV2Props) {
  return (
    <div className="w-full min-h-full p-4 md:p-8 animate-fade-in">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Check-in
        </Button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-light text-foreground">
                Your Patterns
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Insights from {entries.length} check-in{entries.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-3">
            <StatBadge 
              label="This Week" 
              value={entries.filter(e => {
                const entryDate = new Date(e.entry_date);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return entryDate >= weekAgo;
              }).length.toString()} 
            />
            <StatBadge 
              label="This Month" 
              value={entries.filter(e => {
                const entryDate = new Date(e.entry_date);
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return entryDate >= monthAgo;
              }).length.toString()} 
            />
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <div className="max-w-6xl mx-auto">
        <PatternsDashboardEnhanced entries={entries} onDateClick={onDateClick} />
      </div>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-2 rounded-2xl bg-muted/50 border border-border/50">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
