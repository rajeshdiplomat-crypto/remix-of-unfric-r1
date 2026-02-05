import { Heart, Target, BarChart3, Users, Calendar } from "lucide-react";
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
    { id: "feel" as const, label: "Feel", icon: Heart, enabled: true },
    { id: "regulate" as const, label: "Regulate", icon: Target, enabled: canNavigate.regulate },
    { id: "insights" as const, label: "Insights", icon: BarChart3, enabled: true },
  ];

  return (
    <div className="flex items-center justify-between gap-4 w-full">
      {/* Main Navigation Pills */}
      <div className="flex items-center gap-1 p-1.5 bg-background/70 backdrop-blur-xl rounded-full border border-border/40 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => item.enabled && onViewChange(item.id)}
                  disabled={!item.enabled}
                  className={cn(
                    "h-9 px-4 sm:px-5 rounded-full transition-all duration-200 text-sm font-medium gap-2",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    !item.enabled && "opacity-40 cursor-not-allowed"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-1 p-1.5 bg-background/70 backdrop-blur-xl rounded-full border border-border/40 shadow-lg">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenRecentEntries}
              className="h-8 w-8 rounded-full hover:bg-muted/50 transition-all duration-200"
            >
              <Users className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Recent Entries</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenCalendar}
              className="h-8 w-8 rounded-full hover:bg-muted/50 transition-all duration-200"
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Calendar View</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}