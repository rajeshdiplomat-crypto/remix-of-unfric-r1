import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { QuadrantType, QUADRANTS, EmotionEntry } from "./types";
import {
  format,
  subDays,
  startOfDay,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval as eachDay,
  parseISO,
  getHours,
} from "date-fns";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type DateRange = 7 | 30 | 90;

interface PatternsDashboardEnhancedProps {
  entries: EmotionEntry[];
  onDateClick?: (date: string, entries: EmotionEntry[]) => void;
}

function getTimePeriod(timestamp: string): "morning" | "afternoon" | "evening" | "night" {
  const hour = getHours(parseISO(timestamp));
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
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
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
      {subValue && <p className="text-xs text-slate-400 mt-0.5">{subValue}</p>}
    </div>
  );
}

function MonthlyCalendar({
  entries,
  onDateClick,
}: {
  entries: EmotionEntry[];
  onDateClick?: (date: string, entries: EmotionEntry[]) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { days, firstDayOfWeek, entriesByDate } = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDay({ start, end });
    const firstDayOfWeek = start.getDay();

    const entriesByDate: Record<string, EmotionEntry[]> = {};
    entries.forEach((entry) => {
      if (!entriesByDate[entry.entry_date]) entriesByDate[entry.entry_date] = [];
      entriesByDate[entry.entry_date].push(entry);
    });

    return { days, firstDayOfWeek, entriesByDate };
  }, [currentMonth, entries]);

  const getDominant = (dayEntries: EmotionEntry[]): QuadrantType | null => {
    if (dayEntries.length === 0) return null;
    const counts: Record<QuadrantType, number> = {
      "high-pleasant": 0,
      "high-unpleasant": 0,
      "low-unpleasant": 0,
      "low-pleasant": 0,
    };
    dayEntries.forEach((e) => e.quadrant && counts[e.quadrant]++);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as QuadrantType;
  };

  const today = startOfDay(new Date());

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 dark:text-white">Monthly Overview</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[80px] text-center">{format(currentMonth, "MMM yyyy")}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-slate-400 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`e-${i}`} className="h-10" />
        ))}
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayEntries = entriesByDate[dateStr] || [];
          const dominant = getDominant(dayEntries);
          const isToday = day.getTime() === today.getTime();
          const isFuture = day > today;

          return (
            <div
              key={dateStr}
              onClick={() => dayEntries.length > 0 && onDateClick?.(dateStr, dayEntries)}
              className={`h-10 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all cursor-pointer ${
                isToday ? "ring-2 ring-rose-500 ring-offset-2" : ""
              } ${isFuture ? "opacity-30" : ""} ${dayEntries.length > 0 ? "hover:scale-110" : ""}`}
              style={
                dominant && !isFuture
                  ? { backgroundColor: QUADRANTS[dominant].color, color: "white" }
                  : { backgroundColor: "rgb(241 245 249)" }
              }
            >
              {format(day, "d")}
              {dayEntries.length > 1 && <span className="text-[8px] opacity-70">+{dayEntries.length - 1}</span>}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
        {Object.entries(QUADRANTS).map(([key, info]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: info.color }} />
            <span className="text-[10px] text-slate-500">{info.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DaytimeCard({ period, entries }: { period: keyof typeof TIME_INFO; entries: EmotionEntry[] }) {
  const info = TIME_INFO[period];
  const Icon = info.icon;

  const periodEntries = entries.filter((e) => getTimePeriod(e.created_at) === period);
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
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${info.gradient} flex items-center justify-center mb-3`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-xs text-slate-500 mb-1">{info.label}</p>
      {count > 0 && dominant ? (
        <>
          <p className="text-sm font-semibold" style={{ color: QUADRANTS[dominant].color }}>
            {QUADRANTS[dominant].label}
          </p>
          <p className="text-xs text-slate-400 mt-1">{count} check-ins</p>
        </>
      ) : (
        <p className="text-sm text-slate-400">—</p>
      )}
    </div>
  );
}

export function PatternsDashboardEnhanced({ entries, onDateClick }: PatternsDashboardEnhancedProps) {
  const [dateRange, setDateRange] = useState<DateRange>(30);

  const filteredEntries = useMemo(() => {
    const cutoff = format(subDays(startOfDay(new Date()), dateRange - 1), "yyyy-MM-dd");
    return entries.filter((e) => e.entry_date >= cutoff);
  }, [entries, dateRange]);

  const stats = useMemo(() => {
    const today = startOfDay(new Date());

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
      .slice(0, 5);

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
      if (entries.some((e) => e.entry_date === format(subDays(today, i), "yyyy-MM-dd"))) streak++;
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
  }, [filteredEntries, entries]);

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
          <DaytimeCard key={period} period={period} entries={filteredEntries} />
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

      {/* Monthly Calendar */}
      <MonthlyCalendar entries={entries} onDateClick={onDateClick} />
    </div>
  );
}
