import { Play, Flame, Clock, Sparkles, Archive, AlertTriangle, CheckCircle, Calendar, Sun, Sunrise, Sunset, Moon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { QuadrantTask, QuadrantMode, QUADRANT_MODES } from "./types";

interface QuadrantGridProps {
  mode: QuadrantMode;
  tasks: QuadrantTask[];
  onTaskClick: (task: QuadrantTask) => void;
  onDrop: (quadrantId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
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

export function QuadrantGrid({ mode, tasks, onTaskClick, onDrop, onDragOver }: QuadrantGridProps) {
  const modeConfig = QUADRANT_MODES[mode];

  const getTasksForQuadrant = (quadrantId: string): QuadrantTask[] => {
    return tasks.filter(task => {
      if (!task.quadrant_assigned) return false;
      
      switch (mode) {
        case 'urgent-important':
          if (quadrantId === 'urgent-important') return task.urgency === 'high' && task.importance === 'high';
          if (quadrantId === 'urgent-not-important') return task.urgency === 'high' && task.importance === 'low';
          if (quadrantId === 'not-urgent-important') return task.urgency === 'low' && task.importance === 'high';
          if (quadrantId === 'not-urgent-not-important') return task.urgency === 'low' && task.importance === 'low';
          break;
        case 'status':
          return task.status === quadrantId;
        case 'date':
          return task.date_bucket === quadrantId;
        case 'time':
          return task.time_of_day === quadrantId;
      }
      return false;
    });
  };

  const getTaskMeta = (task: QuadrantTask) => {
    const parts: string[] = [];
    if (task.date_bucket === 'today') parts.push('Today');
    else if (task.date_bucket === 'tomorrow') parts.push('Tomorrow');
    else if (task.status === 'overdue') parts.push('Overdue');
    if (task.time_of_day) parts.push(task.time_of_day.charAt(0).toUpperCase() + task.time_of_day.slice(1));
    return parts.join(' · ');
  };

  const QuadrantCard = ({ quadrant, position }: { quadrant: typeof modeConfig.quadrants[0]; position: number }) => {
    const Icon = ICONS[quadrant.icon] || Flame;
    const quadrantTasks = getTasksForQuadrant(quadrant.id);
    const completedCount = quadrantTasks.filter(t => t.is_completed).length;
    const progress = quadrantTasks.length > 0 ? (completedCount / quadrantTasks.length) * 100 : 0;
    
    // Position determines styling - top-left is most important
    const isTopLeft = position === 0;
    
    return (
      <div
        onDragOver={onDragOver}
        onDrop={() => onDrop(quadrant.id)}
        className={cn(
          "relative flex flex-col rounded-2xl border transition-all duration-300",
          "bg-card/80 backdrop-blur-sm",
          isTopLeft ? "border-primary/30 shadow-lg" : "border-border/50 shadow-sm",
          "hover:shadow-md hover:border-border"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-4 w-4", isTopLeft ? "text-primary" : "text-muted-foreground")} />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {quadrant.title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-primary/10 text-primary">
              {quadrantTasks.length} tasks
            </Badge>
            <div className="w-12">
              <Progress value={progress} className="h-1" />
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-48">
          {quadrantTasks.slice(0, 4).map((task) => (
            <div
              key={task.id}
              onClick={() => onTaskClick(task)}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/30",
                "hover:bg-background hover:border-border transition-all cursor-pointer group",
                task.is_completed && "opacity-60"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium text-foreground truncate", task.is_completed && "line-through")}>
                  {task.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {getTaskMeta(task)}
                </p>
              </div>
              <Play className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
            </div>
          ))}
          
          {quadrantTasks.length === 0 && (
            <div className="flex items-center justify-center h-20 text-muted-foreground/60 text-sm italic">
              Drop high-focus tasks here
            </div>
          )}
        </div>

        {/* Footer */}
        {quadrantTasks.length > 4 && (
          <div className="p-3 pt-0">
            <button className="text-xs text-primary hover:underline">
              View all ({quadrantTasks.length})
            </button>
          </div>
        )}
        
        {quadrantTasks.length === 0 && (
          <div className="p-3 pt-0">
            <p className="text-xs text-muted-foreground/60">
              {position === 0 ? "Drop high-focus tasks here" : 
               position === 1 ? "Outsource or timebox" :
               position === 2 ? "Schedule deep work blocks" :
               "Keep if meaningful"}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative h-full">
      {/* Axis Labels */}
      {mode === 'urgent-important' && (
        <>
          {/* Vertical axis label */}
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
              Low Importance — High Importance
            </span>
          </div>
          {/* Horizontal axis label */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 whitespace-nowrap">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
              Low Urgency · High Urgency
            </span>
          </div>
        </>
      )}

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-4 h-full pl-2">
        {/* Top row - High Importance or first 2 quadrants */}
        <QuadrantCard quadrant={modeConfig.quadrants[0]} position={0} />
        <QuadrantCard quadrant={modeConfig.quadrants[1]} position={1} />
        
        {/* Bottom row - Low Importance or last 2 quadrants */}
        <QuadrantCard quadrant={modeConfig.quadrants[2]} position={2} />
        <QuadrantCard quadrant={modeConfig.quadrants[3]} position={3} />
      </div>
    </div>
  );
}
