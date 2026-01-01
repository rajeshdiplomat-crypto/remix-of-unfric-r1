import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { QuadrantMode } from "./types";

interface TasksHeaderProps {
  view: "board" | "quadrant";
  onViewChange: (view: "board" | "quadrant") => void;
  quadrantMode: QuadrantMode;
  onQuadrantModeChange: (mode: QuadrantMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewTask: () => void;
}

const MODE_OPTIONS: { value: QuadrantMode; label: string }[] = [
  { value: "urgent-important", label: "Urgent • Important" },
  { value: "status", label: "Status" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time of Day" },
];

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
    <div className="w-full">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Left: Title */}
        <div className="min-w-0">
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Organize your tasks by focus and see what truly matters today.
          </p>
        </div>

        {/* Right: Controls */}
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {/* View mode */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">View mode</span>

            <Select value={quadrantMode} onValueChange={(v) => onQuadrantModeChange(v as QuadrantMode)}>
              <SelectTrigger className="h-9 w-[190px] rounded-xl bg-card/60 border-border/40">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {MODE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks..."
              className="h-9 w-[260px] rounded-xl pl-9 bg-card/60 border-border/40 focus-visible:ring-1"
            />
          </div>

          {/* Segmented view switch */}
          <div className="flex items-center rounded-xl border border-border/40 bg-card/60 p-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onViewChange("board")}
              className={[
                "h-8 rounded-lg px-3 text-sm",
                view === "board"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              Board
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => onViewChange("quadrant")}
              className={[
                "h-8 rounded-lg px-3 text-sm",
                view === "quadrant"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              Quadrant
            </Button>
          </div>

          {/* CTA */}
          <Button onClick={onNewTask} className="h-9 rounded-xl px-4 shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>
    </div>
  );
}
