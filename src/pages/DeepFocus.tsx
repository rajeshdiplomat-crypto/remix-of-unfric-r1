import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, RotateCcw, Check, Plus, Trash2, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { QuadrantTask, Subtask } from "@/components/tasks/types";
import { useToast } from "@/hooks/use-toast";

const TIMER_PRESETS = [
  { label: "25 min", minutes: 25 },
  { label: "50 min", minutes: 50 },
  { label: "90 min", minutes: 90 },
];

interface DeepFocusProps {
  tasks: QuadrantTask[];
  onUpdateTask: (task: QuadrantTask) => void;
}

export default function DeepFocus({ tasks, onUpdateTask }: DeepFocusProps) {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const task = tasks.find(t => t.id === taskId);

  const [timerMinutes, setTimerMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [notes, setNotes] = useState("");
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [markComplete, setMarkComplete] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    setSecondsRemaining(timerMinutes * 60);
  }, [timerMinutes]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = new Date();
      intervalRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            handleTimerEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleTimerEnd = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Calculate session minutes
    if (startTimeRef.current) {
      const elapsed = Math.floor((new Date().getTime() - startTimeRef.current.getTime()) / 60000);
      setSessionMinutes(elapsed);
    } else {
      setSessionMinutes(timerMinutes);
    }
    
    setShowSummary(true);
    
    // Play notification sound if not in DND mode
    if (!doNotDisturb) {
      toast({ title: "Focus session complete!", description: `You focused for ${timerMinutes} minutes.` });
    }
  };

  const handleEndSession = () => {
    if (startTimeRef.current) {
      const elapsed = Math.floor((new Date().getTime() - startTimeRef.current.getTime()) / 60000);
      setSessionMinutes(Math.max(1, elapsed));
    }
    setIsRunning(false);
    setShowSummary(true);
  };

  const handleSaveSummary = () => {
    if (!task) return;

    const updated: QuadrantTask = {
      ...task,
      total_focus_minutes: (task.total_focus_minutes || 0) + sessionMinutes,
      is_completed: markComplete,
      completed_at: markComplete ? new Date().toISOString() : task.completed_at,
    };

    onUpdateTask(updated);
    toast({ title: "Session saved", description: `Added ${sessionMinutes} minutes of focus time.` });
    navigate('/tasks');
  };

  const handleSubtaskToggle = (subtaskId: string) => {
    if (!task) return;
    const updated: QuadrantTask = {
      ...task,
      subtasks: task.subtasks.map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      ),
    };
    onUpdateTask(updated);
  };

  const handleAddSubtask = () => {
    if (!task || !newSubtask.trim()) return;
    const subtask: Subtask = {
      id: `subtask-${Date.now()}`,
      title: newSubtask.trim(),
      completed: false,
    };
    const updated: QuadrantTask = {
      ...task,
      subtasks: [...task.subtasks, subtask],
    };
    onUpdateTask(updated);
    setNewSubtask("");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((timerMinutes * 60 - secondsRemaining) / (timerMinutes * 60)) * 100;

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Task not found</p>
          <Button variant="link" onClick={() => navigate('/tasks')}>
            Return to Tasks
          </Button>
        </div>
      </div>
    );
  }

  if (showSummary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Session Complete!</h2>
              <p className="text-muted-foreground mt-1">{task.title}</p>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 text-center">
              <p className="text-4xl font-bold text-primary">{sessionMinutes}</p>
              <p className="text-sm text-muted-foreground">minutes focused</p>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
              <Checkbox
                checked={markComplete}
                onCheckedChange={(checked) => setMarkComplete(!!checked)}
              />
              <label className="text-sm font-medium cursor-pointer" onClick={() => setMarkComplete(!markComplete)}>
                Mark task as completed
              </label>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/tasks')}>
                Skip
              </Button>
              <Button className="flex-1" onClick={handleSaveSummary}>
                Save Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/tasks')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-semibold text-lg">{task.title}</h1>
                <p className="text-sm text-muted-foreground">Deep Focus Mode</p>
              </div>
            </div>
            <Button
              variant={doNotDisturb ? "secondary" : "outline"}
              size="sm"
              onClick={() => setDoNotDisturb(!doNotDisturb)}
            >
              {doNotDisturb ? <BellOff className="h-4 w-4 mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
              {doNotDisturb ? "DND On" : "DND Off"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Timer Section */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                {/* Timer Display */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <div className="text-7xl font-mono font-bold text-foreground">
                      {formatTime(secondsRemaining)}
                    </div>
                    <Progress value={progress} className="h-2 mt-4" />
                  </div>
                </div>

                {/* Preset Buttons */}
                {!isRunning && (
                  <div className="flex justify-center gap-2 mb-6">
                    {TIMER_PRESETS.map((preset) => (
                      <Button
                        key={preset.minutes}
                        variant={timerMinutes === preset.minutes ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimerMinutes(preset.minutes)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                    <Input
                      type="number"
                      min={1}
                      max={180}
                      value={timerMinutes}
                      onChange={(e) => setTimerMinutes(Math.max(1, parseInt(e.target.value) || 25))}
                      className="w-20 text-center"
                    />
                  </div>
                )}

                {/* Controls */}
                <div className="flex justify-center gap-3">
                  {!isRunning ? (
                    <Button size="lg" onClick={() => setIsRunning(true)}>
                      <Play className="h-5 w-5 mr-2" />
                      Start
                    </Button>
                  ) : (
                    <>
                      <Button size="lg" variant="outline" onClick={() => setIsRunning(false)}>
                        <Pause className="h-5 w-5 mr-2" />
                        Pause
                      </Button>
                      <Button size="lg" variant="destructive" onClick={handleEndSession}>
                        End Session
                      </Button>
                    </>
                  )}
                  {!isRunning && secondsRemaining < timerMinutes * 60 && (
                    <Button size="lg" variant="ghost" onClick={() => setSecondsRemaining(timerMinutes * 60)}>
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Focus Stats */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Focus Stats
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total focus time</span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {task.total_focus_minutes || 0} min
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task Details Section */}
          <div className="space-y-6">
            {/* Subtasks */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Subtasks
                </h3>
                <div className="space-y-2">
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-3">
                      <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={() => handleSubtaskToggle(subtask.id)}
                      />
                      <span className={cn(
                        "flex-1 text-sm",
                        subtask.completed && "line-through text-muted-foreground"
                      )}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-3">
                    <Plus className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                      placeholder="Add subtask (Enter)"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Session Notes
                </h3>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Capture thoughts, insights, or blockers..."
                  rows={6}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
