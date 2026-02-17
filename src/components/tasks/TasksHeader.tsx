import { Plus, Search, Sparkles, ArrowUpDown, Filter } from "lucide-react";
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

const controlBase = "h-9 rounded-xl bg-background border-border shadow-sm";

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
    <div className="flex flex-col gap-3">
      {/* Centered New Task button */}
      <div className="flex justify-center">
        <Button
          onClick={onNewTask}
          className="h-9 rounded-xl px-6 shadow-md"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Task
        </Button>
      </div>

      {/* Filters row */}
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

        {/* Right: Filters */}
        <div className="flex items-center gap-2">
          {/* Unified Filter dropdown (status, priority, date) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className={`${controlBase} px-3 gap-1.5`}>
                <Filter className="h-3.5 w-3.5" />
                <span className="text-[11px]">Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
              <DropdownMenuLabel className="text-[11px]">Status</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={statusFilter === "all"}
                onCheckedChange={() => onStatusFilterChange("all")}
                className="text-[11px]"
              >
                All
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === "upcoming"}
                onCheckedChange={() => onStatusFilterChange("upcoming")}
                className="text-[11px]"
              >
                Upcoming
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === "ongoing"}
                onCheckedChange={() => onStatusFilterChange("ongoing")}
                className="text-[11px]"
              >
                Ongoing
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === "completed"}
                onCheckedChange={() => onStatusFilterChange("completed")}
                className="text-[11px]"
              >
                Done
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === "overdue"}
                onCheckedChange={() => onStatusFilterChange("overdue")}
                className="text-[11px]"
              >
                Due
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px]">Priority</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={priorityFilter === "all"}
                onCheckedChange={() => onPriorityFilterChange?.("all")}
                className="text-[11px]"
              >
                All Priorities
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={priorityFilter === "urgent-important"}
                onCheckedChange={() => onPriorityFilterChange?.("urgent-important")}
                className="text-[11px]"
              >
                Urgent & Important
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={priorityFilter === "urgent-not-important"}
                onCheckedChange={() => onPriorityFilterChange?.("urgent-not-important")}
                className="text-[11px]"
              >
                Urgent & Not Important
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={priorityFilter === "not-urgent-important"}
                onCheckedChange={() => onPriorityFilterChange?.("not-urgent-important")}
                className="text-[11px]"
              >
                Not Urgent & Important
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={priorityFilter === "not-urgent-not-important"}
                onCheckedChange={() => onPriorityFilterChange?.("not-urgent-not-important")}
                className="text-[11px]"
              >
                Not Urgent & Not Important
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
        </div>
      </div>
    </div>
  );
}
