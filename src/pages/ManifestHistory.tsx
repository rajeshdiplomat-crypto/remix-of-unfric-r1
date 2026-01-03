import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  visualizations: Array<{ id: string; duration: number; created_at: string }>;
  acts: Array<{ id: string; text: string; created_at: string }>;
  proofs: Array<{ id: string; text?: string; image_url?: string; created_at: string }>;
  growth_note?: string;
  gratitude?: string;
}

interface WeekGroup {
  weekStart: Date;
  weekEnd: Date;
  days: HistoryDay[];
  avgAlignment: number;
  actDays: number;
  proofsCount: number;
}

function loadGoalExtras(goalId: string): Partial<ManifestGoal> {
  const stored = localStorage.getItem(GOAL_EXTRAS_KEY);
  if (!stored) return {};
  const all = JSON.parse(stored);
  return all[goalId] || {};
}

function FilterPill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-1.5 text-sm rounded-full border transition-colors",
        "shadow-[0_10px_30px_rgba(0,0,0,0.06)]",
        active
          ? "bg-[#2f2f33] text-white border-transparent"
          : "bg-white/65 text-[#2d2d31] border-black/5 hover:bg-white/80",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function ManifestHistory() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [goal, setGoal] = useState<ManifestGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<HistoryDay[]>([]);

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
          const mergedGoal: ManifestGoal = {
            id: data.id,
            user_id: data.user_id,
            title: data.title,
            category: extras.category || "other",
            vision_image_url: extras.vision_image_url,
            start_date: extras.start_date,
            live_from_end: extras.live_from_end,
            act_as_if: extras.act_as_if || "Take one small action",
            conviction: extras.conviction ?? 5,
            visualization_minutes: extras.visualization_minutes || 3,
            daily_affirmation: extras.daily_affirmation || "",
            check_in_time: extras.check_in_time || "08:00",
            committed_7_days: extras.committed_7_days || false,
            is_completed: data.is_completed || false,
            is_locked: extras.is_locked || false,
            created_at: data.created_at,
            updated_at: data.updated_at,
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

  useEffect(() => {
    if (!goalId) return;

    const stored = localStorage.getItem(DAILY_PRACTICE_KEY);
    if (!stored) {
      setHistoryData([]);
      return;
    }

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
          gratitude: practice.gratitude,
        });
      }
    });

    goalPractices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setHistoryData(goalPractices);
  }, [goalId]);

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

  const weekGroups: WeekGroup[] = [];
  filteredData.forEach((day) => {
    const dayDate = parseISO(day.date);
    const weekStart = startOfWeek(dayDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(dayDate, { weekStartsOn: 1 });

    let group = weekGroups.find((g) => isWithinInterval(dayDate, { start: g.weekStart, end: g.weekEnd }));

    if (!group) {
      group = { weekStart, weekEnd, days: [], avgAlignment: 0, actDays: 0, proofsCount: 0 };
      weekGroups.push(group);
    }

    group.days.push(day);
  });

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

  const totalDays = historyData.length;
  const totalProofs = historyData.reduce((sum, d) => sum + d.proofs.length, 0);
  const practicedDays = historyData.filter((d) => d.practiced);
  const avgAlignment =
    practicedDays.length > 0
      ? Math.round((practicedDays.reduce((sum, d) => sum + d.alignment, 0) / practicedDays.length) * 10) / 10
      : 0;

  let bestStreak = 0;
  let currentStreak = 0;
  const sortedByDateAsc = [...historyData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  sortedByDateAsc.forEach((day) => {
    if (day.practiced) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else currentStreak = 0;
  });

  const handleImageClick = (imageUrl: string) => setLightboxImage(imageUrl);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] w-full bg-[#f6f1ed] px-4 lg:px-6 py-10">
        <div className="mx-auto max-w-[820px] text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="min-h-[calc(100vh-4rem)] w-full bg-[#f6f1ed] px-4 lg:px-6 py-10">
        <div className="mx-auto max-w-[820px] text-center py-12">
          <p className="text-muted-foreground">Goal not found</p>
          <Button variant="link" asChild className="mt-2">
            <Link to="/manifest">Back to Manifestations</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-[#f6f1ed]">
      <div className="mx-auto max-w-[980px] px-4 lg:px-6 py-8 lg:py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/manifest")}
          className="mb-6 rounded-full bg-white/60 backdrop-blur border border-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="rounded-3xl border border-black/5 bg-white/60 backdrop-blur p-6 lg:p-8 shadow-[0_18px_55px_rgba(0,0,0,0.08)]">
          <h1 className="font-serif text-3xl lg:text-4xl tracking-tight text-[#1f1f23]">Practice History</h1>
          <p className="mt-2 text-sm text-muted-foreground">{goal.title}</p>

          <div className="mt-4 text-sm text-muted-foreground">
            Practicing: {totalDays} days · {totalProofs} proofs · Avg {avgAlignment}/10 · Best streak: {bestStreak}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
              All days
            </FilterPill>
            <FilterPill active={filter === "practiced"} onClick={() => setFilter("practiced")}>
              Practiced
            </FilterPill>
            <FilterPill active={filter === "pauses"} onClick={() => setFilter("pauses")}>
              Pauses
            </FilterPill>
            <FilterPill active={filter === "with-proofs"} onClick={() => setFilter("with-proofs")}>
              With proofs
            </FilterPill>
            <FilterPill active={filter === "with-images"} onClick={() => setFilter("with-images")}>
              With images
            </FilterPill>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {weekGroups.length === 0 ? (
            <div className="text-center py-14 rounded-3xl border border-black/5 bg-white/55 backdrop-blur shadow-[0_18px_55px_rgba(0,0,0,0.06)]">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">Your practice history will appear here as you continue.</p>
            </div>
          ) : (
            weekGroups.map((week, weekIndex) => (
              <div key={week.weekStart.toISOString()}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Week of {format(week.weekStart, "MMM d")}–{format(week.weekEnd, "d")}
                  </span>
                  <div className="flex-1 h-px bg-black/10" />
                </div>

                <div className="space-y-3">
                  {week.days.map((day) => (
                    <HistoryDayCard key={day.date} data={day} onImageClick={handleImageClick} />
                  ))}
                </div>

                <div className="mt-4 p-4 rounded-2xl border border-black/5 bg-white/55 backdrop-blur shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-[#1f1f23]">Week summary:</span> Avg alignment {week.avgAlignment}
                    /10 · {week.actDays} act-as-if days · {week.proofsCount} proofs
                  </p>
                </div>

                {weekIndex < weekGroups.length - 1 && <Separator className="my-8 opacity-60" />}
              </div>
            ))
          )}
        </div>

        {lightboxImage && <ProofLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />}
      </div>
    </div>
  );
}
