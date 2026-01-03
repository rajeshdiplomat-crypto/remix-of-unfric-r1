import { useState } from "react";
import { Play, Check, Flame, Clock, Sparkles, Archive, AlertTriangle, CheckCircle, Calendar, Sun, Sunrise, Sunset, Moon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { QuadrantTask, QuadrantMode, QuadrantConfig, QUADRANT_MODES, computeTaskStatus } from "./types";
import { QuadrantViewAllDrawer } from "./QuadrantViewAllDrawer";

interface QuadrantGridProps {
  mode: QuadrantMode;
  tasks: QuadrantTask[];
  onTaskClick: (task: QuadrantTask) => void;
  onStartTask: (task: QuadrantTask) => void;
  onCompleteTask: (task: QuadrantTask) => void;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  flame: Flame,
  clock: Clock,
  sparkles: Sparkles,
  archive: Archive,
  'alert-triangle': AlertTriangle,
  play: Play,
  calendar: Calendar,
  'check-circle': CheckCircle,
  sun: Sun,
  sunrise: Sunrise,
  sunset: Sunset,
  moon: Moon,
};

export function QuadrantGrid({ mode, tasks, onTaskClick, onStartTask, onCompleteTask }: QuadrantGridProps) {
  const modeConfig = QUADRANT_MODES[mode];
  const [viewAllOpen, setViewAllOpen] = useState(false);
  const [viewAllQuadrant, setViewAllQuadrant] = useState<QuadrantConfig | null>(null);
  const [viewAllTasks, setViewAllTasks] = useState<QuadrantTask[]>([]);

  const getTasksForQuadrant = (quadrantId: string): QuadrantTask[] => {
    return tasks.filter(task => {
      // All tasks should appear in quadrant view based on their properties
      switch (mode) {
        case 'urgent-important':
          if (quadrantId === 'urgent-important') return task.urgency === 'high' && task.importance === 'high';
          if (quadrantId === 'urgent-not-important') return task.urgency === 'high' && task.importance === 'low';
          if (quadrantId === 'not-urgent-important') return task.urgency === 'low' && task.importance === 'high';
          if (quadrantId === 'not-urgent-not-important') return task.urgency === 'low' && task.importance === 'low';
          break;
        case 'status':
          return computeTaskStatus(task) === quadrantId;
        case 'date':
          return task.date_bucket === quadrantId;
        case 'time':
          return task.time_of_day === quadrantId;
      }
      return false;
    });
  };

  const handleViewAll = (quadrant: QuadrantConfig, quadrantTasks: QuadrantTask[]) => {
    setViewAllQuadrant(quadrant);
    setViewAllTasks(quadrantTasks);
    setViewAllOpen(true);
  };

  const QuadrantCard = ({ quadrant, position }: { quadrant: typeof modeConfig.quadrants[0]; position: number }) => {
    const Icon = ICONS[quadrant.icon] || Flame;
    const quadrantTasks = getTasksForQuadrant(quadrant.id);
    const completedCount = quadrantTasks.filter(t => t.is_completed).length;
    const progress = quadrantTasks.length > 0 ? (completedCount / quadrantTasks.length) * 100 : 0;
    
    const isTopLeft = position === 0;
    
    return (
      <div
        className={cn(
          "relative flex flex-col rounded-2xl border transition-all duration-300 min-h-0 overflow-hidden",
          "bg-card/80 backdrop-blur-sm",
          isTopLeft ? "border-primary/30 shadow-lg" : "border-border/50 shadow-sm",
          "hover:shadow-md hover:border-border"
        )}
      >
        {/* Header - fixed height, never scrolls */}
        <div className="flex items-center justify-between p-4 border-b border-border/30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-4 w-4", isTopLeft ? "text-primary" : "text-muted-foreground")} />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {quadrant.title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-primary/10 text-primary">
              {quadrantTasks.length}
            </Badge>
            <div className="w-12">
              <Progress value={progress} className="h-1" />
            </div>
          </div>
        </div>

        {/* Task List - scrollable area */}
        <div className="flex-1 min-h-0 p-3 space-y-2 overflow-y-auto">
          {quadrantTasks.map((task) => {
            const isCompleted = task.is_completed || !!task.completed_at;
            const status = computeTaskStatus(task);
            
            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/30",
                  "hover:bg-background hover:border-border transition-all cursor-pointer group",
                  isCompleted && "opacity-60"
                )}
              >
                <div className="flex-1 min-w-0" onClick={() => onTaskClick(task)}>
                  <p className={cn(
                    "text-sm font-medium text-foreground truncate",
                    isCompleted && "line-through"
                  )}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    {task.due_date && (
                      <span>{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    )}
                    {task.due_time && <span>@ {task.due_time}</span>}
                    {status === 'overdue' && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 bg-destructive/10 text-destructive border-destructive/30">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Action icons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isCompleted && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartTask(task);
                        }}
                        title="Start / Deep Focus"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCompleteTask(task);
                        }}
                        title="Mark Complete"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          
          {quadrantTasks.length === 0 && (
            <div className="flex items-center justify-center h-20 text-muted-foreground/60 text-sm italic">
              No tasks here yet
            </div>
          )}
        </div>

        {/* Footer - View all */}
        <div className="p-3 pt-0">
          {quadrantTasks.length > 6 ? (
            <button 
              className="text-xs text-primary hover:underline"
              onClick={() => handleViewAll(quadrant, quadrantTasks)}
            >
              View all ({quadrantTasks.length})
            </button>
          ) : quadrantTasks.length > 0 ? (
            <button 
              className="text-xs text-muted-foreground hover:text-primary hover:underline"
              onClick={() => handleViewAll(quadrant, quadrantTasks)}
            >
              View all
            </button>
          ) : (
            <p className="text-xs text-muted-foreground/60">
              {position === 0 ? "Drop high-focus tasks here" : 
               position === 1 ? "Outsource or timebox" :
               position === 2 ? "Schedule deep work blocks" :
               "Keep if meaningful"}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="relative h-full min-h-0 flex flex-col overflow-hidden">
        {/* Axis Labels */}
        {mode === 'urgent-important' && (
          <>
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap z-10">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                Low Importance — High Importance
              </span>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 whitespace-nowrap z-10">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                Low Urgency · High Urgency
              </span>
            </div>
          </>
        )}

        {/* 2x2 Grid */}
        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 pl-2 overflow-hidden">
          <QuadrantCard quadrant={modeConfig.quadrants[0]} position={0} />
          <QuadrantCard quadrant={modeConfig.quadrants[1]} position={1} />
          <QuadrantCard quadrant={modeConfig.quadrants[2]} position={2} />
          <QuadrantCard quadrant={modeConfig.quadrants[3]} position={3} />
        </div>
      </div>

      {/* View All Drawer */}
      <QuadrantViewAllDrawer
        open={viewAllOpen}
        onClose={() => setViewAllOpen(false)}
        quadrant={viewAllQuadrant}
        tasks={viewAllTasks}
        onTaskClick={onTaskClick}
        onStartTask={onStartTask}
        onCompleteTask={onCompleteTask}
      />
    </>
  );
}
