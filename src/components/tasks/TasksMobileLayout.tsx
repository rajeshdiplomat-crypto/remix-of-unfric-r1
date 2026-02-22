import { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  BarChart3,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Check,
  Play,
  Loader2,
  ChevronDown,
  ChevronUp,
  Flame,
  Sparkles,
  Archive,
  Timer,
  Hourglass,
  List,
  Columns3,
  Pause,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  format,
  subDays,
  addDays,
  startOfDay,
  isSameDay,
  endOfDay,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
} from "date-fns";

import { QuadrantTask, computeTaskStatus, QUADRANT_MODES, QuadrantMode } from "./types";
import { TopFocusBar } from "./TopFocusBar";
import { AllTasksList } from "./AllTasksList";
import { KanbanBoardView } from "./KanbanBoardView";
import { BoardView } from "./BoardView";
import { useTimezone } from "@/hooks/useTimezone";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import { useDatePreferences } from "@/hooks/useDatePreferences";
import type { TasksViewTab } from "./TasksViewTabs";

type TimePeriod = "today" | "tomorrow" | "week";
type ClockMode = "digital" | "timer" | "stopwatch" | "calendar";

// ─── Mini KPI ───
function MobileKpi({
  icon: Icon,
  value,
  label,
  iconClass,
}: {
  icon: React.ElementType;
  value: React.ReactNode;
  label: string;
  iconClass: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-muted/40 border border-border px-2 py-1">
      <Icon className={cn("h-3 w-3 shrink-0", iconClass)} />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground leading-none">{value}</p>
        <p className="text-[7px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Mobile Task Card (compact, matches list view style) ───
function getMobileCardBorderClass(task: QuadrantTask) {
  if (task.is_completed) return "border-l-muted-foreground/30";
  if (task.status === "overdue") return "border-l-destructive";
  if (task.urgency === "high" && task.importance === "high") return "border-l-destructive";
  if (task.urgency === "high") return "border-l-orange-500";
  if (task.importance === "high") return "border-l-amber-500";
  return "border-l-muted-foreground/20";
}

function getMobileCardDuration(task: QuadrantTask) {
  if (!task.due_time || !task.end_time) return "";
  const [sh, sm] = task.due_time.split(":").map(Number);
  const [eh, em] = task.end_time.split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) return "";
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

function getMobileCardQuadrant(task: QuadrantTask) {
  const u = task.urgency === "high";
  const i = task.importance === "high";
  if (u && i) return "U&I";
  if (u && !i) return "U&NI";
  if (!u && i) return "NU&I";
  return "NU&NI";
}

function MobileTaskCard({
  task,
  onClick,
  onComplete,
  onStartTask,
  onDeleteTask,
}: {
  task: QuadrantTask;
  onClick: () => void;
  onComplete: () => void;
  onStartTask?: (task: QuadrantTask) => void;
  onDeleteTask?: (task: QuadrantTask) => void;
}) {
  const dateLabel = task.due_date ? `${new Date(task.due_date).getDate()}/${new Date(task.due_date).getMonth() + 1}` : "";
  const duration = getMobileCardDuration(task);

  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-start gap-2.5 p-2.5 rounded-lg border-l-4 border-r border-t border-b cursor-pointer transition-all hover:shadow-md",
        getMobileCardBorderClass(task),
        task.is_completed
          ? "bg-muted/50 border-border/50"
          : "bg-background border-border/50 shadow-sm",
      )}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }}
        className={cn(
          "h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-colors border mt-0.5",
          task.is_completed
            ? "bg-primary text-primary-foreground border-primary"
            : "border-border text-muted-foreground hover:border-primary hover:text-primary",
        )}
      >
        <Check className="h-3 w-3" />
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-[13px] font-medium truncate text-foreground",
            task.is_completed && "line-through text-muted-foreground",
          )}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-1 mt-1 overflow-x-auto scrollbar-hide flex-nowrap">
          {dateLabel && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/5 text-muted-foreground shrink-0">
              {dateLabel}
            </span>
          )}
          {task.due_time && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/5 text-muted-foreground shrink-0">
              {task.due_time}{task.end_time ? `–${task.end_time}` : ""}
            </span>
          )}
          {duration && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/5 text-muted-foreground shrink-0">
              {duration}
            </span>
          )}
          <span className="text-[10px] px-1 py-0 h-4 inline-flex items-center border border-primary/30 text-primary rounded shrink-0">
            {getMobileCardQuadrant(task)}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0 mt-0.5">
        {!task.is_completed && task.status !== "ongoing" && onStartTask && (
          <button
            onClick={(e) => { e.stopPropagation(); onStartTask(task); }}
            className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="Start task"
          >
            <Play className="h-3 w-3" />
          </button>
        )}
        {task.status === "ongoing" && !task.is_completed && onStartTask && (
          <button
            onClick={(e) => { e.stopPropagation(); onStartTask(task); }}
            className="h-6 w-6 rounded-full flex items-center justify-center text-primary bg-primary/10 transition-colors"
            title="Pause task"
          >
            <Pause className="h-3 w-3" />
          </button>
        )}
        {onDeleteTask && (
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteTask(task); }}
            className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete task"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Quadrant Icon map ───
