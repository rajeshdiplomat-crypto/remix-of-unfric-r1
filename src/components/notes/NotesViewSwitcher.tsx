import * as React from "react";
import { LayoutGrid, Columns, Network } from "lucide-react";
import { cn } from "@/lib/utils";

export type NotesViewType = "atlas" | "board" | "mindmap";

interface NotesViewSwitcherProps {
  currentView: NotesViewType;
  onViewChange: (view: NotesViewType) => void;
}

export function NotesViewSwitcher({ currentView, onViewChange }: NotesViewSwitcherProps) {
  const views: Array<{
    id: NotesViewType;
    label: string;
    icon: React.ReactNode;
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
    <div className="inline-flex items-center bg-background/80 rounded-lg p-1 border border-border/40 shadow-sm backdrop-blur-sm">
      {views.map((view) => {
        const active = currentView === view.id;

        return (
          <button
            key={view.id}
            type="button"
            title={view.description}
            aria-pressed={active}
            onClick={() => onViewChange(view.id)}
            className={cn(
              "h-8 px-4 inline-flex items-center gap-2 text-sm font-medium rounded-lg transition-all duration-200",
              active
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            {view.icon}
            <span className="hidden sm:inline">{view.label}</span>
          </button>
        );
      })}
    </div>
  );
}
