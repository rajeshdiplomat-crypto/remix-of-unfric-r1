import { useState, useMemo } from "react";
import { format, addDays, startOfWeek, isToday, isBefore, isAfter, parseISO, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, subDays } from "date-fns";
import { computeEndDateForHabitDays, getScheduledDates } from "@/lib/dateUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus, MoreVertical, Target, TrendingUp, Calendar as CalendarIcon, CheckCircle2, 
  Flame, Activity, LayoutGrid, List, ChevronLeft, ChevronRight, Download,
  Lightbulb, Clock, Zap, BarChart2, CalendarDays, Timer
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";
import { ActivityImageUpload, loadActivityImage, saveActivityImage, loadAllActivityImages } from "@/components/trackers/ActivityImageUpload";
import { ActivityDetailPanel } from "@/components/trackers/ActivityDetailPanel";
import { TooltipProvider } from "@/components/ui/tooltip";

interface ActivityItem {
  id: string;
  name: string;
  category: string;
  priority: string;
  description: string;
  frequencyPattern: boolean[];
  habitDays: number; // Number of measured habit occurrences
  startDate: string;
  completions: Record<string, boolean>;
  createdAt: string;
  notes?: Record<string, string>;
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
    habitDays: 22, // 22 weekday sessions
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
    habitDays: 30, // 30 daily sessions
    startDate: format(addDays(new Date(), -30), "yyyy-MM-dd"),
    completions: Object.fromEntries(
      Array.from({ length: 28 }, (_, i) => [
        format(addDays(new Date(), -30 + i), "yyyy-MM-dd"),
        true,
      ])
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
    habitDays: 44, // ~44 weekday sessions over ~2 months
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
    habitDays: 7, // 7 daily sessions
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
  const [activities, setActivities] = useState<ActivityItem[]>(SAMPLE_ACTIVITIES);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("health");
  const [formPriority, setFormPriority] = useState("Medium");
  const [formDescription, setFormDescription] = useState("");
  const [formFrequency, setFormFrequency] = useState([true, true, true, true, true, false, false]);
  const [formDays, setFormDays] = useState(30);
  const [formStartDate, setFormStartDate] = useState<Date>(new Date());
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null);

  // Compute end date based on habit days (number of occurrences)
  const getEndDate = (activity: ActivityItem) => {
    return computeEndDateForHabitDays(
      parseISO(activity.startDate),
      activity.frequencyPattern,
      activity.habitDays
    );
  };

  // Days left until end (calendar days)
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

  // FIXED: Calculate scheduled sessions (only selected weekdays within date range)
  const getScheduledSessions = (activity: ActivityItem) => {
    let count = 0;
    const startDate = parseISO(activity.startDate);
    const endDate = getEndDate(activity);
    const today = new Date();
    
    let currentDate = startDate;
    while (!isAfter(currentDate, endDate)) {
      const dayOfWeek = (currentDate.getDay() + 6) % 7; // Mon=0, Sun=6
      if (activity.frequencyPattern[dayOfWeek]) {
        count++;
      }
      currentDate = addDays(currentDate, 1);
    }
    return count;
  };

  // Get past scheduled sessions (for completion calculation)
  const getPastScheduledSessions = (activity: ActivityItem) => {
    let count = 0;
    const startDate = parseISO(activity.startDate);
    const today = new Date();
    const endDate = getEndDate(activity);
    const effectiveEnd = isBefore(today, endDate) ? today : endDate;
    
    let currentDate = startDate;
    while (!isAfter(currentDate, effectiveEnd)) {
      const dayOfWeek = (currentDate.getDay() + 6) % 7;
      if (activity.frequencyPattern[dayOfWeek]) {
        count++;
      }
      currentDate = addDays(currentDate, 1);
    }
    return count;
  };

  const getCompletedSessions = (activity: ActivityItem) => {
    return Object.values(activity.completions).filter(Boolean).length;
  };

  const getSessionsLeft = (activity: ActivityItem) => {
    return Math.max(0, getScheduledSessions(activity) - getCompletedSessions(activity));
  };

  // FIXED: Completion % based on scheduled vs completed sessions
  const getCompletionPercent = (activity: ActivityItem) => {
    const scheduled = getPastScheduledSessions(activity);
    if (scheduled === 0) return 0;
    return Math.round((getCompletedSessions(activity) / scheduled) * 100);
  };

