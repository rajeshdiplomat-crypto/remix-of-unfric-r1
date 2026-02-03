import { Users, Calendar, BarChart3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EmotionsQuickActionsProps {
  activeView: "checkin" | "analytics" | "strategies";
  onViewChange: (view: "checkin" | "analytics" | "strategies") => void;
  onOpenRecentEntries: () => void;
  onOpenCalendar: () => void;
}

export function EmotionsQuickActions({
  activeView,
  onViewChange,
  onOpenRecentEntries,
  onOpenCalendar,
}: EmotionsQuickActionsProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-2xl backdrop-blur-sm border border-border/50">
      {/* Recent Entries - Opens Popup */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenRecentEntries}
            className={cn(
              "h-10 w-10 rounded-xl transition-all duration-200",
              "hover:bg-background hover:shadow-sm"
            )}
          >
            <Users className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Recent Entries</p>
        </TooltipContent>
      </Tooltip>

      {/* Calendar - Opens Popup */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenCalendar}
            className={cn(
              "h-10 w-10 rounded-xl transition-all duration-200",
              "hover:bg-background hover:shadow-sm"
            )}
          >
            <Calendar className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Calendar View</p>
        </TooltipContent>
      </Tooltip>

      {/* Analytics - Full Page */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewChange("analytics")}
            className={cn(
              "h-10 w-10 rounded-xl transition-all duration-200",
              activeView === "analytics" 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "hover:bg-background hover:shadow-sm"
            )}
          >
            <BarChart3 className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Analytics & Patterns</p>
        </TooltipContent>
      </Tooltip>

      {/* Strategies - Full Page */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewChange("strategies")}
            className={cn(
              "h-10 w-10 rounded-xl transition-all duration-200",
              activeView === "strategies" 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "hover:bg-background hover:shadow-sm"
            )}
          >
            <Sparkles className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Regulation Strategies</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
