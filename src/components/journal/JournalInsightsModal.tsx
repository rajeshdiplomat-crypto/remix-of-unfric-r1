import { useState, useEffect, useMemo } from "react";
import { format, subDays, differenceInDays, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart3, Clock, PenLine, TrendingUp, Calendar, FileText, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface JournalInsightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DailyStats {
  date: string;
  wordCount: number;
  charCount: number;
  entryCount: number;
}

const extractTextFromJSON = (contentJSON: string): string => {
  try {
    const parsed = typeof contentJSON === "string" ? JSON.parse(contentJSON) : contentJSON;
    if (!parsed?.content) return "";
    const walk = (node: any): string => {
      if (node?.text) return node.text;
      if (Array.isArray(node?.content)) return node.content.map(walk).join(" ");
      return "";
    };
    return parsed.content.map(walk).join(" ");
  } catch {
    return "";
  }
};

export function JournalInsightsModal({ open, onOpenChange }: JournalInsightsModalProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<{ entry_date: string; text_formatting: any; created_at: string; updated_at: string }[]>([]);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");

  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from("journal_entries")
      .select("entry_date, text_formatting, created_at, updated_at")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false })
      .then(({ data }) => setEntries(data || []));
  }, [open, user]);

  const filteredEntries = useMemo(() => {
    if (timeRange === "all") return entries;
    const days = timeRange === "7d" ? 7 : 30;
    const cutoff = format(subDays(new Date(), days), "yyyy-MM-dd");
    return entries.filter((e) => e.entry_date >= cutoff);
  }, [entries, timeRange]);

  const dailyStats: DailyStats[] = useMemo(() => {
    return filteredEntries.map((e) => {
      const contentStr = typeof e.text_formatting === "string" ? e.text_formatting : JSON.stringify(e.text_formatting || "");
      const text = extractTextFromJSON(contentStr);
      const words = text.split(/\s+/).filter(Boolean);
      return {
        date: e.entry_date,
        wordCount: words.length,
        charCount: text.length,
        entryCount: 1,
      };
    });
  }, [filteredEntries]);

  const totalWords = dailyStats.reduce((s, d) => s + d.wordCount, 0);
  const totalChars = dailyStats.reduce((s, d) => s + d.charCount, 0);
  const totalEntries = dailyStats.length;
  const avgWords = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;
  const avgChars = totalEntries > 0 ? Math.round(totalChars / totalEntries) : 0;

  // Avg writing time estimate (rough: ~40 words/min for journaling)
  const avgMinutes = totalEntries > 0 ? Math.round(totalWords / totalEntries / 40) : 0;
  const totalMinutes = Math.round(totalWords / 40);

  // Most productive day of week
  const dayOfWeekCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    dailyStats.forEach((d) => {
      const day = parseISO(d.date).getDay();
      counts[day] += d.wordCount;
    });
    return counts;
  }, [dailyStats]);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const bestDayIdx = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts));
  const bestDay = dayOfWeekCounts[bestDayIdx] > 0 ? dayNames[bestDayIdx] : "—";

  // Streak
  const streak = useMemo(() => {
    if (!entries.length) return 0;
    const dates = new Set(entries.map((e) => e.entry_date));
    let count = 0;
    let check = new Date();
    for (let i = 0; i < 365; i++) {
      const ds = format(check, "yyyy-MM-dd");
      if (dates.has(ds)) { count++; check = subDays(check, 1); }
      else if (i > 0) break;
      else check = subDays(check, 1);
    }
    return count;
  }, [entries]);

  // Chart data: last N days word counts
  const chartDays = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : Math.min(60, dailyStats.length);
  const chartData = useMemo(() => {
    const map = new Map(dailyStats.map((d) => [d.date, d.wordCount]));
    const days: { date: string; label: string; words: number }[] = [];
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      days.push({ date: d, label: format(subDays(new Date(), i), "d"), words: map.get(d) || 0 });
    }
    return days;
  }, [dailyStats, chartDays]);

  const maxWords = Math.max(...chartData.map((d) => d.words), 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Journal Insights
          </DialogTitle>
        </DialogHeader>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 mb-4">
          {(["7d", "30d", "all"] as const).map((r) => (
            <Button
              key={r}
              variant={timeRange === r ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs rounded-lg"
              onClick={() => setTimeRange(r)}
            >
              {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "All Time"}
            </Button>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { icon: FileText, label: "Entries", value: totalEntries, color: "text-blue-600 bg-blue-50" },
            { icon: PenLine, label: "Total Words", value: totalWords.toLocaleString(), color: "text-emerald-600 bg-emerald-50" },
            { icon: TrendingUp, label: "Avg Words/Day", value: avgWords, color: "text-violet-600 bg-violet-50" },
            { icon: Clock, label: "Avg Time", value: `${avgMinutes} min`, color: "text-amber-600 bg-amber-50" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-border/40 bg-card p-3">
              <div className={cn("p-1.5 rounded-lg w-fit mb-2", kpi.color.split(" ")[1])}>
                <kpi.icon className={cn("h-3.5 w-3.5", kpi.color.split(" ")[0])} />
              </div>
              <p className="text-lg font-bold text-foreground">{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Words Per Day Chart */}
        <div className="rounded-xl border border-border/40 bg-card p-4 mb-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Words Per Day</h3>
          <div className="flex items-end gap-[2px] h-24">
            {chartData.map((d, i) => {
              const h = maxWords > 0 ? Math.max((d.words / maxWords) * 80, d.words > 0 ? 4 : 1) : 1;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end group relative">
                  <div className="absolute -top-6 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {d.words}w · {format(parseISO(d.date), "MMM d")}
                  </div>
                  <div
                    className={cn(
                      "w-full rounded-t-sm transition-all",
                      d.words > 0 ? "bg-primary/70 hover:bg-primary" : "bg-muted/40"
                    )}
                    style={{ height: h }}
                  />
                </div>
              );
            })}
          </div>
          {chartDays <= 14 && (
            <div className="flex gap-[2px] mt-1">
              {chartData.map((d) => (
                <div key={d.date} className="flex-1 text-center text-[9px] text-muted-foreground">{d.label}</div>
              ))}
            </div>
          )}
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Writing by Day of Week */}
          <div className="rounded-xl border border-border/40 bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">By Day of Week</h3>
            <div className="flex items-end gap-2 h-16">
              {dayOfWeekCounts.map((count, i) => {
                const maxD = Math.max(...dayOfWeekCounts, 1);
                const h = Math.max((count / maxD) * 48, count > 0 ? 4 : 2);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={cn("w-full rounded-t-sm", i === bestDayIdx && count > 0 ? "bg-primary" : "bg-primary/40")}
                      style={{ height: h }}
                    />
                    <span className="text-[9px] text-muted-foreground">{dayNames[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="rounded-xl border border-border/40 bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Quick Stats</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Streak</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Award className="h-3 w-3 text-amber-500" /> {streak} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Time Writing</span>
                <span className="font-semibold text-foreground">{totalMinutes > 60 ? `${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes} min`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Characters/Day</span>
                <span className="font-semibold text-foreground">{avgChars.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Best Day</span>
                <span className="font-semibold text-foreground">{bestDay}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
