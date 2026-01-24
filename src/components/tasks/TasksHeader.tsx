import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuadrantMode } from "./types";

interface TasksHeaderProps {
  view: "board" | "quadrant";
  onViewChange: (view: "board" | "quadrant") => void;
  quadrantMode: QuadrantMode;
  onQuadrantModeChange: (mode: QuadrantMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewTask: () => void;
}

const controlBase = "h-10 rounded-xl bg-background/70 border-border/40 shadow-sm";

export function TasksHeader({
  view,
  onViewChange,
  quadrantMode,
  onQuadrantModeChange,
  searchQuery,
  onSearchChange,
  onNewTask,
}: TasksHeaderProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap justify-between">
      {/* Left: Combined View Selector */}
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-[12px] uppercase tracking-[0.16em] text-muted-foreground">View</span>

        <Select
          value={view === "board" ? "planner" : `quadrant-${quadrantMode}`}
          onValueChange={(v) => {
            if (v === "planner") {
              onViewChange("board");
            } else {
              const mode = v.replace("quadrant-", "") as QuadrantMode;
              onViewChange("quadrant");
              onQuadrantModeChange(mode);
            }
          }}
        >
          <SelectTrigger className={`w-[240px] ${controlBase}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="planner">
              <span className="flex items-center gap-2">
                📅 <span className="font-medium">Planner</span>
                <span className="text-muted-foreground text-xs ml-1">(Board)</span>
              </span>
            </SelectItem>
            <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground border-t border-border/50 mt-1">
              Quadrant Views
            </div>
            <SelectItem value="quadrant-urgent-important">
              <span className="flex items-center gap-2">🎯 Urgent × Important</span>
            </SelectItem>
            <SelectItem value="quadrant-status">
              <span className="flex items-center gap-2">📊 By Status</span>
            </SelectItem>
            <SelectItem value="quadrant-date">
              <span className="flex items-center gap-2">📅 By Date</span>
            </SelectItem>
            <SelectItem value="quadrant-time">
              <span className="flex items-center gap-2">🕐 By Time of Day</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Right: Search + New Task */}
      <div className="flex items-center gap-2">
        <div className="relative w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className={`pl-9 ${controlBase}`}
          />
        </div>

        <Button
          onClick={onNewTask}
          className="h-10 rounded-xl px-4 shadow-md bg-gradient-to-r from-primary via-chart-1 to-primary hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>
    </div>
  );
}
