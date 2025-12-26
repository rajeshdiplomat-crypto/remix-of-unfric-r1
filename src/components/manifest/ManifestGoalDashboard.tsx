import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Target, Heart, Home, DollarSign, Calendar, TrendingUp, Award, Edit,
  Copy, Archive, Trash2, CheckCircle2, ImagePlus, X, Sparkles, Plus,
  ExternalLink, Volume2, Lightbulb, BookOpen, ChevronRight, Play,
  ZoomIn
} from "lucide-react";
import { format, isSameDay, parseISO, addDays, startOfWeek, subDays } from "date-fns";
import confetti from "canvas-confetti";

const CATEGORY_ICONS: Record<string, typeof Target> = {
  wealth: DollarSign,
  health: Heart,
  love: Home,
  default: Target,
};

interface ManifestGoal {
  id: string;
  title: string;
  description: string | null;
  feeling_when_achieved: string | null;
  affirmations: string[];
  is_completed: boolean;
  created_at: string;
  category?: string;
  cover_image?: string;
  target_date?: string;
  visualization_images?: string[];
  milestones?: Array<{ id: string; title: string; completed: boolean }>;
  action_steps?: Array<{ id: string; title: string; completed: boolean; taskId?: string }>;
}

interface JournalEntry {
  id: string;
  goal_id: string;
  gratitude: string | null;
  visualization: string | null;
  entry_date: string;
  created_at: string;
}

interface ManifestGoalDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: ManifestGoal;
  journalEntries: JournalEntry[];
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onMarkAchieved: () => void;
  onCheckIn: (date: Date) => void;
  onAddAction: (title: string) => void;
  onAddJournalEntry: (entry: { gratitude: string; visualization: string }) => void;
}