const QUADRANT_ICONS: Record<string, React.ElementType> = {
  "urgent-important": Flame,
  "urgent-not-important": Clock,
  "not-urgent-important": Sparkles,
  "not-urgent-not-important": Archive,
  overdue: AlertTriangle,
  ongoing: Play,
  upcoming: Calendar,
  completed: CheckCircle,
  yesterday: Clock,
  today: Calendar,
  tomorrow: Calendar,
  week: Calendar,
  morning: Clock,
  afternoon: Clock,
  evening: Clock,
  night: Clock,
};

// ─── Clock mode icons ───
const CLOCK_MODE_ICONS: { id: ClockMode; icon: React.ElementType }[] = [
  { id: "digital", icon: Clock },
  { id: "timer", icon: Timer },
  { id: "stopwatch", icon: Hourglass },
  { id: "calendar", icon: Calendar },
];

// ─── View tab config ───
const VIEW_TABS: { id: TasksViewTab; label: string; icon: React.ElementType }[] = [
  { id: "lists", label: "Lists", icon: List },
  { id: "board", label: "Board", icon: Columns3 },
  { id: "timeline", label: "Timeline", icon: Clock },
];

const TIMER_PRESETS = [
  { label: "5m", seconds: 5 * 60 },
  { label: "15m", seconds: 15 * 60 },
  { label: "25m", seconds: 25 * 60 },
];

