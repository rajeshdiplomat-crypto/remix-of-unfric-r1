import { useMemo } from "react";
import { ArrowLeft, BarChart3, Sparkles, TrendingUp, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmotionEntry, QUADRANTS, QuadrantType } from "./types";
import { PatternsDashboardEnhanced } from "./PatternsDashboardEnhanced";
import { cn } from "@/lib/utils";

interface EmotionsPageInsightsProps {
  entries: EmotionEntry[];
  onBack: () => void;
  onDateClick?: (date: string, entries: EmotionEntry[]) => void;
}

const quadrantEmoji: Record<QuadrantType, string> = {
  "high-pleasant": "😊",
  "high-unpleasant": "😰",
  "low-unpleasant": "😔",
  "low-pleasant": "😌",
};

export function EmotionsPageInsights({ entries, onBack, onDateClick }: EmotionsPageInsightsProps) {
  // Get recent mood trend (last 7 entries)
  const moodTrend = useMemo(() => {
    const recent = entries.slice(0, 7);
    if (recent.length < 2) return null;

    const pleasantCount = recent.filter((e) => e.quadrant === "high-pleasant" || e.quadrant === "low-pleasant").length;

    const percentage = Math.round((pleasantCount / recent.length) * 100);
    return {
      percentage,
      trend: percentage >= 50 ? "positive" : "mixed",
      label: percentage >= 70 ? "Mostly positive" : percentage >= 50 ? "Balanced" : "Some challenges",
    };
  }, [entries]);

  // Top 3 recent emotions
  const recentEmotions = useMemo(() => {
    return entries.slice(0, 3).map((e) => ({
      emotion: e.emotion,
      quadrant: e.quadrant,
      date: new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));
  }, [entries]);

  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-transparent border border-primary/20 p-6 md:p-8 mb-6">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: Title & Description */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/15 text-primary backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              Your Patterns
            </div>

            <h1 className="text-3xl md:text-4xl font-light">
              Insights & <span className="font-bold text-primary">Analytics</span>
            </h1>

            <p className="text-muted-foreground text-sm max-w-md">
              Discover patterns in your emotional journey. Based on{" "}
              <span className="font-semibold text-foreground">{entries.length}</span> check-in
              {entries.length !== 1 ? "s" : ""}.
            </p>

            <Button variant="outline" onClick={onBack} className="gap-2 rounded-xl mt-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Check-in
            </Button>
          </div>

          {/* Right: Quick Glance Cards */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Mood Trend Card */}
            {moodTrend && (
              <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-4 min-w-[140px]">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Recent Trend
                </div>
                <p
                  className={cn(
                    "text-lg font-bold",
                    moodTrend.trend === "positive" ? "text-emerald-500" : "text-amber-500",
                  )}
                >
                  {moodTrend.label}
                </p>
                <p className="text-xs text-muted-foreground">{moodTrend.percentage}% positive</p>
              </div>
            )}

            {/* Recent Emotions Card */}
            {recentEmotions.length > 0 && (
              <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-4 min-w-[160px]">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Activity className="h-3.5 w-3.5" />
                  Recent Emotions
                </div>
                <div className="flex items-center gap-1.5">
                  {recentEmotions.map((e, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${QUADRANTS[e.quadrant].color}20` }}
                      title={`${e.emotion} - ${e.date}`}
                    >
                      {quadrantEmoji[e.quadrant]}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Last 3 check-ins</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Patterns Dashboard */}
      <div className="border-2 border-border rounded-2xl p-5 md:p-6 bg-card shadow-sm">
        <PatternsDashboardEnhanced entries={entries} onDateClick={onDateClick} />
      </div>
    </div>
  );
}
