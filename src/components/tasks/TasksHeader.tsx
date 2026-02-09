import { Plus, Search, Sparkles, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TasksHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewTask: () => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const controlBase = "h-9 rounded-xl bg-background/70 border-border/40 shadow-sm";

export function TasksHeader({
  searchQuery,
  onSearchChange,
  onNewTask,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
}: TasksHeaderProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap justify-between">
      {/* Left: Search */}
      <div className="flex items-center gap-2">
        <div className="relative w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className={`pl-9 ${controlBase}`}
          />
        </div>

        <Button variant="outline" size="sm" className={`${controlBase} px-3 gap-1.5`}>
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-[11px]">AI</span>
        </Button>
      </div>

      {/* Right: Filters + New Task */}
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className={`w-[130px] ${controlBase} text-[11px]`}>
            <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="upcoming">To Do</SelectItem>
            <SelectItem value="ongoing">In Progress</SelectItem>
            <SelectItem value="completed">Done</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className={`w-[120px] ${controlBase} text-[11px]`}>
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="due_date">Due Date</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={onNewTask}
          className="h-9 rounded-xl px-4 shadow-md"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Task
        </Button>
      </div>
    </div>
  );
}
