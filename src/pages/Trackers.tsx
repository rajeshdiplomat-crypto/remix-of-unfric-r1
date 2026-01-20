import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  differenceInDays,
  format,
  isAfter,
  isBefore,
  isToday,
  parseISO,
  startOfWeek,
  subDays,
} from "date-fns";
import { computeEndDateForHabitDays } from "@/lib/dateUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ActivityImageUpload, loadActivityImage, saveActivityImage } from "@/components/trackers/ActivityImageUpload";
import { TrackerCard } from "@/components/trackers/TrackerCard";
import { TrackerPracticePanel } from "@/components/trackers/TrackerPracticePanel";
import { TrackerSidebarPanel } from "@/components/trackers/TrackerSidebarPanel";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageHero, PAGE_HERO_TEXT } from "@/components/common/PageHero";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";

interface ActivityItem {
  id: string;
  name: string;
  category: string;
  priority: string;
  description: string;
  frequencyPattern: boolean[];
  habitDays: number;
  startDate: string;
  completions: Record<string, boolean>;
  createdAt: string;
  notes?: Record<string, string>;
  skipped?: Record<string, boolean>;
  reminders?: { time: string; days: number[] };
  time?: string;
  duration?: number;
}

const CATEGORIES = [
  { id: "health", label: "Health & Wellness", color: "142 71% 45%" },
  { id: "growth", label: "Personal Growth", color: "262 83% 58%" },
  { id: "career", label: "Career", color: "221 83% 53%" },
  { id: "education", label: "Education", color: "25 95% 53%" },
  { id: "wellbeing", label: "Wellbeing", color: "339 81% 51%" },
];

const PRIORITIES = ["Low", "Medium", "High"];
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const SAMPLE_ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    name: "30-Day Fitness Challenge",
    category: "health",
    priority: "High",
    description: "Daily workout routine",
    frequencyPattern: [true, true, true, true, true, false, false],
    habitDays: 22,
    startDate: format(addDays(new Date(), -10), "yyyy-MM-dd"),
    completions: {
      [format(addDays(new Date(), -10), "yyyy-MM-dd")]: true,
      [format(addDays(new Date(), -8), "yyyy-MM-dd")]: true,
      [format(addDays(new Date(), -7), "yyyy-MM-dd")]: true,
      [format(addDays(new Date(), -6), "yyyy-MM-dd")]: true,
      [format(addDays(new Date(), -4), "yyyy-MM-dd")]: true,
      [format(addDays(new Date(), -3), "yyyy-MM-dd")]: true,
      [format(addDays(new Date(), -2), "yyyy-MM-dd")]: true,
      [format(addDays(new Date(), -1), "yyyy-MM-dd")]: true,
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Read 'Atomic Habits'",
    category: "growth",
    priority: "Medium",
    description: "Read 20 pages daily",
    frequencyPattern: [true, true, true, true, true, true, true],
    habitDays: 30,
    startDate: format(addDays(new Date(), -30), "yyyy-MM-dd"),
    completions: Object.fromEntries(
      Array.from({ length: 28 }, (_, i) => [format(addDays(new Date(), -30 + i), "yyyy-MM-dd"), true]),
    ),
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Spanish Level 1",
    category: "education",
    priority: "Medium",
    description: "Language learning",
    frequencyPattern: [true, true, true, true, true, false, false],
    habitDays: 44,
    startDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    completions: {},
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Digital Detox",
    category: "wellbeing",
    priority: "High",
    description: "No social media after 8pm",
    frequencyPattern: [true, true, true, true, true, true, true],
    habitDays: 7,
    startDate: format(addDays(new Date(), -5), "yyyy-MM-dd"),
    completions: {
      [format(addDays(new Date(), -5), "yyyy-MM-dd")]: true,
      [format(addDays(new Date(), -4), "yyyy-MM-dd")]: true,
      [format(addDays(new Date(), -3), "yyyy-MM-dd")]: true,
      [format(addDays(new Date(), -2), "yyyy-MM-dd")]: true,
      [format(addDays(new Date(), -1), "yyyy-MM-dd")]: true,
      [format(new Date(), "yyyy-MM-dd")]: true,
    },
    createdAt: new Date().toISOString(),
  },
];

