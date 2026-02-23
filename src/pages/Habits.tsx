import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { UnifiedTimePicker } from "@/components/common/UnifiedTimePicker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDatePreferences } from "@/hooks/useDatePreferences";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UnifiedDatePicker } from "@/components/common/UnifiedDatePicker";
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
  MoreVertical,
  Pencil,
  BarChart3,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ActivityImageUpload, loadActivityImage, loadAllActivityImages, saveActivityImage, saveActivityImageToDb } from "@/components/habits/ActivityImageUpload";
import habitsDefaultImage from "@/assets/habits-default.jpg";
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
  coverImageUrl?: string | null;
  notes?: Record<string, string>;
  skipped?: Record<string, boolean>;
  reminders?: { time: string; days: number[] };
  time?: string;
  duration?: number;
  isArchived?: boolean; // When true, habit is fully completed and no longer tracked
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

// Motivational quotes for when no habit is selected
const MOTIVATIONAL_QUOTES = [
  { text: "Every action you take is a vote for the type of person you wish to become.", author: "James Clear" },
  { text: "Small daily improvements lead to stunning results.", author: "Robin Sharma" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "First we make our habits, then our habits make us.", author: "John Dryden" },
  {
    text: "The chains of habit are too light to be felt until they are too heavy to be broken.",
    author: "Warren Buffett",
  },
  { text: "You'll never change your life until you change something you do daily.", author: "John C. Maxwell" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
];

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
    habitDays: 61,
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
    habitDays: 54,
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
    habitDays: 90,
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
    habitDays: 45,
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
    habitDays: 22,
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
    habitDays: 27,
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
    habitDays: 66,
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
    habitDays: 42,
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
    habitDays: 30,
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
    habitDays: 21,
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    completions: generateSampleCompletions(0.75),
    createdAt: new Date().toISOString(),
  },
];

// Ring accent colors matching the screenshot
const RING_COLORS = [
  "#ef4444", // red-orange for Total Goal
  "#14b8a6", // teal for Momentum
  "#22c55e", // green for Daily
  "#3b82f6", // blue for Weekly
  "#8b5cf6", // purple for Overall
];

