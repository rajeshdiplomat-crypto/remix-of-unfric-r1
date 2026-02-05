import { Heart, Sparkles, Target, BarChart3, Users, Calendar } from "lucide-react";
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
    { id: "regulate" as const, label: "Regulate", icon: Target, enabled: canNavigate.regulate },
    { id: "insights" as const, label: "Insights", icon: BarChart3, enabled: true },
  ];

  return (
    <div className="w-full px-4 lg:px-8 py-4">
      <div className="flex items-center justify-between gap-4 max-w-5xl mx-auto">
        {/* Main Navigation Pills */}
        <div className="flex items-center gap-2 p-2 bg-muted/50 backdrop-blur-xl rounded-2xl border border-border/50 flex-1 max-w-2xl">
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
                      "flex-1 h-12 px-4 lg:px-6 rounded-xl transition-all duration-300 gap-2",
                      "uppercase tracking-wider text-xs font-semibold",
                      isActive
                        ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg"
                        : "hover:bg-background/80 text-muted-foreground hover:text-foreground",
                      !item.enabled && "opacity-40 cursor-not-allowed"
                    )}
                    style={{
                      boxShadow: isActive ? '0 4px 12px hsl(var(--primary) / 0.3)' : undefined
                    }}
                  >
                    <Icon className={cn(
                      "h-4 w-4 transition-transform duration-300",
                      isActive && "scale-110"
                    )} />
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

        {/* Separator */}
        <div className="hidden lg:block w-px h-8 bg-border/50" />

        {/* Quick Access Buttons */}
        <div className="flex items-center gap-2 p-2 bg-muted/50 backdrop-blur-xl rounded-2xl border border-border/50">
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
    </div>
  );
}
