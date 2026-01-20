import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  differenceInDays,
  format,
  isAfter,
  isBefore,
  isToday,
  parseISO,
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  subDays,
  startOfWeek,
  getDay,
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
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Flame,
  Target,
  TrendingUp,
  Zap,
  GripVertical,
  Trash2,
  CheckCircle,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ActivityImageUpload, loadActivityImage, saveActivityImage } from "@/components/trackers/ActivityImageUpload";
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
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Generate sample completions for past days
function generateSampleCompletions(probability: number = 0.7): Record<string, boolean> {
  const completions: Record<string, boolean> = {};
  const today = new Date();
  const monthStart = startOfMonth(today);

  let current = monthStart;
  while (isBefore(current, today) || format(current, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) {
    if (Math.random() < probability) {
      completions[format(current, "yyyy-MM-dd")] = true;
    }
    current = addDays(current, 1);
  }
  return completions;
}

const SAMPLE_ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    name: "Plan my day",
    category: "growth",
    priority: "High",
    description: "Morning planning routine",
    frequencyPattern: [true, true, true, true, true, true, true],
    habitDays: 31,
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    completions: generateSampleCompletions(0.85),
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Stretch for 10 mins",
    category: "health",
    priority: "Medium",
    description: "Morning stretching",
    frequencyPattern: [true, true, true, true, true, true, true],
    habitDays: 31,
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    completions: generateSampleCompletions(0.75),
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Drink 2.5L of water",
    category: "health",
    priority: "High",
    description: "Stay hydrated",
    frequencyPattern: [true, true, true, true, true, true, true],
    habitDays: 31,
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    completions: generateSampleCompletions(0.65),
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Study for 30 mins",
    category: "education",
    priority: "High",
    description: "Daily learning",
    frequencyPattern: [true, true, true, true, true, false, false],
    habitDays: 20,
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    completions: generateSampleCompletions(0.9),
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Strength training",
    category: "health",
    priority: "High",
    description: "Gym workout",
    frequencyPattern: [true, false, true, false, true, false, false],
    habitDays: 15,
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    completions: generateSampleCompletions(0.8),
    createdAt: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Cardio training",
    category: "health",
    priority: "Medium",
    description: "30 min cardio",
    frequencyPattern: [false, true, false, true, false, true, false],
    habitDays: 15,
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    completions: generateSampleCompletions(0.7),
    createdAt: new Date().toISOString(),
  },
  {
    id: "7",
    name: "Read for 20 mins",
    category: "growth",
    priority: "Medium",
    description: "Daily reading",
    frequencyPattern: [true, true, true, true, true, true, true],
    habitDays: 31,
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    completions: generateSampleCompletions(0.6),
    createdAt: new Date().toISOString(),
  },
  {
    id: "8",
    name: "Meditation",
    category: "wellbeing",
    priority: "High",
    description: "10 min meditation",
    frequencyPattern: [true, true, true, true, true, true, true],
    habitDays: 31,
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    completions: generateSampleCompletions(0.55),
    createdAt: new Date().toISOString(),
  },
  {
    id: "9",
    name: "No social media after 9pm",
    category: "wellbeing",
    priority: "High",
    description: "Digital detox",
    frequencyPattern: [true, true, true, true, true, true, true],
    habitDays: 31,
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    completions: generateSampleCompletions(0.5),
    createdAt: new Date().toISOString(),
  },
  {
    id: "10",
    name: "Practice gratitude",
    category: "growth",
    priority: "Low",
    description: "Write 3 things",
    frequencyPattern: [true, true, true, true, true, true, true],
    habitDays: 31,
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    completions: generateSampleCompletions(0.75),
    createdAt: new Date().toISOString(),
  },
];

// Progress Ring Component
function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 8,
  color = "teal",
  label,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const colorMap: Record<string, string> = {
    teal: "#14b8a6",
    green: "#22c55e",
    blue: "#3b82f6",
    purple: "#a855f7",
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colorMap[color] || colorMap.teal}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-slate-700 dark:text-white">{progress}%</span>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-1 text-center">{label}</p>
    </div>
  );
}

