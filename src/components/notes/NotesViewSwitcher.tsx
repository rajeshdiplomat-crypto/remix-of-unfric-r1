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
    // No outer container styling (no bg, no border, no rounded)
    <div className="inline-flex items-center">
      {views.map((view, idx) => {
        const active = currentView === view.id;

        return (
          <button
            key={view.id}
            type="button"
            title={view.description}
            aria-pressed={active}
            onClick={() => onViewChange(view.id)}
            className={cn(
              // base
              "h-9 px-3 inline-flex items-center gap-2 text-sm font-medium",
              "border border-border/40 bg-background text-muted-foreground hover:text-foreground hover:bg-muted/30",
              // remove ALL rounding + avoid double borders between buttons
              "rounded-none -ml-px first:ml-0",
              // active
              active && "bg-primary text-primary-foreground border-primary/40 hover:bg-primary/90",
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
