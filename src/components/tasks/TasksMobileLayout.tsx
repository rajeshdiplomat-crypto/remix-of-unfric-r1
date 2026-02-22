import { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Check,
  Play,
  Loader2,
  ChevronDown,
  Flame,
  Sparkles,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "recharts";
import { format, subDays, addDays, startOfDay, isSameDay, isBefore, endOfDay, isWithinInterval } from "date-fns";

import { QuadrantTask, computeTaskStatus, QUADRANT_MODES, QuadrantMode } from "./types";
import { TopFocusBar } from "./TopFocusBar";
import { useTimezone } from "@/hooks/useTimezone";
import { useTimeFormat } from "@/hooks/useTimeFormat";

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
}

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
    <div className="flex items-center gap-2 rounded-lg bg-muted/40 border border-border px-3 py-2">
      <Icon className={cn("h-3.5 w-3.5 shrink-0", iconClass)} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground leading-none">{value}</p>
        <p className="text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Mobile Task Card (compact) ───
function MobileTaskCard({
  task,
  onClick,
  onComplete,
}: {
  task: QuadrantTask;
  onClick: () => void;
  onComplete: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all",
        task.is_completed
          ? "bg-muted/30 border-border opacity-70"
          : task.status === "overdue"
            ? "bg-destructive/5 border-destructive/20"
            : "bg-card border-border shadow-sm",
      )}
    >
      {/* Checkmark */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }}
        className={cn(
          "h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-colors border",
          task.is_completed
            ? "bg-primary text-primary-foreground border-primary"
            : "border-border text-muted-foreground hover:border-primary hover:text-primary",
        )}
      >
        <Check className="h-3 w-3" />
      </button>

      {/* Title + Time */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate text-foreground",
            task.is_completed && "line-through text-muted-foreground",
          )}
        >
          {task.title}
        </p>
        {task.due_time && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {task.due_time}
            {task.end_time ? ` – ${task.end_time}` : ""}
          </p>
        )}
      </div>

      {/* Status indicator */}
      {task.status === "ongoing" && !task.is_completed && (
        <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
      )}
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

  const today = startOfDay(new Date());
  const tomorrow = startOfDay(addDays(today, 1));
  const weekEnd = endOfDay(addDays(today, 6));

  // KPI metrics for "today"
  const todayTasks = useMemo(
    () => tasks.filter((t) => t.due_date && isSameDay(new Date(t.due_date), today)),
    [tasks, today],
  );
  const plannedCount = todayTasks.filter((t) => !t.is_completed && !t.completed_at).length;
  const doneCount = todayTasks.filter((t) => t.is_completed || t.completed_at).length;
  const overdueCount = tasks.filter((t) => computeTaskStatus(t) === "overdue").length;
  const totalFocusMin = todayTasks.reduce((s, t) => s + (t.total_focus_minutes || 0), 0);

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
      { name: "U&I", value: pending.filter((t) => t.urgency === "high" && t.importance === "high").length, color: "hsl(var(--destructive))" },
      { name: "U&NI", value: pending.filter((t) => t.urgency === "high" && t.importance === "low").length, color: "hsl(var(--primary))" },
      { name: "NU&I", value: pending.filter((t) => t.urgency === "low" && t.importance === "high").length, color: "hsl(var(--chart-1))" },
      { name: "NU&NI", value: pending.filter((t) => t.urgency === "low" && t.importance === "low").length, color: "hsl(var(--muted))" },
    ].filter((d) => d.value > 0);
  }, [tasks]);

  // ─── Quadrant grouping ───
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

  const controlBase = "h-9 rounded-xl bg-background border-border shadow-sm";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ─── Sticky Toolbar ─── */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-foreground/[0.06] px-3 py-2 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks..."
              className={`pl-9 ${controlBase}`}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className={`${controlBase} px-2.5`}>
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
              {["all", "urgent-important", "urgent-not-important", "not-urgent-important", "not-urgent-not-important"].map((p) => (
                <DropdownMenuCheckboxItem
                  key={p}
                  checked={priorityFilter === p}
                  onCheckedChange={() => onPriorityFilterChange(p)}
                  className="text-[11px]"
                >
                  {p === "all" ? "All" : p === "urgent-important" ? "U&I" : p === "urgent-not-important" ? "U&NI" : p === "not-urgent-important" ? "NU&I" : "NU&NI"}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className={`w-[90px] ${controlBase} text-[11px]`}>
              <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="due_date">Due Date</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={onNewTask} size="sm" className="h-9 rounded-xl px-3 shadow-md shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ─── Scrollable Content ─── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {/* ─── 1. Header Card: Focus + KPIs + Clock ─── */}
        <div className="rounded-xl border border-foreground/[0.06] bg-background/40 backdrop-blur-xl shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.04)] overflow-hidden">
          {/* Focus Bar */}
          <TopFocusBar tasks={filteredTasks} onStartFocus={onStartFocus} />

          {/* Split: KPIs left, Clock right */}
          <div className="flex border-t border-foreground/[0.06]">
            {/* Left: Metrics */}
            <div className="flex-1 grid grid-cols-2 gap-1.5 p-3">
              <MobileKpi icon={Calendar} value={plannedCount} label="Planned" iconClass="text-primary" />
              <MobileKpi icon={CheckCircle} value={doneCount} label="Done" iconClass="text-chart-1" />
              <MobileKpi icon={AlertTriangle} value={overdueCount} label="Overdue" iconClass="text-destructive" />
              <MobileKpi icon={Clock} value={<>{totalFocusMin}<span className="text-[10px] font-normal text-muted-foreground">m</span></>} label="Focus" iconClass="text-chart-2" />
            </div>

            {/* Right: Clock */}
            <div className="w-[140px] shrink-0 border-l border-foreground/[0.06] flex flex-col items-center justify-center p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {formatInTimezone(now, { weekday: "short" }).toUpperCase()}
              </p>
              <p className="text-2xl font-bold text-foreground tracking-tight leading-none mt-1">
                {formatInTimezone(now, { hour: "numeric", minute: "2-digit", hour12: is12h }).replace(/\s?(AM|PM)$/i, "")}
                {is12h && (
                  <span className="text-[10px] font-semibold text-primary/60 ml-1">
                    {formatInTimezone(now, { hour: "numeric", hour12: true }).replace(/^[\d:]+\s?/, "")}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {formatInTimezone(now, { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* ─── 2. Analytics Carousel ─── */}
        <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide">
          {/* Plan vs Actual */}
          <div className="snap-start shrink-0 w-[80%] rounded-xl bg-muted/40 border border-border p-3 flex flex-col min-h-[140px]">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-medium text-foreground/70 uppercase tracking-wider">Plan vs Actual</span>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={past7Days}>
                  <defs>
                    <linearGradient id="mPlanG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={14} allowDecimals={false} hide />
                  <Area type="monotone" dataKey="plan" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="url(#mPlanG)" />
                  <Line type="monotone" dataKey="actual" stroke="hsl(var(--chart-1))" strokeWidth={1.5} dot={{ r: 2.5, fill: "hsl(var(--chart-1))" }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Upcoming */}
          <div className="snap-start shrink-0 w-[80%] rounded-xl bg-muted/40 border border-border p-3 flex flex-col min-h-[140px]">
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar className="h-3.5 w-3.5 text-chart-1" />
              <span className="text-[10px] font-medium text-foreground/70 uppercase tracking-wider">Upcoming</span>
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
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={14} allowDecimals={false} hide />
                  <Bar dataKey="tasks" fill="url(#mBarG)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority Pie */}
          <div className="snap-start shrink-0 w-[80%] rounded-xl bg-muted/40 border border-border p-3 flex flex-col min-h-[140px]">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="h-3.5 w-3.5 text-chart-2" />
              <span className="text-[10px] font-medium text-foreground/70 uppercase tracking-wider">Priority</span>
            </div>
            <div className="flex-1 flex items-center gap-3">
              {quadrantData.length > 0 ? (
                <>
                  <div className="w-[70px] h-[70px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={quadrantData} cx="50%" cy="50%" innerRadius={18} outerRadius={32} paddingAngle={3} dataKey="value">
                          {quadrantData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {quadrantData.map((entry, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-[10px] text-muted-foreground">{entry.name}</span>
                        <span className="text-[10px] font-semibold text-foreground">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-[10px] text-muted-foreground">No data</p>
              )}
            </div>
          </div>
        </div>

        {/* ─── 3. Mode Selector ─── */}
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

        {/* ─── 4. Accordion Quadrants ─── */}
        <Accordion type="multiple" defaultValue={activeQuadrants.map((q) => q.id)} className="space-y-2">
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
      </div>
    </div>
  );
}
