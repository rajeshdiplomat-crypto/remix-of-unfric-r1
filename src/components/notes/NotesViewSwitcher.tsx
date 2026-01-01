import type { ReactNode } from "react";
import { LayoutGrid, Columns, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type NotesViewType = "atlas" | "board" | "mindmap";

interface NotesViewSwitcherProps {
  currentView: NotesViewType;
  onViewChange: (view: NotesViewType) => void;
}

export function NotesViewSwitcher({ currentView, onViewChange }: NotesViewSwitcherProps) {
  const views: Array<{
    id: NotesViewType;
    label: string;
    icon: ReactNode;
    description: string;
  }> = [
    {
      id: "atlas",
      label: "Atlas",
      icon: <LayoutGrid className="h-4 w-4" />,
      description: "Vertical view with collapsible groups",
    },
    {
      id: "board",
      label: "Board",
      icon: <Columns className="h-4 w-4" />,
      description: "Horizontal columns for each group",
    },
    {
      id: "mindmap",
      label: "Mind Map",
      icon: <Network className="h-4 w-4" />,
      description: "Visual relationship view",
    },
  ];

  return (
    <TooltipProvider>
      {/* No outer box */}
      <div className="inline-flex items-center gap-2">
        {views.map((view) => {
          const active = currentView === view.id;

          return (
            <Tooltip key={view.id}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewChange(view.id)}
                  className={[
                    // Small, “luxury”, square corners
                    "h-8 px-3 gap-2 rounded-none border text-sm font-medium",
                    "transition-colors",
                    active
                      ? "bg-primary/10 text-primary border-primary/25"
                      : "bg-transparent text-muted-foreground border-border/40 hover:bg-muted/40 hover:text-foreground",
                  ].join(" ")}
                >
                  {view.icon}
                  <span className="hidden sm:inline">{view.label}</span>
                </Button>
              </TooltipTrigger>

              <TooltipContent side="bottom" className="bg-popover text-popover-foreground">
                <p>{view.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
