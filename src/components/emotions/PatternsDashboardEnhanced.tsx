import { useMemo, useState } from "react";
import { QuadrantType, QUADRANTS, EmotionEntry } from "./types";
import { format, subDays, differenceInCalendarDays, parseISO } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  Users,
  Briefcase,
  Moon,
  Dumbbell,
  Sun,
  Sunrise,
  Sunset,
  Sparkles,
  CalendarDays,
  TrendingUp,
  Target,
  Activity,
} from "lucide-react";
import { useTimezone } from "@/hooks/useTimezone";
import { getTimePeriodInTimezone, getStartOfTodayInTimezone } from "@/lib/formatDate";

type DateRange = 7 | 30 | 90;

interface PatternsDashboardEnhancedProps {
  entries: EmotionEntry[];
  onDateClick?: (date: string, entries: EmotionEntry[]) => void;
}

const TIME_INFO = {
  morning: { label: "Morning", icon: Sunrise },
  afternoon: { label: "Afternoon", icon: Sun },
  evening: { label: "Evening", icon: Sunset },
  night: { label: "Night", icon: Moon },
};

// Quadrant colors for consistency
const QUADRANT_COLORS: Record<QuadrantType, string> = {
  "high-pleasant": "hsl(45, 93%, 47%)",    // Yellow/Gold
  "high-unpleasant": "hsl(0, 72%, 51%)",   // Red
  "low-unpleasant": "hsl(215, 20%, 45%)",  // Gray-blue
  "low-pleasant": "hsl(142, 52%, 45%)",    // Green
};

export function PatternsDashboardEnhanced({ entries }: PatternsDashboardEnhancedProps) {
  const { timezone } = useTimezone();
  const [dateRange, setDateRange] = useState<DateRange>(30);
  const [activeTab, setActiveTab] = useState<"overview" | "moods" | "context">("overview");

  const filteredEntries = useMemo(() => {
    const today = getStartOfTodayInTimezone(timezone);
    const cutoff = format(subDays(today, dateRange - 1), "yyyy-MM-dd");
    return entries.filter((e) => e.entry_date >= cutoff);
  }, [entries, dateRange, timezone]);

  const stats = useMemo(() => {
    // Quadrant counts
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
        if (!emotionCounts[e.emotion]) {
          emotionCounts[e.emotion] = { count: 0, quadrant: e.quadrant };
        }
        emotionCounts[e.emotion].count++;
      }
    });

    const topEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    const quadrantData = [
      { name: "High Pleasant", value: quadrantCounts["high-pleasant"], color: QUADRANT_COLORS["high-pleasant"], id: "high-pleasant" },
      { name: "High Unpleasant", value: quadrantCounts["high-unpleasant"], color: QUADRANT_COLORS["high-unpleasant"], id: "high-unpleasant" },
      { name: "Low Unpleasant", value: quadrantCounts["low-unpleasant"], color: QUADRANT_COLORS["low-unpleasant"], id: "low-unpleasant" },
      { name: "Low Pleasant", value: quadrantCounts["low-pleasant"], color: QUADRANT_COLORS["low-pleasant"], id: "low-pleasant" },
    ].filter((d) => d.value > 0);

    return {
      total: filteredEntries.length,
      topEmotions,
      quadrantData,
    };
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
    <div className="space-y-4">
      {/* Date Range Filter + Tab Navigation Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === "overview"
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("moods")}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === "moods"
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Moods
          </button>
          <button
            onClick={() => setActiveTab("context")}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === "context"
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Context
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          {([7, 30, 90] as DateRange[]).map((d) => (
            <button
              key={d}
              onClick={() => setDateRange(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                dateRange === d 
                  ? "bg-card shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content - Fixed Height Container */}
      <div className="min-h-[420px]">
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Stats Strip */}
            <StatsStrip entries={filteredEntries} topEmotion={stats.topEmotions[0]?.[0]} topQuadrant={stats.quadrantData[0]} />
            {/* Pattern Insights */}
            <PatternInsights entries={filteredEntries} />
          </div>
        )}

        {activeTab === "moods" && (
          <div className="space-y-4">
            {/* Mood Distribution + Most Frequent Feelings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <MoodDistributionChart data={stats.quadrantData} />
              <MostFrequentFeelings emotions={stats.topEmotions} total={stats.total} />
            </div>
            {/* Mood by Time of Day */}
            <MoodByTimeOfDay entries={filteredEntries} timezone={timezone} />
          </div>
        )}

        {activeTab === "context" && (
          <div className="space-y-4">
            <ContextInsights entries={filteredEntries} />
          </div>
        )}
      </div>
    </div>
  );
}