// ─── Inline clock display for each mode ───
function MobileClockDisplay({
  mode,
  now,
  is12h,
  formatInTimezone,
}: {
  mode: ClockMode;
  now: Date;
  is12h: boolean;
  formatInTimezone: (d: Date, opts: Intl.DateTimeFormatOptions) => string;
}) {
  const { weekStartsOn } = useDatePreferences();

  // Stopwatch
  const [swMs, setSwMs] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  useEffect(() => {
    if (!swRunning) return;
    const iv = setInterval(() => setSwMs((p) => p + 100), 100);
    return () => clearInterval(iv);
  }, [swRunning]);

  // Timer
  const [timerTotal, setTimerTotal] = useState(25 * 60);
  const [timerLeft, setTimerLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  useEffect(() => {
    if (!timerRunning || timerLeft <= 0) return;
    const iv = setInterval(() => {
      setTimerLeft((p) => {
        if (p <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [timerRunning, timerLeft]);

  // Calendar
  const [calMonth, setCalMonth] = useState(new Date());
  const calDays = useMemo(() => {
    const ms = startOfMonth(calMonth);
    const me = endOfMonth(calMonth);
    const s = startOfWeek(ms, { weekStartsOn });
    const e = endOfWeek(me, { weekStartsOn });
    return eachDayOfInterval({ start: s, end: e });
  }, [calMonth, weekStartsOn]);

  if (mode === "digital") {
    return (
      <div className="text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {formatInTimezone(now, { weekday: "short" }).toUpperCase()}
        </p>
        <p className="text-2xl font-bold text-foreground tracking-tight leading-none mt-0.5">
          {formatInTimezone(now, { hour: "numeric", minute: "2-digit", hour12: is12h }).replace(/\s?(AM|PM)$/i, "")}
          {is12h && (
            <span className="text-[10px] font-semibold text-primary/60 ml-1">
              {formatInTimezone(now, { hour: "numeric", hour12: true }).replace(/^[\d:]+\s?/, "")}
            </span>
          )}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1 text-center">
          {formatInTimezone(now, { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>
    );
  }

  if (mode === "stopwatch") {
    const mins = Math.floor(swMs / 60000);
    const secs = Math.floor((swMs % 60000) / 1000);
    return (
      <div className="text-center space-y-1">
        <p className="text-xl font-mono font-bold text-foreground tabular-nums">
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </p>
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => setSwRunning(!swRunning)}
            className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
          >
            {swRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </button>
          <button
            onClick={() => {
              setSwMs(0);
              setSwRunning(false);
            }}
            className="h-6 w-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  if (mode === "timer") {
    const mins = Math.floor(timerLeft / 60);
    const secs = timerLeft % 60;
    return (
      <div className="text-center space-y-1">
        <p
          className={cn(
            "text-xl font-mono font-bold tabular-nums",
            timerLeft === 0 ? "text-destructive" : "text-foreground",
          )}
        >
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </p>
        <div className="flex items-center justify-center gap-1">
          {TIMER_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setTimerTotal(p.seconds);
                setTimerLeft(p.seconds);
                setTimerRunning(false);
              }}
              className={cn(
                "text-[8px] px-1.5 py-0.5 rounded-full",
                timerTotal === p.seconds ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => setTimerRunning(!timerRunning)}
            disabled={timerLeft === 0}
            className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
          >
            {timerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </button>
          <button
            onClick={() => {
              setTimerLeft(timerTotal);
              setTimerRunning(false);
            }}
            className="h-6 w-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  // calendar — only show current month days (no outside days) to keep it compact
  const currentMonthDays = calDays.filter(d => d.getMonth() === calMonth.getMonth());
  // Pad start with empty slots for alignment
  const firstDayOfMonth = startOfMonth(calMonth);
  const startPad = (firstDayOfMonth.getDay() - weekStartsOn + 7) % 7;

  return (
    <div className="w-full px-1 flex flex-col justify-center">
      <div className="flex items-center justify-between mb-0.5">
        <button onClick={() => setCalMonth(subMonths(calMonth, 1))} className="text-muted-foreground p-0.5">
          <ChevronDown className="h-2.5 w-2.5 rotate-90" />
        </button>
        <span className="text-[7px] font-semibold uppercase tracking-wider text-muted-foreground">
          {format(calMonth, "MMM yyyy")}
        </span>
        <button onClick={() => setCalMonth(addMonths(calMonth, 1))} className="text-muted-foreground p-0.5">
          <ChevronDown className="h-2.5 w-2.5 -rotate-90" />
        </button>
      </div>
      <div className="grid grid-cols-7">
        {(weekStartsOn === 1 ? ["M", "T", "W", "T", "F", "S", "S"] : ["S", "M", "T", "W", "T", "F", "S"]).map(
          (d, i) => (
            <span key={i} className="text-[6px] text-center text-muted-foreground/50 leading-tight">
              {d}
            </span>
          ),
        )}
      </div>
      <div className="grid grid-cols-7">
        {/* Empty padding cells */}
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {currentMonthDays.map((day, i) => {
          const isToday = isSameDay(day, now);
          return (
            <div
              key={i}
              className={cn(
                "h-[11px] flex items-center justify-center text-[7px] rounded-sm leading-none",
                isToday && "bg-primary text-primary-foreground font-bold",
                !isToday && "text-foreground/80",
              )}
            >
              {format(day, "d")}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TasksMobileLayoutProps {
  tasks: QuadrantTask[];
  filteredTasks: QuadrantTask[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (p: string) => void;
  sortBy: string;
  onSortChange: (s: string) => void;
  onNewTask: () => void;
  onTaskClick: (task: QuadrantTask) => void;
  onStartTask: (task: QuadrantTask) => void;
  onCompleteTask: (task: QuadrantTask) => void;
  onStartFocus: (task: QuadrantTask) => void;
  activeTab: TasksViewTab;
  onTabChange: (tab: TasksViewTab) => void;
  defaultBoardMode?: string | null;
  onBoardDrop?: (columnId: string, task: QuadrantTask) => void;
  onBoardQuickAdd?: (title: string, columnId: string) => void;
  onDeleteTask?: (task: QuadrantTask) => void;
}

export function TasksMobileLayout({
  tasks,
  filteredTasks,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  sortBy,
  onSortChange,
  onNewTask,
  onTaskClick,
  onStartTask,
  onCompleteTask,
  onStartFocus,
  activeTab,
  onTabChange,
  defaultBoardMode,
  onBoardDrop,
  onBoardQuickAdd,
  onDeleteTask,
}: TasksMobileLayoutProps) {
  const { getTimeInTimezone, formatInTimezone } = useTimezone();
  const { timeFormat: userTimeFormat } = useTimeFormat();
  const is12h = userTimeFormat === "12h";

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const [boardMode, setBoardMode] = useState<QuadrantMode>("urgent-important");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("today");
  const [clockMode, setClockMode] = useState<ClockMode>("digital");
  const [headerVisible, setHeaderVisible] = useState(true);

  const today = startOfDay(new Date());
  const tomorrow = startOfDay(addDays(today, 1));
  const weekEnd = endOfDay(addDays(today, 6));

  // ─── KPI metrics filtered by time period ───
  const periodTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.due_date) return false;
      const dueDate = startOfDay(new Date(t.due_date));
      switch (timePeriod) {
        case "today":
          return isSameDay(dueDate, today);
        case "tomorrow":
          return isSameDay(dueDate, tomorrow);
        case "week":
          return isWithinInterval(dueDate, { start: today, end: weekEnd });
        default:
          return false;
      }
    });
  }, [tasks, timePeriod, today, tomorrow, weekEnd]);

  const plannedCount = periodTasks.filter((t) => !t.is_completed && !t.completed_at).length;
  const doneCount = periodTasks.filter((t) => t.is_completed || t.completed_at).length;

  const overdueCount = useMemo(() => {
    const allWithStatus = tasks.map((t) => ({ ...t, computedStatus: computeTaskStatus(t) }));
    switch (timePeriod) {
      case "today":
        return allWithStatus.filter((t) => t.computedStatus === "overdue").length;
      case "tomorrow": {
        const currentlyOverdue = allWithStatus.filter((t) => t.computedStatus === "overdue").length;
        const todayIncomplete = tasks.filter((t) => {
          if (!t.due_date) return false;
          return isSameDay(startOfDay(new Date(t.due_date)), today) && !t.is_completed && !t.completed_at;
        }).length;
        return currentlyOverdue + todayIncomplete;
      }
      case "week":
        return allWithStatus.filter((t) => t.computedStatus === "overdue").length;
      default:
        return 0;
    }
  }, [tasks, timePeriod, today]);

  const totalFocusMin = periodTasks.reduce((s, t) => s + (t.total_focus_minutes || 0), 0);

  // ─── Chart data ───
  const past7Days = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      const plan = tasks.filter((t) => t.due_date && isSameDay(new Date(t.due_date), dayStart)).length;
      const actual = tasks.filter((t) => t.completed_at && isSameDay(new Date(t.completed_at), dayStart)).length;
      data.push({ date: format(date, "EEE"), plan, actual });
    }
    return data;
  }, [tasks, today]);

  const future7Days = useMemo(() => {
    const data = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      const dayStart = startOfDay(date);
      const count = tasks.filter((t) => {
        if (!t.due_date || t.is_completed || t.completed_at) return false;
        return isSameDay(new Date(t.due_date), dayStart);
      }).length;
      data.push({ date: i === 0 ? "Today" : format(date, "EEE"), tasks: count });
    }
    return data;
  }, [tasks, today]);

  const quadrantData = useMemo(() => {
    const pending = tasks.filter((t) => !t.is_completed && !t.completed_at);
    return [
      {
        name: "U&I",
        value: pending.filter((t) => t.urgency === "high" && t.importance === "high").length,
        color: "hsl(var(--destructive))",
      },
      {
        name: "U&NI",
        value: pending.filter((t) => t.urgency === "high" && t.importance === "low").length,
        color: "hsl(var(--primary))",
      },
      {
        name: "NU&I",
        value: pending.filter((t) => t.urgency === "low" && t.importance === "high").length,
        color: "hsl(var(--chart-1))",
      },
      {
        name: "NU&NI",
        value: pending.filter((t) => t.urgency === "low" && t.importance === "low").length,
        color: "hsl(var(--muted))",
      },
    ].filter((d) => d.value > 0);
  }, [tasks]);

  // ─── Quadrant grouping (for board tab) ───
  const activeQuadrants = QUADRANT_MODES[boardMode].quadrants;
  const groupedTasks = useMemo(() => {
    const groups: Record<string, { active: QuadrantTask[]; completed: QuadrantTask[] }> = {};
    activeQuadrants.forEach((q) => {
      groups[q.id] = { active: [], completed: [] };
    });

    filteredTasks.forEach((t) => {
      for (const q of activeQuadrants) {
        let match = false;
        switch (boardMode) {
          case "urgent-important":
            if (q.id === "urgent-important") match = t.urgency === "high" && t.importance === "high";
            if (q.id === "urgent-not-important") match = t.urgency === "high" && t.importance === "low";
            if (q.id === "not-urgent-important") match = t.urgency === "low" && t.importance === "high";
            if (q.id === "not-urgent-not-important") match = t.urgency === "low" && t.importance === "low";
            break;
          case "status":
            match = computeTaskStatus(t) === q.id;
            break;
          case "date":
            match = (() => {
              if (!t.due_date) return q.id === "today";
              const d = startOfDay(new Date(t.due_date));
              const diff = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              if (q.id === "yesterday") return diff < 0;
              if (q.id === "today") return diff === 0;
              if (q.id === "tomorrow") return diff === 1;
              return diff > 1;
            })();
            break;
          case "time":
            match = t.time_of_day === q.id;
            break;
        }
        if (match) {
          (t.is_completed ? groups[q.id].completed : groups[q.id].active).push(t);
          break;
        }
      }
    });
    return groups;
  }, [filteredTasks, boardMode, activeQuadrants, today]);

  // Board accordion content
  const renderBoardAccordions = () => (
    <>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {(["urgent-important", "status", "date", "time"] as QuadrantMode[]).map((m) => (
          <Button
            key={m}
            variant={boardMode === m ? "default" : "ghost"}
            size="sm"
            className="h-7 text-[10px] uppercase tracking-wider shrink-0"
            onClick={() => setBoardMode(m)}
          >
            {QUADRANT_MODES[m].label}
          </Button>
        ))}
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {activeQuadrants.map((col) => {
          const Icon = QUADRANT_ICONS[col.id] || Calendar;
          const activeTasks = groupedTasks[col.id]?.active || [];
          const completedTasks = groupedTasks[col.id]?.completed || [];
          const total = activeTasks.length + completedTasks.length;

          return (
            <AccordionItem key={col.id} value={col.id} className="border-none">
              <AccordionTrigger className="py-2.5 px-3 rounded-lg bg-muted/40 border border-border hover:no-underline">
                <div className="flex items-center gap-2 flex-1">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: col.color }} />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                    {col.title}
                  </span>
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 ml-auto mr-2">
                    {total}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-0 px-0">
                <div className="space-y-1.5">
                  {activeTasks.map((task) => (
                    <MobileTaskCard
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick(task)}
                      onComplete={() => onCompleteTask(task)}
                      onStartTask={onStartTask}
                      onDeleteTask={onDeleteTask}
                    />
                  ))}
                  {completedTasks.length > 0 && (
                    <details className="group">
                      <summary className="flex items-center gap-1.5 py-1.5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer list-none">
                        <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                        <span className="font-medium">Done ({completedTasks.length})</span>
                      </summary>
                      <div className="space-y-1.5 mt-1">
                        {completedTasks.map((task) => (
                          <MobileTaskCard
                            key={task.id}
                            task={task}
                            onClick={() => onTaskClick(task)}
                            onComplete={() => onCompleteTask(task)}
                            onStartTask={onStartTask}
                            onDeleteTask={onDeleteTask}
                          />
                        ))}
                      </div>
                    </details>
                  )}
                  {activeTasks.length === 0 && completedTasks.length === 0 && (
                    <p className="text-[10px] text-muted-foreground py-3 text-center">No tasks</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ─── Sticky Toolbar ─── */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-foreground/[0.06] px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          {/* Toggle header visibility */}
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0 shrink-0", headerVisible && "text-primary")}
            onClick={() => setHeaderVisible(!headerVisible)}
          >
            <BarChart3 className="h-3.5 w-3.5" />
          </Button>

          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks..."
              className="pl-8 h-8 rounded-lg bg-background border-border shadow-sm text-xs"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-border shadow-sm shrink-0">
                <Filter className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
              <DropdownMenuLabel className="text-[11px]">Status</DropdownMenuLabel>
              {["all", "upcoming", "ongoing", "completed", "overdue"].map((s) => (
                <DropdownMenuCheckboxItem
                  key={s}
                  checked={statusFilter === s}
                  onCheckedChange={() => onStatusFilterChange(s)}
                  className="text-[11px]"
                >
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px]">Priority</DropdownMenuLabel>
              {[
                "all",
                "urgent-important",
                "urgent-not-important",
                "not-urgent-important",
                "not-urgent-not-important",
              ].map((p) => (
                <DropdownMenuCheckboxItem
                  key={p}
                  checked={priorityFilter === p}
                  onCheckedChange={() => onPriorityFilterChange(p)}
                  className="text-[11px]"
                >
                  {p === "all"
                    ? "All"
                    : p === "urgent-important"
                      ? "U&I"
                      : p === "urgent-not-important"
                        ? "U&NI"
                        : p === "not-urgent-important"
                          ? "NU&I"
                          : "NU&NI"}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-8 h-8 rounded-lg bg-background border-border shadow-sm p-0 justify-center [&>svg:last-child]:hidden">
              <ArrowUpDown className="h-3.5 w-3.5" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="due_date">Due Date</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={onNewTask} size="sm" className="h-8 w-8 p-0 rounded-lg shadow-sm shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ─── Scrollable Content ─── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {/* ─── 1. Collapsible Header Card ─── */}
        {headerVisible && (
          <>
            <div className="rounded-xl border border-foreground/[0.06] bg-background/40 backdrop-blur-xl shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.04)] overflow-hidden">
              {/* Focus Bar */}
              <TopFocusBar tasks={filteredTasks} onStartFocus={onStartFocus} />

              {/* Split: KPIs left, Clock right */}
              <div className="flex h-[135px] border-t border-foreground/[0.06]">
                {/* Left: Time period filter + Metrics */}
                <div className="flex-1 flex flex-col p-2 gap-1.5">
                  <div className="flex items-center gap-1">
                    {(["today", "tomorrow", "week"] as TimePeriod[]).map((period) => (
                      <button
                        key={period}
                        onClick={() => setTimePeriod(period)}
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[9px] font-medium transition-all",
                          timePeriod === period
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted",
                        )}
                      >
                        {period === "today" ? "Today" : period === "tomorrow" ? "Tmrw" : "Week"}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    <MobileKpi icon={Calendar} value={plannedCount} label="Planned" iconClass="text-primary" />
                    <MobileKpi icon={CheckCircle} value={doneCount} label="Done" iconClass="text-chart-1" />
                    <MobileKpi icon={AlertTriangle} value={overdueCount} label="Overdue" iconClass="text-destructive" />
                    <MobileKpi
                      icon={Clock}
                      value={
                        <>
                          {totalFocusMin}
                          <span className="text-[10px] font-normal text-muted-foreground">m</span>
                        </>
                      }
                      label="Focus"
                      iconClass="text-chart-2"
                    />
                  </div>
                </div>

                {/* Right: Clock mode icons + Active Clock */}
                <div className="w-[150px] h-[120px] shrink-0 border-l border-foreground/[0.06] flex flex-col items-center justify-center p-2 overflow-hidden">
                  {/* Clock mode shortcut icons */}
                  <div className="flex items-center gap-0.5 mb-2">
                    {CLOCK_MODE_ICONS.map(({ id, icon: ModeIcon }) => (
                      <button
                        key={id}
                        onClick={() => setClockMode(id)}
                        className={cn(
                          "h-5 w-5 rounded flex items-center justify-center transition-all",
                          clockMode === id
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground/50 hover:text-muted-foreground",
                        )}
                      >
                        <ModeIcon className="h-3 w-3" />
                      </button>
                    ))}
                  </div>

                  <MobileClockDisplay mode={clockMode} now={now} is12h={is12h} formatInTimezone={formatInTimezone} />
                </div>
              </div>
            </div>

            {/* ─── 2. Analytics Carousel ─── */}
            <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide">
              {/* Plan vs Actual */}
              <div className="snap-start shrink-0 w-[75%] rounded-xl bg-muted/40 border border-border p-2.5 flex flex-col min-h-[140px]">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <BarChart3 className="h-3 w-3 text-primary" />
                  <span className="text-[9px] font-medium text-foreground/70 uppercase tracking-wider">
                    Plan vs Actual
                  </span>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm" style={{ background: "hsl(var(--primary))" }} />
                    <span className="text-[8px] text-muted-foreground">Planned</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--chart-1))" }} />
                    <span className="text-[8px] text-muted-foreground">Done</span>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={past7Days}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 7, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        width={12}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 10,
                          color: "hsl(var(--popover-foreground))",
                          padding: "4px 8px",
                        }}
                        labelStyle={{ fontSize: 9, color: "hsl(var(--muted-foreground))", marginBottom: 2 }}
                        formatter={(value: number, name: string) => [value, name === "plan" ? "Planned" : "Done"]}
                      />
                      <Bar
                        dataKey="plan"
                        fill="hsl(var(--primary))"
                        opacity={0.2}
                        radius={[3, 3, 0, 0]}
                        barSize={14}
                      />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        dot={{ r: 2.5, fill: "hsl(var(--chart-1))", strokeWidth: 0 }}
                        activeDot={{ r: 3.5, fill: "hsl(var(--chart-1))" }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Upcoming */}
              <div className="snap-start shrink-0 w-[75%] rounded-xl bg-muted/40 border border-border p-2.5 flex flex-col min-h-[120px]">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Calendar className="h-3 w-3 text-chart-1" />
                  <span className="text-[9px] font-medium text-foreground/70 uppercase tracking-wider">Upcoming</span>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={future7Days}>
                      <defs>
                        <linearGradient id="mBarG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <Bar dataKey="tasks" fill="url(#mBarG)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Priority Pie */}
              <div className="snap-start shrink-0 w-[75%] rounded-xl bg-muted/40 border border-border p-2.5 flex flex-col min-h-[120px]">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Clock className="h-3 w-3 text-chart-2" />
                  <span className="text-[9px] font-medium text-foreground/70 uppercase tracking-wider">Priority</span>
                </div>
                <div className="flex-1 flex items-center gap-3">
                  {quadrantData.length > 0 ? (
                    <>
                      <div className="w-[60px] h-[60px] shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={quadrantData}
                              cx="50%"
                              cy="50%"
                              innerRadius={15}
                              outerRadius={28}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {quadrantData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} stroke="none" />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-col gap-1">
                        {quadrantData.map((entry, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <div
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-[9px] text-muted-foreground">{entry.name}</span>
                            <span className="text-[9px] font-semibold text-foreground">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-[9px] text-muted-foreground">No data</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ─── View Switcher (below carousel, slim) ─── */}
        <div className="flex items-center gap-0.5 bg-muted/30 rounded-lg p-0.5 border border-border">
          {VIEW_TABS.map(({ id, label, icon: TabIcon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-medium transition-all",
                activeTab === id
                  ? "bg-background text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <TabIcon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        {/* ─── 3. Tab Content ─── */}
        {activeTab === "board" && renderBoardAccordions()}

        {activeTab === "lists" && (
          <AllTasksList
            tasks={filteredTasks}
            onTaskClick={onTaskClick}
            onStartTask={onStartTask}
            onCompleteTask={onCompleteTask}
            onDeleteTask={onDeleteTask ? (task) => onDeleteTask(task) : undefined}
            collapsed={false}
            onToggleCollapse={() => {}}
          />
        )}

        {activeTab === "timeline" && (
          <BoardView
            mode="status"
            tasks={filteredTasks}
            onTaskClick={onTaskClick}
            onDragStart={() => {}}
            onDrop={onBoardDrop || (() => {})}
            onQuickAdd={onBoardQuickAdd || (() => {})}
            onStartTask={onStartTask}
            onCompleteTask={onCompleteTask}
          />
        )}
      </div>
    </div>
  );
}
