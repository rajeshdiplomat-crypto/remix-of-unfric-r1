import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, TrendingUp, Calendar, Zap } from "lucide-react";
import { EmotionEntry } from "./types";
import { PatternsDashboardEnhanced } from "./PatternsDashboardEnhanced";
import { cn } from "@/lib/utils";

interface EmotionsAnalyticsPageV2Props {
  entries: EmotionEntry[];
  onBack: () => void;
  onDateClick?: (date: string, entries: EmotionEntry[]) => void;
}

export function EmotionsAnalyticsPageV2({ entries, onBack, onDateClick }: EmotionsAnalyticsPageV2Props) {
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
    <div className="w-full min-h-full p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground group transition-all duration-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Check-in
        </Button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-light text-foreground">
                Your Patterns
              </h1>
            </div>
            <p className="text-muted-foreground">
              Insights from {entries.length} check-in{entries.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-3 animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: '200ms' }}>
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
      </div>

      {/* Dashboard */}
      <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '300ms' }}>
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
