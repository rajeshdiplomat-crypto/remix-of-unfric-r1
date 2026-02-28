import * as React from "react";
import { LayoutGrid, Columns, Network } from "lucide-react";
import { cn } from "@/lib/utils";

export type NotesViewType = "atlas" | "board" | "mindmap";

interface NotesViewSwitcherProps {
  currentView: NotesViewType;
  onViewChange: (view: NotesViewType) => void;
}

export function NotesViewSwitcher({ currentView, onViewChange, hideMindMap = false }: NotesViewSwitcherProps & { hideMindMap?: boolean }) {
  const allViews: Array<{
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

  const views = hideMindMap ? allViews.filter(v => v.id !== "mindmap") : allViews;

  return (
    <div className="inline-flex items-center bg-white/[0.03] rounded-[6px] p-0.5 border border-white/[0.1] backdrop-blur-xl" style={{ transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
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
              "h-8 px-4 inline-flex items-center gap-2 text-sm font-light rounded-[6px]",
              active
                ? "bg-[hsl(215,15%,40%)]/15 text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.02]",
            )}
            style={{ transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            {view.icon}
            <span className="hidden sm:inline tracking-[0.3em] text-[11px]">{view.label}</span>
          </button>
        );
      })}
    </div>
  );
}
