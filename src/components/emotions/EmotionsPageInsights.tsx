import { useMemo } from "react";
import { ArrowLeft, BarChart3, Zap, Calendar, TrendingUp, PieChart, Clock, Sparkles, ChevronRight } from "lucide-react";
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

const INSIGHTS_CONTENT = {
  badge: "Your Patterns",
  title: { line1: "Insights &", line2: "Analytics" },
  description: "Discover patterns in your emotional journey.",
  features: ["AI-powered pattern detection", "Mood distribution analysis", "Context-based insights"],
};

export function EmotionsPageInsights({ entries, onBack, onDateClick }: EmotionsPageInsightsProps) {
  // Calculate stats
  const weekEntries = entries.filter((e) => {
    const entryDate = new Date(e.entry_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entryDate >= weekAgo;
  }).length;

  const monthEntries = entries.filter((e) => {
    const entryDate = new Date(e.entry_date);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return entryDate >= monthAgo;
  }).length;

  // Calculate streak
  const streak = useMemo(() => {
    if (entries.length === 0) return 0;
    let count = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];
      const hasEntry = entries.some((e) => e.entry_date === dateStr);
      if (hasEntry) count++;
      else if (i > 0) break;
    }
    return count;
  }, [entries]);

  // Calculate most common quadrant
  const quadrantStats = useMemo(() => {
    const counts: Record<QuadrantType, number> = {
      "high-pleasant": 0,
      "high-unpleasant": 0,
      "low-unpleasant": 0,
      "low-pleasant": 0,
    };
    entries.forEach((e) => counts[e.quadrant]++);

    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
    const topQuadrant = sorted[0]?.[0] as QuadrantType;
    return { counts, topQuadrant, topCount: sorted[0]?.[1] || 0 };
  }, [entries]);

  // Top emotion
  const topEmotion = useMemo(() => {
    const emotionCounts: Record<string, number> = {};
    entries.forEach((e) => {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
    });
    const sorted = Object.entries(emotionCounts).sort(([, a], [, b]) => b - a);
    return sorted[0]?.[0] || "—";
  }, [entries]);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Header Section */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4 bg-primary/10 text-primary">
          <BarChart3 className="h-3 w-3" />
          {INSIGHTS_CONTENT.badge}
        </div>

        <h1 className="text-3xl md:text-4xl font-light mb-4">
          {INSIGHTS_CONTENT.title.line1} <span className="font-bold text-primary">{INSIGHTS_CONTENT.title.line2}</span>
        </h1>

        <p className="text-muted-foreground text-sm leading-relaxed max-w-lg mx-auto">
          {INSIGHTS_CONTENT.description} Based on {entries.length} check-in{entries.length !== 1 ? "s" : ""}.
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Check-ins"
          value={entries.length.toString()}
          icon={<BarChart3 className="h-4 w-4" />}
          color="hsl(var(--primary))"
        />
        <StatCard label="Current Streak" value={`${streak} days`} icon={<Zap className="h-4 w-4" />} color="#F59E0B" />
        <StatCard
          label="Most Common Zone"
          value={quadrantStats.topQuadrant ? QUADRANTS[quadrantStats.topQuadrant].label.split(",")[0] : "—"}
          icon={<PieChart className="h-4 w-4" />}
          color={quadrantStats.topQuadrant ? QUADRANTS[quadrantStats.topQuadrant].color : "hsl(var(--muted))"}
          valueColor={quadrantStats.topQuadrant ? QUADRANTS[quadrantStats.topQuadrant].color : undefined}
        />
        <StatCard label="Top Feeling" value={topEmotion} icon={<Sparkles className="h-4 w-4" />} color="#10B981" />
      </div>

      {/* 3-Column Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: This Week / Month Stats */}
        <div className="border-2 border-border rounded-2xl p-5 bg-card">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Time Period</div>
          <h3 className="text-lg font-semibold mb-4">Check-in Activity</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">This Week</p>
                  <p className="text-xl font-bold">{weekEntries}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">This Month</p>
                  <p className="text-xl font-bold">{monthEntries}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">All Time</p>
                  <p className="text-xl font-bold">{entries.length}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* CENTER: Mood Distribution */}
        <div className="border-2 border-primary/30 rounded-2xl p-5 bg-primary/5 shadow-lg scale-[1.02] relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium text-white bg-primary">
            Mood Overview
          </div>

          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 mt-2">Distribution</div>
          <h3 className="text-lg font-semibold mb-4">How You've Been Feeling</h3>

          <div className="space-y-3">
            {(Object.entries(quadrantStats.counts) as [QuadrantType, number][])
              .sort(([, a], [, b]) => b - a)
              .map(([quadrant, count]) => {
                const info = QUADRANTS[quadrant];
                const percentage = entries.length > 0 ? Math.round((count / entries.length) * 100) : 0;

                return (
                  <div key={quadrant} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{quadrantEmoji[quadrant]}</span>
                        <span className="font-medium">{info.label.split(",")[0]}</span>
                      </div>
                      <span className="text-muted-foreground">{percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: info.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* RIGHT: Quick Insights */}
        <div className="border-2 border-border rounded-2xl p-5 bg-card">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Pattern Insights</div>
          <h3 className="text-lg font-semibold mb-4">What We've Learned</h3>

          <div className="space-y-3">
            {INSIGHTS_CONTENT.features.map((feature, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-primary text-xs font-bold">{i + 1}</span>
                </div>
                <p className="text-sm text-muted-foreground">{feature}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Top emotion this period:</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {quadrantStats.topQuadrant ? quadrantEmoji[quadrantStats.topQuadrant] : "—"}
              </span>
              <span className="text-lg font-semibold">{topEmotion}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Patterns Dashboard */}
      <div className="border-2 border-border rounded-2xl p-6 bg-card">
        <PatternsDashboardEnhanced entries={entries} onDateClick={onDateClick} />
      </div>

      {/* Back Button */}
      <div className="flex justify-center pt-4">
        <Button variant="outline" size="lg" onClick={onBack} className="h-12 px-8 rounded-xl gap-2">
          <ArrowLeft className="h-4 w-4" />
          BACK TO CHECK-IN
        </Button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  valueColor,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  valueColor?: string;
}) {
  return (
    <div className="border-2 border-border rounded-2xl p-4 bg-card hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color }}>{icon}</span>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-bold truncate" style={{ color: valueColor }}>
        {value}
      </p>
    </div>
  );
}
