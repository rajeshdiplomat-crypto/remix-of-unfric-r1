import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Sparkles,
  CalendarDays,
  TrendingUp,
  Target,
  Activity,
  Moon,
  Dumbbell,
  Briefcase,
  Users,
  Sun,
  Sunrise,
  Sunset,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmotionEntry, QuadrantType } from "./types";
import { format, subDays, differenceInCalendarDays, parseISO } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useTimezone } from "@/hooks/useTimezone";
import { getTimePeriodInTimezone, getStartOfTodayInTimezone } from "@/lib/formatDate";
import { useIsMobile } from "@/hooks/use-mobile";

interface EmotionsPageInsightsProps {
  entries: EmotionEntry[];
  onBack: () => void;
  onDateClick?: (date: string, entries: EmotionEntry[]) => void;
}

type DateRange = 7 | 30 | 90;

const QUADRANT_COLORS: Record<QuadrantType, string> = {
  "high-pleasant": "hsl(45, 93%, 47%)",
  "high-unpleasant": "hsl(0, 72%, 51%)",
  "low-unpleasant": "hsl(215, 20%, 45%)",
  "low-pleasant": "hsl(142, 52%, 45%)",
};

const TIME_INFO = {
  morning: { label: "Morning", icon: Sunrise },
  afternoon: { label: "Afternoon", icon: Sun },
  evening: { label: "Evening", icon: Sunset },
  night: { label: "Night", icon: Moon },
};