export function ManifestGoalDashboard({
  open,
  onOpenChange,
  goal,
  journalEntries,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  onMarkAchieved,
  onCheckIn,
  onAddAction,
  onAddJournalEntry,
}: ManifestGoalDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState("");
  const [journalGratitude, setJournalGratitude] = useState("");
  const [journalVisualization, setJournalVisualization] = useState("");
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const CategoryIcon = CATEGORY_ICONS[goal.category || "default"] || Target;

  const goalEntries = journalEntries.filter((e) => e.goal_id === goal.id);
  const progress = Math.min(Math.round((goalEntries.length / 30) * 100), 100);

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i)
  );

  const hasEntryOnDate = (date: Date): boolean => {
    return goalEntries.some((e) => isSameDay(parseISO(e.entry_date), date));
  };

  const getStreak = (): number => {
    let streak = 0;
    let currentDate = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = subDays(currentDate, i);
      const hasEntry = goalEntries.some((e) => isSameDay(parseISO(e.entry_date), checkDate));
      if (hasEntry) streak++;
      else if (i > 0) break;
    }
    return streak;
  };

  const handleMarkAchieved = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    onMarkAchieved();
  };

  const handleAddAction = () => {
    if (newActionTitle.trim()) {
      onAddAction(newActionTitle);
      setNewActionTitle("");
    }
  };

  const handleAddJournalEntry = () => {
    if (journalGratitude.trim() || journalVisualization.trim()) {
      onAddJournalEntry({
        gratitude: journalGratitude,
        visualization: journalVisualization,
      });
      setJournalGratitude("");
      setJournalVisualization("");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          {/* Header with Cover */}
          <div className="relative">
            {goal.cover_image ? (
              <div className="h-48 w-full overflow-hidden rounded-t-lg">
                <img
                  src={goal.cover_image}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
              </div>
            ) : (
              <div className="h-32 w-full bg-gradient-to-r from-primary/20 to-primary/5 rounded-t-lg" />
            )}

            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-end justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`h-16 w-16 rounded-xl flex items-center justify-center shadow-lg ${
                      goal.is_completed ? "bg-green-500" : "bg-primary"
                    }`}
                  >
                    {goal.is_completed ? (
                      <CheckCircle2 className="h-8 w-8 text-white" />
                    ) : (
                      <CategoryIcon className="h-8 w-8 text-primary-foreground" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground drop-shadow-sm">
                      {goal.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="capitalize">
                        {goal.category || "General"}
                      </Badge>
                      {goal.is_completed && (
                        <Badge className="bg-green-500 text-white">
                          Manifested ✨
                        </Badge>
                      )}
                      {goal.target_date && (
                        <Badge variant="outline" className="gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(goal.target_date), "MMM d, yyyy")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={onDuplicate}>
                    <Copy className="h-4 w-4 mr-1" />
                    Duplicate
                  </Button>
                  {!goal.is_completed && (
                    <Button size="sm" onClick={handleMarkAchieved} className="bg-green-500 hover:bg-green-600">
                      <Award className="h-4 w-4 mr-1" />
                      Mark Achieved
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6 pb-6">
            <TabsList className="w-full justify-start mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="visualization">Visualization</TabsTrigger>
              <TabsTrigger value="affirmations">Affirmations</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="journal">Journal</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px]">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-0">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{progress}%</p>
                        <p className="text-xs text-muted-foreground">Progress</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{getStreak()}</p>
                        <p className="text-xs text-muted-foreground">Day Streak</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{goalEntries.length}</p>
                        <p className="text-xs text-muted-foreground">Journal Entries</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Progress Bar */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">30-Day Progress</span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </Card>

                {/* Weekly Tracker */}
                <Card className="p-4">
                  <p className="text-sm font-medium mb-3">This Week</p>
                  <div className="flex items-center justify-between">
                    {weekDays.map((day, i) => {
                      const hasEntry = hasEntryOnDate(day);
                      const isToday = isSameDay(day, new Date());
                      return (
                        <button
                          key={i}
                          onClick={() => onCheckIn(day)}
                          className="flex flex-col items-center gap-1"
                        >
                          <span className="text-xs text-muted-foreground">
                            {format(day, "EEE")}
                          </span>
                          <div
                            className={`h-10 w-10 rounded-lg flex items-center justify-center transition-all ${
                              hasEntry
                                ? "bg-primary text-primary-foreground"
                                : isToday
                                ? "bg-primary/20 ring-2 ring-primary"
                                : "bg-muted hover:bg-muted-foreground/20"
                            }`}
                          >
                            {format(day, "d")}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card>

                {/* Description */}
                {goal.description && (
                  <Card className="p-4">
                    <p className="text-sm font-medium mb-2">Visualization Script</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {goal.description}
                    </p>
                  </Card>
                )}

                {/* Feeling */}
                {goal.feeling_when_achieved && (
                  <Card className="p-4">
                    <p className="text-sm font-medium mb-2">When I achieve this, I will feel...</p>
                    <p className="text-sm text-muted-foreground italic">
                      {goal.feeling_when_achieved}
                    </p>
                  </Card>
                )}

                {/* Danger Zone */}
                <Card className="p-4 border-destructive/20">
                  <p className="text-sm font-medium mb-3 text-destructive">Danger Zone</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onArchive}>
                      <Archive className="h-4 w-4 mr-1" />
                      Archive
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* Visualization Tab */}
              <TabsContent value="visualization" className="space-y-4 mt-0">
                <div className="grid grid-cols-3 gap-4">
                  {(goal.visualization_images || []).map((img, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                      onClick={() => setFullscreenImage(img)}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  ))}
                  <button className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/50 transition-colors">
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Add Image</span>
                  </button>
                </div>
                {(goal.visualization_images || []).length === 0 && (
                  <Card className="p-8 text-center">
                    <ImagePlus className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Add images that represent your goal to create your vision board.
                    </p>
                  </Card>
                )}
              </TabsContent>

              {/* Affirmations Tab */}
              <TabsContent value="affirmations" className="space-y-4 mt-0">
                {goal.affirmations?.length > 0 && (
                  <Card className="p-4 bg-primary/5 border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Volume2 className="h-4 w-4 text-primary" />
                      <span className="text-xs text-primary uppercase tracking-wider font-medium">
                        Daily Affirmation
                      </span>
                    </div>
                    <p className="text-lg font-medium italic">
                      "{goal.affirmations[0]}"
                    </p>
                  </Card>
                )}

                <div className="space-y-2">
                  {goal.affirmations?.map((affirmation, i) => (
                    <Card key={i} className="p-4 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {i + 1}
                      </div>
                      <p className="text-sm">{affirmation}</p>
                    </Card>
                  ))}
                </div>

                {(!goal.affirmations || goal.affirmations.length === 0) && (
                  <Card className="p-8 text-center">
                    <Volume2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Add affirmations to reinforce your manifestation.
                    </p>
                    <Button variant="outline" className="mt-4" onClick={onEdit}>
                      Add Affirmations
                    </Button>
                  </Card>
                )}
              </TabsContent>

              {/* Actions Tab */}
              <TabsContent value="actions" className="space-y-4 mt-0">
                <Card className="p-4">
                  <p className="text-sm font-medium mb-3">Add Action Step</p>
                  <div className="flex gap-2">
                    <Input
                      value={newActionTitle}
                      onChange={(e) => setNewActionTitle(e.target.value)}
                      placeholder="What's one small step you can take?"
                      onKeyDown={(e) => e.key === "Enter" && handleAddAction()}
                    />
                    <Button onClick={handleAddAction}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>

                <div className="space-y-2">
                  {(goal.action_steps || []).map((action) => (
                    <Card key={action.id} className="p-4 flex items-center gap-3">
                      <Checkbox checked={action.completed} />
                      <span className={action.completed ? "line-through text-muted-foreground" : ""}>
                        {action.title}
                      </span>
                      {action.taskId && (
                        <Badge variant="outline" className="ml-auto">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Linked to Tasks
                        </Badge>
                      )}
                    </Card>
                  ))}
                </div>

                {(!goal.action_steps || goal.action_steps.length === 0) && (
                  <Card className="p-8 text-center">
                    <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Break your goal into actionable steps to make it real.
                    </p>
                  </Card>
                )}
              </TabsContent>

              {/* Journal Tab */}
              <TabsContent value="journal" className="space-y-4 mt-0">
                <Card className="p-4">
                  <p className="text-sm font-medium mb-3">Quick Reflection</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground">
                        What are you grateful for today?
                      </label>
                      <Textarea
                        value={journalGratitude}
                        onChange={(e) => setJournalGratitude(e.target.value)}
                        placeholder="I am grateful for..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">
                        Visualization notes
                      </label>
                      <Textarea
                        value={journalVisualization}
                        onChange={(e) => setJournalVisualization(e.target.value)}
                        placeholder="During my visualization, I saw..."
                        rows={2}
                      />
                    </div>
                    <Button onClick={handleAddJournalEntry} className="w-full">
                      Save Entry
                    </Button>
                  </div>
                </Card>

                <div className="space-y-3">
                  {goalEntries.slice(0, 10).map((entry) => (
                    <Card key={entry.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">
                          {format(parseISO(entry.entry_date), "MMM d, yyyy")}
                        </Badge>
                      </div>
                      {entry.gratitude && (
                        <p className="text-sm mb-2">
                          <span className="text-muted-foreground">Gratitude:</span> {entry.gratitude}
                        </p>
                      )}
                      {entry.visualization && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Visualization:</span>{" "}
                          {entry.visualization}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Viewer */}
      {fullscreenImage && (
        <Dialog open={!!fullscreenImage} onOpenChange={() => setFullscreenImage(null)}>
          <DialogContent className="max-w-5xl p-0">
            <img
              src={fullscreenImage}
              alt=""
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{goal.title}" and all associated journal entries.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete();
                setDeleteDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
