import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDatePreferences } from "@/hooks/useDatePreferences";
import {
  type ManifestGoal,
  type ManifestDailyPractice,
  DAILY_PRACTICE_KEY,
  GOAL_EXTRAS_KEY,
} from "@/components/manifest/types";
import { HistoryDayCard } from "@/components/manifest/HistoryDayCard";
import { ProofLightbox } from "@/components/manifest/ProofLightbox";

type FilterType = "all" | "practiced" | "pauses" | "with-proofs" | "with-images";

interface HistoryDay {
  date: string;
  practiced: boolean;
  alignment: number;
  visualizations: Array<{
    id: string;
    duration: number;
    created_at: string;
  }>;
  acts: Array<{
    id: string;
    text: string;
    created_at: string;
  }>;
  proofs: Array<{
    id: string;
    text?: string;
    image_url?: string;
    created_at: string;
  }>;
  growth_note?: string;
  gratitudes?: Array<{
    id: string;
    text: string;
    created_at: string;
  }>;
}

interface WeekGroup {
  weekStart: Date;
  weekEnd: Date;
  days: HistoryDay[];
  avgAlignment: number;
  actDays: number;
  proofsCount: number;
}

// Helper to load goal extras - DB columns are now primary, localStorage is fallback
function loadGoalExtras(goalId: string): Partial<ManifestGoal> {
  try {
    const stored = localStorage.getItem(GOAL_EXTRAS_KEY);
    if (!stored) return {};
    const all = JSON.parse(stored);
    return all[goalId] || {};
  } catch { return {}; }
}

