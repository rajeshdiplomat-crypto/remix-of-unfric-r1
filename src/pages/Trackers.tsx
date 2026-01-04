import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  differenceInDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import { computeEndDateForHabitDays, getScheduledDates } from "@/lib/dateUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Activity as ActivityIcon,
  BarChart2,
  Calendar as CalendarIcon,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Flame,
  LayoutGrid,
  Lightbulb,
  List,
  MoreVertical,
  Plus,
  Target,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { BarChart, Bar, ResponsiveContainer } from "recharts";
import { ActivityImageUpload, loadActivityImage, saveActivityImage } from "@/components/trackers/ActivityImageUpload";
import { ActivityDetailPanel } from "@/components/trackers/ActivityDetailPanel";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageHero, PAGE_HERO_TEXT } from "@/components/common/PageHero";
import { getPresetImage } from "@/lib/presetImages";

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
const FULL_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

type ViewMode = "week" | "compact" | "heatmap";

export default function Trackers() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);

  const [selectedWeekStart, setSelectedWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  // form
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("health");
  const [formPriority, setFormPriority] = useState("Medium");
  const [formDescription, setFormDescription] = useState("");
  const [formFrequency, setFormFrequency] = useState([true, true, true, true, true, false, false]);
  const [formDays, setFormDays] = useState(30);
  const [formStartDate, setFormStartDate] = useState<Date>(new Date());
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setActivities(SAMPLE_ACTIVITIES);
      setLoading(false);
      return;
    }
    fetchHabits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const getDaysLeft = (activity: ActivityItem) => {
    const endDate = getEndDate(activity);
    const today = new Date();
    return Math.max(0, differenceInDays(endDate, today));
  };

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

  const getPastScheduledSessions = (activity: ActivityItem) => {
    let count = 0;
    const startDate = parseISO(activity.startDate);
    const today = new Date();
    const endDate = getEndDate(activity);
    const effectiveEnd = isBefore(today, endDate) ? today : endDate;

    let currentDate = startDate;
    while (!isAfter(currentDate, effectiveEnd)) {
      const dayOfWeek = (currentDate.getDay() + 6) % 7;
      if (activity.frequencyPattern[dayOfWeek]) count++;
      currentDate = addDays(currentDate, 1);
    }
    return count;
  };

  const getCompletedSessions = (activity: ActivityItem) => Object.values(activity.completions).filter(Boolean).length;

  const getSessionsLeft = (activity: ActivityItem) =>
    Math.max(0, getScheduledSessions(activity) - getCompletedSessions(activity));

  const getCompletionPercent = (activity: ActivityItem) => {
    const scheduled = getPastScheduledSessions(activity);
    if (scheduled === 0) return 0;
    return Math.round((getCompletedSessions(activity) / scheduled) * 100);
  };

  const getCurrentStreak = (activity: ActivityItem) => {
    let streak = 0;
    let checkDate = new Date();

    while (true) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const dayOfWeek = (checkDate.getDay() + 6) % 7;
      const isPlanned = activity.frequencyPattern[dayOfWeek];

      if (isPlanned) {
        if (activity.completions[dateStr]) streak++;
        else if (!isToday(checkDate)) break;
      }

      checkDate = subDays(checkDate, 1);
      if (isBefore(checkDate, parseISO(activity.startDate))) break;
    }

    return streak;
  };

  const getLongestStreak = (activity: ActivityItem) => {
    let longest = 0;
    let current = 0;
    const startDate = parseISO(activity.startDate);
    const endDate = getEndDate(activity);

    let checkDate = startDate;
    while (!isAfter(checkDate, endDate)) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const dayOfWeek = (checkDate.getDay() + 6) % 7;

      if (activity.frequencyPattern[dayOfWeek]) {
        if (activity.completions[dateStr]) {
          current++;
          longest = Math.max(longest, current);
        } else current = 0;
      }

      checkDate = addDays(checkDate, 1);
    }

    return longest;
  };

  const getTodayCompletion = () => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const todayDayOfWeek = (new Date().getDay() + 6) % 7;

    let scheduledToday = 0;
    let completedToday = 0;

    activities.forEach((a) => {
      const startDate = parseISO(a.startDate);
      const endDate = getEndDate(a);
      const today = new Date();

      if (!isBefore(today, startDate) && !isAfter(today, endDate)) {
        if (a.frequencyPattern[todayDayOfWeek]) {
          scheduledToday++;
          if (a.completions[todayStr]) completedToday++;
        }
      }
    });

    return scheduledToday > 0 ? Math.round((completedToday / scheduledToday) * 100) : 100;
  };

  const last7DaysTrend = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayOfWeek = (date.getDay() + 6) % 7;

      let scheduled = 0;
      let completed = 0;

      activities.forEach((a) => {
        const startDate = parseISO(a.startDate);
        const endDate = getEndDate(a);

        if (!isBefore(date, startDate) && !isAfter(date, endDate)) {
          if (a.frequencyPattern[dayOfWeek]) {
            scheduled++;
            if (a.completions[dateStr]) completed++;
          }
        }
      });

      data.push({
        day: format(date, "EEE"),
        completion: scheduled > 0 ? Math.round((completed / scheduled) * 100) : 100,
        completed,
        scheduled,
      });
    }
    return data;
  }, [activities]);

  const weeklyStats = useMemo(() => {
    const avgCompletion = Math.round(last7DaysTrend.reduce((s, d) => s + d.completion, 0) / 7);
    const totalCompleted = last7DaysTrend.reduce((s, d) => s + d.completed, 0);
    const totalScheduled = last7DaysTrend.reduce((s, d) => s + d.scheduled, 0);
    const missedDays = last7DaysTrend.filter((d) => d.scheduled > 0 && d.completion < 100).length;
    return { avgCompletion, totalCompleted, totalScheduled, missedDays };
  }, [last7DaysTrend]);

  const getInsights = (activity: ActivityItem) => {
    const dayCompletions = [0, 0, 0, 0, 0, 0, 0];
    const dayPlanned = [0, 0, 0, 0, 0, 0, 0];

    Object.entries(activity.completions).forEach(([dateStr, completed]) => {
      if (completed) {
        const date = parseISO(dateStr);
        const dayOfWeek = (date.getDay() + 6) % 7;
        dayCompletions[dayOfWeek]++;
      }
    });

    const startDate = parseISO(activity.startDate);
    const endDate = getEndDate(activity);
    let checkDate = startDate;

    while (!isAfter(checkDate, endDate) && !isAfter(checkDate, new Date())) {
      const dayOfWeek = (checkDate.getDay() + 6) % 7;
      if (activity.frequencyPattern[dayOfWeek]) dayPlanned[dayOfWeek]++;
      checkDate = addDays(checkDate, 1);
    }

    let bestDay = 0;
    let worstDay = 0;
    let bestRate = 0;
    let worstRate = 100;

    for (let i = 0; i < 7; i++) {
      if (dayPlanned[i] > 0) {
        const rate = (dayCompletions[i] / dayPlanned[i]) * 100;
        if (rate > bestRate) {
          bestRate = rate;
          bestDay = i;
        }
        if (rate < worstRate) {
          worstRate = rate;
          worstDay = i;
        }
      }
    }

    return {
      bestDay: FULL_DAY_LABELS[bestDay],
      worstDay: FULL_DAY_LABELS[worstDay],
      bestRate: Math.round(bestRate),
      worstRate: Math.round(worstRate),
    };
  };

  const getWeekDays = () => Array.from({ length: 7 }, (_, i) => addDays(selectedWeekStart, i));

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
    }

    toast({
      title: editingActivity ? "Activity updated" : "Activity created",
      description: `${scheduledSessions} habit sessions scheduled`,
    });
    setDialogOpen(false);
  };

  const handleDelete = async (activityId: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== activityId));
    setSelectedActivities((prev) => {
      const next = new Set(prev);
      next.delete(activityId);
      return next;
    });
    if (selectedActivity?.id === activityId) setSelectedActivity(null);

    if (user) {
      await supabase.from("habit_completions").delete().eq("habit_id", activityId).eq("user_id", user.id);
      await supabase.from("habits").delete().eq("id", activityId).eq("user_id", user.id);
    }

    toast({ title: "Activity deleted" });
  };

  const handleBulkComplete = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setActivities((prev) =>
      prev.map((a) => {
        if (!selectedActivities.has(a.id)) return a;
        if (!isPlannedForDate(a, date)) return a;
        return { ...a, completions: { ...a.completions, [dateStr]: true } };
      }),
    );
    toast({ title: `Marked ${selectedActivities.size} activities complete` });
  };

  const handleExport = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      activities: activities.map((a) => ({
        ...a,
        currentStreak: getCurrentStreak(a),
        longestStreak: getLongestStreak(a),
        completionPercent: getCompletionPercent(a),
        scheduledSessions: getScheduledSessions(a),
        sessionsLeft: getSessionsLeft(a),
        daysLeft: getDaysLeft(a),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `activity-tracker-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: "Exported successfully" });
  };

  const filteredActivities = activities.filter((a) => {
    const matchesCategory = categoryFilter === "all" || a.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || getStatus(a) === statusFilter;
    return matchesCategory && matchesStatus;
  });

  const weekDays = getWeekDays();
  const activeCount = activities.filter((a) => getStatus(a) === "active").length;
  const totalStreak = activities.reduce((sum, a) => sum + getCurrentStreak(a), 0);

  const completedThisWeek = (() => {
    let count = 0;
    activities.forEach((a) => {
      weekDays.forEach((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        if (a.completions[dateStr]) count++;
      });
    });
    return count;
  })();

  const plannedThisWeek = (() => {
    let count = 0;
    activities.forEach((a) => {
      weekDays.forEach((day) => {
        if (isPlannedForDate(a, day)) count++;
      });
    });
    return count;
  })();

  const getCategoryInfo = (categoryId: string) => CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[0];

  const getHeatmapData = (activity: ActivityItem) => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const days = eachDayOfInterval({ start, end });

    return days.map((day) => ({
      date: day,
      completed: !!activity.completions[format(day, "yyyy-MM-dd")],
      planned: isPlannedForDate(activity, day),
    }));
  };

  const todayCompletion = getTodayCompletion();
  const currentSelectedActivity = selectedActivity
    ? activities.find((a) => a.id === selectedActivity.id) || null
    : null;

  return (
    <TooltipProvider>
      <div className="flex flex-col w-full flex-1">
        {/* Full-bleed Hero */}
        <PageHero
          storageKey="tracker_hero_src"
          typeKey="tracker_hero_type"
          badge={PAGE_HERO_TEXT.trackers.badge}
          title={PAGE_HERO_TEXT.trackers.title}
          subtitle={PAGE_HERO_TEXT.trackers.subtitle}
        />

        {/* Content Grid */}
        <div className="w-full flex flex-col lg:flex-row gap-6 px-6 lg:px-8 pt-6">
          {/* LEFT */}
          <div className="flex-1 min-w-0 space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-end gap-4">

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={handleExport} className="h-10 rounded-full gap-2 shadow-sm">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>

              <Button size="sm" onClick={openCreateDialog} className="h-10 rounded-full gap-2 flex-1 sm:flex-none shadow-sm">
                <Plus className="h-4 w-4" />
                New Activity
              </Button>
            </div>
          </div>

          {/* KPI Row - Unified alignment */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="rounded-xl border-border/40 bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <ActivityIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-semibold leading-none">{activeCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Active</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border-border/40 bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-semibold leading-none">{totalStreak}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Streak</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border-border/40 bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-semibold leading-none">{weeklyStats.avgCompletion}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Weekly Avg</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border-border/40 bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-semibold leading-none">
                    {completedThisWeek}/{plannedThisWeek}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">This Week</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border-border/40 bg-card p-4">
              <div className="flex flex-col h-full justify-between">
                <p className="text-xs text-muted-foreground font-medium">Today</p>
                <p className="text-xl font-semibold mt-1">{todayCompletion}%</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                  <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${todayCompletion}%` }} />
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border-border/40 bg-card p-4">
              <div className="flex flex-col h-full justify-between">
                <p className="text-xs text-muted-foreground font-medium">7-Day Trend</p>
                <div className="mt-2 h-10 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={last7DaysTrend} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Bar dataKey="completion" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Week navigation */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl"
                onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, -7))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 rounded-xl gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {format(selectedWeekStart, "MMM d")} - {format(addDays(selectedWeekStart, 6), "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedWeekStart}
                    onSelect={(date) => date && setSelectedWeekStart(startOfWeek(date, { weekStartsOn: 1 }))}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl"
                onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, 7))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-xl text-sm"
                onClick={() => setSelectedWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              >
                Today
              </Button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* category pills */}
              <div className="flex items-center gap-1 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-3 rounded-none",
                    categoryFilter === "all"
                      ? "text-foreground border-b border-foreground"
                      : "text-muted-foreground hover:text-foreground border-b border-transparent",
                  )}
                  onClick={() => setCategoryFilter("all")}
                >
                  All
                </Button>

                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-3 rounded-none",
                      categoryFilter === cat.id
                        ? "text-foreground border-b border-foreground"
                        : "text-muted-foreground hover:text-foreground border-b border-transparent",
                    )}
                    onClick={() => setCategoryFilter(cat.id)}
                  >
                    {cat.label.split(" ")[0]}
                  </Button>
                ))}
              </div>

              {/* view switcher (segmented) */}
              <div className="inline-flex items-center rounded-xl bg-muted/40 p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-lg",
                    viewMode === "week" ? "bg-background shadow-sm" : "text-muted-foreground",
                  )}
                  onClick={() => setViewMode("week")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-lg",
                    viewMode === "heatmap" ? "bg-background shadow-sm" : "text-muted-foreground",
                  )}
                  onClick={() => setViewMode("heatmap")}
                >
                  <BarChart2 className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-lg",
                    viewMode === "compact" ? "bg-background shadow-sm" : "text-muted-foreground",
                  )}
                  onClick={() => setViewMode("compact")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bulk actions */}
          {selectedActivities.size > 0 && (
            <Card className="rounded-2xl border border-primary/15 bg-primary/5 p-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-sm font-medium">{selectedActivities.size} selected</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-xl"
                    onClick={() => handleBulkComplete(new Date())}
                  >
                    Mark Today Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 rounded-xl"
                    onClick={() => setSelectedActivities(new Set())}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Activity cards */}
          <div className="space-y-3">
            {filteredActivities.map((activity) => {
              const category = getCategoryInfo(activity.category);
              const status = getStatus(activity);
              const currentStreak = getCurrentStreak(activity);
              const longestStreak = getLongestStreak(activity);
              const percent = getCompletionPercent(activity);
              const insights = getInsights(activity);
              const scheduledSessions = getScheduledSessions(activity);
              const sessionsLeft = getSessionsLeft(activity);
              const daysLeft = getDaysLeft(activity);
              const completedSessions = getCompletedSessions(activity);

              return (
                <Card
                  key={activity.id}
                  className={cn(
                    "rounded-2xl border-border/60 bg-card/60 transition-colors cursor-pointer overflow-hidden",
                    "hover:bg-card",
                    selectedActivity?.id === activity.id && "border-primary/40 ring-1 ring-primary/20",
                  )}
                  onClick={() => selectActivity(activity)}
                >
                  <div className="flex">
                    {/* Left: Cover Image */}
                    <div className="w-40 shrink-0 relative overflow-hidden">
                      <img
                        src={loadActivityImage(activity.id) || getPresetImage("trackers", activity.category)}
                        alt=""
                        className="w-full h-full object-cover min-h-[160px]"
                      />
                    </div>

                    {/* Right: Card Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start gap-3">
                        <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
                          <Checkbox
                            checked={selectedActivities.has(activity.id)}
                            onCheckedChange={(checked) => {
                              setSelectedActivities((prev) => {
                                const next = new Set(prev);
                                if (checked) next.add(activity.id);
                                else next.delete(activity.id);
                                return next;
                              });
                            }}
                          />
                        </div>

                        <div
                          className="h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `hsl(${category.color} / 0.14)` }}
                        >
                          <Target className="h-5 w-5" style={{ color: `hsl(${category.color})` }} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold truncate">{activity.name}</h3>

                            <Badge variant="secondary" className="rounded-full text-[11px]">
                              {category.label.split(" ")[0]}
                            </Badge>

                            {currentStreak > 0 && (
                              <Badge variant="outline" className="rounded-full text-[11px] gap-1">
                                <Flame className="h-3.5 w-3.5 text-orange-500" />
                                {currentStreak}
                              </Badge>
                            )}

                            <Badge
                              className={cn(
                                "rounded-full text-[11px] border",
                                status === "active" && "bg-green-500/10 text-green-700 border-green-500/15",
                                status === "completed" && "bg-primary/10 text-primary border-primary/15",
                                status === "upcoming" && "bg-orange-500/10 text-orange-700 border-orange-500/15",
                              )}
                            >
                              {status}
                            </Badge>
                          </div>

                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{activity.description}</p>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {format(parseISO(activity.startDate), "MMM d")} → {format(getEndDate(activity), "MMM d")} (
                              {activity.habitDays} sessions)
                            </span>
                            <span className="font-medium text-foreground">{daysLeft} days left</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs">
                            <span className="text-muted-foreground">
                              <span className="font-medium text-foreground">{completedSessions}</span>/{scheduledSessions}{" "}
                              sessions
                            </span>
                            <span className="text-muted-foreground">
                              <span className="font-medium text-foreground">{sessionsLeft}</span> left
                            </span>
                            <span className="font-medium text-foreground">{percent}% complete</span>
                          </div>

                          <Progress value={percent} className="h-1.5 mt-2" />
                        </div>

                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => selectActivity(activity)}>View Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(activity)}>Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(activity.id)} className="text-destructive">
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Tracker grid */}
                      <div className="mt-4 pl-[52px]">
                      {viewMode === "week" && (
                        <div className="flex gap-2">
                          {weekDays.map((day, idx) => {
                            const isPlanned = isPlannedForDate(activity, day);
                            const isCompleted = !!activity.completions[format(day, "yyyy-MM-dd")];
                            const isFuture = isAfter(day, new Date());

                            return (
                              <div key={idx} className="flex flex-col items-center flex-1">
                                <span className="text-[11px] text-muted-foreground mb-1">{format(day, "EEE")}</span>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isPlanned && !isFuture) toggleCompletion(activity.id, day);
                                  }}
                                  disabled={!isPlanned || isFuture}
                                  className={cn(
                                    "h-6 w-full max-w-[34px] rounded-md transition-all",
                                    isCompleted
                                      ? "bg-green-500"
                                      : isPlanned
                                        ? isFuture
                                          ? "bg-muted/40"
                                          : "bg-muted hover:bg-muted-foreground/20"
                                        : "bg-transparent",
                                    isToday(day) && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
                                  )}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {viewMode === "heatmap" && (
                        <div className="grid grid-cols-7 gap-1">
                          {getHeatmapData(activity).map((day, idx) => (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (day.planned && !isAfter(day.date, new Date()))
                                  toggleCompletion(activity.id, day.date);
                              }}
                              disabled={!day.planned || isAfter(day.date, new Date())}
                              className={cn(
                                "h-4 w-full rounded-md transition-all",
                                day.completed
                                  ? "bg-green-500"
                                  : day.planned
                                    ? "bg-muted hover:bg-muted-foreground/20"
                                    : "bg-transparent",
                                isToday(day.date) && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
                              )}
                              title={format(day.date, "MMM d")}
                            />
                          ))}
                        </div>
                      )}

                      {viewMode === "compact" && (
                        <ScrollArea className="w-full">
                          <div className="flex gap-1">
                            {getScheduledDates(
                              parseISO(activity.startDate),
                              activity.frequencyPattern,
                              Math.min(activity.habitDays, 60),
                            ).map((day, i) => {
                              const isCompleted = !!activity.completions[format(day, "yyyy-MM-dd")];
                              const isFuture = isAfter(day, new Date());

                              return (
                                <button
                                  key={i}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isFuture) toggleCompletion(activity.id, day);
                                  }}
                                  disabled={isFuture}
                                  className={cn(
                                    "h-3.5 w-3.5 rounded-md flex-shrink-0 transition-all",
                                    isCompleted ? "bg-green-500" : "bg-muted hover:bg-muted-foreground/20",
                                  )}
                                  title={format(day, "EEE, MMM d")}
                                />
                              );
                            })}
                          </div>
                        </ScrollArea>
                      )}
                      </div>

                      {/* Quick insight row */}
                      <div className="mt-3 pl-[52px] flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5 text-orange-500" />
                          <span>Streak: {currentStreak}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-3.5 w-3.5 text-yellow-500" />
                          <span>Best: {longestStreak}</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1">
                          <Lightbulb className="h-3.5 w-3.5 text-primary" />
                          <span>Best on {insights.bestDay}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}

            {filteredActivities.length === 0 && (
              <Card className="rounded-2xl p-10 text-center border-border/60 bg-card/60">
                <ActivityIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-sm font-semibold text-foreground mb-1">No activities found</h3>
                <p className="text-sm text-muted-foreground mb-4">Create your first activity to start tracking</p>
                <Button className="h-9 rounded-xl" onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Activity
                </Button>
              </Card>
            )}
          </div>

          {/* Create/Edit dialog */}
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

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1 h-10 rounded-xl" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1 h-10 rounded-xl" onClick={handleSave} disabled={!formName.trim()}>
                    {editingActivity ? "Save Changes" : "Create Activity"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* RIGHT */}
        <ActivityDetailPanel
          activity={currentSelectedActivity}
          onEdit={openEditDialog}
          onToggleCompletion={toggleCompletion}
          onSkipDay={handleSkipDay}
          onImageChange={handleImageChange}
        />
        </div>
      </div>
    </TooltipProvider>
  );
}
