import { useState, useEffect, useRef, useCallback } from "react";
import { X, Clock, Filter } from "lucide-react";
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { type ManifestGoal, type ManifestDailyPractice, DAILY_PRACTICE_KEY } from "./types";
import { HistoryDayCard } from "./HistoryDayCard";
import { ProofLightbox } from "./ProofLightbox";

interface HistoryDrawerProps {
  goal: ManifestGoal;
  isOpen: boolean;
  onClose: () => void;
  onUseAsMicroAction?: (text: string) => void;
}

type FilterType = "all" | "practiced" | "pauses" | "with-proofs" | "with-images";

interface HistoryDay {
  date: string;
  practiced: boolean;
  alignment: number;
  acted: boolean;
  visualization_completed: boolean;
  proofs: Array<{
    id: string;
    text?: string;
    image_url?: string;
    created_at: string;
  }>;
  growth_note?: string;
  gratitude?: string;
  custom_act_as_if?: string;
}

interface WeekGroup {
  weekStart: Date;
  weekEnd: Date;
  days: HistoryDay[];
  avgAlignment: number;
  actDays: number;
  proofsCount: number;
}

export function HistoryDrawer({ goal, isOpen, onClose, onUseAsMicroAction }: HistoryDrawerProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<HistoryDay[]>([]);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage
  useEffect(() => {
    if (!isOpen) return;

    const stored = localStorage.getItem(DAILY_PRACTICE_KEY);
    if (!stored) {
      setHistoryData([]);
      return;
    }

    const allPractices = JSON.parse(stored);
    const goalPractices: HistoryDay[] = [];

    // Get all entries for this goal
    Object.keys(allPractices).forEach((key) => {
      if (key.startsWith(`${goal.id}_`)) {
        const practice = allPractices[key] as Partial<ManifestDailyPractice>;
        const dateStr = key.replace(`${goal.id}_`, "");
        
        goalPractices.push({
          date: dateStr,
          practiced: practice.locked || false,
          alignment: practice.alignment || 0,
          acted: practice.acted || false,
          visualization_completed: practice.visualization_completed || false,
          proofs: practice.proof_text || practice.proof_image_url ? [{
            id: `${goal.id}_${dateStr}_proof`,
            text: practice.proof_text,
            image_url: practice.proof_image_url,
            created_at: practice.created_at || new Date().toISOString(),
          }] : [],
          growth_note: practice.growth_note,
          gratitude: practice.gratitude,
          custom_act_as_if: practice.custom_act_as_if,
        });
      }
    });

    // Sort by date descending (newest first)
    goalPractices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setHistoryData(goalPractices);

    // Analytics: view_history_opened
    console.log("Analytics: view_history_opened", { manifestation_id: goal.id });
  }, [isOpen, goal.id]);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Filter data
  const filteredData = historyData.filter((day) => {
    switch (filter) {
      case "practiced":
        return day.practiced;
      case "pauses":
        return !day.practiced;
      case "with-proofs":
        return day.proofs.some(p => p.text);
      case "with-images":
        return day.proofs.some(p => p.image_url);
      default:
        return true;
    }
  });

  // Group by week
  const weekGroups: WeekGroup[] = [];
  filteredData.forEach((day) => {
    const dayDate = parseISO(day.date);
    const weekStart = startOfWeek(dayDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(dayDate, { weekStartsOn: 1 });
    
    let group = weekGroups.find(g => 
      isWithinInterval(dayDate, { start: g.weekStart, end: g.weekEnd })
    );
    
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
    const practicedDays = group.days.filter(d => d.practiced);
    group.avgAlignment = practicedDays.length > 0
      ? Math.round(practicedDays.reduce((sum, d) => sum + d.alignment, 0) / practicedDays.length * 10) / 10
      : 0;
    group.actDays = group.days.filter(d => d.acted).length;
    group.proofsCount = group.days.reduce((sum, d) => sum + d.proofs.length, 0);
  });

  // Sort weeks by start date descending
  weekGroups.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());

  // Calculate totals
  const totalDays = historyData.length;
  const totalProofs = historyData.reduce((sum, d) => sum + d.proofs.length, 0);
  const practicedDays = historyData.filter(d => d.practiced);
  const avgAlignment = practicedDays.length > 0
    ? Math.round(practicedDays.reduce((sum, d) => sum + d.alignment, 0) / practicedDays.length * 10) / 10
    : 0;
  
  // Calculate best streak
  let bestStreak = 0;
  let currentStreak = 0;
  const sortedByDateAsc = [...historyData].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
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
    console.log("Analytics: history_filter_changed", { filter: newFilter });
  };

  const handleImageClick = (imageUrl: string) => {
    setLightboxImage(imageUrl);
    console.log("Analytics: proof_image_opened", { proof_id: imageUrl });
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-drawer-title"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l border-border shadow-xl flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h2 id="history-drawer-title" className="font-semibold text-foreground">
                {goal.title}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Practicing: {totalDays} days · {totalProofs} proofs · Avg {avgAlignment}/10 · Best streak: {bestStreak}
              </p>
            </div>
            <Button
              ref={closeButtonRef}
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close history"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2 mt-3">
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
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
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
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {weekGroups.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Your practice history will appear here as you continue.
                </p>
              </div>
            ) : (
              weekGroups.map((week, weekIndex) => (
                <div key={week.weekStart.toISOString()}>
                  {/* Week Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Week of {format(week.weekStart, "MMM d")}–{format(week.weekEnd, "d")}
                    </span>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>

                  {/* Day Cards */}
                  <div className="space-y-2">
                    {week.days.map((day) => (
                      <HistoryDayCard
                        key={day.date}
                        data={day}
                        onImageClick={handleImageClick}
                        onUseAsMicroAction={onUseAsMicroAction}
                      />
                    ))}
                  </div>

                  {/* Weekly Summary */}
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Week summary:</span>{" "}
                      Avg alignment {week.avgAlignment}/10 · {week.actDays} act-as-if days · {week.proofsCount} proofs
                    </p>
                  </div>

                  {weekIndex < weekGroups.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <ProofLightbox
          imageUrl={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </>
  );
}