export default function ManifestHistory() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { weekStartsOn, formatDate: fmtDate } = useDatePreferences();

  const [goal, setGoal] = useState<ManifestGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<HistoryDay[]>([]);

  // Load goal info from Supabase + local extras
  useEffect(() => {
    async function fetchGoal() {
      if (!goalId || !user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("manifest_goals")
          .select("*")
          .eq("id", goalId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const extras = loadGoalExtras(goalId);
          const d = data as any;
          const mergedGoal: ManifestGoal = {
            id: d.id,
            user_id: d.user_id,
            title: d.title,
            category: d.category || extras.category || "other",
            vision_image_url: d.cover_image_url || extras.vision_image_url,
            start_date: d.start_date || extras.start_date,
            live_from_end: d.live_from_end || extras.live_from_end,
            act_as_if: d.act_as_if || extras.act_as_if || "Take one small action",
            conviction: d.conviction ?? extras.conviction ?? 5,
            visualization_minutes: d.visualization_minutes || extras.visualization_minutes || 3,
            daily_affirmation: d.daily_affirmation || extras.daily_affirmation || "",
            check_in_time: d.check_in_time || extras.check_in_time || "08:00",
            committed_7_days: d.committed_7_days || extras.committed_7_days || false,
            is_completed: d.is_completed || false,
            is_locked: d.is_locked || extras.is_locked || false,
            created_at: d.created_at,
            updated_at: d.updated_at,
          };
          setGoal(mergedGoal);
        }
      } catch (err) {
        console.error("Error fetching goal:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchGoal();
  }, [goalId, user]);

  // Load history data from DB (with localStorage fallback)
  useEffect(() => {
    if (!goalId || !user) return;

    const loadHistory = async () => {
      // Try DB first
      const { data: dbPractices } = await supabase
        .from("manifest_practices")
        .select("*")
        .eq("goal_id", goalId)
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false });

      if (dbPractices && dbPractices.length > 0) {
        const goalPractices: HistoryDay[] = dbPractices.map((p: any) => ({
          date: p.entry_date,
          practiced: p.locked || false,
          alignment: p.alignment || 0,
          visualizations: p.visualizations || [],
          acts: p.acts || [],
          proofs: p.proofs || [],
          growth_note: p.growth_note,
          gratitudes: p.gratitudes || [],
        }));
        setHistoryData(goalPractices);
        return;
      }

      // Fallback to localStorage
      const stored = localStorage.getItem(DAILY_PRACTICE_KEY);
      if (!stored) { setHistoryData([]); return; }
      const allPractices = JSON.parse(stored);
      const goalPractices: HistoryDay[] = [];
      Object.keys(allPractices).forEach((key) => {
        if (key.startsWith(`${goalId}_`)) {
          const practice = allPractices[key] as Partial<ManifestDailyPractice>;
          const dateStr = key.replace(`${goalId}_`, "");
          goalPractices.push({
            date: dateStr,
            practiced: practice.locked || false,
            alignment: practice.alignment || 0,
            visualizations: practice.visualizations || [],
            acts: practice.acts || [],
            proofs: practice.proofs || [],
            growth_note: practice.growth_note,
            gratitudes: practice.gratitudes || [],
          });
        }
      });
      goalPractices.sort((a, b) => b.date.localeCompare(a.date));
      setHistoryData(goalPractices);
    };

    loadHistory();
  }, [goalId, user]);

  // Filter data
  const filteredData = historyData.filter((day) => {
    switch (filter) {
      case "practiced":
        return day.practiced;
      case "pauses":
        return !day.practiced;
      case "with-proofs":
        return day.proofs.some((p) => p.text);
      case "with-images":
        return day.proofs.some((p) => p.image_url);
      default:
        return true;
    }
  });

  // Group by week
  const weekGroups: WeekGroup[] = [];
  filteredData.forEach((day) => {
    const dayDate = parseISO(day.date);
    const weekStart = startOfWeek(dayDate, { weekStartsOn });
    const weekEnd = endOfWeek(dayDate, { weekStartsOn });

    let group = weekGroups.find((g) => isWithinInterval(dayDate, { start: g.weekStart, end: g.weekEnd }));

    if (!group) {
      group = {
        weekStart,
        weekEnd,
        days: [],
        avgAlignment: 0,
        actDays: 0,
        proofsCount: 0,
      };
      weekGroups.push(group);
    }

    group.days.push(day);
  });

  // Calculate week summaries
  weekGroups.forEach((group) => {
    const practicedDays = group.days.filter((d) => d.practiced);
    group.avgAlignment =
      practicedDays.length > 0
        ? Math.round((practicedDays.reduce((sum, d) => sum + d.alignment, 0) / practicedDays.length) * 10) / 10
        : 0;
    group.actDays = group.days.filter((d) => d.acts.length > 0).length;
    group.proofsCount = group.days.reduce((sum, d) => sum + d.proofs.length, 0);
  });

  weekGroups.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());

  // Calculate totals
  const totalDays = historyData.length;
  const totalProofs = historyData.reduce((sum, d) => sum + d.proofs.length, 0);
  const practicedDays = historyData.filter((d) => d.practiced);
  const avgAlignment =
    practicedDays.length > 0
      ? Math.round((practicedDays.reduce((sum, d) => sum + d.alignment, 0) / practicedDays.length) * 10) / 10
      : 0;

  // Calculate best streak
  let bestStreak = 0;
  let currentStreak = 0;
  const sortedByDateAsc = [...historyData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  sortedByDateAsc.forEach((day) => {
    if (day.practiced) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
  };

  const handleImageClick = (imageUrl: string) => {
    setLightboxImage(imageUrl);
  };

  if (loading) {
    return (
      <div className="flex-1 w-full px-4 lg:px-6 py-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="flex-1 w-full px-4 lg:px-6 py-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Goal not found</p>
          <Button variant="link" asChild className="mt-2">
            <Link to="/manifest">Back to Manifestations</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full px-4 lg:px-6 py-4">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/manifest")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Manifestations
        </Button>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground">Practice History</h1>
          <h2 className="text-lg text-muted-foreground">{goal.title}</h2>
          <p className="text-sm text-muted-foreground">
            Practicing: {totalDays} days · {totalProofs} proofs · Avg {avgAlignment}/10 · Best streak: {bestStreak}
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            { key: "all" as FilterType, label: "All days" },
            { key: "practiced" as FilterType, label: "Practiced only" },
            { key: "pauses" as FilterType, label: "Pauses" },
            { key: "with-proofs" as FilterType, label: "With proofs" },
            { key: "with-images" as FilterType, label: "With images" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                filter === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Content */}
      <div className="max-w-2xl space-y-6">
        {weekGroups.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">Your practice history will appear here as you continue.</p>
          </div>
        ) : (
          weekGroups.map((week, weekIndex) => (
            <div key={week.weekStart.toISOString()}>
              {/* Week Header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Week of {fmtDate(week.weekStart, "short")}–{format(week.weekEnd, "d")}
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>

              {/* Day Cards */}
              <div className="space-y-3">
                {week.days.map((day) => (
                  <HistoryDayCard key={day.date} data={day} onImageClick={handleImageClick} />
                ))}
              </div>

              {/* Weekly Summary */}
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Week summary:</span> Avg alignment {week.avgAlignment}/10 ·{" "}
                  {week.actDays} act-as-if days · {week.proofsCount} proofs
                </p>
              </div>

              {weekIndex < weekGroups.length - 1 && <Separator className="my-6" />}
            </div>
          ))
        )}
      </div>

      {/* Lightbox */}
      {lightboxImage && <ProofLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />}
    </div>
  );
}
