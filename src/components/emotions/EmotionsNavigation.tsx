import { Heart, Sparkles, BarChart3, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type EmotionsView = "feel" | "context" | "regulate" | "insights";

interface EmotionsNavigationProps {
  activeView: EmotionsView;
  canNavigate: {
    context: boolean;
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
    { id: "context" as const, label: "Context", icon: Sparkles, enabled: canNavigate.context },
    { id: "regulate" as const, label: "Regulate", icon: Sparkles, enabled: canNavigate.regulate },
    { id: "insights" as const, label: "Insights", icon: BarChart3, enabled: true },
  ];

  return (
    <div className="flex items-center justify-between">
      {/* Main Navigation Pills */}
      <div className="flex items-center gap-1 p-1.5 bg-muted/50 backdrop-blur-xl rounded-2xl border border-border/50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => item.enabled && onViewChange(item.id)}
                  disabled={!item.enabled}
                  className={cn(
                    "h-10 px-4 rounded-xl transition-all duration-300 gap-2",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-background/80",
                    !item.enabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    isActive && "scale-110"
                  )} />
                  <span className="hidden sm:inline text-sm font-medium">{item.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Quick Access Buttons */}
      <div className="flex items-center gap-1 p-1.5 bg-muted/50 backdrop-blur-xl rounded-2xl border border-border/50">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenRecentEntries}
              className="h-10 w-10 rounded-xl hover:bg-background/80 transition-all duration-300"
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
              className="h-10 w-10 rounded-xl hover:bg-background/80 transition-all duration-300"
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
