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
    <div className="flex flex-col animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        
        {/* Left: Dashboard */}
        <div className="flex flex-col order-2 lg:order-1">
          <PatternsDashboardEnhanced entries={entries} onDateClick={onDateClick} />
        </div>
        
        {/* Right: Descriptive Text */}
        <div className="flex flex-col justify-center order-1 lg:order-2">
          <div className="space-y-4 max-w-md">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium w-fit bg-primary/10 text-primary">
              <BarChart3 className="h-3 w-3" />
              Your Patterns
            </div>
            
            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-light leading-tight">
              Insights &{" "}
              <span className="font-semibold text-primary">Analytics</span>
            </h2>
            
            {/* Description */}
            <p className="text-muted-foreground text-sm leading-relaxed">
              Discover patterns in your emotional journey based on {entries.length} check-in{entries.length !== 1 ? 's' : ''}.
            </p>
            
            {/* Features */}
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary" />
                AI-powered pattern detection
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary" />
                Mood distribution analysis
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary" />
                Context-based insights
              </li>
            </ul>
            
            {/* Stats */}
            <div className="flex gap-3 pt-2">
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
            
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="gap-2 text-muted-foreground hover:text-foreground mt-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Check-in
            </Button>
          </div>
        </div>
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
