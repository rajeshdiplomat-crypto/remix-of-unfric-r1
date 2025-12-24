import { useState } from "react";
import { format, addDays, startOfWeek, isToday, isBefore, isAfter, parseISO, differenceInDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MoreVertical, Target, TrendingUp, Calendar, CheckCircle2, Flame, Activity, LayoutGrid, List } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface ActivityItem {
  id: string;
  name: string;
  category: string;
  priority: string;
  description: string;
  frequencyPattern: boolean[]; // M T W T F S S
  numberOfDays: number;
  startDate: string;
  completions: Record<string, boolean>; // date string -> completed
  createdAt: string;
}

const CATEGORIES = [
  { id: "health", label: "Health & Wellness", color: "hsl(142, 71%, 45%)" },
  { id: "growth", label: "Personal Growth", color: "hsl(262, 83%, 58%)" },
  { id: "career", label: "Career", color: "hsl(221, 83%, 53%)" },
  { id: "education", label: "Education", color: "hsl(25, 95%, 53%)" },
  { id: "wellbeing", label: "Wellbeing", color: "hsl(339, 81%, 51%)" },
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
    numberOfDays: 30,
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
    numberOfDays: 30,
    startDate: format(addDays(new Date(), -30), "yyyy-MM-dd"),
    completions: Object.fromEntries(
      Array.from({ length: 30 }, (_, i) => [
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
    numberOfDays: 61,
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
    numberOfDays: 7,
    startDate: format(addDays(new Date(), -3), "yyyy-MM-dd"),
    completions: {
      [format(addDays(new Date(), -3), "yyyy-MM-dd")]: true,
      [format(addDays(new Date(), -2), "yyyy-MM-dd")]: true,
      [format(addDays(new Date(), -1), "yyyy-MM-dd")]: true,
      [format(new Date(), "yyyy-MM-dd")]: true,
    },
    createdAt: new Date().toISOString(),
  },
];

type ViewMode = "week" | "compact";

export default function Trackers() {
  const { toast } = useToast();
  const [activities, setActivities] = useState<ActivityItem[]>(SAMPLE_ACTIVITIES);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("health");
  const [formPriority, setFormPriority] = useState("Medium");
  const [formDescription, setFormDescription] = useState("");
  const [formFrequency, setFormFrequency] = useState([true, true, true, true, true, false, false]);
  const [formDays, setFormDays] = useState(30);

  const getEndDate = (activity: ActivityItem) => {
    return addDays(parseISO(activity.startDate), activity.numberOfDays - 1);
  };

  const getStatus = (activity: ActivityItem): "active" | "completed" | "upcoming" => {
    const today = new Date();
    const startDate = parseISO(activity.startDate);
    const endDate = getEndDate(activity);

    if (isBefore(today, startDate)) return "upcoming";

    const completionPercent = getCompletionPercent(activity);
    if (completionPercent >= 100 || isAfter(today, endDate)) return "completed";

    return "active";
  };

  const getPlannedDays = (activity: ActivityItem) => {
    let count = 0;
    const startDate = parseISO(activity.startDate);
    for (let i = 0; i < activity.numberOfDays; i++) {
      const date = addDays(startDate, i);
      const dayOfWeek = (date.getDay() + 6) % 7; // Convert to Mon=0
      if (activity.frequencyPattern[dayOfWeek]) count++;
    }
    return count;
  };

  const getCompletedDays = (activity: ActivityItem) => {
    return Object.values(activity.completions).filter(Boolean).length;
  };

  const getCompletionPercent = (activity: ActivityItem) => {
    const planned = getPlannedDays(activity);
    if (planned === 0) return 0;
    return Math.round((getCompletedDays(activity) / planned) * 100);
  };

  const getWeekDays = () => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
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
    setDialogOpen(true);
  };

  const openEditDialog = (activity: ActivityItem) => {
    setEditingActivity(activity);
    setFormName(activity.name);
    setFormCategory(activity.category);
    setFormPriority(activity.priority);
    setFormDescription(activity.description);
    setFormFrequency([...activity.frequencyPattern]);
    setFormDays(activity.numberOfDays);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) return;

    if (editingActivity) {
      setActivities(activities.map((a) =>
        a.id === editingActivity.id
          ? {
              ...a,
              name: formName,
              category: formCategory,
              priority: formPriority,
              description: formDescription,
              frequencyPattern: formFrequency,
              numberOfDays: formDays,
            }
          : a
      ));
      toast({ title: "Activity updated" });
    } else {
      const newActivity: ActivityItem = {
        id: crypto.randomUUID(),
        name: formName,
        category: formCategory,
        priority: formPriority,
        description: formDescription,
        frequencyPattern: formFrequency,
        numberOfDays: formDays,
        startDate: format(new Date(), "yyyy-MM-dd"),
        completions: {},
        createdAt: new Date().toISOString(),
      };
      setActivities([newActivity, ...activities]);
      toast({ title: "Activity created" });
    }
    setDialogOpen(false);
  };

  const handleDelete = (activityId: string) => {
    setActivities(activities.filter((a) => a.id !== activityId));
    toast({ title: "Activity deleted" });
  };

  const filteredActivities = activities.filter((a) => {
    const matchesCategory = categoryFilter === "all" || a.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || getStatus(a) === statusFilter;
    return matchesCategory && matchesStatus;
  });

  // Dashboard KPIs
  const activeCount = activities.filter((a) => getStatus(a) === "active").length;
  const completedThisWeek = (() => {
    const weekDays = getWeekDays();
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
    const weekDays = getWeekDays();
    let count = 0;
    activities.forEach((a) => {
      weekDays.forEach((day) => {
        if (isPlannedForDate(a, day)) count++;
      });
    });
    return count;
  })();
  const completionRate = plannedThisWeek > 0 ? Math.round((completedThisWeek / plannedThisWeek) * 100) : 0;
  const upcomingCount = activities.filter((a) => getStatus(a) === "upcoming").length;

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[0];
  };

  const weekDays = getWeekDays();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity Tracker</h1>
          <p className="text-muted-foreground text-sm">Monitor your long-term goals and daily commitments.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          New Activity
        </Button>
      </div>

      {/* Dashboard KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active Activities</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{completionRate}%</p>
              <p className="text-xs text-muted-foreground">Completion This Week</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{completedThisWeek}/{plannedThisWeek}</p>
              <p className="text-xs text-muted-foreground">Done This Week</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{upcomingCount}</p>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Activity group</span>
          <div className="flex gap-1">
            <Button
              variant={categoryFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("all")}
              className="rounded-full"
            >
              All
            </Button>
            {CATEGORIES.slice(0, 3).map((cat) => (
              <Button
                key={cat.id}
                variant={categoryFilter === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(cat.id)}
                className="rounded-full"
              >
                {cat.label.split(" ")[0]}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status</span>
          <div className="flex gap-1">
            {["all", "active", "completed", "upcoming"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="rounded-full capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("week")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "compact" ? "default" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("compact")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Activity Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">ACTIVITY</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">TIMELINE</th>
                <th className="text-center p-3 text-sm font-medium text-muted-foreground">
                  {viewMode === "week" ? "DAILY TRACKER (THIS WEEK)" : "ALL DAYS"}
                </th>
                <th className="text-center p-3 text-sm font-medium text-muted-foreground">STATUS</th>
                <th className="text-center p-3 text-sm font-medium text-muted-foreground">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.map((activity) => {
                const category = getCategoryInfo(activity.category);
                const status = getStatus(activity);
                const completedDays = getCompletedDays(activity);
                const plannedDays = getPlannedDays(activity);
                const percent = getCompletionPercent(activity);

                return (
                  <tr key={activity.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <Target className="h-5 w-5" style={{ color: category.color }} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{activity.name}</p>
                          <p className="text-xs text-muted-foreground">{category.label}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <p className="font-medium text-foreground">
                          {format(parseISO(activity.startDate), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          to {format(getEndDate(activity), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {completedDays} / {plannedDays} days by {percent}% complete
                        </p>
                        <Progress value={percent} className="h-1 mt-1" />
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center gap-1">
                        {viewMode === "week" ? (
                          <>
                            {weekDays.map((day, idx) => {
                              const isPlanned = isPlannedForDate(activity, day);
                              const isCompleted = activity.completions[format(day, "yyyy-MM-dd")];
                              return (
                                <div key={idx} className="flex flex-col items-center">
                                  <span className="text-xs text-muted-foreground mb-1">
                                    {DAY_LABELS[idx]}
                                  </span>
                                  <button
                                    onClick={() => isPlanned && toggleCompletion(activity.id, day)}
                                    disabled={!isPlanned}
                                    className={`h-7 w-7 rounded ${
                                      isCompleted
                                        ? "bg-green-500"
                                        : isPlanned
                                        ? "bg-muted hover:bg-muted-foreground/20"
                                        : "bg-transparent"
                                    }`}
                                  />
                                </div>
                              );
                            })}
                          </>
                        ) : (
                          <ScrollArea className="w-[200px]">
                            <div className="flex gap-0.5">
                              {Array.from({ length: Math.min(activity.numberOfDays, 30) }, (_, i) => {
                                const day = addDays(parseISO(activity.startDate), i);
                                const isPlanned = isPlannedForDate(activity, day);
                                const isCompleted = activity.completions[format(day, "yyyy-MM-dd")];
                                return (
                                  <button
                                    key={i}
                                    onClick={() => isPlanned && toggleCompletion(activity.id, day)}
                                    disabled={!isPlanned}
                                    className={`h-4 w-4 rounded-sm flex-shrink-0 ${
                                      isCompleted
                                        ? "bg-green-500"
                                        : isPlanned
                                        ? "bg-muted"
                                        : "bg-transparent"
                                    }`}
                                    title={format(day, "MMM d")}
                                  />
                                );
                              })}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <Badge
                        variant="secondary"
                        className={`capitalize ${
                          status === "active"
                            ? "bg-green-500/20 text-green-600"
                            : status === "completed"
                            ? "bg-primary/20 text-primary"
                            : "bg-orange-500/20 text-orange-600"
                        }`}
                      >
                        {status}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(activity)}>
                            Edit Activity
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(activity.id)} className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
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
            <div>
              <label className="text-sm font-medium mb-2 block">No. of Days</label>
              <Input
                type="number"
                min={1}
                max={365}
                value={formDays}
                onChange={(e) => setFormDays(parseInt(e.target.value) || 30)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Why is this activity important to you?"
                rows={3}
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
                    className={`h-10 w-10 rounded-full font-medium transition-colors ${
                      formFrequency[idx]
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
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
  );
}
