import { Users, Calendar, BarChart3, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EmotionsQuickActionsV2Props {
  activeView: "checkin" | "analytics" | "strategies";
  onViewChange: (view: "checkin" | "analytics" | "strategies") => void;
  onOpenRecentEntries: () => void;
  onOpenCalendar: () => void;
}

export function EmotionsQuickActionsV2({
  activeView,
  onViewChange,
  onOpenRecentEntries,
  onOpenCalendar,
}: EmotionsQuickActionsV2Props) {
  return (
    <div className="flex items-center gap-2">
      {/* Main Navigation Pills */}
      <div className="flex items-center gap-1 p-1.5 bg-background/80 backdrop-blur-xl rounded-2xl border border-border/50 shadow-lg">
        {/* Check-in Tab */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewChange("checkin")}
              className={cn(
                "h-10 px-4 rounded-xl transition-all duration-300 gap-2",
                activeView === "checkin"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-muted"
              )}
            >
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline text-sm font-medium">Check-in</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Emotion Check-in</p>
          </TooltipContent>
        </Tooltip>

        {/* Analytics Tab */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewChange("analytics")}
              className={cn(
                "h-10 px-4 rounded-xl transition-all duration-300 gap-2",
                activeView === "analytics"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-muted"
              )}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline text-sm font-medium">Patterns</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Analytics & Patterns</p>
          </TooltipContent>
        </Tooltip>

        {/* Strategies Tab */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewChange("strategies")}
              className={cn(
                "h-10 px-4 rounded-xl transition-all duration-300 gap-2",
                activeView === "strategies"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-muted"
              )}
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline text-sm font-medium">Strategies</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Regulation Strategies</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Quick Access Buttons */}
      <div className="flex items-center gap-1 p-1.5 bg-background/80 backdrop-blur-xl rounded-2xl border border-border/50 shadow-lg">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenRecentEntries}
              className="h-10 w-10 rounded-xl hover:bg-muted transition-all duration-200"
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
              className="h-10 w-10 rounded-xl hover:bg-muted transition-all duration-200"
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
