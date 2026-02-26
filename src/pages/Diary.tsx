import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PenLine, Search, ChevronDown, Filter } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DiaryFeedCard } from "@/components/diary/DiaryFeedCard";
import { DiaryLeftSidebar } from "@/components/diary/DiaryLeftSidebar";

import { DiaryProfileCard } from "@/components/diary/DiaryProfileCard";
import { DiaryMobileInsightsSidebar } from "@/components/diary/DiaryMobileInsightsSidebar";
import { PageHero, PAGE_HERO_TEXT } from "@/components/common/PageHero";

import { DiaryJournalModal } from "@/components/diary/DiaryJournalModal";
import { useFeedEvents } from "@/components/diary/useFeedEvents";
import { useDiaryMetrics } from "@/components/diary/useDiaryMetrics";

import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";
import type { TimeRange, FeedEvent, SourceModule } from "@/components/diary/types";
import { extractImagesFromHTML, extractImagesFromTiptapJSON } from "@/lib/editorUtils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_QUESTIONS } from "@/components/journal/types";

type TimeFilter = 'all_time' | 'today' | 'yesterday' | 'last_week';
type SortOption = 'latest' | 'oldest' | 'most_active';

const FILTER_TABS = [
  { value: "all", label: "All" },
  { value: "emotions", label: "Emotions" },
  { value: "journal", label: "Journal" },
  { value: "manifest", label: "Manifest" },
  { value: "trackers", label: "Habits" },
  { value: "notes", label: "Notes" },
  { value: "tasks", label: "Tasks" },
];

const TIME_FILTER_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: "all_time", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_week", label: "Last Week" },
];