  // Streak calculations
  const getCurrentStreak = (activity: ActivityItem) => {
    let streak = 0;
    let checkDate = new Date();
    
    while (true) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const dayOfWeek = (checkDate.getDay() + 6) % 7;
      const isPlanned = activity.frequencyPattern[dayOfWeek];
      
      if (isPlanned) {
        if (activity.completions[dateStr]) {
          streak++;
        } else if (!isToday(checkDate)) {
          break;
        }
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
        } else {
          current = 0;
        }
      }
      checkDate = addDays(checkDate, 1);
    }
    
    return longest;
  };

  // Today's completion for graphs
  const getTodayCompletion = () => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const todayDayOfWeek = (new Date().getDay() + 6) % 7;
    
    let scheduledToday = 0;
    let completedToday = 0;
    
    activities.forEach(a => {
      const startDate = parseISO(a.startDate);
      const endDate = getEndDate(a);
      const today = new Date();
      
      if (!isBefore(today, startDate) && !isAfter(today, endDate)) {
        if (a.frequencyPattern[todayDayOfWeek]) {
          scheduledToday++;
          if (a.completions[todayStr]) {
            completedToday++;
          }
        }
      }
    });
    
    return scheduledToday > 0 ? Math.round((completedToday / scheduledToday) * 100) : 100;
  };

  // Last 7 days trend data
  const getLast7DaysTrend = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayOfWeek = (date.getDay() + 6) % 7;
      
      let scheduled = 0;
      let completed = 0;
      
      activities.forEach(a => {
        const startDate = parseISO(a.startDate);
        const endDate = getEndDate(a);
        
        if (!isBefore(date, startDate) && !isAfter(date, endDate)) {
          if (a.frequencyPattern[dayOfWeek]) {
            scheduled++;
            if (a.completions[dateStr]) {
              completed++;
            }
          }
        }
      });
      
      data.push({
        day: format(date, "EEE"),
        date: format(date, "MMM d"),
        completion: scheduled > 0 ? Math.round((completed / scheduled) * 100) : 100,
        completed,
        scheduled,
      });
    }
    return data;
  }, [activities]);

  // Weekly stats
  const weeklyStats = useMemo(() => {
    const last7Days = getLast7DaysTrend;
    const avgCompletion = Math.round(last7Days.reduce((sum, d) => sum + d.completion, 0) / 7);
    const totalCompleted = last7Days.reduce((sum, d) => sum + d.completed, 0);
    const totalScheduled = last7Days.reduce((sum, d) => sum + d.scheduled, 0);
    const missedDays = last7Days.filter(d => d.scheduled > 0 && d.completion < 100).length;
    
    return { avgCompletion, totalCompleted, totalScheduled, missedDays };
  }, [getLast7DaysTrend]);

  // Insights calculations
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
      if (activity.frequencyPattern[dayOfWeek]) {
        dayPlanned[dayOfWeek]++;
      }
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

  const getWeekDays = () => {
    return Array.from({ length: 7 }, (_, i) => addDays(selectedWeekStart, i));
  };

  const isPlannedForDate = (activity: ActivityItem, date: Date) => {
    const startDate = parseISO(activity.startDate);
    const endDate = getEndDate(activity);
    if (isBefore(date, startDate) || isAfter(date, endDate)) return false;
    const dayOfWeek = (date.getDay() + 6) % 7;
    return activity.frequencyPattern[dayOfWeek];
  };

  const toggleCompletion = (activityId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setActivities(activities.map((a) => {
      if (a.id !== activityId) return a;
      const newCompletions = { ...a.completions };
      if (newCompletions[dateStr]) {
        delete newCompletions[dateStr];
      } else {
        newCompletions[dateStr] = true;
      }
      return { ...a, completions: newCompletions };
    }));
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
    // Keep the reference updated with the latest from activities array
    const current = activities.find(a => a.id === activity.id);
    setSelectedActivity(current || activity);
  };

  const handleSkipDay = (activityId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setActivities(activities.map((a) => {
      if (a.id !== activityId) return a;
      const currentSkipped = (a as any).skipped || {};
      const skipped = { ...currentSkipped, [dateStr]: true };
      return { ...a, skipped };
    }));
    toast({ title: "Day skipped" });
  };

  const handleImageChange = (activityId: string, imageUrl: string | null) => {
    saveActivityImage(activityId, imageUrl);
  };

  const handleSave = () => {
    if (!formName.trim()) return;

    // Calculate scheduled sessions for preview
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
    };

    const scheduledSessions = getScheduledSessions(tempActivity);

    // Save image if provided
    if (formImageUrl) {
      saveActivityImage(tempActivity.id, formImageUrl);
    }

    if (editingActivity) {
      setActivities(activities.map((a) =>
        a.id === editingActivity.id ? tempActivity : a
      ));
      toast({ 
        title: "Activity updated",
        description: `${scheduledSessions} habit sessions scheduled`,
      });
    } else {
      setActivities([tempActivity, ...activities]);
      toast({ 
        title: "Activity created",
        description: `${scheduledSessions} habit sessions scheduled`,
      });
    }
    setDialogOpen(false);
  };

  const handleDelete = (activityId: string) => {
    setActivities(activities.filter((a) => a.id !== activityId));
    setSelectedActivities(prev => {
      const next = new Set(prev);
      next.delete(activityId);
      return next;
    });
    toast({ title: "Activity deleted" });
  };

  const handleBulkComplete = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setActivities(activities.map((a) => {
      if (!selectedActivities.has(a.id)) return a;
      if (!isPlannedForDate(a, date)) return a;
      return { ...a, completions: { ...a.completions, [dateStr]: true } };
    }));
    toast({ title: `Marked ${selectedActivities.size} activities complete` });
  };

  const handleExport = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      activities: activities.map(a => ({
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

  // Dashboard KPIs
  const activeCount = activities.filter((a) => getStatus(a) === "active").length;
  const totalStreak = activities.reduce((sum, a) => sum + getCurrentStreak(a), 0);
  const weekDays = getWeekDays();
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

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[0];
  };

  // Heatmap data for current month
  const getHeatmapData = (activity: ActivityItem) => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => ({
      date: day,
      completed: activity.completions[format(day, "yyyy-MM-dd")] || false,
      planned: isPlannedForDate(activity, day),
    }));
  };

  const todayCompletion = getTodayCompletion();

  // Keep selected activity synced with latest data
  const currentSelectedActivity = selectedActivity 
    ? activities.find(a => a.id === selectedActivity.id) || null 
    : null;

  return (
    <TooltipProvider>
    <div className="w-full flex-1 flex gap-6">
      {/* Left content area */}
      <div className="flex-1 min-w-0 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Activity Tracker</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Monitor your long-term goals and daily commitments.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button className="flex-1 sm:flex-none" size="sm" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Activity
          </Button>
        </div>
      </div>

      {/* Dashboard KPIs + Graphs Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Activity className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-foreground">{activeCount}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Active</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Flame className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-foreground">{totalStreak}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Total Streak</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-foreground">{weeklyStats.avgCompletion}%</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Weekly Avg</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-foreground">{completedThisWeek}/{plannedThisWeek}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">This Week</p>
            </div>
          </div>
        </Card>
        
        {/* Today's Completion Graph */}
        <Card className="p-3 md:p-4 col-span-2 lg:col-span-1">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] md:text-xs text-muted-foreground font-medium">Today</p>
              <p className="text-lg font-bold text-foreground">{todayCompletion}%</p>
            </div>
            <div className="flex-1 flex items-end">
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500"
                  style={{ width: `${todayCompletion}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Last 7 Days Trend */}
        <Card className="p-3 md:p-4 col-span-2 lg:col-span-1">
          <div className="flex flex-col h-full">
            <p className="text-[10px] md:text-xs text-muted-foreground font-medium mb-2">7-Day Trend</p>
            <div className="flex-1 min-h-[40px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getLast7DaysTrend} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Bar dataKey="completion" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Best Streak</p>
              <p className="text-lg font-bold text-foreground">
                {Math.max(...activities.map(a => getLongestStreak(a)), 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-3 bg-green-500/5 border-green-500/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Weekly Done</p>
              <p className="text-lg font-bold text-foreground">{weeklyStats.totalCompleted}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 bg-orange-500/5 border-orange-500/20">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Missed Days</p>
              <p className="text-lg font-bold text-foreground">{weeklyStats.missedDays}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 bg-purple-500/5 border-purple-500/20">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">Scheduled</p>
              <p className="text-lg font-bold text-foreground">{weeklyStats.totalScheduled}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Week Navigation + Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Week Navigator */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs md:text-sm">
                <CalendarIcon className="h-3.5 w-3.5" />
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
            className="h-8 w-8"
            onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-xs"
            onClick={() => setSelectedWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          >
            Today
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <ScrollArea className="w-full md:w-auto">
            <div className="flex gap-1">
              <Button
                variant={categoryFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("all")}
                className="rounded-full text-xs h-7 px-2.5"
              >
                All
              </Button>
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.id}
                  variant={categoryFilter === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(cat.id)}
                  className="rounded-full text-xs h-7 px-2.5 whitespace-nowrap"
                >
                  {cat.label.split(" ")[0]}
                </Button>
              ))}
            </div>
          </ScrollArea>
          <div className="flex gap-1">
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("week")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "heatmap" ? "default" : "outline"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("heatmap")}
            >
              <BarChart2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "compact" ? "default" : "outline"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("compact")}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedActivities.size > 0 && (
        <Card className="p-3 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{selectedActivities.size} selected</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleBulkComplete(new Date())}>
                Mark Today Complete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedActivities(new Set())}>
                Clear
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Activity Cards */}
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
                "overflow-hidden cursor-pointer transition-colors",
                selectedActivity?.id === activity.id 
                  ? "border-primary ring-1 ring-primary" 
                  : "hover:border-primary/50"
              )}
              onClick={() => selectActivity(activity)}
            >
              <div className="p-3 md:p-4" onClick={(e) => e.stopPropagation()}>
                {/* Header Row */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedActivities.has(activity.id)}
                    onCheckedChange={(checked) => {
                      setSelectedActivities(prev => {
                        const next = new Set(prev);
                        if (checked) next.add(activity.id);
                        else next.delete(activity.id);
                        return next;
                      });
                    }}
                    className="mt-1"
                  />
                  
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `hsl(${category.color} / 0.2)` }}
                  >
                    <Target className="h-5 w-5" style={{ color: `hsl(${category.color})` }} />
                  </div>
                  
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectActivity(activity);
                    }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground hover:text-primary transition-colors">{activity.name}</h3>
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {category.label.split(" ")[0]}
                      </Badge>
                      {currentStreak > 0 && (
                        <Badge variant="outline" className="text-[10px] h-5 gap-1">
                          <Flame className="h-3 w-3 text-orange-500" />
                          {currentStreak}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                    
                    {/* FIXED: Duration & Sessions Info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {format(parseISO(activity.startDate), "MMM d")} → {format(getEndDate(activity), "MMM d")} ({activity.habitDays} sessions)
                      </span>
                      <span className="font-medium text-foreground">{daysLeft} days left</span>
                      <Badge 
                        variant="secondary"
                        className={cn("text-[10px] h-5", {
                          "bg-green-500/20 text-green-600": status === "active",
                          "bg-primary/20 text-primary": status === "completed",
                          "bg-orange-500/20 text-orange-600": status === "upcoming",
                        })}
                      >
                        {status}
                      </Badge>
                    </div>
                    
                    {/* Sessions Info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs">
                      <span className="text-muted-foreground">
                        <span className="font-medium text-foreground">{completedSessions}</span>/{scheduledSessions} sessions
                      </span>
                      <span className="text-muted-foreground">
                        <span className="font-medium text-foreground">{sessionsLeft}</span> sessions left
                      </span>
                      <span className="font-medium text-foreground">{percent}% complete</span>
                    </div>
                    
                    <Progress value={percent} className="h-1.5 mt-2" />
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => selectActivity(activity)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(activity)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(activity.id)} className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Tracker Grid */}
                <div className="mt-4 pl-10 md:pl-14">
                  {viewMode === "week" && (
                    <div className="flex gap-1.5 md:gap-2">
                      {weekDays.map((day, idx) => {
                        const isPlanned = isPlannedForDate(activity, day);
                        const isCompleted = activity.completions[format(day, "yyyy-MM-dd")];
                        const isFuture = isAfter(day, new Date());
                        
                        return (
                          <div key={idx} className="flex flex-col items-center flex-1">
                            <span className="text-[10px] text-muted-foreground mb-1 hidden md:block">
                              {format(day, "EEE")}
                            </span>
                            <span className="text-[10px] text-muted-foreground mb-1 md:hidden">
                              {DAY_LABELS[idx]}
                            </span>
                            <span className="text-[10px] text-muted-foreground mb-1 hidden md:block">
                              {format(day, "d")}
                            </span>
                            <button
                              onClick={() => isPlanned && !isFuture && toggleCompletion(activity.id, day)}
                              disabled={!isPlanned || isFuture}
                              className={cn(
                                "h-5 w-full max-w-[32px] rounded-sm transition-all",
                                isCompleted 
                                  ? "bg-green-500" 
                                  : isPlanned 
                                    ? isFuture 
                                      ? "bg-muted/50" 
                                      : "bg-muted hover:bg-muted-foreground/30 cursor-pointer" 
                                    : "bg-transparent",
                                isToday(day) && "ring-2 ring-primary ring-offset-1"
                              )}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {viewMode === "heatmap" && (
                    <div className="grid grid-cols-7 gap-0.5">
                      {getHeatmapData(activity).map((day, idx) => (
                        <button
                          key={idx}
                          onClick={() => day.planned && !isAfter(day.date, new Date()) && toggleCompletion(activity.id, day.date)}
                          disabled={!day.planned || isAfter(day.date, new Date())}
                          className={cn(
                            "h-3.5 w-full rounded-sm transition-all",
                            day.completed 
                              ? "bg-green-500" 
                              : day.planned 
                                ? "bg-muted/80" 
                                : "bg-transparent",
                            isToday(day.date) && "ring-1 ring-primary"
                          )}
                          title={format(day.date, "MMM d")}
                        />
                      ))}
                    </div>
                  )}

                  {viewMode === "compact" && (
                    <ScrollArea className="w-full">
                      <div className="flex gap-0.5">
                        {getScheduledDates(parseISO(activity.startDate), activity.frequencyPattern, Math.min(activity.habitDays, 60)).map((day, i) => {
                          const isPlanned = true; // All dates from getScheduledDates are planned
                          const isCompleted = activity.completions[format(day, "yyyy-MM-dd")];
                          const isFuture = isAfter(day, new Date());
                          
                          return (
                            <button
                              key={i}
                              onClick={() => isPlanned && !isFuture && toggleCompletion(activity.id, day)}
                              disabled={!isPlanned || isFuture}
                              className={cn(
                                "h-3 w-3 rounded-sm flex-shrink-0 transition-all",
                                isCompleted 
                                  ? "bg-green-500" 
                                  : isPlanned 
                                    ? "bg-muted hover:bg-muted-foreground/30" 
                                    : "bg-transparent"
                              )}
                              title={format(day, "EEE, MMM d")}
                            />
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                {/* Quick Stats Row */}
                <div className="flex items-center gap-4 mt-3 pl-10 md:pl-14 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    <span>Streak: {currentStreak}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-yellow-500" />
                    <span>Best: {longestStreak}</span>
                  </div>
                  <div className="flex items-center gap-1 hidden sm:flex">
                    <Lightbulb className="h-3 w-3 text-primary" />
                    <span>Best on {insights.bestDay}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredActivities.length === 0 && (
        <Card className="p-8 text-center">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium text-foreground mb-1">No activities found</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first activity to start tracking</p>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Activity
          </Button>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingActivity ? "Edit Activity" : "Create New Activity"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
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
                  <SelectTrigger>
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
                  <SelectTrigger>
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
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
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
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Number of measured habit occurrences
                </p>
                <p className="text-[10px] text-primary font-medium mt-1">
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
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Cover Image (optional)</label>
              <ActivityImageUpload
                imageUrl={formImageUrl}
                onImageChange={setFormImageUrl}
                compact
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Frequency Pattern</label>
              <p className="text-xs text-muted-foreground mb-2">Select the days you plan to perform this activity.</p>
              <div className="flex gap-2">
                {DAY_LABELS.map((day, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const newPattern = [...formFrequency];
                      newPattern[idx] = !newPattern[idx];
                      setFormFrequency(newPattern);
                    }}
                    className={cn(
                      "h-9 w-9 rounded-full font-medium text-sm transition-colors",
                      formFrequency[idx]
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
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
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={!formName.trim()}>
                {editingActivity ? "Save Changes" : "Create Activity"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      </div>

      {/* Right panel - Activity Details */}
      <ActivityDetailPanel
        activity={currentSelectedActivity}
        onEdit={openEditDialog}
        onToggleCompletion={toggleCompletion}
        onSkipDay={handleSkipDay}
        onImageChange={handleImageChange}
      />
    </div>
    </TooltipProvider>
  );
}
