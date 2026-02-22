import { Users, Calendar } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { EmotionEntry } from "./types";
import { RecentEntriesList } from "./RecentEntriesList";
import { EmotionCalendarSidebar } from "./EmotionCalendarSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

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
  /** When true, renders as a standalone sticky bar (mobile) instead of hero overlay */
  standalone?: boolean;
}

export function EmotionsNavigation({
  activeView,
  canNavigate,
  onViewChange,
  entries,
  onEditEntry,
  onDeleteEntry,
  onDateClick,
  standalone = false,
}: EmotionsNavigationProps) {
  const isMobile = useIsMobile();
  const navItems = [
    { id: "feel" as const, label: "Feel", enabled: true },
    { id: "regulate" as const, label: "Regulate", enabled: canNavigate.regulate },
    { id: "insights" as const, label: "Insights", enabled: true },
  ];

  // Mobile: standalone sticky segmented control
  if (standalone) {
    return (
      <div className={cn(
        "z-30 bg-background/95 backdrop-blur-md border-b border-border px-3 py-2",
        isMobile && "sticky top-0"
      )}>
        <div className="flex items-center gap-2">
          {/* Segmented Control */}
          <div className="flex-1 flex items-center gap-0 p-1 bg-muted rounded-xl">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => item.enabled && onViewChange(item.id)}
                  disabled={!item.enabled}
                  className={cn(
                    "flex-1 h-7 rounded-lg transition-all duration-200 text-[11px] font-semibold tracking-wide",
                    isActive
                      ? "bg-card shadow-sm text-foreground"
                      : "text-muted-foreground",
                    !item.enabled && "opacity-40 cursor-not-allowed"
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <button className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Users className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[340px] max-h-[70vh] overflow-hidden p-0 rounded-2xl" 
                align="end" 
                sideOffset={8}
              >
                <div className="max-h-[70vh] overflow-y-auto">
                  <RecentEntriesList entries={entries} onEditEntry={onEditEntry} onDeleteEntry={onDeleteEntry} />
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <button className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Calendar className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl" align="end" sideOffset={8}>
                <EmotionCalendarSidebar entries={entries} onDateClick={onDateClick} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    );
  }

  // Desktop: floating glass pill
  return (
    <div className="sticky top-0 z-50 flex justify-center py-3">
      <div className="flex items-center gap-1 px-2 py-1.5 bg-background/60 backdrop-blur-xl border border-border/50 rounded-full shadow-sm"
        style={{ width: '50%', minWidth: 420 }}
      >
        {/* Tab Pills */}
        <div className="flex items-center gap-0.5 flex-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => item.enabled && onViewChange(item.id)}
                disabled={!item.enabled}
                className={cn(
                  "flex-1 h-8 rounded-full transition-all duration-200 text-sm",
                  "hover:scale-[1.03] hover:text-primary",
                  isActive
                    ? "bg-primary/15 font-semibold text-primary shadow-sm"
                    : "font-medium text-muted-foreground",
                  !item.enabled && "opacity-40 cursor-not-allowed hover:scale-100 hover:text-muted-foreground"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-border/60 mx-1" />

        {/* Quick Actions */}
        <div className="flex items-center gap-0.5">
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                    <Calendar className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>Calendar</p></TooltipContent>
            </Tooltip>
            <PopoverContent className="w-auto p-0 rounded-2xl" align="end" sideOffset={12}>
              <EmotionCalendarSidebar entries={entries} onDateClick={onDateClick} />
            </PopoverContent>
          </Popover>

          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                    <Users className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>Recent Entries</p></TooltipContent>
            </Tooltip>
            <PopoverContent
              className="w-[380px] max-h-[70vh] overflow-hidden p-0 rounded-2xl"
              align="end"
              sideOffset={12}
            >
              <div className="max-h-[70vh] overflow-y-auto">
                <RecentEntriesList entries={entries} onEditEntry={onEditEntry} onDeleteEntry={onDeleteEntry} />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
