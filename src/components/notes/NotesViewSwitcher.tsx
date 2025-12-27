import { LayoutGrid, Columns, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type NotesViewType = "atlas" | "board" | "mindmap";

interface NotesViewSwitcherProps {
  currentView: NotesViewType;
  onViewChange: (view: NotesViewType) => void;
}

export function NotesViewSwitcher({ currentView, onViewChange }: NotesViewSwitcherProps) {
  const views: Array<{ id: NotesViewType; label: string; icon: React.ReactNode; description: string }> = [
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
      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/30">
        {views.map((view) => (
          <Tooltip key={view.id}>
            <TooltipTrigger asChild>
              <Button
                variant={currentView === view.id ? "secondary" : "ghost"}
                size="sm"
                className={`h-8 px-3 gap-2 ${
                  currentView === view.id 
                    ? "bg-background text-foreground shadow-sm border border-border/50" 
                    : "text-foreground/60 hover:text-foreground hover:bg-muted/50"
                }`}
                onClick={() => onViewChange(view.id)}
              >
                {view.icon}
                <span className="hidden sm:inline text-sm">{view.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-popover text-popover-foreground">
              <p>{view.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
