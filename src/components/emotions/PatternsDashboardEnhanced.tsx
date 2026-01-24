import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { QuadrantType, QUADRANTS, EmotionEntry } from "./types";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  TrendingUp,
  Calendar,
  Activity,
  Target,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Flame,
  Heart,
  Sparkles,
} from "lucide-react";
import { useTimezone } from "@/hooks/useTimezone";
import { getTimePeriodInTimezone, getTodayInTimezone, getStartOfTodayInTimezone } from "@/lib/formatDate";

type DateRange = 7 | 30 | 90;

interface PatternsDashboardEnhancedProps {
  entries: EmotionEntry[];
  onDateClick?: (date: string, entries: EmotionEntry[]) => void;
}

const TIME_INFO = {
  morning: { label: "Morning", icon: Sunrise, gradient: "from-amber-400 to-orange-400" },
  afternoon: { label: "Afternoon", icon: Sun, gradient: "from-orange-400 to-rose-400" },
  evening: { label: "Evening", icon: Sunset, gradient: "from-purple-400 to-pink-400" },
  night: { label: "Night", icon: Moon, gradient: "from-indigo-400 to-blue-400" },
};

function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
  subValue,
}: {
  icon: any;
  label: string;
  value: string | number;
  gradient: string;
  subValue?: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</p>
        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center opacity-80`}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
      </div>
      <div>
        <p className="text-xl font-bold text-slate-800 dark:text-white leading-tight">{value}</p>
        {subValue && <p className="text-[10px] text-slate-400 mt-0.5">{subValue}</p>}
      </div>
    </div>
  );
}

function DaytimeCard({ 
  period, 
  entries,
  timezone 
}: { 
  period: keyof typeof TIME_INFO; 
  entries: EmotionEntry[];
  timezone: string;
}) {
  const info = TIME_INFO[period];
  const Icon = info.icon;

  const periodEntries = entries.filter((e) => getTimePeriodInTimezone(e.created_at, timezone) === period);
  const count = periodEntries.length;

  const dominant = useMemo(() => {
    if (count === 0) return null;
    const counts: Record<QuadrantType, number> = {
      "high-pleasant": 0,
      "high-unpleasant": 0,
      "low-unpleasant": 0,
      "low-pleasant": 0,
    };
    periodEntries.forEach((e) => e.quadrant && counts[e.quadrant]++);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as QuadrantType;
  }, [periodEntries, count]);

  return (
    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{info.label}</p>
        <div
          className={`w-7 h-7 rounded-lg bg-gradient-to-br ${info.gradient} flex items-center justify-center opacity-80`}
        >
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
      </div>
      <div>
        {count > 0 && dominant ? (
          <>
            <p className="text-sm font-bold truncate" style={{ color: QUADRANTS[dominant].color }}>
              {QUADRANTS[dominant].label}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{count} check-ins</p>
          </>
        ) : (
          <p className="text-sm text-slate-400 font-medium">—</p>
        )}
      </div>
    </div>
  );
}

export function PatternsDashboardEnhanced({ entries, onDateClick }: PatternsDashboardEnhancedProps) {
  const [dateRange, setDateRange] = useState<DateRange>(30);
  const { timezone } = useTimezone();

  const filteredEntries = useMemo(() => {
    const today = getStartOfTodayInTimezone(timezone);
    const cutoff = format(subDays(today, dateRange - 1), "yyyy-MM-dd");
    return entries.filter((e) => e.entry_date >= cutoff);
  }, [entries, dateRange, timezone]);

  const stats = useMemo(() => {
    const today = getStartOfTodayInTimezone(timezone);
    const todayStr = getTodayInTimezone(timezone);

    const quadrantCounts: Record<QuadrantType, number> = {
      "high-pleasant": 0,
      "high-unpleasant": 0,
      "low-unpleasant": 0,
      "low-pleasant": 0,
    };
    const emotionCounts: Record<string, number> = {};

    filteredEntries.forEach((e) => {
      if (e.quadrant) quadrantCounts[e.quadrant]++;
      if (e.emotion) emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
    });

    const topEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Only 5 most frequent

    const quadrantData = Object.entries(quadrantCounts)
      .filter(([_, count]) => count > 0)
      .map(([id, count]) => ({
        name: QUADRANTS[id as QuadrantType].label,
        value: count,
        color: QUADRANTS[id as QuadrantType].color,
      }));

    const last7Days = eachDayOfInterval({ start: subDays(today, 6), end: today });
    const dailyData = last7Days.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      return { date: format(date, "EEE"), count: filteredEntries.filter((e) => e.entry_date === dateStr).length };
    });

    let streak = 0;
    for (let i = 0; i < 90; i++) {
      const checkDate = format(subDays(today, i), "yyyy-MM-dd");
      if (entries.some((e) => e.entry_date === checkDate)) streak++;
      else if (i > 0) break;
    }

    const mostCommon = Object.entries(quadrantCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      total: filteredEntries.length,
      streak,
      mostCommon,
      topEmotion: topEmotions[0],
      topEmotions,
      quadrantData,
      dailyData,
    };
  }, [filteredEntries, entries, timezone]);

  if (entries.length === 0) {
    return (
      <div className="p-12 rounded-2xl bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
        <Heart className="h-12 w-12 mx-auto text-rose-300 mb-4" />
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">No check-ins yet</h3>
        <p className="text-sm text-slate-500">Start logging your emotions to see patterns here</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-rose-500" /> Your Patterns
          </h2>
          <p className="text-sm text-slate-500">Insights from your emotional check-ins</p>
        </div>
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {([7, 30, 90] as DateRange[]).map((d) => (
            <button
              key={d}
              onClick={() => setDateRange(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${dateRange === d ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700"}`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Calendar} label="Total Check-ins" value={stats.total} gradient="from-rose-500 to-pink-500" />
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={`${stats.streak}`}
          gradient="from-orange-500 to-amber-500"
          subValue="days"
        />
        <StatCard
          icon={Target}
          label="Most Common"
          value={
            stats.mostCommon && stats.mostCommon[1] > 0
              ? QUADRANTS[stats.mostCommon[0] as QuadrantType].label.split(" ")[0]
              : "—"
          }
          gradient="from-purple-500 to-indigo-500"
        />
        <StatCard
          icon={Activity}
          label="Top Feeling"
          value={stats.topEmotion?.[0] || "—"}
          gradient="from-teal-500 to-cyan-500"
        />
      </div>

      {/* Daytime Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(["morning", "afternoon", "evening", "night"] as const).map((period) => (
          <DaytimeCard key={period} period={period} entries={filteredEntries} timezone={timezone} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly Chart */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Last 7 Days</h3>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dailyData}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis hide domain={[0, "auto"]} />
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.[0] ? (
                      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border p-2 text-xs">
                        <p className="font-medium">{payload[0].payload.date}</p>
                        <p className="text-slate-500">{payload[0].payload.count} check-ins</p>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {stats.dailyData.map((_, i) => (
                    <Cell key={i} fill={`hsl(${340 - i * 5}, 70%, 55%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mood Distribution */}
        {stats.quadrantData.length > 0 && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Mood Distribution</h3>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.quadrantData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stats.quadrantData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border p-2 text-xs">
                          <p className="font-medium">{payload[0].payload.name}</p>
                          <p className="text-slate-500">{payload[0].payload.value} times</p>
                        </div>
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {stats.quadrantData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] text-slate-500">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top Emotions */}
      {stats.topEmotions.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Most Frequent Feelings</h3>
          <div className="space-y-3">
            {stats.topEmotions.map(([emotion, count]) => {
              const pct = (count / stats.total) * 100;
              const entry = filteredEntries.find((e) => e.emotion === emotion);
              const color = entry?.quadrant ? QUADRANTS[entry.quadrant].color : "#64748b";
              return (
                <div key={emotion}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color }}>
                      {emotion}
                    </span>
                    <span className="text-xs text-slate-400">{count} times</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
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
      )}

      {/* Context Patterns - Based on additional details */}
      <ContextPatternsSection entries={filteredEntries} />
    </div>
  );
}

// Context Patterns Component - Shows analytics based on Who, What, Body, Sleep, Activity
function ContextPatternsSection({ entries }: { entries: EmotionEntry[] }) {
  const contextStats = useMemo(() => {
    const whoStats: Record<string, { count: number; quadrants: Record<QuadrantType, number> }> = {};
    const whatStats: Record<string, { count: number; quadrants: Record<QuadrantType, number> }> = {};
    const bodyStats: Record<string, { count: number; quadrants: Record<QuadrantType, number> }> = {};
    const sleepStats: Record<string, { count: number; quadrants: Record<QuadrantType, number> }> = {};
    const activityStats: Record<string, { count: number; quadrants: Record<QuadrantType, number> }> = {};

    entries.forEach((e) => {
      const addToStats = (
        stats: Record<string, { count: number; quadrants: Record<QuadrantType, number> }>,
        value: string | undefined
      ) => {
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
      addToStats(bodyStats, e.context?.body);
      addToStats(sleepStats, e.context?.sleepHours);
      addToStats(activityStats, e.context?.physicalActivity);
    });

    const getTopItems = (stats: Record<string, { count: number; quadrants: Record<QuadrantType, number> }>) =>
      Object.entries(stats)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 4)
        .map(([label, data]) => {
          const dominantQuadrant = Object.entries(data.quadrants).sort((a, b) => b[1] - a[1])[0];
          return {
            label,
            count: data.count,
            dominantQuadrant: dominantQuadrant[1] > 0 ? (dominantQuadrant[0] as QuadrantType) : null,
          };
        });

    return {
      who: getTopItems(whoStats),
      what: getTopItems(whatStats),
      body: getTopItems(bodyStats),
      sleep: getTopItems(sleepStats),
      activity: getTopItems(activityStats),
    };
  }, [entries]);

  const hasContextData =
    contextStats.who.length > 0 ||
    contextStats.what.length > 0 ||
    contextStats.body.length > 0 ||
    contextStats.sleep.length > 0 ||
    contextStats.activity.length > 0;

  if (!hasContextData) return null;

  const sections = [
    { key: "who", label: "Who You're With", icon: "👥", data: contextStats.who },
    { key: "what", label: "What You're Doing", icon: "🎯", data: contextStats.what },
    { key: "body", label: "Body Sensations", icon: "💓", data: contextStats.body },
    { key: "sleep", label: "Sleep Patterns", icon: "🌙", data: contextStats.sleep },
    { key: "activity", label: "Physical Activity", icon: "🏃", data: contextStats.activity },
  ].filter((s) => s.data.length > 0);

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
      <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-indigo-500" />
        Context Patterns
      </h3>
      <p className="text-xs text-slate-500 mb-4">Insights from the additional details you've logged</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => (
          <div key={section.key} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <span>{section.icon}</span>
              <span>{section.label}</span>
            </div>
            <div className="space-y-1.5">
              {section.data.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/50"
                >
                  <span className="text-sm text-slate-600 dark:text-slate-300">{item.label}</span>
                  <div className="flex items-center gap-2">
                    {item.dominantQuadrant && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: QUADRANTS[item.dominantQuadrant].color }}
                        title={QUADRANTS[item.dominantQuadrant].label}
                      />
                    )}
                    <span className="text-xs text-slate-400">{item.count}×</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