export function EmotionsPageInsights({ entries, onBack, onDateClick }: EmotionsPageInsightsProps) {
  const { timezone } = useTimezone();
  const isMobile = useIsMobile();
  const [dateRange, setDateRange] = useState<DateRange>(30);
  const [rightTab, setRightTab] = useState<"moods" | "context" | "strategies">("moods");

  const filteredEntries = useMemo(() => {
    const today = getStartOfTodayInTimezone(timezone);
    const cutoff = format(subDays(today, dateRange - 1), "yyyy-MM-dd");
    return entries.filter((e) => e.entry_date >= cutoff);
  }, [entries, dateRange, timezone]);

  const stats = useMemo(() => {
    const quadrantCounts: Record<QuadrantType, number> = {
      "high-pleasant": 0,
      "high-unpleasant": 0,
      "low-unpleasant": 0,
      "low-pleasant": 0,
    };
    const emotionCounts: Record<string, { count: number; quadrant: QuadrantType }> = {};

    filteredEntries.forEach((e) => {
      if (e.quadrant) quadrantCounts[e.quadrant]++;
      if (e.emotion) {
        if (!emotionCounts[e.emotion]) emotionCounts[e.emotion] = { count: 0, quadrant: e.quadrant };
        emotionCounts[e.emotion].count++;
      }
    });

    const topEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);
    const quadrantData = [
      {
        name: "High Pleasant",
        value: quadrantCounts["high-pleasant"],
        color: QUADRANT_COLORS["high-pleasant"],
        id: "high-pleasant",
      },
      {
        name: "High Unpleasant",
        value: quadrantCounts["high-unpleasant"],
        color: QUADRANT_COLORS["high-unpleasant"],
        id: "high-unpleasant",
      },
      {
        name: "Low Unpleasant",
        value: quadrantCounts["low-unpleasant"],
        color: QUADRANT_COLORS["low-unpleasant"],
        id: "low-unpleasant",
      },
      {
        name: "Low Pleasant",
        value: quadrantCounts["low-pleasant"],
        color: QUADRANT_COLORS["low-pleasant"],
        id: "low-pleasant",
      },
    ].filter((d) => d.value > 0);

    // Streak
    let streak = 0;
    if (filteredEntries.length > 0) {
      const sortedDates = [...new Set(filteredEntries.map((e) => e.entry_date))].sort().reverse();
      const today = format(new Date(), "yyyy-MM-dd");
      const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
      if (sortedDates[0] === today || sortedDates[0] === yesterday) {
        streak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const diff = differenceInCalendarDays(parseISO(sortedDates[i - 1]), parseISO(sortedDates[i]));
          if (diff === 1) streak++;
          else break;
        }
      }
    }

    return { total: filteredEntries.length, topEmotions, quadrantData, streak };
  }, [filteredEntries]);

  if (entries.length === 0) {
    return (
      <div className="p-12 rounded-2xl bg-card border-2 border-dashed border-border text-center">
        <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="font-semibold text-foreground mb-2">No check-ins yet</h3>
        <p className="text-sm text-muted-foreground">Start logging your emotions to see patterns here</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-2 bg-primary/10 text-primary">
            <Sparkles className="h-3 w-3" />
            Your Patterns
          </div>
          <h1 className="text-xl md:text-3xl font-semibold tracking-tight">
            Insights & <span className="text-primary">Analytics</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex gap-1 p-1 bg-muted rounded-xl">
            {([7, 30, 90] as DateRange[]).map((d) => (
              <button
                key={d}
                onClick={() => setDateRange(d)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  dateRange === d ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {d}D
              </button>
            ))}
          </div>
          {!isMobile && (
            <Button variant="outline" onClick={onBack} className="gap-2 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
        </div>
      </div>

      {/* Mobile: Overview Stats as horizontal pills */}
      {isMobile && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border shrink-0">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-normal">Total</span>
            <span className="text-sm font-semibold text-foreground">{stats.total}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border shrink-0">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-normal">Streak</span>
            <span className="text-sm font-semibold text-foreground">{stats.streak}d</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border shrink-0">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-normal">Common</span>
            <span className="text-sm font-semibold truncate" style={{ color: stats.quadrantData[0]?.color }}>
              {stats.quadrantData[0]?.name.split(" ")[0] || "—"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border shrink-0">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-normal">Top</span>
            <span className="text-sm font-semibold text-foreground truncate">{stats.topEmotions[0]?.[0] || "—"}</span>
          </div>
        </div>
      )}

      {/* Mobile: Vertical feed layout */}
      {isMobile ? (
        <div className="space-y-4">
          {/* Check-in Activity - full width */}
          <CheckinFrequencyGraph entries={entries} />

          {/* Tab Toggle for Moods/Context/Strategies */}
          <div className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex gap-1 p-1 bg-muted/50 rounded-xl mb-4">
              <button
                onClick={() => setRightTab("moods")}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                  rightTab === "moods"
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Moods
              </button>
              <button
                onClick={() => setRightTab("context")}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                  rightTab === "context"
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Context
              </button>
              <button
                onClick={() => setRightTab("strategies")}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                  rightTab === "strategies"
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Strategies
              </button>
            </div>
            {rightTab === "moods" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <MoodDistributionChart data={stats.quadrantData} />
                  <MostFrequentFeelings emotions={stats.topEmotions} total={stats.total} />
                </div>
                <MoodByTimeOfDay entries={filteredEntries} timezone={timezone} />
                <EmotionalBalance entries={filteredEntries} />
              </div>
            )}
            {rightTab === "context" && <ContextInsights entries={filteredEntries} />}
            {rightTab === "strategies" && <StrategiesInsights entries={filteredEntries} />}
          </div>

          {/* Pattern Insights */}
          <PatternInsightsCompact entries={filteredEntries} />
        </div>
      ) : (
        /* Desktop: 2-Column Layout */
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-5 items-start">
          {/* LEFT: Why + Overview (Narrow) */}
          <div className="space-y-4 lg:self-stretch flex flex-col">
            <div className="px-1">
              <h3 className="font-semibold text-foreground mb-2 text-sm">Why Track Your Moods?</h3>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>Identify <strong className="text-foreground">triggers</strong> that affect your mood</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>Improve <strong className="text-foreground">wellbeing</strong> with data-driven insights</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>Build <strong className="text-foreground">self-awareness</strong> over time</span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border flex-1">
              <h3 className="font-semibold text-foreground mb-4 text-xs tracking-wider">Overview</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-normal">Total</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-normal">Streak</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{stats.streak}d</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Target className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-normal">Common</span>
                  </div>
                  <p className="text-sm font-semibold truncate" style={{ color: stats.quadrantData[0]?.color }}>
                    {stats.quadrantData[0]?.name.split(" ")[0] || "—"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Activity className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-normal">Top Feel</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">{stats.topEmotions[0]?.[0] || "—"}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4 mb-4">
                <p className="text-[10px] font-normal text-muted-foreground tracking-wide mb-2">Recent check-ins</p>
                <div className="space-y-1.5">
                  {filteredEntries.slice(0, 4).map((entry, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="font-medium" style={{ color: QUADRANT_COLORS[entry.quadrant] }}>{entry.emotion}</span>
                      <span className="text-muted-foreground text-[10px] font-normal">
                        {new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  ))}
                  {filteredEntries.length === 0 && <p className="text-xs text-muted-foreground">No recent entries</p>}
                </div>
              </div>

              <CheckinFrequencyGraph entries={entries} />
              <div className="mt-4">
                <PatternInsightsCompact entries={filteredEntries} />
              </div>
            </div>
          </div>

          {/* RIGHT: Moods/Context (Wide) */}
          <div className="p-5 rounded-2xl bg-card border border-border lg:self-stretch">
            <div className="flex gap-1 p-1 bg-muted/50 rounded-xl mb-5">
              <button
                onClick={() => setRightTab("moods")}
                className={`flex-1 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                  rightTab === "moods" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Moods
              </button>
              <button
                onClick={() => setRightTab("context")}
                className={`flex-1 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                  rightTab === "context" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Context
              </button>
              <button
                onClick={() => setRightTab("strategies")}
                className={`flex-1 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                  rightTab === "strategies" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Strategies
              </button>
            </div>

            {rightTab === "moods" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MoodDistributionChart data={stats.quadrantData} />
                  <MostFrequentFeelings emotions={stats.topEmotions} total={stats.total} />
                </div>
                <MoodByTimeOfDay entries={filteredEntries} timezone={timezone} />
                <EmotionalBalance entries={filteredEntries} />
              </div>
            )}

            {rightTab === "context" && <ContextInsights entries={filteredEntries} />}
            {rightTab === "strategies" && <StrategiesInsights entries={filteredEntries} />}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact Pattern Insights for left sidebar
function PatternInsightsCompact({ entries }: { entries: EmotionEntry[] }) {
  const insights = useMemo(() => {
    const results: { icon: typeof Moon; text: string }[] = [];

    const whatMoods: Record<string, { good: number; total: number }> = {};
    entries.forEach((e) => {
      const what = e.context?.what;
      if (!what) return;
      if (!whatMoods[what]) whatMoods[what] = { good: 0, total: 0 };
      whatMoods[what].total++;
      if (e.quadrant === "low-pleasant" || e.quadrant === "high-pleasant") whatMoods[what].good++;
    });

    Object.entries(whatMoods).forEach(([what, data]) => {
      if (data.total >= 2 && data.good / data.total >= 0.6) {
        results.push({ icon: Briefcase, text: `${what} often makes you feel good (${data.total} entries)` });
      }
    });

    return results.slice(0, 2);
  }, [entries]);

  if (insights.length === 0) {
    return (
      <div className="p-3 rounded-lg bg-muted/30 border border-dashed border-border">
        <p className="text-xs text-muted-foreground">Log more check-ins with context to unlock insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-medium text-muted-foreground tracking-wide">Pattern insights</p>
      {insights.map((insight, i) => {
        const Icon = insight.icon;
        return (
          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
            <Icon className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <span className="text-xs text-foreground">{insight.text}</span>
          </div>
        );
      })}
    </div>
  );
}

// Mood Distribution Chart
function MoodDistributionChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  if (data.length === 0) return null;
  return (
    <div className="p-4 rounded-xl bg-muted/30">
      <h4 className="font-medium text-foreground mb-3 text-sm">Mood Distribution</h4>
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: d.color }} />
            <span className="text-[10px] text-muted-foreground">{d.name.split(" ")[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Most Frequent Feelings
function MostFrequentFeelings({
  emotions,
  total,
}: {
  emotions: [string, { count: number; quadrant: QuadrantType }][];
  total: number;
}) {
  if (emotions.length === 0) return null;
  return (
    <div className="p-4 rounded-xl bg-muted/30">
      <h4 className="font-medium text-foreground mb-3 text-sm">Top Feelings</h4>
      <div className="space-y-2">
        {emotions.map(([emotion, data]) => {
          const pct = (data.count / total) * 100;
          return (
            <div key={emotion}>
              <div className="flex justify-between mb-0.5">
                <span className="text-xs font-medium" style={{ color: QUADRANT_COLORS[data.quadrant] }}>
                  {emotion}
                </span>
                <span className="text-[10px] text-muted-foreground">{data.count}×</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: QUADRANT_COLORS[data.quadrant] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Mood by Time of Day
function MoodByTimeOfDay({ entries, timezone }: { entries: EmotionEntry[]; timezone: string }) {
  const timeStats = useMemo(() => {
    const periods = ["morning", "afternoon", "evening", "night"] as const;
    return periods.map((period) => {
      const periodEntries = entries.filter((e) => getTimePeriodInTimezone(e.created_at, timezone) === period);
      const count = periodEntries.length;
      const quadrantCounts: Record<QuadrantType, number> = {
        "high-pleasant": 0,
        "high-unpleasant": 0,
        "low-unpleasant": 0,
        "low-pleasant": 0,
      };
      periodEntries.forEach((e) => {
        if (e.quadrant) quadrantCounts[e.quadrant]++;
      });
      const percentages =
        count > 0
          ? {
              "high-pleasant": (quadrantCounts["high-pleasant"] / count) * 100,
              "high-unpleasant": (quadrantCounts["high-unpleasant"] / count) * 100,
              "low-unpleasant": (quadrantCounts["low-unpleasant"] / count) * 100,
              "low-pleasant": (quadrantCounts["low-pleasant"] / count) * 100,
            }
          : null;
      return { period, count, percentages, info: TIME_INFO[period] };
    });
  }, [entries, timezone]);

  return (
    <div className="p-4 rounded-xl bg-muted/30">
      <h4 className="font-medium text-foreground mb-3 text-sm">By Time of Day</h4>
      <div className="grid grid-cols-4 gap-2">
        {timeStats.map(({ period, count, percentages, info }) => {
          const Icon = info.icon;
          return (
            <div key={period} className="text-center">
              <Icon className="h-4 w-4 mx-auto text-amber-500 mb-1" />
              <p className="text-[10px] text-muted-foreground mb-1">{info.label}</p>
              {count > 0 && percentages ? (
                <div className="h-1.5 rounded-full overflow-hidden flex">
                  {percentages["high-pleasant"] > 0 && (
                    <div
                      style={{
                        width: `${percentages["high-pleasant"]}%`,
                        backgroundColor: QUADRANT_COLORS["high-pleasant"],
                      }}
                    />
                  )}
                  {percentages["high-unpleasant"] > 0 && (
                    <div
                      style={{
                        width: `${percentages["high-unpleasant"]}%`,
                        backgroundColor: QUADRANT_COLORS["high-unpleasant"],
                      }}
                    />
                  )}
                  {percentages["low-unpleasant"] > 0 && (
                    <div
                      style={{
                        width: `${percentages["low-unpleasant"]}%`,
                        backgroundColor: QUADRANT_COLORS["low-unpleasant"],
                      }}
                    />
                  )}
                  {percentages["low-pleasant"] > 0 && (
                    <div
                      style={{
                        width: `${percentages["low-pleasant"]}%`,
                        backgroundColor: QUADRANT_COLORS["low-pleasant"],
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="h-1.5 rounded-full bg-muted" />
              )}
              <p className="text-[10px] text-muted-foreground mt-1">{count}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Emotional Balance - pleasant vs unpleasant ratio with trend
function EmotionalBalance({ entries }: { entries: EmotionEntry[] }) {
  const balance = useMemo(() => {
    const pleasant = entries.filter((e) => e.quadrant === "high-pleasant" || e.quadrant === "low-pleasant").length;
    const unpleasant = entries.filter((e) => e.quadrant === "high-unpleasant" || e.quadrant === "low-unpleasant").length;
    const total = pleasant + unpleasant;
    const ratio = total > 0 ? Math.round((pleasant / total) * 100) : 50;
    const highEnergy = entries.filter((e) => e.quadrant === "high-pleasant" || e.quadrant === "high-unpleasant").length;
    const energyRatio = total > 0 ? Math.round((highEnergy / total) * 100) : 50;
    return { pleasant, unpleasant, total, ratio, energyRatio };
  }, [entries]);

  if (balance.total === 0) return null;

  return (
    <div className="p-4 rounded-xl bg-muted/30">
      <h4 className="font-medium text-foreground mb-3 text-sm">Emotional Balance</h4>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>Pleasant ({balance.pleasant})</span>
            <span>Unpleasant ({balance.unpleasant})</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden flex bg-muted">
            <div className="h-full rounded-l-full" style={{ width: `${balance.ratio}%`, backgroundColor: QUADRANT_COLORS["high-pleasant"] }} />
            <div className="h-full rounded-r-full" style={{ width: `${100 - balance.ratio}%`, backgroundColor: QUADRANT_COLORS["high-unpleasant"] }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>High Energy ({balance.energyRatio}%)</span>
            <span>Low Energy ({100 - balance.energyRatio}%)</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden flex bg-muted">
            <div className="h-full rounded-l-full" style={{ width: `${balance.energyRatio}%`, backgroundColor: QUADRANT_COLORS["low-pleasant"] }} />
            <div className="h-full rounded-r-full" style={{ width: `${100 - balance.energyRatio}%`, backgroundColor: QUADRANT_COLORS["low-unpleasant"] }} />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground text-center pt-1">
          {balance.ratio >= 60 ? "✨ You're trending positive!" : balance.ratio <= 40 ? "💙 Consider a regulation strategy" : "⚖️ Balanced emotional range"}
        </p>
      </div>
    </div>
  );
}

// Context Insights
function ContextInsights({ entries }: { entries: EmotionEntry[] }) {
  const contextStats = useMemo(() => {
    type ContextStats = Record<string, { count: number; quadrants: Record<QuadrantType, number> }>;
    const whoStats: ContextStats = {},
      whatStats: ContextStats = {},
      sleepStats: ContextStats = {},
      activityStats: ContextStats = {};

    entries.forEach((e) => {
      const addToStats = (stats: ContextStats, value: string | undefined) => {
        if (!value) return;
        if (!stats[value])
          stats[value] = {
            count: 0,
            quadrants: { "high-pleasant": 0, "high-unpleasant": 0, "low-unpleasant": 0, "low-pleasant": 0 },
          };
        stats[value].count++;
        if (e.quadrant) stats[value].quadrants[e.quadrant]++;
      };
      addToStats(whoStats, e.context?.who);
      addToStats(whatStats, e.context?.what);
      addToStats(sleepStats, e.context?.sleepHours);
      addToStats(activityStats, e.context?.physicalActivity);
    });

    const processStats = (stats: ContextStats) =>
      Object.entries(stats)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 4)
        .map(([label, data]) => {
          const total = data.count;
          const percentages = {
            "high-pleasant": (data.quadrants["high-pleasant"] / total) * 100,
            "high-unpleasant": (data.quadrants["high-unpleasant"] / total) * 100,
            "low-unpleasant": (data.quadrants["low-unpleasant"] / total) * 100,
            "low-pleasant": (data.quadrants["low-pleasant"] / total) * 100,
          };
          const dominantMood =
            (Object.entries(data.quadrants).sort((a, b) => b[1] - a[1])[0]?.[0] as QuadrantType) || "low-pleasant";
          return { label, count: total, percentages, dominantMood };
        });

    return {
      who: processStats(whoStats),
      what: processStats(whatStats),
      sleep: processStats(sleepStats),
      activity: processStats(activityStats),
    };
  }, [entries]);

  const sections = [
    { key: "who", label: "Who are you with", icon: Users, data: contextStats.who },
    { key: "what", label: "What are you doing", icon: Briefcase, data: contextStats.what },
    { key: "sleep", label: "Sleep", icon: Moon, data: contextStats.sleep },
    { key: "activity", label: "Activity", icon: Dumbbell, data: contextStats.activity },
  ].filter((s) => s.data.length > 0);

  if (sections.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">Add context to your check-ins to see insights here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <div key={section.key}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">{section.label}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
              {section.data.map((item) => (
                <div
                  key={item.label}
                  className="p-2.5 rounded-lg bg-muted/30 border-l-3"
                  style={{ borderLeftColor: QUADRANT_COLORS[item.dominantMood], borderLeftWidth: 3 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground truncate">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground">{item.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden flex">
                    {item.percentages["high-pleasant"] > 0 && (
                      <div
                        style={{
                          width: `${item.percentages["high-pleasant"]}%`,
                          backgroundColor: QUADRANT_COLORS["high-pleasant"],
                        }}
                      />
                    )}
                    {item.percentages["high-unpleasant"] > 0 && (
                      <div
                        style={{
                          width: `${item.percentages["high-unpleasant"]}%`,
                          backgroundColor: QUADRANT_COLORS["high-unpleasant"],
                        }}
                      />
                    )}
                    {item.percentages["low-unpleasant"] > 0 && (
                      <div
                        style={{
                          width: `${item.percentages["low-unpleasant"]}%`,
                          backgroundColor: QUADRANT_COLORS["low-unpleasant"],
                        }}
                      />
                    )}
                    {item.percentages["low-pleasant"] > 0 && (
                      <div
                        style={{
                          width: `${item.percentages["low-pleasant"]}%`,
                          backgroundColor: QUADRANT_COLORS["low-pleasant"],
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Strategies Insights
function StrategiesInsights({ entries }: { entries: EmotionEntry[] }) {
  const strategyStats = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach((e) => {
      if (e.strategy) {
        counts[e.strategy] = (counts[e.strategy] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [entries]);

  if (strategyStats.length === 0) {
    return (
      <div className="p-6 text-center">
        <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">Complete recommended strategies to see them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-foreground text-sm">Top Strategies</h4>
      <div className="grid grid-cols-1 gap-2">
        {strategyStats.map((item, i) => (
          <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                {i + 1}
              </div>
              <span className="text-sm font-medium">{item.name}</span>
            </div>
            <span className="text-xs font-medium bg-background px-2 py-1 rounded-md border border-border">
              {item.count} sessions
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Check-in Frequency Graph (7-day mini, expandable to 30-day full)
function CheckinFrequencyGraph({ entries }: { entries: EmotionEntry[] }) {
  const [expanded, setExpanded] = useState(false);

  const buildChartData = (days: number) => {
    const today = new Date();
    const data: { date: string; label: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, "yyyy-MM-dd");
      const label = days <= 7 ? format(d, "EEE") : format(d, "MMM d");
      const count = entries.filter((e) => e.entry_date === dateStr).length;
      data.push({ date: dateStr, label, count });
    }
    return data;
  };

  const miniData = useMemo(() => buildChartData(7), [entries]);
  const fullData = useMemo(() => buildChartData(30), [entries]);

  const maxCount = Math.max(...miniData.map((d) => d.count), 1);

  return (
    <>
      {/* Mini 7-day graph */}
      <div
        className="p-4 rounded-xl bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors group"
        onClick={() => setExpanded(true)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Check-in Activity</span>
          </div>
          <Maximize2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
        <div className="flex items-end gap-1" style={{ height: 64 }}>
          {miniData.map((d) => {
            const barH = maxCount > 0 ? Math.max((d.count / maxCount) * 56, 3) : 3;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full">
                <div
                  className="w-full rounded-t-sm bg-primary/80 transition-all duration-300"
                  style={{ height: barH }}
                />
                <span className="text-[8px] text-muted-foreground mt-1">{d.label}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">Tap to expand • Last 7 days</p>
      </div>

      {/* Expanded 30-day Dialog */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-3xl rounded-3xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Check-in Frequency</h3>
                <p className="text-sm text-muted-foreground">Last 30 days</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {fullData.reduce((sum, d) => sum + d.count, 0)}
                </p>
                <p className="text-xs text-muted-foreground">total check-ins</p>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fullData} margin={{ top: 5, right: 5, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    className="fill-muted-foreground"
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10 }}
                    className="fill-muted-foreground"
                    width={30}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="px-3 py-2 rounded-lg bg-background border border-border shadow-lg text-xs">
                          <p className="font-medium">{data.date}</p>
                          <p className="text-primary font-bold">{data.count} check-in{data.count !== 1 ? "s" : ""}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} className="fill-primary" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
