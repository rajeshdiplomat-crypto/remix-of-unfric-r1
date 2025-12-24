import { useState } from "react";
import { X, Search, Play, Check } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { QuadrantTask, QuadrantConfig, computeTaskStatus } from "./types";

interface QuadrantViewAllDrawerProps {
  open: boolean;
  onClose: () => void;
  quadrant: QuadrantConfig | null;
  tasks: QuadrantTask[];
  onTaskClick: (task: QuadrantTask) => void;
  onStartTask: (task: QuadrantTask) => void;
  onCompleteTask: (task: QuadrantTask) => void;
}

export function QuadrantViewAllDrawer({
  open,
  onClose,
  quadrant,
  tasks,
  onTaskClick,
  onStartTask,
  onCompleteTask,
}: QuadrantViewAllDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!quadrant) return null;

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-w-md ml-auto h-full rounded-l-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DrawerHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <DrawerTitle className="flex items-center gap-2">
                <span>{quadrant.title}</span>
                <Badge variant="secondary" className="text-xs">
                  {tasks.length} tasks
                </Badge>
              </DrawerTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="pl-9"
              />
            </div>
          </DrawerHeader>

          {/* Task List */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {filteredTasks.map((task) => {
                const isCompleted = task.is_completed || !!task.completed_at;
                const status = computeTaskStatus(task);

                return (
                  <div
                    key={task.id}
                    className={cn(
                      "group p-3 bg-background rounded-xl border border-border/50",
                      "hover:shadow-md hover:border-border transition-all cursor-pointer",
                      isCompleted && "opacity-60"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0" onClick={() => { onTaskClick(task); onClose(); }}>
                        <p className={cn(
                          "text-sm font-medium text-foreground",
                          isCompleted && "line-through"
                        )}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {task.due_date && (
                            <span>{format(new Date(task.due_date), 'MMM d')}</span>
                          )}
                          {task.due_time && <span>@ {task.due_time}</span>}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                            {task.time_of_day}
                          </Badge>
                          {status === 'overdue' && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-destructive/10 text-destructive border-destructive/30">
                              Overdue
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!isCompleted && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartTask(task);
                              }}
                            >
                              <Play className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCompleteTask(task);
                              }}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredTasks.length === 0 && (
                <div className="flex items-center justify-center h-32 text-muted-foreground/60 text-sm italic">
                  No tasks found
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
