import { Target, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { QuadrantTask } from "./types";
import { cn } from "@/lib/utils";

interface TopFocusBarProps {
  tasks: QuadrantTask[];
  onStartFocus: (task: QuadrantTask) => void;
}

export function TopFocusBar({ tasks, onStartFocus }: TopFocusBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get the most important task that's not completed
  const topTask = tasks.find(
    (t) => 
      !t.is_completed && 
      t.urgency === 'high' && 
      t.importance === 'high'
  ) || tasks.find(t => !t.is_completed);

  if (!topTask) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-card/80 border border-border/50 rounded-xl p-4">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                <Target className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">
                  Top Focus for Today: <span className="font-semibold">{topTask.title}</span>
                </span>
                {topTask.urgency === 'high' && (
                  <Badge variant="outline" className="text-xs px-2 py-0 bg-muted/50 text-muted-foreground">
                    Urgent ⚡
                  </Badge>
                )}
                {topTask.importance === 'high' && (
                  <Badge variant="outline" className="text-xs px-2 py-0 bg-muted/50 text-muted-foreground">
                    Important
                  </Badge>
                )}
              </div>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 pl-11 text-sm text-muted-foreground">
            Suggested: <span className="text-foreground font-medium">25 min focus</span>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