export default function Trackers() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);

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

  // Get days in current month
  const daysInMonth = useMemo(() => {
    const days: Date[] = [];
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    let current = start;
    while (!isAfter(current, end)) {
      days.push(current);
      current = addDays(current, 1);
    }
    return days;
  }, [currentMonth]);

  // Calculate stats for each activity
  const activityStats = useMemo(() => {
    return activities.map((activity) => {
      let streak = 0;
      let checkDate = new Date();

      // Calculate current streak
      while (true) {
        const dateStr = format(checkDate, "yyyy-MM-dd");
        const dayOfWeek = (checkDate.getDay() + 6) % 7;
        const isPlanned = activity.frequencyPattern[dayOfWeek];

        if (isPlanned) {
          if (activity.completions[dateStr]) streak++;
          else if (format(checkDate, "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd")) break;
        }

        checkDate = subDays(checkDate, 1);
        if (isBefore(checkDate, parseISO(activity.startDate))) break;
      }

      // Calculate monthly completions
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      let monthlyCompleted = 0;
      let monthlyTotal = 0;

      let day = monthStart;
      while (!isAfter(day, monthEnd)) {
        const dayOfWeek = (day.getDay() + 6) % 7;
        if (activity.frequencyPattern[dayOfWeek]) {
          monthlyTotal++;
          if (activity.completions[format(day, "yyyy-MM-dd")]) {
            monthlyCompleted++;
          }
        }
        day = addDays(day, 1);
      }

      const progress = monthlyTotal > 0 ? Math.round((monthlyCompleted / monthlyTotal) * 100) : 0;

      return {
        id: activity.id,
        streak,
        completed: monthlyCompleted,
        total: monthlyTotal,
        progress,
      };
    });
  }, [activities, currentMonth]);

  // Overall stats (filtered by selected activity if one is selected)
  const overallStats = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const dayOfWeek = (today.getDay() + 6) % 7;

    let dailyCompleted = 0;
    let dailyTotal = 0;
    let weeklyCompleted = 0;
    let weeklyTotal = 0;
    let monthlyCompleted = 0;
    let monthlyTotal = 0;

    // Filter activities if one is selected
    const filteredActivities = selectedActivityId ? activities.filter((a) => a.id === selectedActivityId) : activities;

    filteredActivities.forEach((activity) => {
      // Daily
      if (activity.frequencyPattern[dayOfWeek]) {
        dailyTotal++;
        if (activity.completions[todayStr]) dailyCompleted++;
      }

      // Weekly (last 7 days)
      for (let i = 0; i < 7; i++) {
        const d = subDays(today, i);
        const dStr = format(d, "yyyy-MM-dd");
        const dDayOfWeek = (d.getDay() + 6) % 7;
        if (activity.frequencyPattern[dDayOfWeek]) {
          weeklyTotal++;
          if (activity.completions[dStr]) weeklyCompleted++;
        }
      }

      // Monthly
      const stats = activityStats.find((s) => s.id === activity.id);
      if (stats) {
        monthlyCompleted += stats.completed;
        monthlyTotal += stats.total;
      }
    });

    const momentum = Math.round(
      (dailyTotal > 0 ? dailyCompleted / dailyTotal : 0) * 40 +
        (weeklyTotal > 0 ? weeklyCompleted / weeklyTotal : 0) * 30 +
        (monthlyTotal > 0 ? monthlyCompleted / monthlyTotal : 0) * 30,
    );

    return {
      momentum,
      dailyProgress: dailyTotal > 0 ? Math.round((dailyCompleted / dailyTotal) * 100) : 0,
      weeklyProgress: weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0,
      monthlyProgress: monthlyTotal > 0 ? Math.round((monthlyCompleted / monthlyTotal) * 100) : 0,
      totalCompleted: monthlyCompleted,
      totalRemaining: monthlyTotal - monthlyCompleted,
    };
  }, [activities, activityStats, selectedActivityId]);

  // Top habits
  const topHabits = useMemo(() => {
    return [...activityStats]
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 5)
      .map((stat) => ({
        ...stat,
        name: activities.find((a) => a.id === stat.id)?.name || "",
      }));
  }, [activityStats, activities]);

  // Active streaks
  const activeStreaks = useMemo(() => {
    return [...activityStats]
      .filter((s) => s.streak > 0)
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 8)
      .map((stat) => ({
        ...stat,
        name: activities.find((a) => a.id === stat.id)?.name || "",
      }));
  }, [activityStats, activities]);

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
    setFormTime("09:00");
    setFormDuration(30);
    setFormAddToTasks(true);
    setDialogOpen(true);
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

    if (formImageUrl) saveActivityImage(tempActivity.id, formImageUrl);

    setActivities((prev) => {
      if (editingActivity) return prev.map((a) => (a.id === editingActivity.id ? tempActivity : a));
      return [tempActivity, ...prev];
    });

    if (user) {
      const targetDays = formFrequency
        .map((selected, idx) => (selected ? idx + 1 : null))
        .filter((d): d is number => d !== null);

      await supabase.from("habits").upsert({
        id: tempActivity.id,
        user_id: user.id,
        name: tempActivity.name,
        description: tempActivity.description || null,
        frequency: "custom",
        target_days: targetDays,
      });

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
          toast({
            title: "Activity created",
            description: `${scheduledDates.length} tasks added to your schedule`,
          });
        }
      } else {
        toast({ title: editingActivity ? "Activity updated" : "Activity created" });
      }
    } else {
      toast({ title: editingActivity ? "Activity updated" : "Activity created" });
    }

    setDialogOpen(false);
  };

  const handleDelete = async (activityId: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== activityId));

    if (user) {
      await supabase.from("habit_completions").delete().eq("habit_id", activityId).eq("user_id", user.id);
      await supabase.from("habits").delete().eq("id", activityId).eq("user_id", user.id);
    }

    toast({ title: "Activity deleted" });
  };

  if (loading) {
    return <PageLoadingScreen module="trackers" />;
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col w-full flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen">
        {/* Hero */}
        <PageHero
          storageKey="tracker_hero_src"
          typeKey="tracker_hero_type"
          badge={PAGE_HERO_TEXT.trackers.badge}
          title={PAGE_HERO_TEXT.trackers.title}
          subtitle={PAGE_HERO_TEXT.trackers.subtitle}
        />

        {/* Dashboard Content */}
        <div className="px-4 py-4 space-y-4">
          {/* Top Section: Month + Progress Rings */}
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_200px] gap-4">
            {/* Month Card */}
            <Card className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30">
              <div className="flex items-center justify-between mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setCurrentMonth(addDays(startOfMonth(currentMonth), -1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white italic">
                  {format(currentMonth, "MMMM")}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setCurrentMonth(addDays(endOfMonth(currentMonth), 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-center text-slate-500 mb-3">- HABIT TRACKER -</p>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Start Date</span>
                  <span className="font-medium">{format(startOfMonth(currentMonth), "MMMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">End Date</span>
                  <span className="font-medium">{format(endOfMonth(currentMonth), "MMMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Days Left</span>
                  <span className="font-medium">{differenceInDays(endOfMonth(currentMonth), new Date()) + 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Daily Habits</span>
                  <span className="font-medium">{activities.length}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-center">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">COMPLETED</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{overallStats.totalCompleted}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-center">
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">REMAINING</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{overallStats.totalRemaining}</p>
                </div>
              </div>
            </Card>

            {/* Progress Rings + Chart */}
            <Card className="p-4 rounded-xl">
              {/* Selected Habit Indicator */}
              {selectedActivityId && (
                <div className="mb-4 p-2 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-teal-600 dark:text-teal-400">Viewing:</span>
                    <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
                      {activities.find((a) => a.id === selectedActivityId)?.name || "Selected Habit"}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedActivityId(null)}
                    className="text-xs px-2 py-1 rounded bg-teal-100 dark:bg-teal-800 text-teal-600 dark:text-teal-300 hover:bg-teal-200 transition-colors flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Clear
                  </button>
                </div>
              )}

              <div className="flex justify-around mb-4">
                <ProgressRing progress={overallStats.momentum} color="teal" label="MOMENTUM" />
                <ProgressRing progress={overallStats.dailyProgress} color="green" label="DAILY PROGRESS" />
                <ProgressRing progress={overallStats.weeklyProgress} color="blue" label="WEEKLY PROGRESS" />
                <ProgressRing progress={overallStats.monthlyProgress} color="purple" label="MONTHLY PROGRESS" />
              </div>

              {/* Smooth Wave Area Chart */}
              <div className="mt-4 p-4 rounded-lg bg-gradient-to-b from-teal-50 to-teal-100/50 dark:from-teal-950/30 dark:to-teal-900/20">
                <p className="text-xs font-medium text-slate-500 mb-3 text-center">DAILY PROGRESS</p>
                <div className="relative h-32">
                  <svg viewBox="0 0 1000 200" className="w-full h-full" preserveAspectRatio="none">
                    {(() => {
                      // Calculate data points
                      const dataPoints: { x: number; y: number; value: number; isPast: boolean; isFuture: boolean }[] =
                        [];
                      const numDays = Math.min(daysInMonth.length, 31);
                      const today = new Date();

                      for (let i = 0; i < numDays; i++) {
                        const day = daysInMonth[i];
                        if (!day) continue;
                        const dayStr = format(day, "yyyy-MM-dd");
                        const dayOfWeek = (day.getDay() + 6) % 7;
                        const isPast = isBefore(day, today) || isToday(day);
                        const isFuture = isAfter(day, today);

                        // Filter by selected activity if one is selected
                        const chartActivities = selectedActivityId
                          ? activities.filter((a) => a.id === selectedActivityId)
                          : activities;

                        let completed = 0;
                        let total = 0;
                        chartActivities.forEach((a) => {
                          if (a.frequencyPattern[dayOfWeek]) {
                            total++;
                            if (a.completions[dayStr]) completed++;
                          }
                        });

                        const value = total > 0 ? (completed / total) * 100 : isFuture ? 50 : 0;
                        const x = (i / (numDays - 1)) * 1000;
                        // Clamp Y to stay within bounds (min 20, max 180)
                        const rawY = 180 - (value / 100) * 140;
                        const y = Math.max(20, Math.min(180, rawY));
                        dataPoints.push({ x, y, value, isPast, isFuture });
                      }

                      if (dataPoints.length < 2) return null;

                      // Create smooth bezier curve path with gentle curves
                      const createSmoothPath = (points: { x: number; y: number }[]) => {
                        if (points.length < 2) return "";

                        let path = `M ${points[0].x} ${points[0].y}`;

                        for (let i = 0; i < points.length - 1; i++) {
                          const current = points[i];
                          const next = points[i + 1];

                          // Use simple quadratic bezier for gentler curves
                          const midX = (current.x + next.x) / 2;
                          const midY = (current.y + next.y) / 2;

                          // Add subtle curve control
                          path += ` Q ${current.x + (midX - current.x) * 0.5} ${current.y}, ${midX} ${midY}`;
                          path += ` Q ${midX + (next.x - midX) * 0.5} ${next.y}, ${next.x} ${next.y}`;
                        }

                        return path;
                      };

                      const linePath = createSmoothPath(dataPoints);
                      const areaPath = `${linePath} L 1000 200 L 0 200 Z`;

                      return (
                        <>
                          {/* Gradient definition */}
                          <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#5eead4" stopOpacity="0.6" />
                              <stop offset="100%" stopColor="#5eead4" stopOpacity="0.1" />
                            </linearGradient>
                          </defs>

                          {/* Area fill */}
                          <path d={areaPath} fill="url(#areaGradient)" className="transition-all duration-500" />

                          {/* Line stroke */}
                          <path
                            d={linePath}
                            fill="none"
                            stroke="#14b8a6"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="transition-all duration-500"
                          />

                          {/* Data points */}
                          {dataPoints.map((point, i) => {
                            const isMissed = point.isPast && point.value === 0;
                            const pointColor = point.isFuture
                              ? "#94a3b8" // gray for future
                              : isMissed
                                ? "#ef4444" // red for missed
                                : "#14b8a6"; // teal for completed

                            return (
                              <circle
                                key={i}
                                cx={point.x}
                                cy={point.y}
                                r={isMissed ? "6" : "4"}
                                fill={pointColor}
                                stroke="white"
                                strokeWidth="2"
                                className="transition-all duration-300"
                              >
                                <title>{`Day ${i + 1}: ${Math.round(point.value)}%${isMissed ? " (Missed)" : point.isFuture ? " (Upcoming)" : ""}`}</title>
                              </circle>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            </Card>

            {/* Right Sidebar: Top Habits + Streaks */}
            <div className="space-y-4">
              <Card className="p-3 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">TOP HABITS</p>
                  <Button
                    size="sm"
                    onClick={openCreateDialog}
                    className="h-6 px-2 text-xs rounded-lg bg-teal-500 hover:bg-teal-600"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-1">
                  {topHabits.map((habit, i) => (
                    <div key={habit.id} className="flex items-center gap-2 text-xs">
                      <span className="truncate flex-1 text-slate-600 dark:text-slate-400">{habit.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
                        {habit.completed}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-3 rounded-xl">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">ACTIVE STREAKS</p>
                <div className="space-y-1">
                  {activeStreaks.map((habit) => (
                    <div key={habit.id} className="flex items-center gap-2 text-xs">
                      <span className="truncate flex-1 text-slate-600 dark:text-slate-400">{habit.name}</span>
                      <div className="flex items-center gap-1">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-teal-400 to-green-400"
                          style={{ width: `${Math.min(habit.streak * 8, 60)}px` }}
                        />
                        <span className="text-slate-500 font-medium">{habit.streak}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Habits Grid */}
          <Card className="rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    <th className="text-left p-2 font-semibold text-slate-600 dark:text-slate-300 sticky left-0 bg-slate-100 dark:bg-slate-800 min-w-[150px]">
                      DAILY HABITS
                    </th>
                    <th className="p-2 font-semibold text-slate-600 dark:text-slate-300 w-12">GOALS</th>
                    {daysInMonth.map((day, i) => {
                      const weekNum = Math.floor(i / 7) + 1;
                      const isFirstOfWeek = i % 7 === 0;
                      return (
                        <th
                          key={i}
                          className={cn(
                            "p-1 font-medium text-center min-w-[28px]",
                            isFirstOfWeek && "border-l-2 border-slate-200 dark:border-slate-700",
                            isToday(day) && "bg-teal-100 dark:bg-teal-900/30",
                          )}
                        >
                          <div className="text-slate-400">{DAY_NAMES[(day.getDay() + 6) % 7]}</div>
                          <div
                            className={cn(
                              "text-slate-600 dark:text-slate-300",
                              isToday(day) && "text-teal-600 dark:text-teal-400 font-bold",
                            )}
                          >
                            {format(day, "d")}
                          </div>
                        </th>
                      );
                    })}
                    <th className="p-2 text-center font-semibold text-slate-600 dark:text-slate-300 min-w-[80px]">
                      PROGRESS
                    </th>
                    <th className="p-2 text-center font-semibold text-slate-600 dark:text-slate-300 w-16">STREAK</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity, actIdx) => {
                    const stats = activityStats.find((s) => s.id === activity.id);
                    const colors = [
                      "bg-pink-50",
                      "bg-blue-50",
                      "bg-green-50",
                      "bg-yellow-50",
                      "bg-purple-50",
                      "bg-orange-50",
                    ];
                    const rowColor = colors[actIdx % colors.length];
                    const isSelected = selectedActivityId === activity.id;
                    const todayStr = format(new Date(), "yyyy-MM-dd");
                    const isTodayCompleted = activity.completions[todayStr];

                    return (
                      <tr
                        key={activity.id}
                        className={cn(
                          "border-b border-slate-100 dark:border-slate-800 cursor-pointer transition-all",
                          isSelected ? "ring-2 ring-teal-400 ring-inset bg-teal-50 dark:bg-teal-900/20" : rowColor,
                          "dark:bg-slate-900/50 hover:bg-opacity-70",
                        )}
                        onClick={() => setSelectedActivityId(isSelected ? null : activity.id)}
                        draggable
                        onDragStart={() => setDraggedIndex(actIdx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggedIndex !== null && draggedIndex !== actIdx) {
                            const newActivities = [...activities];
                            const [removed] = newActivities.splice(draggedIndex, 1);
                            newActivities.splice(actIdx, 0, removed);
                            setActivities(newActivities);
                          }
                          setDraggedIndex(null);
                        }}
                      >
                        {/* Actions Column */}
                        <td
                          className={cn(
                            "p-2 sticky left-0",
                            isSelected ? "bg-teal-50 dark:bg-teal-900/20" : rowColor,
                            "dark:bg-slate-900/50",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {/* Drag Handle */}
                            <button
                              className="cursor-grab text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GripVertical className="h-4 w-4" />
                            </button>

                            {/* Habit Name */}
                            <span className="font-medium text-slate-700 dark:text-slate-300 flex-1 truncate max-w-[120px]">
                              {activity.name}
                            </span>

                            {/* Quick Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* Complete Today */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCompletion(activity.id, new Date());
                                }}
                                className={cn(
                                  "p-1 rounded transition-colors",
                                  isTodayCompleted
                                    ? "text-green-600 bg-green-100 dark:bg-green-900/30"
                                    : "text-slate-400 hover:text-green-600 hover:bg-green-50",
                                )}
                                title={isTodayCompleted ? "Completed today" : "Mark complete for today"}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm("Delete this habit?")) {
                                    handleDelete(activity.id);
                                  }
                                }}
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete habit"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 text-center text-slate-500">{activity.habitDays}</td>
                        {daysInMonth.map((day, i) => {
                          const dateStr = format(day, "yyyy-MM-dd");
                          const dayOfWeek = (day.getDay() + 6) % 7;
                          const isPlanned = activity.frequencyPattern[dayOfWeek];
                          const isCompleted = activity.completions[dateStr];
                          const isPast = isBefore(day, new Date()) || isToday(day);
                          const isFirstOfWeek = i % 7 === 0;

                          return (
                            <td
                              key={i}
                              className={cn(
                                "p-1 text-center",
                                isFirstOfWeek && "border-l-2 border-slate-200 dark:border-slate-700",
                                isToday(day) && "bg-teal-50 dark:bg-teal-900/20",
                              )}
                            >
                              {isPlanned ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    isPast && toggleCompletion(activity.id, day);
                                  }}
                                  disabled={!isPast}
                                  className={cn(
                                    "w-5 h-5 rounded flex items-center justify-center transition-all mx-auto",
                                    isCompleted
                                      ? "bg-teal-500 text-white"
                                      : isPast
                                        ? "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300"
                                        : "bg-slate-100 dark:bg-slate-800",
                                  )}
                                >
                                  {isCompleted && <Check className="h-3 w-3" />}
                                </button>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-teal-400 to-green-400 rounded-full transition-all"
                                style={{ width: `${stats?.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-slate-600 dark:text-slate-400 w-10 text-right">
                              {stats?.completed}/{stats?.total}
                            </span>
                            <span className="text-slate-500 font-medium w-10">{stats?.progress}%</span>
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                              (stats?.streak || 0) > 0
                                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400",
                            )}
                          >
                            {(stats?.streak || 0) > 0 && <Flame className="h-3 w-3" />}
                            {stats?.streak || 0}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Create Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle>{editingActivity ? "Edit Activity" : "Create New Habit"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Habit Name</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Drink 2.5L of water"
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
                      <Button variant="outline" className="w-full justify-start text-left font-normal rounded-xl h-10">
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
                  <label className="text-sm font-medium mb-2 block">Goal (habit days)</label>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={formDays}
                    onChange={(e) => setFormDays(parseInt(e.target.value) || 30)}
                    className="rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
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
                    <input
                      type="time"
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
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
                  placeholder="Why is this habit important to you?"
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
                <p className="text-xs text-muted-foreground mb-2">Select the days you plan to perform this habit.</p>
                <div className="flex gap-2">
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
                        formFrequency[idx] ? "bg-teal-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400",
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {!editingActivity && (
                <div className="flex items-center space-x-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <Checkbox
                    id="addToTasks"
                    checked={formAddToTasks}
                    onCheckedChange={(checked) => setFormAddToTasks(checked as boolean)}
                  />
                  <label htmlFor="addToTasks" className="text-sm cursor-pointer">
                    Add scheduled sessions to Tasks page
                  </label>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 rounded-xl bg-teal-500 hover:bg-teal-600" onClick={handleSave}>
                  {editingActivity ? "Save Changes" : "Create Habit"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