// Stats Strip - Summary cards at top
function StatsStrip({ 
  entries, 
  topEmotion,
  topQuadrant 
}: { 
  entries: EmotionEntry[]; 
  topEmotion?: string;
  topQuadrant?: { name: string; id: string };
}) {
  const stats = useMemo(() => {
    // Total check-ins
    const total = entries.length;
    
    // Current streak calculation
    let streak = 0;
    if (entries.length > 0) {
      const sortedDates = [...new Set(entries.map(e => e.entry_date))].sort().reverse();
      const today = format(new Date(), "yyyy-MM-dd");
      const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
      
      // Check if streak is active (today or yesterday has entry)
      if (sortedDates[0] === today || sortedDates[0] === yesterday) {
        streak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = parseISO(sortedDates[i - 1]);
          const currDate = parseISO(sortedDates[i]);
          const diff = differenceInCalendarDays(prevDate, currDate);
          if (diff === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }
    
    return { total, streak };
  }, [entries]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <CalendarDays className="h-4 w-4" />
          <span className="text-xs font-medium">Total Check-ins</span>
        </div>
        <p className="text-2xl font-bold text-foreground">{stats.total}</p>
      </div>
      
      <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs font-medium">Current Streak</span>
        </div>
        <p className="text-2xl font-bold text-foreground">{stats.streak} days</p>
      </div>
      
      <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Target className="h-4 w-4" />
          <span className="text-xs font-medium">Most Common Zone</span>
        </div>
        <p 
          className="text-lg font-semibold"
          style={{ color: topQuadrant ? QUADRANT_COLORS[topQuadrant.id as QuadrantType] : undefined }}
        >
          {topQuadrant?.name || "—"}
        </p>
      </div>
      
      <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Activity className="h-4 w-4" />
          <span className="text-xs font-medium">Top Feeling</span>
        </div>
        <p className="text-lg font-semibold text-foreground">{topEmotion || "—"}</p>
      </div>
    </div>
  );
}

// Mood Distribution Donut Chart
function MoodDistributionChart({ data }: { data: { name: string; value: number; color: string; id: string }[] }) {
  if (data.length === 0) return null;

  return (
    <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
      <h3 className="font-semibold text-foreground mb-4 uppercase text-xs tracking-wider">Mood Distribution</h3>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: QUADRANT_COLORS["high-pleasant"] }} />
          <span className="text-xs text-muted-foreground">High Pleasant</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: QUADRANT_COLORS["high-unpleasant"] }} />
          <span className="text-xs text-muted-foreground">High Unpleasant</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: QUADRANT_COLORS["low-unpleasant"] }} />
          <span className="text-xs text-muted-foreground">Low Unpleasant</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: QUADRANT_COLORS["low-pleasant"] }} />
          <span className="text-xs text-muted-foreground">Low Pleasant</span>
        </div>
      </div>
    </div>
  );
}

