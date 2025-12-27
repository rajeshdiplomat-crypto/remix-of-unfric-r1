import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ViewSwitcher } from "./ViewSwitcher";
import { QuadrantMode } from "./types";
import { ReactNode } from "react";

interface TasksHeaderProps {
  view: 'board' | 'quadrant';
  onViewChange: (view: 'board' | 'quadrant') => void;
  quadrantMode: QuadrantMode;
  onQuadrantModeChange: (mode: QuadrantMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewTask: () => void;
  timerWidget?: ReactNode;
}

export function TasksHeader({
  view,
  onViewChange,
  quadrantMode,
  onQuadrantModeChange,
  searchQuery,
  onSearchChange,
  onNewTask,
  timerWidget,
}: TasksHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Top Row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        {/* Left - Title & Description */}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize your tasks by focus and see what truly matters today.
          </p>
        </div>

        {/* Right - Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline">View mode</span>
            <Select value={quadrantMode} onValueChange={(v) => onQuadrantModeChange(v as QuadrantMode)}>
              <SelectTrigger className="w-40 bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent-important">
                  <span className="flex items-center gap-2">
                    <span>📋</span> Urgent × Important
                  </span>
                </SelectItem>
                <SelectItem value="status">
                  <span className="flex items-center gap-2">
                    <span>📊</span> Status
                  </span>
                </SelectItem>
                <SelectItem value="date">
                  <span className="flex items-center gap-2">
                    <span>📅</span> Date
                  </span>
                </SelectItem>
                <SelectItem value="time">
                  <span className="flex items-center gap-2">
                    <span>🕐</span> Time of Day
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks..."
              className="pl-9 bg-background border-border"
            />
          </div>

          {/* View Switcher */}
          <ViewSwitcher view={view} onViewChange={onViewChange} />

          {/* Timer Widget - inline with controls */}
          {timerWidget}

          {/* New Task Button */}
          <Button onClick={onNewTask} className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-1.5" />
            New Task
          </Button>
        </div>
      </div>
    </div>
  );
}