export default function Trackers() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);

  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // form
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("health");
  const [formPriority, setFormPriority] = useState("Medium");
  const [formDescription, setFormDescription] = useState("");
  const [formFrequency, setFormFrequency] = useState([true, true, true, true, true, false, false]);
  const [formDays, setFormDays] = useState(30);
  const [formStartDate, setFormStartDate] = useState<Date>(new Date());
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null);
  const [formTime, setFormTime] = useState("09:00");
  const [formDuration, setFormDuration] = useState(30);
  const [formAddToTasks, setFormAddToTasks] = useState(false);

  useEffect(() => {
    if (!user) {
      setActivities(SAMPLE_ACTIVITIES);
      setLoading(false);
      return;
    }
    fetchHabits();
  }, [user]);

  const fetchHabits = async () => {
    if (!user) return;
    setLoading(true);

    const { data: habitsData, error: habitsError } = await supabase.from("habits").select("*").eq("user_id", user.id);

    const { data: completionsData, error: completionsError } = await supabase
      .from("habit_completions")
      .select("*")
      .eq("user_id", user.id);

    if (habitsError || completionsError) {
      console.error("Error fetching habits:", habitsError || completionsError);
      setActivities(SAMPLE_ACTIVITIES);
      setLoading(false);
      return;
    }

    const transformedActivities: ActivityItem[] = (habitsData || []).map((habit) => {
      const habitCompletions = (completionsData || [])
        .filter((c) => c.habit_id === habit.id)
        .reduce(
          (acc, c) => {
            acc[c.completed_date] = true;
            return acc;
          },
          {} as Record<string, boolean>,
        );

      const targetDays = habit.target_days || [1, 2, 3, 4, 5, 6, 7];
      const frequencyPattern = [1, 2, 3, 4, 5, 6, 7].map((d) => targetDays.includes(d));

      return {
        id: habit.id,
        name: habit.name,
        category: "health",
        priority: "Medium",
        description: habit.description || "",
        frequencyPattern,
        habitDays: 30,
        startDate: format(new Date(habit.created_at), "yyyy-MM-dd"),
        completions: habitCompletions,
        createdAt: habit.created_at,
      };
    });

    setActivities(transformedActivities.length === 0 ? SAMPLE_ACTIVITIES : transformedActivities);
    setLoading(false);
  };

  const getEndDate = (activity: ActivityItem) =>
    computeEndDateForHabitDays(parseISO(activity.startDate), activity.frequencyPattern, activity.habitDays);

  const getStatus = (activity: ActivityItem): "active" | "completed" | "upcoming" => {
    const today = new Date();
    const startDate = parseISO(activity.startDate);
    const endDate = getEndDate(activity);
    if (isBefore(today, startDate)) return "upcoming";
    if (isAfter(today, endDate)) return "completed";
    return "active";
  };

  const getScheduledSessions = (activity: ActivityItem) => {
    let count = 0;
    const startDate = parseISO(activity.startDate);
    const endDate = getEndDate(activity);

    let currentDate = startDate;
    while (!isAfter(currentDate, endDate)) {
      const dayOfWeek = (currentDate.getDay() + 6) % 7;
      if (activity.frequencyPattern[dayOfWeek]) count++;
      currentDate = addDays(currentDate, 1);
    }
    return count;
  };

  const isPlannedForDate = (activity: ActivityItem, date: Date) => {
    const startDate = parseISO(activity.startDate);
    const endDate = getEndDate(activity);
    if (isBefore(date, startDate) || isAfter(date, endDate)) return false;
    const dayOfWeek = (date.getDay() + 6) % 7;
    return activity.frequencyPattern[dayOfWeek];
  };

  const toggleCompletion = async (activityId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;

    const wasCompleted = activity.completions[dateStr];
    const nowCompleted = !wasCompleted;

    setActivities((prev) =>
      prev.map((a) => {
        if (a.id !== activityId) return a;
        const next = { ...a.completions };
        if (next[dateStr]) delete next[dateStr];
        else next[dateStr] = true;
        return { ...a, completions: next };
      }),
    );

    if (user) {
      if (wasCompleted) {
        await supabase
          .from("habit_completions")
          .delete()
          .eq("habit_id", activityId)
          .eq("user_id", user.id)
          .eq("completed_date", dateStr);
      } else {
        await supabase.from("habit_completions").insert({
          habit_id: activityId,
          user_id: user.id,
          completed_date: dateStr,
        });
      }

      // Sync linked task
      const { data: linkedTasks } = await supabase
        .from("tasks")
        .select("id")
        .eq("user_id", user.id)
        .eq("title", activity.name)
        .eq("due_date", dateStr)
        .contains("tags", ["Habit"]);

      if (linkedTasks && linkedTasks.length > 0) {
        await supabase
          .from("tasks")
          .update({
            is_completed: nowCompleted,
            completed_at: nowCompleted ? new Date().toISOString() : null,
          })
          .in(
            "id",
            linkedTasks.map((t) => t.id),
          );
      }
    }
  };

  const openCreateDialog = () => {
    setEditingActivity(null);
    setFormName("");
    setFormCategory("health");
    setFormPriority("Medium");
    setFormDescription("");
    setFormFrequency([true, true, true, true, true, false, false]);
    setFormDays(30);
    setFormStartDate(new Date());
    setFormImageUrl(null);
    setFormTime("09:00");
    setFormDuration(30);
    setFormAddToTasks(true);
    setDialogOpen(true);
  };

  const openEditDialog = (activity: ActivityItem) => {
    setEditingActivity(activity);
    setFormName(activity.name);
    setFormCategory(activity.category);
    setFormPriority(activity.priority);
    setFormDescription(activity.description);
    setFormFrequency([...activity.frequencyPattern]);
    setFormDays(activity.habitDays);
    setFormStartDate(parseISO(activity.startDate));
    setFormImageUrl(loadActivityImage(activity.id));
    setFormTime(activity.time || "09:00");
    setFormDuration(activity.duration || 30);
    setFormAddToTasks(false);
    setDialogOpen(true);
  };

  const selectActivity = (activity: ActivityItem) => {
    const current = activities.find((a) => a.id === activity.id);
    setSelectedActivity(current || activity);
  };

  const handleSkipDay = (activityId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setActivities((prev) =>
      prev.map((a) => {
        if (a.id !== activityId) return a;
        const skipped = { ...(a.skipped || {}), [dateStr]: true };
        return { ...a, skipped };
      }),
    );
    toast({ title: "Day skipped" });
  };

  const handleImageChange = (activityId: string, imageUrl: string | null) => {
    saveActivityImage(activityId, imageUrl);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;

    const tempActivity: ActivityItem = {
      id: editingActivity?.id || crypto.randomUUID(),
      name: formName,
      category: formCategory,
      priority: formPriority,
      description: formDescription,
      frequencyPattern: formFrequency,
      habitDays: formDays,
      startDate: format(formStartDate, "yyyy-MM-dd"),
      completions: editingActivity?.completions || {},
      createdAt: editingActivity?.createdAt || new Date().toISOString(),
      skipped: editingActivity?.skipped || {},
      notes: editingActivity?.notes || {},
      time: formTime,
      duration: formDuration,
    };

    const scheduledSessions = getScheduledSessions(tempActivity);

    if (formImageUrl) saveActivityImage(tempActivity.id, formImageUrl);

    setActivities((prev) => {
      if (editingActivity) return prev.map((a) => (a.id === editingActivity.id ? tempActivity : a));
      return [tempActivity, ...prev];
    });

    if (user) {
      const targetDays = formFrequency
        .map((selected, idx) => (selected ? idx + 1 : null))
        .filter((d): d is number => d !== null);

      const { error } = await supabase.from("habits").upsert({
        id: tempActivity.id,
        user_id: user.id,
        name: tempActivity.name,
        description: tempActivity.description || null,
        frequency: "custom",
        target_days: targetDays,
      });

      if (error) {
        toast({ title: "Sync failed", description: error.message, variant: "destructive" });
        return;
      }

      // Create tasks for each scheduled day if enabled
      if (formAddToTasks && !editingActivity) {
        const scheduledDates: Date[] = [];
        let checkDate = formStartDate;
        let count = 0;
        const endDate = computeEndDateForHabitDays(formStartDate, formFrequency, formDays);

        while (!isAfter(checkDate, endDate) && count < formDays) {
          const dayOfWeek = (checkDate.getDay() + 6) % 7;
          if (formFrequency[dayOfWeek]) {
            scheduledDates.push(new Date(checkDate));
            count++;
          }
          checkDate = addDays(checkDate, 1);
        }

        const tasks = scheduledDates.map((date) => ({
          id: crypto.randomUUID(),
          user_id: user.id,
          title: `${tempActivity.name}`,
          description: tempActivity.description || null,
          due_date: format(date, "yyyy-MM-dd"),
          due_time: formTime,
          priority: formPriority.toLowerCase(),
          urgency: "low",
          importance: formPriority === "High" ? "high" : "low",
          time_of_day:
            parseInt(formTime.split(":")[0]) < 12
              ? "morning"
              : parseInt(formTime.split(":")[0]) < 17
                ? "afternoon"
                : "evening",
          is_completed: false,
          tags: ["Habit", formCategory],
        }));

        if (tasks.length > 0) {
          await supabase.from("tasks").insert(tasks as any);
        }
      }
    }

    const tasksMessage = formAddToTasks && !editingActivity ? ` + ${scheduledSessions} tasks added` : "";
    toast({
      title: editingActivity ? "Activity updated" : "Activity created",
      description: `${scheduledSessions} habit sessions scheduled${tasksMessage}`,
    });
    setDialogOpen(false);
  };

  const handleDelete = async (activityId: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== activityId));
    if (selectedActivity?.id === activityId) setSelectedActivity(null);

    if (user) {
      await supabase.from("habit_completions").delete().eq("habit_id", activityId).eq("user_id", user.id);
      await supabase.from("habits").delete().eq("id", activityId).eq("user_id", user.id);
    }

    toast({ title: "Activity deleted" });
  };

  // Filter activities
  const activeActivities = useMemo(() => {
    return activities.filter((a) => getStatus(a) === "active" || getStatus(a) === "upcoming");
  }, [activities]);

  const completedActivities = useMemo(() => {
    return activities.filter((a) => getStatus(a) === "completed");
  }, [activities]);

  const currentSelectedActivity = selectedActivity
    ? activities.find((a) => a.id === selectedActivity.id) || null
    : null;

  if (loading) {
    return <PageLoadingScreen module="trackers" />;
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col w-full flex-1">
        {/* Hero */}
        <PageHero
          storageKey="tracker_hero_src"
          typeKey="tracker_hero_type"
          badge={PAGE_HERO_TEXT.trackers.badge}
          title={PAGE_HERO_TEXT.trackers.title}
          subtitle={PAGE_HERO_TEXT.trackers.subtitle}
        />

        {/* 3-Column Layout */}
        <div
          className={cn(
            "grid gap-6 px-6 lg:px-8 pt-6 flex-1",
            rightPanelCollapsed
              ? "grid-cols-1 lg:grid-cols-[420px_1fr_64px]"
              : "grid-cols-1 lg:grid-cols-[420px_1fr_260px]",
          )}
        >
          {/* LEFT PANEL - Activity Cards */}
          <div className="flex flex-col gap-4 min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Your Activities</h2>
              <Button
                size="sm"
                onClick={openCreateDialog}
                className="h-9 rounded-xl gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md"
              >
                <Plus className="h-4 w-4" />
                New
              </Button>
            </div>

            {/* Activity Cards List */}
            <ScrollArea className="flex-1 -mx-1 px-1">
              <div className="space-y-3 pb-4">
                {activeActivities.map((activity) => (
                  <TrackerCard
                    key={activity.id}
                    activity={activity}
                    isSelected={selectedActivity?.id === activity.id}
                    onClick={() => selectActivity(activity)}
                    onEdit={() => openEditDialog(activity)}
                    onDelete={() => handleDelete(activity.id)}
                    onImageUpdate={fetchHabits}
                  />
                ))}

                {activeActivities.length === 0 && (
                  <Card className="rounded-xl p-8 text-center border-dashed border-2 border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">No active activities</p>
                    <Button size="sm" className="rounded-xl" onClick={openCreateDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Activity
                    </Button>
                  </Card>
                )}

                {/* Completed Section */}
                {completedActivities.length > 0 && (
                  <div className="pt-4">
                    <button
                      onClick={() => setShowCompleted(!showCompleted)}
                      className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors w-full"
                    >
                      {showCompleted ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      Completed Activities ({completedActivities.length})
                    </button>

                    {showCompleted && (
                      <div className="space-y-3 mt-3">
                        {completedActivities.map((activity) => (
                          <TrackerCard
                            key={activity.id}
                            activity={activity}
                            isSelected={selectedActivity?.id === activity.id}
                            onClick={() => selectActivity(activity)}
                            onEdit={() => openEditDialog(activity)}
                            onDelete={() => handleDelete(activity.id)}
                            isCompleted
                            onImageUpdate={fetchHabits}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* CENTER PANEL - Practice Panel */}
          <div className="hidden lg:block min-h-0">
            <Card className="h-full rounded-2xl overflow-hidden border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
              <TrackerPracticePanel
                activity={currentSelectedActivity}
                selectedDate={selectedDate}
                onClose={() => setSelectedActivity(null)}
                onEdit={openEditDialog}
                onToggleCompletion={toggleCompletion}
                onSkipDay={handleSkipDay}
                onImageChange={handleImageChange}
                userName={user?.email?.split("@")[0] || "there"}
              />
            </Card>
          </div>

          {/* RIGHT SIDEBAR - Stats + Calendar */}
          <aside className="hidden lg:block min-h-0">
            <Card
              className={cn(
                "h-full rounded-2xl overflow-hidden border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50",
                rightPanelCollapsed ? "w-16" : "w-full",
              )}
            >
              <TrackerSidebarPanel
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                activities={activities}
                isCollapsed={rightPanelCollapsed}
                onToggleCollapse={() => setRightPanelCollapsed(!rightPanelCollapsed)}
              />
            </Card>
          </aside>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle>{editingActivity ? "Edit Activity" : "Create New Activity"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Activity Name</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. 30 Minutes Reading"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Priority</label>
                  <Select value={formPriority} onValueChange={setFormPriority}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal rounded-xl h-10"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formStartDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formStartDate}
                        onSelect={(date) => date && setFormStartDate(date)}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Habit Days</label>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={formDays}
                    onChange={(e) => setFormDays(parseInt(e.target.value) || 30)}
                    className="rounded-xl"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Number of measured habit occurrences</p>
                  <p className="text-[11px] text-primary font-medium mt-1">
                    End: {format(computeEndDateForHabitDays(formStartDate, formFrequency, formDays), "d MMM, yyyy")}
                  </p>
                </div>
              </div>

              {/* Time Scheduling */}
              <div>
                <label className="text-sm font-medium mb-2 block">Scheduled Time</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Start time</p>
                    <div className="relative">
                      <input
                        type="time"
                        value={formTime}
                        onChange={(e) => setFormTime(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Duration</p>
                    <Select value={String(formDuration)} onValueChange={(v) => setFormDuration(Number(v))}>
                      <SelectTrigger className="rounded-xl h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5">End time</p>
                    <div className="h-10 px-3 rounded-xl border border-input bg-muted/30 flex items-center text-sm text-muted-foreground">
                      {(() => {
                        const [h, m] = formTime.split(":").map(Number);
                        const endMinutes = h * 60 + m + formDuration;
                        const endH = Math.floor(endMinutes / 60) % 24;
                        const endM = endMinutes % 60;
                        return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Why is this activity important to you?"
                  rows={2}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Cover Image (optional)</label>
                <ActivityImageUpload imageUrl={formImageUrl} onImageChange={setFormImageUrl} compact />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Frequency Pattern</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select the days you plan to perform this activity.
                </p>

                <div className="flex gap-2 flex-wrap">
                  {DAY_LABELS.map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const next = [...formFrequency];
                        next[idx] = !next[idx];
                        setFormFrequency(next);
                      }}
                      className={cn(
                        "h-9 w-9 rounded-full font-medium text-sm transition-colors",
                        formFrequency[idx]
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted-foreground/15",
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  {formFrequency.filter(Boolean).length} days/week → {formDays} habit sessions
                </p>
              </div>

              {/* Add to Tasks toggle */}
              {!editingActivity && (
                <div
                  className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => setFormAddToTasks(!formAddToTasks)}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">Add to Tasks page</p>
                    <p className="text-xs text-muted-foreground">
                      Create time-blocked tasks for each scheduled day
                    </p>
                  </div>
                  <Checkbox
                    checked={formAddToTasks}
                    onCheckedChange={(checked) => setFormAddToTasks(!!checked)}
                    className="h-5 w-5"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl border-border/50 hover:bg-muted/60 transition-all"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                  onClick={handleSave}
                  disabled={!formName.trim()}
                >
                  {editingActivity ? "Save Changes" : "Create Activity"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
