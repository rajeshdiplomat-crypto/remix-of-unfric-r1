import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuadrantMode, QUADRANT_MODES } from "./types";

interface QuadrantToolbarProps {
  mode: QuadrantMode;
  onModeChange: (mode: QuadrantMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function QuadrantToolbar({ 
  mode, 
  onModeChange, 
  searchQuery, 
  onSearchChange,
}: QuadrantToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-card/50 rounded-xl border border-border/50">
      {/* Left - Mode Dropdown */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground whitespace-nowrap">View mode</span>
        <Select value={mode} onValueChange={(v) => onModeChange(v as QuadrantMode)}>
          <SelectTrigger className="w-48 bg-background/50">
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

      {/* Center - Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks…"
            className="pl-9 bg-background/50 border-border/50"
          />
        </div>
      </div>

      {/* Right - Empty (removed Priority/Assignee/New Task) */}
      <div className="w-4" />
    </div>
  );
}
