import { Plus, Search, ArrowUpDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TasksHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewTask: () => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  priorityFilter?: string;
  onPriorityFilterChange?: (priority: string) => void;
  tagFilter?: string;
  onTagFilterChange?: (tag: string) => void;
}

export function TasksHeader({
  searchQuery,
  onSearchChange,
  onNewTask,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  priorityFilter = "all",
  onPriorityFilterChange,
  tagFilter = "all",
  onTagFilterChange,
}: TasksHeaderProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap justify-between bg-background/40 backdrop-blur-xl border border-foreground/[0.06] rounded-sm p-2 shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.04)]">
      {/* Left: Search */}
      <div className="flex items-center gap-2">
        <div className="relative w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="pl-9 h-9 rounded-sm bg-background border-border shadow-sm text-[13px]"
          />
        </div>
      </div>

      {/* Right: Filters + New Task */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 rounded-sm px-3 gap-1.5">
              <Filter className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="text-[11px] tracking-[0.15em]">Filter</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
            <DropdownMenuLabel className="text-[10px] tracking-[0.3em] uppercase opacity-50">Status</DropdownMenuLabel>
            <DropdownMenuCheckboxItem checked={statusFilter === "all"} onCheckedChange={() => onStatusFilterChange("all")} className="text-[11px]">All</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={statusFilter === "upcoming"} onCheckedChange={() => onStatusFilterChange("upcoming")} className="text-[11px]">Upcoming</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={statusFilter === "ongoing"} onCheckedChange={() => onStatusFilterChange("ongoing")} className="text-[11px]">Ongoing</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={statusFilter === "completed"} onCheckedChange={() => onStatusFilterChange("completed")} className="text-[11px]">Done</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={statusFilter === "overdue"} onCheckedChange={() => onStatusFilterChange("overdue")} className="text-[11px]">Due</DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] tracking-[0.3em] uppercase opacity-50">Priority</DropdownMenuLabel>
            <DropdownMenuCheckboxItem checked={priorityFilter === "all"} onCheckedChange={() => onPriorityFilterChange?.("all")} className="text-[11px]">All Priorities</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={priorityFilter === "urgent-important"} onCheckedChange={() => onPriorityFilterChange?.("urgent-important")} className="text-[11px]">Urgent & Important</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={priorityFilter === "urgent-not-important"} onCheckedChange={() => onPriorityFilterChange?.("urgent-not-important")} className="text-[11px]">Urgent & Not Important</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={priorityFilter === "not-urgent-important"} onCheckedChange={() => onPriorityFilterChange?.("not-urgent-important")} className="text-[11px]">Not Urgent & Important</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={priorityFilter === "not-urgent-not-important"} onCheckedChange={() => onPriorityFilterChange?.("not-urgent-not-important")} className="text-[11px]">Not Urgent & Not Important</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[120px] h-9 rounded-sm bg-background border-border shadow-sm text-[11px] tracking-[0.1em]">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="due_date">Due Date</SelectItem>
          </SelectContent>
        </Select>

        {/* Expandable + button */}
        <Button
          onClick={onNewTask}
          className="h-9 rounded-sm px-3 shadow-sm group overflow-hidden transition-all duration-300 hover:px-4"
        >
          <Plus className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          <span className="max-w-0 overflow-hidden group-hover:max-w-[80px] transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:ml-1.5 text-[11px] tracking-[0.15em] whitespace-nowrap">
            New Task
          </span>
        </Button>
      </div>
    </div>
  );
}
