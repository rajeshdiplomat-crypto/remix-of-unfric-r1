import { ArrowLeft, BarChart3, Zap, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmotionEntry } from "./types";
import { PatternsDashboardEnhanced } from "./PatternsDashboardEnhanced";

interface EmotionsPageInsightsProps {
  entries: EmotionEntry[];
  onBack: () => void;
  onDateClick?: (date: string, entries: EmotionEntry[]) => void;
}

export function EmotionsPageInsights({ entries, onBack, onDateClick }: EmotionsPageInsightsProps) {
  const weekEntries = entries.filter(e => {
    const entryDate = new Date(e.entry_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entryDate >= weekAgo;
  }).length;

  const monthEntries = entries.filter(e => {
    const entryDate = new Date(e.entry_date);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return entryDate >= monthAgo;
  }).length;

  return (
    <div className="flex flex-col min-h-[calc(100vh-300px)] animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Check-in
        </Button>

        {/* Quick Stats */}
        <div className="flex gap-3">
          <StatBadge 
            label="This Week" 
            value={weekEntries.toString()} 
            icon={<Zap className="h-3.5 w-3.5" />}
          />
          <StatBadge 
            label="This Month" 
            value={monthEntries.toString()} 
            icon={<Calendar className="h-3.5 w-3.5" />}
          />
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
            <BarChart3 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-light">
            Your Patterns
          </h1>
        </div>
        <p className="text-muted-foreground">
          Insights from {entries.length} check-in{entries.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Dashboard */}
      <div className="flex-1">
        <PatternsDashboardEnhanced entries={entries} onDateClick={onDateClick} />
      </div>
    </div>
  );
}

function StatBadge({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="px-4 py-2.5 rounded-2xl bg-muted/50 border border-border/50 backdrop-blur-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-muted-foreground group-hover:text-primary transition-colors">{icon}</span>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
