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
    <div className="flex items-center gap-2 flex-wrap justify-end">
      {/* Mode select */}
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-[12px] uppercase tracking-[0.16em] text-muted-foreground">
          View mode
        </span>

        <Select value={quadrantMode} onValueChange={(v) => onQuadrantModeChange(v as QuadrantMode)}>
          <SelectTrigger className={`w-[190px] ${controlBase}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="urgent-important">📋 Urgent × Important</SelectItem>
            <SelectItem value="status">📊 Status</SelectItem>
            <SelectItem value="date">📅 Date</SelectItem>
            <SelectItem value="time">🕐 Time of Day</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      <div className="relative w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks..."
          className={`pl-9 ${controlBase}`}
        />
      </div>

      {/* Segmented control (Board / Quadrant) */}
      <div className="flex items-center rounded-xl border border-border/40 bg-background/60 p-1 shadow-sm">
        <button
          type="button"
          onClick={() => onViewChange("board")}
          className={[
            "h-8 px-3 rounded-lg text-[13px] font-medium transition",
            view === "board" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          📅 Planner
        </button>
        <button
          type="button"
          onClick={() => onViewChange("quadrant")}
          className={[
            "h-8 px-3 rounded-lg text-[13px] font-medium transition",
            view === "quadrant"
              ? "bg-card shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          Quadrant
        </button>
      </div>

      {/* Primary CTA */}
      <Button onClick={onNewTask} className="h-10 rounded-xl px-4 shadow-sm">
        <Plus className="h-4 w-4 mr-2" />
        New Task
      </Button>
    </div>
  );
}