// Progress Ring Component — Colorful SaaS design
function ProgressRing({
  progress,
  size = 90,
  strokeWidth = 6,
  label,
  color = "hsl(var(--foreground))",
  mobileSize,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  color?: string;
  mobileSize?: number;
}) {
  // Use mobileSize on small screens via CSS, but for SVG we need JS
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;
  const effectiveSize = mobileSize && isMobileView ? mobileSize : size;
  const radius = (effectiveSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0 snap-center">
      <div className="relative aspect-square" style={{ width: effectiveSize, height: effectiveSize }}>
        <svg width={effectiveSize} height={effectiveSize} className="transform -rotate-90">
          <circle
            cx={effectiveSize / 2}
            cy={effectiveSize / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={effectiveSize / 2}
            cy={effectiveSize / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm md:text-lg font-light text-foreground tracking-tight">{progress}%</span>
        </div>
      </div>
      <p className="text-[10px] uppercase tracking-zara-wide text-muted-foreground font-normal">{label}</p>
    </div>
  );
}

export default function Habits() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { weekStartsOn } = useDatePreferences();

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);

  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // form
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("health");
  const [formPriority, setFormPriority] = useState("Medium");
  const [formDescription, setFormDescription] = useState("");
  const [formFrequency, setFormFrequency] = useState([true, true, true, true, true, false, false]);
  const [formDays, setFormDays] = useState("30");
  const [formStartDate, setFormStartDate] = useState<Date>(new Date());
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null);
  const [formTime, setFormTime] = useState("09:00");
  const [formDuration, setFormDuration] = useState(30);
  const [formAddToTasks, setFormAddToTasks] = useState(false);

  // Mobile week navigation offset (0 = current week, -1 = last week, etc.)
  const [mobileWeekOffset, setMobileWeekOffset] = useState(0);

  // Mobile insights drawer
  const [insightsOpen, setInsightsOpen] = useState(false);

  // Mobile habit detail modal
  const [habitDetailId, setHabitDetailId] = useState<string | null>(null);

  // Quote rotation state
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quoteVisible, setQuoteVisible] = useState(true);

  // Quote rotation effect - change every 10 seconds with fade
  useEffect(() => {
    if (selectedActivityId) return; // Don't rotate when a habit is selected

    const interval = setInterval(() => {
      // Fade out
      setQuoteVisible(false);

      // After fade out, change quote and fade in
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
        setQuoteVisible(true);
      }, 500); // Wait for fade out animation
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedActivityId]);

  useEffect(() => {
    if (!user) {
      setActivities(SAMPLE_ACTIVITIES);
      setLoading(false);
      return;
    }
    fetchHabits();
  }, [user]);

  // One-time migration: sync localStorage images to database
  useEffect(() => {
    if (!user) return;
    const migrateImages = async () => {
      const allImages = loadAllActivityImages();
      for (const [habitId, imgData] of Object.entries(allImages)) {
        if (imgData.startsWith("data:")) {
          // Upload base64 to storage first
          try {
            const res = await fetch(imgData);
            const blob = await res.blob();
            const ext = blob.type.split("/")[1] || "jpg";
            const fileName = `${user.id}/${Date.now()}-${habitId}.${ext}`;
            const { error } = await supabase.storage.from("entry-covers").upload(fileName, blob);
            if (error) { console.error("Migration upload error:", error); continue; }
            const { data: { publicUrl } } = supabase.storage.from("entry-covers").getPublicUrl(fileName);
            saveActivityImage(habitId, publicUrl);
            await saveActivityImageToDb(habitId, publicUrl);
          } catch (err) {
            console.error("Migration error for habit", habitId, err);
          }
        } else {
          // URL exists in localStorage but might be missing from DB — sync it
          await saveActivityImageToDb(habitId, imgData);
        }
      }
    };
    migrateImages();
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
        habitDays: (habit as any).habit_days || 30,
        startDate: (habit as any).start_date || format(new Date(habit.created_at), "yyyy-MM-dd"),
        completions: habitCompletions,
        createdAt: habit.created_at,
        coverImageUrl: habit.cover_image_url || null,
      };
    });

    setActivities(transformedActivities);
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

  // Current week days for mobile weekly view
  const currentWeekDays = useMemo(() => {
    const today = new Date();
    const ws = startOfWeek(today, { weekStartsOn });
    const offsetStart = addDays(ws, mobileWeekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(offsetStart, i));
  }, [weekStartsOn, mobileWeekOffset]);

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

  // Overall stats (filtered by selected activity if one is selected) - INDEPENDENT OF MONTH
  const overallStats = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const dayOfWeek = (today.getDay() + 6) % 7;

    let dailyCompleted = 0;
    let dailyTotal = 0;
    let weeklyCompleted = 0;
    let weeklyTotal = 0;
    let allTimeCompleted = 0;
    let allTimeTotal = 0;

    // Filter activities if one is selected, also exclude archived habits from daily/weekly stats
    const filteredActivities = selectedActivityId
      ? activities.filter((a) => a.id === selectedActivityId)
      : activities.filter((a) => !a.isArchived); // Exclude archived from active stats

    filteredActivities.forEach((activity) => {
      const habitStartDate = parseISO(activity.startDate);
      const habitEndDate = computeEndDateForHabitDays(habitStartDate, activity.frequencyPattern, activity.habitDays);

      // Daily - only count if today is within the habit's date range
      const isTodayInRange = !isBefore(today, habitStartDate) && !isAfter(today, habitEndDate);
      if (activity.frequencyPattern[dayOfWeek] && isTodayInRange) {
        dailyTotal++;
        if (activity.completions[todayStr]) dailyCompleted++;
      }

      // Weekly (last 7 days) - only count days within the habit's date range
      for (let i = 0; i < 7; i++) {
        const d = subDays(today, i);
        const dStr = format(d, "yyyy-MM-dd");
        const dDayOfWeek = (d.getDay() + 6) % 7;
        const isDayInRange = !isBefore(d, habitStartDate) && !isAfter(d, habitEndDate);

        if (activity.frequencyPattern[dDayOfWeek] && isDayInRange) {
          weeklyTotal++;
          if (activity.completions[dStr]) weeklyCompleted++;
        }
      }

      // All-time (total habit days completed vs total habit days)
      const totalCompletions = Object.keys(activity.completions || {}).length;
      allTimeCompleted += totalCompletions;
      allTimeTotal += activity.habitDays;
    });

    const momentum = Math.round(
      (dailyTotal > 0 ? dailyCompleted / dailyTotal : 0) * 40 +
        (weeklyTotal > 0 ? weeklyCompleted / weeklyTotal : 0) * 30 +
        (allTimeTotal > 0 ? allTimeCompleted / allTimeTotal : 0) * 30,
    );

    return {
      momentum,
      dailyProgress: dailyTotal > 0 ? Math.round((dailyCompleted / dailyTotal) * 100) : 0,
      weeklyProgress: weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0,
      monthlyProgress: allTimeTotal > 0 ? Math.round((allTimeCompleted / allTimeTotal) * 100) : 0,
      totalCompleted: allTimeCompleted,
      totalRemaining: allTimeTotal - allTimeCompleted,
    };
  }, [activities, selectedActivityId]);

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

        // SYNC: Uncomplete the corresponding task if it exists
        const { data: tasks } = await supabase
          .from("tasks")
          .select("id")
          .eq("user_id", user.id)
          .eq("title", activity.name)
          .eq("due_date", dateStr);

        if (tasks && tasks.length > 0) {
          await supabase
            .from("tasks")
            .update({
              is_completed: false,
              completed_at: null,
              status: "ongoing", // Reset to ongoing
            } as any)
            .in(
              "id",
              tasks.map((t) => t.id),
            );
        }
      } else {
        await supabase.from("habit_completions").insert({
          habit_id: activityId,
          user_id: user.id,
          completed_date: dateStr,
        });

        // SYNC: Complete the corresponding task if it exists
        const { data: tasks } = await supabase
          .from("tasks")
          .select("id")
          .eq("user_id", user.id)
          .eq("title", activity.name)
          .eq("due_date", dateStr);

        if (tasks && tasks.length > 0) {
          await supabase
            .from("tasks")
            .update({
              is_completed: true,
              completed_at: new Date().toISOString(),
              status: "completed",
            } as any)
            .in(
              "id",
              tasks.map((t) => t.id),
            );
        }

        // Check if all habit days are now completed - auto-archive if so
        const newCompletionsCount = Object.keys(activity.completions).length + 1; // +1 because we just added one
        if (newCompletionsCount >= activity.habitDays && !activity.isArchived) {
          // Auto-archive the habit
          setActivities((prev) => prev.map((a) => (a.id === activityId ? { ...a, isArchived: true } : a)));

          // Update in database
          await supabase
            .from("habits")
            .update({ is_archived: true, archived_at: new Date().toISOString() } as any)
            .eq("id", activityId)
            .eq("user_id", user.id);

          toast({
            title: "🎉 Habit Completed!",
            description: `Congratulations! "${activity.name}" has been moved to completed habits.`,
          });

          // Clear selection if this habit was selected
          if (selectedActivityId === activityId) {
            setSelectedActivityId(null);
          }
        }
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
    setFormDays("30");
    setFormStartDate(new Date());
    setFormImageUrl(null);
    setFormTime("09:00");
    setFormDuration(30);
    setFormAddToTasks(false);
    setDialogOpen(true);
  };

  const openEditDialog = (activity: ActivityItem) => {
    setEditingActivity(activity);
    setFormName(activity.name);
    setFormCategory(activity.category);
    setFormPriority(activity.priority || "Medium");
    setFormDescription(activity.description || "");
    setFormFrequency(activity.frequencyPattern);
    setFormDays(String(activity.habitDays));
    setFormStartDate(activity.startDate ? parseISO(activity.startDate) : new Date());
    setFormImageUrl(activity.coverImageUrl || loadActivityImage(activity.id));
    setFormTime(activity.time || "09:00");
    setFormDuration(activity.duration || 30);
    setFormAddToTasks(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your habit",
        variant: "destructive",
      });
      return;
    }

    try {
      const tempActivity: ActivityItem = {
        id: editingActivity?.id || crypto.randomUUID(),
        name: formName,
        category: formCategory,
        priority: formPriority,
        description: formDescription,
        frequencyPattern: formFrequency,
        habitDays: parseInt(formDays) || 1,
        startDate: format(formStartDate, "yyyy-MM-dd"),
        completions: editingActivity?.completions || {},
        createdAt: editingActivity?.createdAt || new Date().toISOString(),
        skipped: editingActivity?.skipped || {},
        notes: editingActivity?.notes || {},
        time: formTime,
        duration: formDuration,
      };

      if (formImageUrl) {
        saveActivityImage(tempActivity.id, formImageUrl);
      }

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
          habit_days: parseInt(formDays) || 1,
          start_date: format(formStartDate, "yyyy-MM-dd"),
          cover_image_url: formImageUrl || null,
        });

        if (error) {
          throw error;
        }

        // Create tasks for each scheduled day if enabled
        if (formAddToTasks && !editingActivity) {
          const scheduledDates: Date[] = [];
          let checkDate = formStartDate;
          let count = 0;
          const habitDaysNum = parseInt(formDays) || 1;
          const endDate = computeEndDateForHabitDays(formStartDate, formFrequency, habitDaysNum);

          while (!isAfter(checkDate, endDate) && count < habitDaysNum) {
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
          toast({ title: editingActivity ? "Activity updated" : "Activity saved to cloud" });
        }
        await fetchHabits();
      } else {
        toast({ title: editingActivity ? "Activity updated" : "Activity created" });
      }

      setDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving activity:", error);
      toast({
        title: "Failed to save",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (activityId: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== activityId));

    if (user) {
      await supabase.from("habit_completions").delete().eq("habit_id", activityId).eq("user_id", user.id);
      await supabase.from("habits").delete().eq("id", activityId).eq("user_id", user.id);
    }

    toast({ title: "Activity deleted" });
  };

  const handleCompleteHabit = async (activityId: string) => {
    // Mark the habit as archived (fully completed)
    setActivities((prev) => prev.map((a) => (a.id === activityId ? { ...a, isArchived: true } : a)));

    if (user) {
      // Update the habit in database to mark as archived
      await supabase
        .from("habits")
        .update({ is_archived: true, archived_at: new Date().toISOString() } as any)
        .eq("id", activityId)
        .eq("user_id", user.id);
    }

    toast({
      title: "🎉 Habit Completed!",
      description: "Congratulations! This habit has been archived.",
    });

    // Clear selection if this habit was selected
    if (selectedActivityId === activityId) {
      setSelectedActivityId(null);
    }
  };

  const handleRestoreHabit = async (activityId: string) => {
    // Mark the habit as not archived (restore to active)
    setActivities((prev) => prev.map((a) => (a.id === activityId ? { ...a, isArchived: false } : a)));

    if (user) {
      // Update the habit in database to remove archived status
      await supabase
        .from("habits")
        .update({ is_archived: false, archived_at: null } as any)
        .eq("id", activityId)
        .eq("user_id", user.id);
    }

    toast({
      title: "Habit Restored",
      description: "This habit has been moved back to active tracking.",
    });
  };

  const [loadingFinished, setLoadingFinished] = useState(false);
  const isDataReady = !loading;

  const renderRow = (activity: ActivityItem, originalIndex: number, isActive: boolean) => {
    const stats = activityStats.find((s) => s.id === activity.id);
    const isSelected = selectedActivityId === activity.id;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const isTodayCompleted = activity.completions[todayStr];
    const isArchived = !!activity.isArchived;

    // Calculate progress based on total habit days completed vs total habit days
    const totalCompletions = Object.keys(activity.completions || {}).length;
    const progressPercent = activity.habitDays > 0 ? Math.round((totalCompletions / activity.habitDays) * 100) : 0;

    return (
      <tr
        key={activity.id}
        className={cn(
          "border-b border-slate-100 dark:border-slate-800 transition-all",
          isSelected
            ? "bg-emerald-50 dark:bg-emerald-900/30 ring-2 ring-emerald-500 ring-inset shadow-sm"
            : isArchived
              ? "bg-slate-50 dark:bg-slate-900/30 opacity-70 grayscale-[0.5]"
              : "bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50",
          "cursor-pointer",
        )}
        onClick={() => setSelectedActivityId(isSelected ? null : activity.id)}
        draggable={isActive}
        onDragStart={isActive ? () => setDraggedIndex(originalIndex) : undefined}
        onDragOver={(e) => e.preventDefault()}
        onDrop={
          isActive
            ? () => {
                if (draggedIndex !== null && draggedIndex !== originalIndex) {
                  const newActivities = [...activities];
                  const [removed] = newActivities.splice(draggedIndex, 1);
                  newActivities.splice(originalIndex, 0, removed);
                  setActivities(newActivities);
                }
                setDraggedIndex(null);
              }
            : undefined
        }
      >
        {/* Actions Column */}
        <td
          className={cn(
            "p-2 sticky left-0",
            isSelected
              ? "bg-emerald-50 dark:bg-emerald-900/30"
              : isArchived
                ? "bg-slate-50 dark:bg-slate-900/30"
                : "bg-white dark:bg-slate-900/50",
          )}
        >
          <div className="flex items-center gap-1.5">
            {/* Drag Handle - Only for active */}
            {isActive && (
              <button
                className="cursor-grab text-slate-300 hover:text-slate-500 dark:hover:text-slate-300"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-3.5 w-3.5" />
              </button>
            )}
            {!isActive && <div className="w-3.5" />}

            {/* 3-Dot Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditDialog(activity);
                  }}
                  className="cursor-pointer"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>

                {/* Mark Today - Only for active habits */}
                {!isArchived && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompletion(activity.id, new Date());
                    }}
                    className="cursor-pointer"
                  >
                    <Check className={cn("h-4 w-4 mr-2", isTodayCompleted ? "text-green-500" : "")} />
                    {isTodayCompleted ? "Today Done ✓" : "Mark Today"}
                  </DropdownMenuItem>
                )}

                {/* Complete Habit Action - Only for active habits */}
                {!isArchived && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Mark this habit as fully completed? It will be archived and no longer tracked.")) {
                        handleCompleteHabit(activity.id);
                      }
                    }}
                    className="cursor-pointer text-emerald-600 focus:text-emerald-600"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Habit
                  </DropdownMenuItem>
                )}

                {/* Move to Active - Only for archived habits */}
                {isArchived && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestoreHabit(activity.id);
                    }}
                    className="cursor-pointer text-blue-600 focus:text-blue-600"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Move to Active
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this habit?")) {
                      handleDelete(activity.id);
                    }
                  }}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Habit Name */}
            <span
              className={cn(
                "font-medium truncate max-w-[120px] ml-1",
                isArchived ? "text-slate-500 line-through" : "text-slate-700 dark:text-slate-300",
              )}
            >
              {activity.name}
            </span>
          </div>
        </td>
        <td className="p-2 text-center text-slate-500">{activity.habitDays}</td>
        {daysInMonth.map((day, i) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayOfWeek = (day.getDay() + 6) % 7;
          const isPlanned = activity.frequencyPattern[dayOfWeek];
          const isCompleted = activity.completions[dateStr];
          const isPast = isBefore(day, new Date()) || isToday(day);

          const isWeekStart = day.getDay() === weekStartsOn;
          const isFirstDay = i === 0;

          // Check if day is within habit's date range
          const habitStartDate = parseISO(activity.startDate);
          const habitEndDate = computeEndDateForHabitDays(
            habitStartDate,
            activity.frequencyPattern,
            activity.habitDays,
          );
          const isWithinRange = !isBefore(day, habitStartDate) && !isAfter(day, habitEndDate);

          const today = new Date();
          const weekStart = startOfWeek(today, { weekStartsOn });
          const weekEnd = addDays(weekStart, 6);
          const isCurrentWeek = !isBefore(day, weekStart) && !isAfter(day, weekEnd);

          return (
            <td
              key={i}
              className={cn(
                "p-1 text-center",
                (isWeekStart || isFirstDay) && "border-l-2 border-slate-200 dark:border-slate-700",
                isToday(day) && "bg-emerald-50 dark:bg-emerald-900/20",
                isCurrentWeek && !isToday(day) && "bg-blue-50/50 dark:bg-blue-900/10",
                isArchived && "opacity-50",
              )}
            >
              {isPlanned && isWithinRange ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Don't allow toggling for archived habits
                    if (!isArchived && isPast) {
                      toggleCompletion(activity.id, day);
                    }
                  }}
                  disabled={!isPast || isArchived}
                  className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center transition-all mx-auto",
                    isCompleted
                      ? isArchived
                        ? "bg-muted-foreground text-background cursor-not-allowed"
                        : "bg-emerald-400 text-white"
                      : isPast && !isArchived
                        ? "border-2 border-muted-foreground/30 hover:border-muted-foreground/50 bg-transparent"
                        : "border-2 border-border bg-transparent cursor-not-allowed",
                  )}
                >
                  {isCompleted && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </button>
              ) : (
                <span className="text-muted-foreground/30">-</span>
              )}
            </td>
          );
        })}
        <td className="p-2">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 20 20" className="shrink-0">
              <circle cx="10" cy="10" r="9" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
              <circle cx="10" cy="10" r="7" fill="none" stroke={isArchived ? "#94A3B8" : "#2DD4BF"} strokeWidth="4"
                strokeDasharray={`${(progressPercent / 100) * 43.98} 43.98`}
                strokeLinecap="round" transform="rotate(-90 10 10)" />
            </svg>
            <span className="text-slate-600 dark:text-slate-400 w-10 text-right">
              {totalCompletions}/{activity.habitDays}
            </span>
            <span className="text-slate-500 font-medium w-10">{progressPercent}%</span>
          </div>
        </td>
        <td className="p-2 text-center">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
              (stats?.streak || 0) > 0
                ? isArchived
                  ? "bg-slate-200 text-slate-500"
                  : "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400",
            )}
          >
            {(stats?.streak || 0) > 0 && <Flame className="h-3 w-3" />}
            {stats?.streak || 0}
          </span>
        </td>
      </tr>
    );
  };

  return (
    <TooltipProvider>
      {!loadingFinished && (
        <PageLoadingScreen
          module="habits"
          isDataReady={isDataReady}
          onFinished={() => setLoadingFinished(true)}
        />
      )}
      <div className="flex flex-col w-full flex-1 bg-background min-h-screen">
        {/* Hero */}
        <PageHero
          storageKey="tracker_hero_src"
          typeKey="tracker_hero_type"
          badge={PAGE_HERO_TEXT.trackers.badge}
          title={PAGE_HERO_TEXT.trackers.title}
          subtitle={PAGE_HERO_TEXT.trackers.subtitle}
        />

        {/* Dashboard Content */}
        <div className="flex-1 px-3 sm:px-4 lg:px-8 py-4 pb-16 flex flex-col overflow-y-auto max-w-[1400px] mx-auto w-full">
          {/* Top Section: Header + Stats Dashboard */}
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h2 className="text-sm font-normal uppercase tracking-zara-wide text-foreground">Habits Tracker</h2>
            <div className="flex items-center gap-2">
              {/* Mobile: Create + Insights buttons in header */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8"
                onClick={() => setInsightsOpen(true)}
                aria-label="Open Insights"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                className="md:hidden h-7 px-2.5 text-[10px] gap-1 rounded-md"
                onClick={openCreateDialog}
                aria-label="Create Habit"
              >
                <Plus className="h-3 w-3" />
                New
              </Button>
              {/* Desktop: inline button */}
              <Button onClick={openCreateDialog} variant="outline" size="sm" className="hidden md:inline-flex">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Habit
              </Button>
            </div>
          </div>

          {/* Main dashboard — Single wide card with 3 internal sections */}
          <Card className="mb-4 flex-shrink-0 overflow-hidden">
            {/* Mobile Minimalist Header */}
            <div className="lg:hidden">
              {/* Quote */}
              <div className="px-4 pt-3 pb-2">
                <div className={cn(
                  "transition-opacity duration-500 ease-in-out text-center",
                  quoteVisible ? "opacity-100" : "opacity-0",
                )}>
                  <p className="text-xs italic text-primary leading-relaxed">
                    "{MOTIVATIONAL_QUOTES[quoteIndex].text}"
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-zara">
                    — {MOTIVATIONAL_QUOTES[quoteIndex].author}
                  </p>
                </div>
              </div>
              {/* 5 Progress Rings - equally spaced */}
              <div className="grid grid-cols-5 gap-0 py-2.5 border-t border-b border-border">
                {(() => {
                  const selectedHabit = selectedActivityId ? activities.find(a => a.id === selectedActivityId) : null;
                  let totalGoalPercent = 0;
                  if (selectedHabit) {
                    const tc = Object.keys(selectedHabit.completions || {}).length;
                    totalGoalPercent = Math.round((tc / selectedHabit.habitDays) * 100);
                  } else {
                    const ta = overallStats.totalCompleted + overallStats.totalRemaining;
                    totalGoalPercent = ta > 0 ? Math.round((overallStats.totalCompleted / ta) * 100) : 0;
                  }
                  const ringSize = 54;
                  return (
                    <>
                      <div className="flex justify-center"><ProgressRing progress={Math.min(totalGoalPercent, 100)} label="Goal" color={RING_COLORS[0]} size={ringSize} strokeWidth={5} /></div>
                      <div className="flex justify-center"><ProgressRing progress={overallStats.momentum} label="Drive" color={RING_COLORS[1]} size={ringSize} strokeWidth={5} /></div>
                      <div className="flex justify-center"><ProgressRing progress={overallStats.dailyProgress} label="Daily" color={RING_COLORS[2]} size={ringSize} strokeWidth={5} /></div>
                      <div className="flex justify-center"><ProgressRing progress={overallStats.weeklyProgress} label="Weekly" color={RING_COLORS[3]} size={ringSize} strokeWidth={5} /></div>
                      <div className="flex justify-center"><ProgressRing progress={overallStats.monthlyProgress} label="Overall" color={RING_COLORS[4]} size={ringSize} strokeWidth={5} /></div>
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_200px] lg:min-h-[280px] gap-0">
              {/* Left section — Month nav + Stats */}
              <div className="p-4 hidden lg:block border-r border-border">
                {/* Month Navigator */}
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setCurrentMonth(addDays(startOfMonth(currentMonth), -1))}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs font-medium text-foreground">
                    {format(currentMonth, "MMM-yy")}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setCurrentMonth(addDays(endOfMonth(currentMonth), 1))}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Habits count */}
                <div className="mb-3">
                  <p className="text-[10px] uppercase tracking-zara-wide text-muted-foreground mb-1.5">Habits</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="flex flex-col items-center p-1.5 rounded-lg border border-border bg-muted/20">
                      <span className="text-base font-medium text-primary">{activities.filter((a) => !a.isArchived).length}</span>
                      <span className="text-[8px] text-muted-foreground uppercase tracking-zara">Active</span>
                    </div>
                    <div className="flex flex-col items-center p-1.5 rounded-lg border border-border bg-muted/20">
                      <span className="text-base font-medium text-foreground">{activities.filter((a) => a.isArchived).length}</span>
                      <span className="text-[8px] text-muted-foreground uppercase tracking-zara">Done</span>
                    </div>
                    <div className="flex flex-col items-center p-1.5 rounded-lg border border-border bg-muted/20">
                      <span className="text-base font-medium text-foreground">{activities.length}</span>
                      <span className="text-[8px] text-muted-foreground uppercase tracking-zara">Total</span>
                    </div>
                  </div>
                </div>

                {/* Habit Days count */}
                <div>
                  <p className="text-[10px] uppercase tracking-zara-wide text-muted-foreground mb-1.5">Habit Days</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="flex flex-col items-center p-1.5 rounded-lg border border-border bg-muted/20">
                      <span className="text-base font-medium text-primary">{activities.reduce((sum, a) => sum + a.habitDays, 0) - overallStats.totalCompleted}</span>
                      <span className="text-[8px] text-muted-foreground uppercase tracking-zara">Pending</span>
                    </div>
                    <div className="flex flex-col items-center p-1.5 rounded-lg border border-border bg-muted/20">
                      <span className="text-base font-medium text-primary">{overallStats.totalCompleted}</span>
                      <span className="text-[8px] text-muted-foreground uppercase tracking-zara">Done</span>
                    </div>
                    <div className="flex flex-col items-center p-1.5 rounded-lg border border-border bg-muted/20">
                      <span className="text-base font-medium text-foreground">{activities.reduce((sum, a) => sum + a.habitDays, 0)}</span>
                      <span className="text-[8px] text-muted-foreground uppercase tracking-zara">Total</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center section — Quote + Rings + Top Habits (desktop only) */}
              <div className="p-4 hidden lg:flex flex-col justify-between overflow-hidden">
                {/* Quote at top center */}
                {(() => {
                  const currentQuote = MOTIVATIONAL_QUOTES[quoteIndex];
                  return (
                    <div
                      className={cn(
                        "mb-3 text-center transition-opacity duration-500 ease-in-out",
                        quoteVisible ? "opacity-100" : "opacity-0",
                      )}
                    >
                      <p className="text-xs italic text-primary leading-relaxed">
                        "{currentQuote.text}"
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-zara">
                        — {currentQuote.author}
                      </p>
                    </div>
                  );
                })()}

                {/* Selected habit indicator — always rendered to reserve space */}
                <div className={cn("flex items-center justify-center gap-3 border-l-2 pl-3 mb-2 h-5",
                  selectedActivityId ? "border-foreground" : "border-transparent invisible"
                )}>
                  {selectedActivityId && (() => {
                    const selectedHabit = activities.find((a) => a.id === selectedActivityId);
                    const startDateStr = selectedHabit?.startDate
                      ? format(parseISO(selectedHabit.startDate), "MMM d, yyyy")
                      : "N/A";
                    const endDate = selectedHabit?.startDate
                      ? computeEndDateForHabitDays(
                          parseISO(selectedHabit.startDate),
                          selectedHabit.frequencyPattern,
                          selectedHabit.habitDays,
                        )
                      : null;
                    const endDateStr = endDate ? format(endDate, "MMM d, yyyy") : "N/A";

                    return (
                      <>
                        <div>
                          <span className="text-xs font-normal text-foreground">{selectedHabit?.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">{startDateStr} → {endDateStr}</span>
                        </div>
                        <button
                          onClick={() => setSelectedActivityId(null)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    );
                  })()}
                </div>

                {/* Progress Rings — colored */}
                {(() => {
                  const selectedHabit = selectedActivityId ? activities.find((a) => a.id === selectedActivityId) : null;

                  let totalGoalPercent = 0;
                  if (selectedHabit) {
                    const totalCompletions = Object.keys(selectedHabit.completions || {}).length;
                    totalGoalPercent = Math.round((totalCompletions / selectedHabit.habitDays) * 100);
                  } else {
                    const totalCompleted = overallStats.totalCompleted;
                    const totalAll = overallStats.totalCompleted + overallStats.totalRemaining;
                    totalGoalPercent = totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 0;
                  }

                  return (
                    <div className="grid grid-cols-5 gap-1 md:flex md:justify-center md:gap-6 lg:gap-8 overflow-visible pb-1">
                      <ProgressRing progress={Math.min(totalGoalPercent, 100)} label="Goal" color={RING_COLORS[0]} mobileSize={58} />
                      <ProgressRing progress={overallStats.momentum} label="Drive" color={RING_COLORS[1]} mobileSize={58} />
                      <ProgressRing progress={overallStats.dailyProgress} label="Daily" color={RING_COLORS[2]} mobileSize={58} />
                      <ProgressRing progress={overallStats.weeklyProgress} label="Weekly" color={RING_COLORS[3]} mobileSize={58} />
                      <ProgressRing progress={overallStats.monthlyProgress} label="Overall" color={RING_COLORS[4]} mobileSize={58} />
                    </div>
                  );
                })()}

                {/* Top Habits — inline row */}
                <div className="mt-2 pt-2 border-t border-border overflow-hidden">
                  <div className="flex items-center gap-2 flex-nowrap overflow-hidden whitespace-nowrap">
                    <span className="text-[10px] uppercase tracking-zara-wide text-muted-foreground shrink-0">Top Habits</span>
                    {topHabits.slice(0, 5).map((habit, i) => (
                      <span key={habit.id} className="text-xs text-foreground shrink-0">
                        {habit.name} <span className="text-primary font-medium">{habit.streak}</span>
                        {i < Math.min(topHabits.length, 5) - 1 && <span className="text-muted-foreground mx-1">·</span>}
                      </span>
                    ))}
                    {topHabits.length === 0 && (
                      <span className="text-[10px] text-muted-foreground italic">No habits yet</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right section — Selected habit preview */}
              <div className="hidden lg:flex border-l border-border overflow-hidden relative">
                {(() => {
                  const selectedHabit = selectedActivityId ? activities.find((a) => a.id === selectedActivityId) : null;
                  if (selectedHabit) {
                    const imgUrl = selectedHabit.coverImageUrl || loadActivityImage(selectedHabit.id);
                    return imgUrl ? (
                      <div className="absolute inset-0">
                        <img src={imgUrl} alt={selectedHabit.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                          <span className="text-[10px] text-white uppercase tracking-zara">
                            {selectedHabit.name}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/30">
                        <Target className="h-8 w-8 text-muted-foreground opacity-30" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-zara text-center">
                          {selectedHabit.name}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div className="absolute inset-0">
                      <img src={habitsDefaultImage} alt="Habits" className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-3">
                        <span className="text-[10px] text-white/80 uppercase tracking-zara">
                          Select a habit
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </Card>

          {/* Habits Grid */}
          {/* Mobile Weekly Grid */}
          <Card className="md:hidden rounded-xl overflow-hidden mb-0">
            {/* Week Navigation */}
            <div className="px-4 pt-2 pb-1 border-b border-border">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-zara-wide text-muted-foreground">Daily Progress</p>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setMobileWeekOffset(prev => prev - 1)}>
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <span className="text-[9px] text-muted-foreground font-medium min-w-[60px] text-center">
                    {format(currentWeekDays[0], "MMM d")} – {format(currentWeekDays[6], "d")}
                  </span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setMobileWeekOffset(prev => prev + 1)} disabled={mobileWeekOffset >= 0}>
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            {/* Weekly Table with embedded graph row */}
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-1 pl-2 text-[9px] font-medium text-muted-foreground uppercase tracking-zara sticky left-0 bg-muted/50 z-10" style={{ width: 90 }}>Habit</th>
                  {currentWeekDays.map((day, i) => (
                    <th key={i} className={cn("p-0.5 text-center text-[9px] font-medium text-muted-foreground", isToday(day) && "bg-primary/10")}>
                      {DAY_LABELS[(day.getDay() + 6) % 7]}
                    </th>
                  ))}
                  <th className="p-0.5 text-center text-[9px] font-medium text-muted-foreground" style={{ width: 32 }}>%</th>
                </tr>
              </thead>
              <tbody>
                {/* Daily Progress Chart Row - aligned with day columns like desktop */}
                <tr>
                  <td className="p-0 bg-muted/30 sticky left-0 z-10" style={{ width: 90 }} />
                  <td colSpan={7} className="p-0 bg-muted/30">
                    <svg viewBox="0 0 700 120" className="w-full block" style={{ height: 56 }}>
                      {(() => {
                        const today = new Date();
                        const dataPoints: { x: number; y: number; value: number; isPast: boolean; isFuture: boolean }[] = [];
                        const chartActivities = selectedActivityId ? activities.filter(a => a.id === selectedActivityId) : activities.filter(a => !a.isArchived);

                        for (let i = 0; i < 7; i++) {
                          const day = currentWeekDays[i];
                          if (!day) continue;
                          const dayStr = format(day, "yyyy-MM-dd");
                          const dayOfWeek = (day.getDay() + 6) % 7;
                          const isPast = isBefore(day, today) || isToday(day);
                          const isFuture = isAfter(day, today);
                          let completed = 0, total = 0;
                          chartActivities.forEach(a => {
                            const hStart = parseISO(a.startDate);
                            const hEnd = computeEndDateForHabitDays(hStart, a.frequencyPattern, a.habitDays);
                            if (a.frequencyPattern[dayOfWeek] && !isBefore(day, hStart) && !isAfter(day, hEnd)) {
                              total++;
                              if (a.completions[dayStr]) completed++;
                            }
                          });
                          const value = total > 0 ? (completed / total) * 100 : -1;
                          const x = (i + 0.5) * 100;
                          if (value < 0) continue;
                          const y = 100 - (value / 100) * 80;
                          dataPoints.push({ x, y: Math.max(10, Math.min(110, y)), value, isPast, isFuture });
                        }

                        if (dataPoints.length < 2) return <text x="350" y="65" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="12" opacity="0.5">Not enough data</text>;

                        const createSmoothPath = (points: { x: number; y: number }[]) => {
                          if (points.length < 2) return "";
                          let path = `M ${points[0].x} ${points[0].y}`;
                          for (let j = 0; j < points.length - 1; j++) {
                            const current = points[j];
                            const next = points[j + 1];
                            const midX = (current.x + next.x) / 2;
                            const midY = (current.y + next.y) / 2;
                            path += ` Q ${current.x + (midX - current.x) * 0.5} ${current.y}, ${midX} ${midY}`;
                            path += ` Q ${midX + (next.x - midX) * 0.5} ${next.y}, ${next.x} ${next.y}`;
                          }
                          return path;
                        };

                        const linePath = createSmoothPath(dataPoints);
                        const areaPath = `${linePath} L ${dataPoints[dataPoints.length - 1].x} 115 L ${dataPoints[0].x} 115 Z`;

                        return (
                          <>
                            <defs>
                              <linearGradient id="mobileAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#5EEAD4" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#5EEAD4" stopOpacity="0.05" />
                              </linearGradient>
                            </defs>
                            <path d={areaPath} fill="url(#mobileAreaGrad)" />
                            {dataPoints.map((p, i) => {
                              if (i === 0) return null;
                              const prev = dataPoints[i - 1];
                              const segmentPath = createSmoothPath([prev, p]);
                              const isRedSegment = (prev.isPast && prev.value === 0) && (p.isPast && p.value === 0);
                              return <path key={`seg-${i}`} d={segmentPath} fill="none" stroke={isRedSegment ? "#EF4444" : "#5EEAD4"} strokeWidth="2.5" strokeLinecap="round" />;
                            })}
                            {dataPoints.map((p, i) => (
                              <circle key={i} cx={p.x} cy={p.y} r="4"
                                fill={p.isFuture ? "hsl(var(--border))" : p.isPast && p.value === 0 ? "#EF4444" : "#2DD4BF"}
                                stroke="hsl(var(--background))" strokeWidth="1.5"
                              />
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </td>
                  <td className="p-0 bg-muted/30" style={{ width: 32 }} />
                </tr>
                {activities.filter(a => !a.isArchived).map((activity, idx) => {
                  const stats = activityStats.find(s => s.id === activity.id);
                  const totalCompletions = Object.keys(activity.completions || {}).length;
                  const progressPercent = activity.habitDays > 0 ? Math.round((totalCompletions / activity.habitDays) * 100) : 0;
                  const isSelected = selectedActivityId === activity.id;

                  return (
                    <tr
                      key={activity.id}
                      className={cn(
                        "border-b border-border/40 transition-colors",
                        isSelected ? "bg-primary/5" : idx % 2 === 1 ? "bg-muted/20" : ""
                      )}
                      onClick={() => setSelectedActivityId(isSelected ? null : activity.id)}
                    >
                      <td className={cn("p-1 pl-2 sticky left-0 z-10", isSelected ? "bg-primary/5" : idx % 2 === 1 ? "bg-muted/20" : "bg-background")} style={{ width: 90 }}>
                        <div className="flex items-center gap-1">
                          <button
                            className="text-[11px] font-medium text-foreground truncate max-w-[65px] block text-left"
                            onClick={(e) => { e.stopPropagation(); setHabitDetailId(activity.id); }}
                          >
                            {activity.name}
                          </button>
                          
                        </div>
                      </td>
                      {currentWeekDays.map((day, i) => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const dayOfWeek = (day.getDay() + 6) % 7;
                        const isPlanned = activity.frequencyPattern[dayOfWeek];
                        const isCompleted = activity.completions[dateStr];
                        const isPast = isBefore(day, new Date()) || isToday(day);
                        const habitStart = parseISO(activity.startDate);
                        const habitEnd = computeEndDateForHabitDays(habitStart, activity.frequencyPattern, activity.habitDays);
                        const isInRange = !isBefore(day, habitStart) && !isAfter(day, habitEnd);

                        return (
                          <td key={i} className={cn("p-0.5 text-center", isToday(day) && "bg-primary/5")}>
                            {isPlanned && isInRange ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); if (isPast) toggleCompletion(activity.id, day); }}
                                disabled={!isPast}
                                className={cn(
                                  "w-6 h-6 rounded-md flex items-center justify-center mx-auto transition-all",
                                  isCompleted ? "bg-emerald-400 text-white" : isPast ? "border border-muted-foreground/30" : "border border-border"
                                )}
                              >
                                {isCompleted && <Check className="h-3 w-3 stroke-[3]" />}
                              </button>
                            ) : (
                              <span className="text-muted-foreground/30 text-[9px]">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-0.5 text-center text-[10px] text-muted-foreground font-medium">
                        <div className="flex items-center justify-center gap-1">
                          <svg width="14" height="14" viewBox="0 0 20 20" className="shrink-0">
                            <circle cx="10" cy="10" r="9" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
                            <circle cx="10" cy="10" r="7" fill="none" stroke="#2DD4BF" strokeWidth="4"
                              strokeDasharray={`${(progressPercent / 100) * 43.98} 43.98`}
                              strokeLinecap="round" transform="rotate(-90 10 10)" />
                          </svg>
                          <span>{progressPercent}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* Desktop Full Month Table */}
          <Card className="hidden md:block rounded-xl overflow-hidden" data-habits-table>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    <th className="text-left p-2 font-semibold text-slate-600 dark:text-slate-300 sticky left-0 bg-slate-100 dark:bg-slate-800 min-w-[150px]">
                      DAILY HABITS
                    </th>
                    <th className="p-2 font-semibold text-slate-600 dark:text-slate-300 w-12">GOALS</th>
                    {daysInMonth.map((day, i) => {
                      // Correct week partition: Border on left of week start day
                      const isWeekStart = day.getDay() === weekStartsOn;
                      const isFirstDay = i === 0;
                      const isCurrentWeek = (() => {
                        const today = new Date();
                        const weekStart = startOfWeek(today, { weekStartsOn });
                        const weekEnd = addDays(weekStart, 6);
                        return !isBefore(day, weekStart) && !isAfter(day, weekEnd);
                      })();

                      return (
                        <th
                          key={i}
                          className={cn(
                            "p-1 font-medium text-center min-w-[28px]",
                            (isWeekStart || isFirstDay) && "border-l-2 border-slate-200 dark:border-slate-700",
                            isToday(day) && "bg-emerald-100 dark:bg-emerald-900/30",
                            isCurrentWeek && !isToday(day) && "bg-blue-50 dark:bg-blue-900/20",
                          )}
                        >
                          <div className="text-muted-foreground hidden md:block">{DAY_NAMES[(day.getDay() + 6) % 7]}</div>
                          <div className="text-muted-foreground md:hidden">{DAY_LABELS[(day.getDay() + 6) % 7]}</div>
                          <div
                            className={cn(
                              "text-foreground/70",
                              isToday(day) && "text-primary font-bold",
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
                  {/* Daily Progress Chart Row - embedded in table for perfect date alignment */}
                  <tr>
                    <td className="sticky left-0 bg-muted/30 p-2 text-xs font-medium text-muted-foreground align-bottom" colSpan={2}>
                      DAILY PROGRESS
                    </td>
                    <td colSpan={daysInMonth.length} className="p-0 bg-muted/30">
                      <svg viewBox={`0 0 ${daysInMonth.length * 100} 220`} className="w-full" style={{ height: 180 }} preserveAspectRatio="none">
                        {(() => {
                          const numDays = daysInMonth.length;
                          const today = new Date();
                          const vbWidth = numDays * 100;
                          const dataPoints: { x: number; y: number; value: number; isPast: boolean; isFuture: boolean }[] = [];

                          for (let i = 0; i < numDays; i++) {
                            const day = daysInMonth[i];
                            if (!day) continue;
                            const dayStr = format(day, "yyyy-MM-dd");
                            const dayOfWeek = (day.getDay() + 6) % 7;
                            const isPast = isBefore(day, today) || isToday(day);
                            const isFuture = isAfter(day, today);

                            const chartActivities = selectedActivityId
                              ? activities.filter((a) => a.id === selectedActivityId)
                              : activities;

                            let completed = 0;
                            let total = 0;
                            chartActivities.forEach((a) => {
                              const habitStartDate = parseISO(a.startDate);
                              const habitEndDate = computeEndDateForHabitDays(habitStartDate, a.frequencyPattern, a.habitDays);
                              const isWithinHabitRange = !isBefore(day, habitStartDate) && !isAfter(day, habitEndDate);
                              if (a.frequencyPattern[dayOfWeek] && isWithinHabitRange) {
                                total++;
                                if (a.completions[dayStr]) completed++;
                              }
                            });

                            const value = total > 0 ? (completed / total) * 100 : -1;
                            const x = (i + 0.5) * 100;
                            if (value < 0) {
                              // No habits scheduled this day — skip data point
                              continue;
                            }
                            const rawY = 190 - (value / 100) * 160;
                            const y = Math.max(10, Math.min(200, rawY));
                            dataPoints.push({ x, y, value, isPast, isFuture });
                          }

                          if (dataPoints.length < 2) return null;

                          const createSmoothPath = (points: { x: number; y: number }[]) => {
                            if (points.length < 2) return "";
                            let path = `M ${points[0].x} ${points[0].y}`;
                            for (let j = 0; j < points.length - 1; j++) {
                              const current = points[j];
                              const next = points[j + 1];
                              const midX = (current.x + next.x) / 2;
                              const midY = (current.y + next.y) / 2;
                              path += ` Q ${current.x + (midX - current.x) * 0.5} ${current.y}, ${midX} ${midY}`;
                              path += ` Q ${midX + (next.x - midX) * 0.5} ${next.y}, ${next.x} ${next.y}`;
                            }
                            return path;
                          };

                          const linePath = createSmoothPath(dataPoints);
                          const areaPath = `${linePath} L ${dataPoints[dataPoints.length - 1].x} 215 L ${dataPoints[0].x} 215 Z`;

                          return (
                            <>
                              <defs>
                                <linearGradient id="tableAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#5EEAD4" stopOpacity="0.25" />
                                  <stop offset="100%" stopColor="#5EEAD4" stopOpacity="0.05" />
                                </linearGradient>
                              </defs>
                              <path d={areaPath} fill="url(#tableAreaGradient)" />
                              {dataPoints.map((point, i) => {
                                if (i === 0) return null;
                                const prev = dataPoints[i - 1];
                                const segmentPath = createSmoothPath([prev, point]);
                                const isRedSegment = (prev.isPast && prev.value === 0) && (point.isPast && point.value === 0);
                                return <path key={`seg-${i}`} d={segmentPath} fill="none" stroke={isRedSegment ? "#EF4444" : "#5EEAD4"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />;
                              })}
                              <line x1="0" y1="210" x2={vbWidth} y2="210" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="4 4" />
                              {dataPoints.map((point, i) => {
                                const isMissed = point.isPast && point.value === 0;
                                return (
                                  <circle
                                    key={i}
                                    cx={point.x}
                                    cy={point.y}
                                    r={isMissed ? "6" : "4"}
                                    fill={point.isFuture ? "hsl(var(--border))" : isMissed ? "#EF4444" : "#2DD4BF"}
                                    stroke="hsl(var(--background))"
                                    strokeWidth="2"
                                  >
                                    <title>{`${Math.round(point.value)}%${isMissed ? " (Missed)" : point.isFuture ? " (Upcoming)" : ""}`}</title>
                                  </circle>
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>
                    </td>
                    <td colSpan={2} className="bg-muted/30"></td>
                  </tr>
                  {/* Render Active Habits */}
                  {activities
                    .map((a, i) => ({ ...a, originalIndex: i }))
                    .filter((a) => !a.isArchived)
                    .map((activity) => renderRow(activity, activity.originalIndex, true))}

                  {/* Render Archived Habits Section */}
                  {activities.some((a) => a.isArchived) && (
                    <>
                      {/* Separator / Toggle Row */}
                      <tr
                        className="bg-slate-50/80 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => setShowArchived(!showArchived)}
                      >
                        <td colSpan={daysInMonth.length + 4} className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
                            {showArchived ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            <span>
                              {showArchived ? "Hide" : "Show"} {activities.filter((a) => a.isArchived).length} Completed
                              Habits
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Archived Rows */}
                      {showArchived &&
                        activities
                          .map((a, i) => ({ ...a, originalIndex: i }))
                          .filter((a) => a.isArchived)
                          .map((activity) => renderRow(activity, activity.originalIndex, false))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile FAB removed - create button moved to header */}
        </div>

        {/* Mobile Insights Drawer */}
        <Sheet open={insightsOpen} onOpenChange={setInsightsOpen}>
          <SheetContent side="right" className="w-[90%] max-w-sm p-0 overflow-y-auto">
            <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
              <SheetTitle>Insights</SheetTitle>
            </SheetHeader>
            <div className="px-5 py-4 space-y-5">
              {/* Month Navigator */}
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addDays(startOfMonth(currentMonth), -1))}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs font-medium uppercase tracking-zara-wide text-foreground">{format(currentMonth, "MMMM yyyy")}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addDays(endOfMonth(currentMonth), 1))}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Habits Count */}
              <div>
                <p className="text-[10px] uppercase tracking-zara-wide text-muted-foreground mb-2">Habits</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center p-3 rounded-xl border border-border bg-muted/20">
                    <span className="text-lg font-semibold text-primary">{activities.filter((a) => !a.isArchived).length}</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-zara">Active</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-xl border border-border bg-muted/20">
                    <span className="text-lg font-semibold text-foreground">{activities.filter((a) => a.isArchived).length}</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-zara">Done</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-xl border border-border bg-muted/20">
                    <span className="text-lg font-semibold text-foreground">{activities.length}</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-zara">Total</span>
                  </div>
                </div>
              </div>

              {/* Habit Days Summary Cards */}
              <div>
                <p className="text-[10px] uppercase tracking-zara-wide text-muted-foreground mb-2">Habit Days</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center p-3 rounded-xl border border-border bg-muted/20">
                    <span className="text-lg font-semibold text-foreground">{activities.reduce((sum, a) => sum + a.habitDays, 0) - overallStats.totalCompleted}</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-zara">Pending</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-xl border border-border bg-muted/20">
                    <span className="text-lg font-semibold text-primary">{overallStats.totalCompleted}</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-zara">Done</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-xl border border-border bg-muted/20">
                    <span className="text-lg font-semibold text-foreground">{activities.reduce((sum, a) => sum + a.habitDays, 0)}</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-zara">Total</span>
                  </div>
                </div>
              </div>

              {/* Active Streaks moved up, image removed */}

              {/* Top Habits List */}
              <div>
                <p className="text-[10px] uppercase tracking-zara-wide text-muted-foreground mb-2">Top Habits</p>
                {topHabits.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No habits tracked yet</p>
                ) : (
                  <div className="space-y-2">
                    {topHabits.map((habit, i) => {
                      const activity = activities.find(a => a.id === habit.id);
                      const totalCompletions = Object.keys(activity?.completions || {}).length;
                      const progressPercent = activity && activity.habitDays > 0 ? Math.round((totalCompletions / activity.habitDays) * 100) : 0;
                      return (
                        <div key={habit.id} className="flex items-center gap-3">
                          <span className="text-[10px] text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{habit.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${progressPercent}%` }} />
                              </div>
                              <span className="text-[10px] text-muted-foreground">{progressPercent}%</span>
                            </div>
                          </div>
                          {(habit.streak || 0) > 0 && (
                            <span className="text-[10px] text-foreground shrink-0">🔥{habit.streak}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active Streaks */}
              {activeStreaks.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-zara-wide text-muted-foreground mb-2">Active Streaks</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeStreaks.map(s => (
                      <span key={s.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-[10px] text-foreground">
                        <Flame className="h-3 w-3 text-primary" /> {s.name} <span className="font-semibold">{s.streak}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile Habit Detail Modal */}
        {(() => {
          const detailHabit = habitDetailId ? activities.find(a => a.id === habitDetailId) : null;
          if (!detailHabit) return null;
          const startDateStr = format(parseISO(detailHabit.startDate), "MMM d");
          const endDate = computeEndDateForHabitDays(parseISO(detailHabit.startDate), detailHabit.frequencyPattern, detailHabit.habitDays);
          const endDateStr = format(endDate, "MMM d");
          const totalCompletions = Object.keys(detailHabit.completions || {}).length;
          const progressPercent = detailHabit.habitDays > 0 ? Math.round((totalCompletions / detailHabit.habitDays) * 100) : 0;
          const todayStr = format(new Date(), "yyyy-MM-dd");
          const isTodayDone = detailHabit.completions[todayStr];
          const detailStats = activityStats.find(s => s.id === detailHabit.id);
          const imgUrl = detailHabit.coverImageUrl || loadActivityImage(detailHabit.id);

          return (
            <Dialog open={!!habitDetailId} onOpenChange={(o) => { if (!o) setHabitDetailId(null); }}>
              <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm p-0 rounded-2xl overflow-hidden">
                {/* Image header */}
                {imgUrl ? (
                  <div className="relative h-40 w-full">
                    <img src={imgUrl} alt={detailHabit.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="text-base font-semibold text-foreground">{detailHabit.name}</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-zara">{startDateStr} → {endDateStr}</p>
                    </div>
                  </div>
                ) : (
                  <div className="px-5 pt-6 pb-2">
                    <h3 className="text-base font-semibold text-foreground">{detailHabit.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-zara mt-0.5">{startDateStr} → {endDateStr}</p>
                  </div>
                )}

                {/* Details */}
                <div className="px-5 pb-5 space-y-4">
                  {detailHabit.description && (
                    <p className="text-xs text-muted-foreground">{detailHabit.description}</p>
                  )}

                  {/* Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-zara-wide text-muted-foreground">Progress</span>
                      <span className="text-xs font-medium text-foreground">{totalCompletions}/{detailHabit.habitDays} ({progressPercent}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-sm font-semibold text-foreground">{detailStats?.streak || 0}</p>
                      <p className="text-[9px] uppercase tracking-zara text-muted-foreground">Streak</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-sm font-semibold text-foreground">{totalCompletions}</p>
                      <p className="text-[9px] uppercase tracking-zara text-muted-foreground">Done</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-sm font-semibold text-foreground">{detailHabit.habitDays - totalCompletions}</p>
                      <p className="text-[9px] uppercase tracking-zara text-muted-foreground">Remaining</p>
                    </div>
                  </div>

                  {/* Frequency */}
                  <div>
                    <p className="text-[10px] uppercase tracking-zara-wide text-muted-foreground mb-1.5">Schedule</p>
                    <div className="flex gap-1.5">
                      {DAY_LABELS.map((d, i) => (
                        <span key={i} className={cn(
                          "h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-medium",
                          detailHabit.frequencyPattern[i] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>{d}</span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => { setHabitDetailId(null); openEditDialog(detailHabit); }}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => { toggleCompletion(detailHabit.id, new Date()); }}
                    >
                      <Check className="h-3.5 w-3.5 mr-1.5" /> {isTodayDone ? "Undo Today" : "Mark Today"}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    {!detailHabit.isArchived && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => { setHabitDetailId(null); handleCompleteHabit(detailHabit.id); }}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Complete
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        if (confirm("Delete this habit?")) {
                          setHabitDetailId(null);
                          handleDelete(detailHabit.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          );
        })()}

        {/* Create Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg p-0 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Emerald gradient header — matches Reality/Task modal pattern */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 text-white flex-shrink-0">
              <DialogTitle className="text-lg font-semibold text-white">
                {editingActivity ? "Edit Activity" : "Create New Habit"}
              </DialogTitle>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Habit Name</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Drink 2.5L of water"
                  className="rounded-xl"
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
                  <UnifiedDatePicker
                    value={formStartDate}
                    onChange={(date) => { if (date) setFormStartDate(date); }}
                    displayFormat="PPP"
                    triggerClassName="w-full rounded-xl h-10"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Goal (habit days)</label>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={formDays}
                    onChange={(e) => setFormDays(e.target.value)}
                    onBlur={(e) => {
                      const num = parseInt(e.target.value);
                      if (isNaN(num) || num < 1) {
                        setFormDays("1");
                      } else if (num > 365) {
                        setFormDays("365");
                      }
                    }}
                    className="rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    End:{" "}
                    {format(
                      computeEndDateForHabitDays(formStartDate, formFrequency, parseInt(formDays) || 1),
                      "d MMM, yyyy",
                    )}
                  </p>
                </div>
              </div>

              {/* Time Scheduling */}
              <div>
                <label className="text-sm font-medium mb-2 block">Scheduled Time</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Start time</p>
                    <UnifiedTimePicker
                      value={formTime}
                      onChange={(v) => setFormTime(v)}
                      intervalMinutes={30}
                      triggerClassName="w-full rounded-xl h-10"
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
                <div className="flex gap-4 items-start">
                  {/* 9:16 Preview */}
                  <div
                    className="w-16 rounded-lg overflow-hidden bg-muted border-2 border-border flex-shrink-0"
                    style={{ aspectRatio: "9/16" }}
                  >
                    {formImageUrl ? (
                      <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/80">
                        <Target className="h-4 w-4 text-muted-foreground mb-0.5" />
                        <p className="text-[6px] text-muted-foreground text-center px-1">9:16</p>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <ActivityImageUpload imageUrl={formImageUrl} onImageChange={setFormImageUrl} compact />
                  </div>
                </div>
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
                        formFrequency[idx]
                          ? "bg-emerald-500 text-white"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {!editingActivity && (
                <div className="flex items-center space-x-2 p-3 rounded-xl bg-muted/50">
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
                <Button className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg transition-all" onClick={handleSave}>
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