// Most Frequent Feelings
function MostFrequentFeelings({ 
  emotions, 
  total 
}: { 
  emotions: [string, { count: number; quadrant: QuadrantType }][]; 
  total: number;
}) {
  if (emotions.length === 0) return null;

  return (
    <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
      <h3 className="font-semibold text-foreground mb-4 uppercase text-xs tracking-wider">Most Frequent Feelings</h3>
      <div className="space-y-3">
        {emotions.map(([emotion, data]) => {
          const pct = (data.count / total) * 100;
          const color = QUADRANT_COLORS[data.quadrant];
          return (
            <div key={emotion}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium" style={{ color }}>
                  {emotion}
                </span>
                <span className="text-xs text-muted-foreground">{data.count} times</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color }}
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
      
      // Calculate percentages for the stacked bar
      const percentages = count > 0 ? {
        "high-pleasant": (quadrantCounts["high-pleasant"] / count) * 100,
        "high-unpleasant": (quadrantCounts["high-unpleasant"] / count) * 100,
        "low-unpleasant": (quadrantCounts["low-unpleasant"] / count) * 100,
        "low-pleasant": (quadrantCounts["low-pleasant"] / count) * 100,
      } : null;
      
      // Get top 2 moods for display
      const sortedQuadrants = Object.entries(quadrantCounts)
        .filter(([_, c]) => c > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([q, c]) => ({
          quadrant: q as QuadrantType,
          percentage: Math.round((c / count) * 100),
        }));
      
      return {
        period,
        count,
        percentages,
        topMoods: sortedQuadrants,
        info: TIME_INFO[period],
      };
    });
  }, [entries, timezone]);

  return (
    <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
      <h3 className="font-semibold text-foreground mb-4 uppercase text-xs tracking-wider">Mood by Time of Day</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {timeStats.map(({ period, count, percentages, topMoods, info }) => {
          const Icon = info.icon;
          return (
            <div key={period} className="p-3 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-foreground">{info.label}</span>
              </div>
              
              {count > 0 && percentages ? (
                <>
                  {/* Stacked color bar */}
                  <div className="h-2 rounded-full overflow-hidden flex mb-2">
                    {percentages["high-pleasant"] > 0 && (
                      <div style={{ width: `${percentages["high-pleasant"]}%`, backgroundColor: QUADRANT_COLORS["high-pleasant"] }} />
                    )}
                    {percentages["high-unpleasant"] > 0 && (
                      <div style={{ width: `${percentages["high-unpleasant"]}%`, backgroundColor: QUADRANT_COLORS["high-unpleasant"] }} />
                    )}
                    {percentages["low-unpleasant"] > 0 && (
                      <div style={{ width: `${percentages["low-unpleasant"]}%`, backgroundColor: QUADRANT_COLORS["low-unpleasant"] }} />
                    )}
                    {percentages["low-pleasant"] > 0 && (
                      <div style={{ width: `${percentages["low-pleasant"]}%`, backgroundColor: QUADRANT_COLORS["low-pleasant"] }} />
                    )}
                  </div>
                  
                  {/* Top moods */}
                  <div className="space-y-0.5">
                    {topMoods.map((mood) => (
                      <p key={mood.quadrant} className="text-[10px] truncate" style={{ color: QUADRANT_COLORS[mood.quadrant] }}>
                        {mood.percentage}% {QUADRANTS[mood.quadrant].label.split(",")[0]}...
                      </p>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{count} check-ins</p>
                </>
              ) : (
                <>
                  <div className="h-2 rounded-full bg-muted mb-2" />
                  <p className="text-xs text-muted-foreground">—</p>
                  <p className="text-[10px] text-muted-foreground">0 check-ins</p>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Context Insights - Cards showing context data with mood breakdowns
function ContextInsights({ entries }: { entries: EmotionEntry[] }) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const contextStats = useMemo(() => {
    type ContextStats = Record<string, { count: number; quadrants: Record<QuadrantType, number> }>;
    
    const whoStats: ContextStats = {};
    const whatStats: ContextStats = {};
    const sleepStats: ContextStats = {};
    const activityStats: ContextStats = {};

    entries.forEach((e) => {
      const addToStats = (stats: ContextStats, value: string | undefined) => {
        if (!value) return;
        if (!stats[value]) {
          stats[value] = {
            count: 0,
            quadrants: { "high-pleasant": 0, "high-unpleasant": 0, "low-unpleasant": 0, "low-pleasant": 0 },
          };
        }
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
        .map(([label, data]) => {
          const total = data.count;
          
          // Calculate percentages for stacked bar
          const percentages = {
            "high-pleasant": (data.quadrants["high-pleasant"] / total) * 100,
            "high-unpleasant": (data.quadrants["high-unpleasant"] / total) * 100,
            "low-unpleasant": (data.quadrants["low-unpleasant"] / total) * 100,
            "low-pleasant": (data.quadrants["low-pleasant"] / total) * 100,
          };
          
          const moodBreakdown = Object.entries(data.quadrants)
            .filter(([_, c]) => c > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([q, c]) => ({
              quadrant: q as QuadrantType,
              percentage: Math.round((c / total) * 100),
            }));
          
          // Determine left border color based on dominant mood
          const dominantMood = moodBreakdown[0]?.quadrant || "low-pleasant";
          
          return { label, count: total, moodBreakdown, dominantMood, percentages };
        });

    return {
      who: processStats(whoStats),
      what: processStats(whatStats),
      sleep: processStats(sleepStats),
      activity: processStats(activityStats),
    };
  }, [entries]);

  const hasData = contextStats.who.length > 0 || contextStats.what.length > 0 || 
                  contextStats.sleep.length > 0 || contextStats.activity.length > 0;

  if (!hasData) return null;

  const sections = [
    { key: "who", label: "Who are you with", icon: Users, data: contextStats.who },
    { key: "what", label: "What are you doing", icon: Briefcase, data: contextStats.what },
    { key: "sleep", label: "Sleep last night", icon: Moon, data: contextStats.sleep },
    { key: "activity", label: "Physical activity", icon: Dumbbell, data: contextStats.activity },
  ].filter((s) => s.data.length > 0);

  return (
    <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
      <h3 className="font-semibold text-foreground mb-5 uppercase text-xs tracking-wider">Context Insights</h3>
      
      <div className="space-y-6">
        {sections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSections[section.key];
          const visibleData = isExpanded ? section.data : section.data.slice(0, 4);
          const hasMore = section.data.length > 4;
          const hiddenCount = section.data.length - 4;
          
          return (
            <div key={section.key}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{section.label}</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {visibleData.map((item) => (
                  <div
                    key={item.label}
                    className="p-3 rounded-lg bg-muted/30 border-l-4"
                    style={{ borderLeftColor: QUADRANT_COLORS[item.dominantMood] }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.count}</span>
                    </div>
                    
                    {/* Stacked color bar */}
                    <div className="h-2 rounded-full overflow-hidden flex mb-2">
                      {item.percentages["high-pleasant"] > 0 && (
                        <div style={{ width: `${item.percentages["high-pleasant"]}%`, backgroundColor: QUADRANT_COLORS["high-pleasant"] }} />
                      )}
                      {item.percentages["high-unpleasant"] > 0 && (
                        <div style={{ width: `${item.percentages["high-unpleasant"]}%`, backgroundColor: QUADRANT_COLORS["high-unpleasant"] }} />
                      )}
                      {item.percentages["low-unpleasant"] > 0 && (
                        <div style={{ width: `${item.percentages["low-unpleasant"]}%`, backgroundColor: QUADRANT_COLORS["low-unpleasant"] }} />
                      )}
                      {item.percentages["low-pleasant"] > 0 && (
                        <div style={{ width: `${item.percentages["low-pleasant"]}%`, backgroundColor: QUADRANT_COLORS["low-pleasant"] }} />
                      )}
                    </div>
                    
                    <div className="space-y-0.5">
                      {item.moodBreakdown.slice(0, 2).map((mood) => (
                        <p 
                          key={mood.quadrant} 
                          className="text-[11px]"
                          style={{ color: QUADRANT_COLORS[mood.quadrant] }}
                        >
                          {mood.percentage}% {QUADRANTS[mood.quadrant].label.replace("Energy, ", "")}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {hasMore && (
                <button
                  onClick={() => toggleSection(section.key)}
                  className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  {isExpanded ? (
                    <>Show less</>
                  ) : (
                    <>Show {hiddenCount} more</>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Pattern Insights - Natural language insights
function PatternInsights({ entries }: { entries: EmotionEntry[] }) {
  const insights = useMemo(() => {
    const results: { icon: typeof Moon; text: string; count: number }[] = [];
    
    // Analyze sleep patterns
    const sleepMoods: Record<string, { pleasant: number; unpleasant: number; total: number }> = {};
    entries.forEach((e) => {
      const sleep = e.context?.sleepHours;
      if (!sleep) return;
      if (!sleepMoods[sleep]) sleepMoods[sleep] = { pleasant: 0, unpleasant: 0, total: 0 };
      sleepMoods[sleep].total++;
      if (e.quadrant === "low-pleasant" || e.quadrant === "high-pleasant") {
        sleepMoods[sleep].pleasant++;
      } else {
        sleepMoods[sleep].unpleasant++;
      }
    });
    
    Object.entries(sleepMoods).forEach(([sleep, data]) => {
      if (data.total >= 2) {
        if (data.pleasant > data.unpleasant) {
          results.push({
            icon: Moon,
            text: `You felt calmer with ${sleep} sleep`,
            count: data.total,
          });
        }
      }
    });

    // Analyze activity patterns
    const activityMoods: Record<string, { energized: number; total: number }> = {};
    entries.forEach((e) => {
      const activity = e.context?.physicalActivity;
      if (!activity || activity === "None") return;
      if (!activityMoods[activity]) activityMoods[activity] = { energized: 0, total: 0 };
      activityMoods[activity].total++;
      if (e.quadrant === "high-pleasant") {
        activityMoods[activity].energized++;
      }
    });
    
    Object.entries(activityMoods).forEach(([activity, data]) => {
      if (data.total >= 2 && data.energized > 0) {
        results.push({
          icon: Dumbbell,
          text: `Most energized after ${activity.toLowerCase()}`,
          count: data.total,
        });
      }
    });

    // Analyze what you're doing patterns
    const whatMoods: Record<string, { good: number; total: number }> = {};
    entries.forEach((e) => {
      const what = e.context?.what;
      if (!what) return;
      if (!whatMoods[what]) whatMoods[what] = { good: 0, total: 0 };
      whatMoods[what].total++;
      if (e.quadrant === "low-pleasant" || e.quadrant === "high-pleasant") {
        whatMoods[what].good++;
      }
    });
    
    Object.entries(whatMoods).forEach(([what, data]) => {
      if (data.total >= 2 && data.good / data.total >= 0.6) {
        results.push({
          icon: Briefcase,
          text: `${what} often makes you feel good`,
          count: data.total,
        });
      }
    });

    return results.slice(0, 3);
  }, [entries]);

  return (
    <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
      <h3 className="font-semibold text-foreground mb-4 uppercase text-xs tracking-wider">Pattern Insights</h3>
      
      {insights.length === 0 ? (
        <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border">
          <p className="text-sm text-muted-foreground mb-3">
            Log more check-ins with context to unlock personalized insights about your mood patterns.
          </p>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Moon className="h-3.5 w-3.5 text-primary" />
              <span>Add <strong className="text-foreground">sleep hours</strong> to see how rest affects your mood</span>
            </div>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-3.5 w-3.5 text-primary" />
              <span>Log <strong className="text-foreground">physical activity</strong> to discover energy patterns</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-primary" />
              <span>Note <strong className="text-foreground">what you're doing</strong> to find feel-good activities</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {insights.map((insight, i) => {
            const Icon = insight.icon;
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Icon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-foreground">
                  {insight.text} ({insight.count} entries)
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
