import { Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type EmotionsView = "feel" | "regulate" | "insights";

interface EmotionsNavigationProps {
  activeView: EmotionsView;
  canNavigate: {
    regulate: boolean;
  };
  onViewChange: (view: EmotionsView) => void;
  onOpenRecentEntries: () => void;
  onOpenCalendar: () => void;
}

export function EmotionsNavigation({
  activeView,
  canNavigate,
  onViewChange,
  onOpenRecentEntries,
  onOpenCalendar,
}: EmotionsNavigationProps) {
  const navItems = [
    { id: "feel" as const, label: "Feel", enabled: true },
    { id: "regulate" as const, label: "Regulate", enabled: canNavigate.regulate },
    { id: "insights" as const, label: "Insights", enabled: true },
  ];

  return (
    <div className="flex items-center justify-end gap-3 w-full">
      {/* Main Navigation Pills */}
      <div className="flex items-center gap-0.5 px-1.5 py-1 bg-foreground/20 backdrop-blur-md rounded-full">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => item.enabled && onViewChange(item.id)}
              disabled={!item.enabled}
              className={cn(
                "h-8 px-4 rounded-full transition-all duration-200 text-sm font-medium",
                isActive
                  ? "bg-foreground/30 text-white"
                  : "text-white/70 hover:text-white",
                !item.enabled && "opacity-40 cursor-not-allowed"
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-0.5 px-1.5 py-1 bg-foreground/20 backdrop-blur-md rounded-full">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onOpenRecentEntries}
              className="h-8 w-8 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <Users className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Recent Entries</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onOpenCalendar}
              className="h-8 w-8 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <Calendar className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Calendar View</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}