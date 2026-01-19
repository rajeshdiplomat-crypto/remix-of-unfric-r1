import { useState, useEffect, useRef, useMemo } from "react";
import { X, Clock, ChevronDown, ChevronUp, Sparkles, TrendingUp, Camera, Image } from "lucide-react";
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

const ENTRIES_PER_PAGE = 5;

export function HistoryDrawer({ goal, isOpen, onClose, onUseAsMicroAction }: HistoryDrawerProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<HistoryDay[]>([]);
  const [visibleCount, setVisibleCount] = useState(ENTRIES_PER_PAGE);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

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

    Object.keys(allPractices).forEach((key) => {
      if (key.startsWith(`${goal.id}_`)) {
        const practice = allPractices[key] as Partial<ManifestDailyPractice>;
        const dateStr = key.replace(`${goal.id}_`, "");
        
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

    // Sort by date descending
    goalPractices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setHistoryData(goalPractices);
    setVisibleCount(ENTRIES_PER_PAGE);
    // Expand the first week by default
    if (goalPractices.length > 0) {
      const firstDate = parseISO(goalPractices[0].date);
      const firstWeekStart = startOfWeek(firstDate, { weekStartsOn: 1 });
      setExpandedWeeks(new Set([firstWeekStart.toISOString()]));
    }
  }, [isOpen, goal.id]);

  // Filter data
  const filteredData = useMemo(() => {
    return historyData.filter((day) => {
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
  }, [historyData, filter]);

  // Group by week
  const weekGroups = useMemo<WeekGroup[]>(() => {
    const groups: WeekGroup[] = [];
    
    filteredData.forEach((day) => {
      const dayDate = parseISO(day.date);
      const weekStart = startOfWeek(dayDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(dayDate, { weekStartsOn: 1 });
      
      let group = groups.find(g => 
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
        groups.push(group);
      }
      
      group.days.push(day);
    });

    // Calculate week summaries
    groups.forEach((group) => {
      const practicedDays = group.days.filter(d => d.practiced);
      group.avgAlignment = practicedDays.length > 0
        ? Math.round(practicedDays.reduce((sum, d) => sum + d.alignment, 0) / practicedDays.length * 10) / 10
        : 0;
      group.actDays = group.days.filter(d => d.acts.length > 0).length;
      group.proofsCount = group.days.reduce((sum, d) => sum + d.proofs.length, 0);
    });

    // Sort weeks by start date descending
    groups.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());

    return groups;
  }, [filteredData]);

  // Calculate totals
  const stats = useMemo(() => {
    const totalDays = historyData.length;
    const totalProofs = historyData.reduce((sum, d) => sum + d.proofs.length, 0);
    const totalImages = historyData.reduce((sum, d) => sum + d.proofs.filter(p => p.image_url).length, 0);
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

    return { totalDays, totalProofs, totalImages, avgAlignment, bestStreak, practicedCount: practicedDays.length };
  }, [historyData]);

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setVisibleCount(ENTRIES_PER_PAGE);
  };

  const handleImageClick = (imageUrl: string) => {
    setLightboxImage(imageUrl);
  };

  const toggleWeek = (weekKey: string) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekKey)) {
        next.delete(weekKey);
      } else {
        next.add(weekKey);
      }
      return next;
    });
  };

  const loadMore = () => {
    setVisibleCount((prev) => prev + ENTRIES_PER_PAGE);
  };

  // Get visible weeks (limit entries shown)
  let displayedEntryCount = 0;
  const visibleWeekGroups = weekGroups.filter((week) => {
    if (displayedEntryCount >= visibleCount) return false;
    displayedEntryCount += week.days.length;
    return true;
  });

  const hasMore = displayedEntryCount < filteredData.length;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border/50 bg-gradient-to-r from-teal-50/80 to-cyan-50/80 dark:from-teal-900/20 dark:to-cyan-900/20 flex-shrink-0">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-teal-500" />
                  <h2 className="font-semibold text-foreground text-lg">Practice History</h2>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">{goal.title}</p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white/90 dark:bg-slate-800/90 rounded-lg p-2 text-center shadow-sm">
                <p className="text-xl font-bold text-teal-600">{stats.practicedCount}</p>
                <p className="text-[10px] text-muted-foreground">Days</p>
              </div>
              <div className="bg-white/90 dark:bg-slate-800/90 rounded-lg p-2 text-center shadow-sm">
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <p className="text-xl font-bold text-orange-500">{stats.bestStreak}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">Best Streak</p>
              </div>
              <div className="bg-white/90 dark:bg-slate-800/90 rounded-lg p-2 text-center shadow-sm">
                <div className="flex items-center justify-center gap-1">
                  <Camera className="h-4 w-4 text-purple-500" />
                  <p className="text-xl font-bold text-purple-600">{stats.totalProofs}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">Proofs</p>
              </div>
              <div className="bg-white/90 dark:bg-slate-800/90 rounded-lg p-2 text-center shadow-sm">
                <div className="flex items-center justify-center gap-1">
                  <Image className="h-4 w-4 text-cyan-500" />
                  <p className="text-xl font-bold text-cyan-600">{stats.totalImages}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">Photos</p>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {[
                { key: "all" as FilterType, label: "All" },
                { key: "practiced" as FilterType, label: "Completed" },
                { key: "with-proofs" as FilterType, label: "With Proofs" },
                { key: "with-images" as FilterType, label: "With Photos" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleFilterChange(key)}
                  className={`px-2.5 py-1 text-xs rounded-full transition-all ${
                    filter === key
                      ? "bg-teal-500 text-white shadow-sm"
                      : "bg-white dark:bg-slate-800 text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700 border border-border"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Content */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 space-y-3">
              {visibleWeekGroups.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Your practice history will appear here as you continue.
                  </p>
                </div>
              ) : (
                <>
                  {visibleWeekGroups.map((week) => {
                    const weekKey = week.weekStart.toISOString();
                    const isExpanded = expandedWeeks.has(weekKey);

                    return (
                      <div key={weekKey} className="bg-white dark:bg-slate-800 rounded-xl border border-border/50 overflow-hidden shadow-sm">
                        {/* Week Header - Collapsible */}
                        <button
                          onClick={() => toggleWeek(weekKey)}
                          className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {format(week.weekStart, "MMM d")} – {format(week.weekEnd, "MMM d")}
                            </span>
                            <Badge variant="secondary" className="text-[10px] h-5">
                              {week.days.filter(d => d.practiced).length}/{week.days.length} days
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {week.proofsCount} proofs
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {/* Day Cards */}
                        {isExpanded && (
                          <div className="border-t border-border/30 p-3 space-y-2">
                            {week.days.map((day) => (
                              <HistoryDayCard
                                key={day.date}
                                data={day}
                                onImageClick={handleImageClick}
                                onUseAsMicroAction={onUseAsMicroAction}
                              />
                            ))}

                            {/* Weekly Summary */}
                            <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                              <p className="text-[10px] text-muted-foreground text-center">
                                Week avg: {week.avgAlignment}/10 alignment · {week.actDays} action days · {week.proofsCount} proofs
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Load More Button */}
                  {hasMore && (
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      className="w-full rounded-xl"
                      size="sm"
                    >
                      Load More ({filteredData.length - displayedEntryCount} remaining)
                    </Button>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

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