export default function Diary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all_time');
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

  const {
    events,
    reactions,
    comments,
    saves,
    loading,
    filter,
    setFilter,
    toggleReaction,
    addComment,
    editComment,
    deleteComment,
    toggleSave,
    refetch,
  } = useFeedEvents(user?.id);

  const { metrics } = useDiaryMetrics(user?.id, timeRange);

  // Seed feed events from existing data
  const seedFeedEvents = async () => {
    if (!user?.id) return;

    try {
      await supabase.functions.invoke("manage-diary", {
        body: { action: "seed_feed_events" }
      });
      refetch();
    } catch (err) {
      console.error("Error seeding feed events:", err);
    }
  };

  // Seed feed events on mount
  useEffect(() => {
    if (!user?.id) return;
    seedFeedEvents();
  }, [user?.id]);

  // Real-time subscriptions for tasks and habits
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("diary-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${user.id}` }, () => {
        seedFeedEvents();
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habits", filter: `user_id=eq.${user.id}` },
        () => {
          seedFeedEvents();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habit_completions", filter: `user_id=eq.${user.id}` },
        () => {
          seedFeedEvents();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleNavigateToSource = (event: FeedEvent) => {
    switch (event.source_module) {
      case "tasks":
        navigate("/tasks");
        break;
      case "journal":
        navigate("/journal");
        break;
      case "notes":
        navigate("/notes");
        break;
      case "trackers":
        navigate("/habits");
        break;
      case "manifest":
        navigate("/manifest");
        break;
      case "emotions":
        navigate("/emotions");
        break;
      default:
        break;
    }
  };


  const handleJournalSuccess = () => {
    seedFeedEvents();
  };

  // Filter events based on search and time filter
  const filteredEvents = events.filter((event) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = event.title.toLowerCase().includes(query) ||
        event.content_preview?.toLowerCase().includes(query) ||
        event.summary?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    // Time filter
    if (timeFilter !== 'all_time') {
      const eventDate = new Date(event.created_at);
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart.getTime() - 86400000);
      const lastWeekStart = new Date(todayStart.getTime() - 7 * 86400000);

      if (timeFilter === 'today' && eventDate < todayStart) return false;
      if (timeFilter === 'yesterday' && (eventDate < yesterdayStart || eventDate >= todayStart)) return false;
      if (timeFilter === 'last_week' && eventDate < lastWeekStart) return false;
    }
    return true;
  });

  // Sort events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortOption === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    if (sortOption === 'most_active') {
      // Sort by reaction/comment count (most interactions first)
      const aActivity = (reactions[a.id]?.length || 0) + (comments[a.id]?.length || 0);
      const bActivity = (reactions[b.id]?.length || 0) + (comments[b.id]?.length || 0);
      return bActivity - aActivity;
    }
    // Default: latest first
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const [loadingFinished, setLoadingFinished] = useState(false);
  const [mobileInsightsOpen, setMobileInsightsOpen] = useState(false);
  const userName = user?.email?.split("@")[0] || "User";
  const displayInitials = (userName.charAt(0).toUpperCase() + userName.slice(1)).slice(0, 2).toUpperCase();

  // Fetch avatar from profiles table
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | undefined>(user?.user_metadata?.avatar_url);
  useEffect(() => {
    if (!user?.id) return;
    supabase.functions.invoke("manage-settings", { body: { action: "fetch_profile" } }).then(({ data: res }) => {
      if (res?.data?.avatar_url) setProfileAvatarUrl(res.data.avatar_url);
    });
  }, [user?.id]);

  // Edge-swipe gesture: detect swipe from right edge
  const swipeRef = useRef<{ startX: number; startY: number; active: boolean }>({ startX: 0, startY: 0, active: false });

  useEffect(() => {
    const EDGE_ZONE = 30; // px from right edge
    const handleTouchStart = (e: TouchEvent) => {
      const x = e.touches[0].clientX;
      const screenW = window.innerWidth;
      if (screenW >= 768) return; // mobile only
      if (x >= screenW - EDGE_ZONE) {
        swipeRef.current = { startX: x, startY: e.touches[0].clientY, active: true };
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!swipeRef.current.active) return;
      const dx = swipeRef.current.startX - e.touches[0].clientX;
      const dy = Math.abs(e.touches[0].clientY - swipeRef.current.startY);
      if (dy > 50) { swipeRef.current.active = false; return; }
      if (dx > 50) {
        swipeRef.current.active = false;
        setMobileInsightsOpen(true);
      }
    };
    const handleTouchEnd = () => { swipeRef.current.active = false; };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  const isDataReady = !loading || events.length > 0;

  return (
    <>
      {!loadingFinished && (
        <PageLoadingScreen
          module="diary"
          isDataReady={isDataReady}
          onFinished={() => setLoadingFinished(true)}
        />
      )}
      <div
        className="flex flex-col w-full h-full overflow-hidden"
        style={{ background: "linear-gradient(180deg, #EEF2F7 0%, #E8EEF6 100%)" }}
      >
        {/* Full-width Hero */}
        <PageHero
          storageKey="diary_hero_src"
          typeKey="diary_hero_type"
          badge={PAGE_HERO_TEXT.diary.badge}
          title={PAGE_HERO_TEXT.diary.title}
          subtitle={PAGE_HERO_TEXT.diary.subtitle}
        />

        {/* 3-Column Layout Below Hero */}
        <div className="flex flex-1 w-full max-w-[1400px] mx-auto overflow-hidden min-h-0">
          {/* Left Sidebar - Editorial style */}
          <aside className="hidden md:flex flex-col w-[280px] lg:w-[380px] shrink-0 h-full min-h-0 overflow-y-auto" style={{ borderRight: "1px solid #E5EAF2" }}>
            <DiaryLeftSidebar
              userName={userName}
              filter={filter}
              onFilterChange={setFilter}
            />
          </aside>

          {/* Center Feed - Scrollable */}
          <main className="flex-1 min-w-0 min-h-0 h-full overflow-y-auto bg-muted/20 rounded-2xl">
            <div className="w-full px-2 sm:px-4 lg:px-6 py-3 sm:py-4">

              {/* Search Bar with Profile Icon on mobile */}
              <div className="mb-4 flex items-center gap-2">
                <button
                  onClick={() => setMobileInsightsOpen(true)}
                  className="md:hidden shrink-0 rounded-full hover:ring-2 hover:ring-primary/30 transition-all"
                  aria-label="Open profile & performance"
                >
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={profileAvatarUrl} alt={userName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                      {displayInitials}
                    </AvatarFallback>
                  </Avatar>
                </button>
                <div className="flex items-center gap-2 rounded-[14px] px-3 py-1 flex-1 md:max-w-none" style={{ background: "#F8FAFC", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)" }}>
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="Search your feed..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 bg-transparent focus-visible:ring-0 px-0 h-7 md:h-9 text-xs md:text-sm placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 mb-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ borderBottom: "1px solid #E5EAF2" }}>
                {FILTER_TABS.map((tab) => (
                  <Button
                    key={tab.value}
                    variant={filter === tab.value ? "chipActive" : "chip"}
                    size="chip"
                    onClick={() => setFilter(tab.value as SourceModule | "all" | "saved")}
                  >
                    {tab.label}
                  </Button>
                ))}

                {/* Time Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="chip" size="chip" className="ml-auto">
                      <Filter className="h-3 w-3 mr-1" />
                      {TIME_FILTER_OPTIONS.find(o => o.value === timeFilter)?.label || 'All Time'}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {TIME_FILTER_OPTIONS.map(opt => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => setTimeFilter(opt.value)}
                        className={timeFilter === opt.value ? "bg-muted font-medium" : ""}
                      >
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="chip" size="chip">
                      {sortOption === 'latest' ? 'Latest' : sortOption === 'oldest' ? 'Oldest' : 'Most Active'}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortOption('latest')} className={sortOption === 'latest' ? "bg-muted font-medium" : ""}>
                      Latest
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOption('oldest')} className={sortOption === 'oldest' ? "bg-muted font-medium" : ""}>
                      Oldest
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOption('most_active')} className={sortOption === 'most_active' ? "bg-muted font-medium" : ""}>
                      Most Active
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Feed Cards */}
              {sortedEvents.length === 0 ? (
                <Card className="p-12 text-center border-0" style={{ background: "#FFFFFF", borderRadius: "18px", boxShadow: "0px 10px 35px rgba(15, 23, 42, 0.07)" }}>
                  <PenLine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground">No entries yet</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Start journaling, adding tasks, or notes to see them here.
                  </p>
                </Card>
              ) : (
                <div className="pb-16 space-y-4">
                  {sortedEvents.map((event) => (
                    <DiaryFeedCard
                      key={event.id}
                      event={event}
                      reactions={reactions[event.id] || []}
                      comments={comments[event.id] || []}
                      isSaved={saves.has(event.id)}
                      currentUserId={user?.id || ""}
                      onToggleReaction={toggleReaction}
                      onAddComment={addComment}
                      onEditComment={editComment}
                      onDeleteComment={deleteComment}
                      onToggleSave={toggleSave}
                      onNavigateToSource={handleNavigateToSource}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="hidden lg:flex flex-col w-[280px] xl:w-[340px] shrink-0 h-full min-h-0 overflow-y-auto border-l border-border/10 p-4 gap-4" style={{ background: "transparent" }}>
            <DiaryProfileCard
              userName={userName}
              userEmail={user?.email || ""}
              avatarUrl={profileAvatarUrl}
              metrics={metrics}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          </aside>
        </div>

        {/* Journal Modal */}
        <DiaryJournalModal
          open={isJournalModalOpen}
          onOpenChange={setIsJournalModalOpen}
          onSuccess={handleJournalSuccess}
        />

        {/* Mobile Edge-Swipe Insights Sidebar */}
        <DiaryMobileInsightsSidebar
          open={mobileInsightsOpen}
          onClose={() => setMobileInsightsOpen(false)}
          userName={userName}
          userEmail={user?.email || ""}
          avatarUrl={profileAvatarUrl}
          metrics={metrics}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      </div>
    </>
  );
}
