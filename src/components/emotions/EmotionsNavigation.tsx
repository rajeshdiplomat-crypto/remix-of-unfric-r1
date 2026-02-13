import { Users, Calendar } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { EmotionEntry } from "./types";
import { RecentEntriesList } from "./RecentEntriesList";
import { EmotionCalendarSidebar } from "./EmotionCalendarSidebar";

export type EmotionsView = "feel" | "regulate" | "insights";

interface EmotionsNavigationProps {
  activeView: EmotionsView;
  canNavigate: {
    regulate: boolean;
  };
  onViewChange: (view: EmotionsView) => void;
  entries: EmotionEntry[];
  onEditEntry: (entry: EmotionEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onDateClick: (date: string, entries: EmotionEntry[]) => void;
}

export function EmotionsNavigation({
  activeView,
  canNavigate,
  onViewChange,
  entries,
  onEditEntry,
  onDeleteEntry,
  onDateClick,
}: EmotionsNavigationProps) {
  const navItems = [
    { id: "feel" as const, label: "Feel", enabled: true },
    { id: "regulate" as const, label: "Regulate", enabled: canNavigate.regulate },
    { id: "insights" as const, label: "Insights", enabled: true },
  ];

  return (
    <div className="flex items-center justify-end gap-6 w-full">
      {/* Main Navigation Pills */}
      <div className="flex items-center gap-0 p-1 bg-foreground/25 backdrop-blur-md rounded-lg">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => item.enabled && onViewChange(item.id)}
              disabled={!item.enabled}
              className={cn(
                "h-8 px-5 rounded-md transition-all duration-200 text-sm font-medium",
                isActive
                  ? "bg-foreground/40 text-white"
                  : "text-white/70 hover:text-white",
                !item.enabled && "opacity-40 cursor-not-allowed"
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Quick Actions - Popovers */}
      <div className="flex items-center gap-0 p-1 bg-foreground/25 backdrop-blur-md rounded-lg">
        {/* Recent Entries Popover */}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button
                  className="h-8 w-8 rounded-md flex items-center justify-center text-white/70 hover:text-white transition-colors"
                >
                  <Users className="h-4 w-4" />
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Recent Entries</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent 
            className="w-[380px] max-h-[70vh] overflow-hidden p-0 rounded-2xl" 
            align="end" 
            sideOffset={12}
          >
            <div className="max-h-[70vh] overflow-y-auto">
              <RecentEntriesList 
                entries={entries} 
                onEditEntry={onEditEntry} 
                onDeleteEntry={onDeleteEntry} 
              />
            </div>
          </PopoverContent>
        </Popover>

        {/* Calendar Popover */}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button
                  className="h-8 w-8 rounded-md flex items-center justify-center text-white/70 hover:text-white transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Calendar View</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent 
            className="w-auto p-0 rounded-2xl" 
            align="end" 
            sideOffset={12}
          >
            <EmotionCalendarSidebar entries={entries} onDateClick={onDateClick} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
