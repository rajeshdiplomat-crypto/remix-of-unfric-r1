import { List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ManifestViewSwitcherProps {
  view: "list" | "board";
  onViewChange: (view: "list" | "board") => void;
}

export function ManifestViewSwitcher({ view, onViewChange }: ManifestViewSwitcherProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange("list")}
        className={cn(
          "h-8 px-3 rounded-lg transition-all",
          view === "list"
            ? "bg-white dark:bg-slate-700 shadow-sm text-teal-600"
            : "text-slate-500 hover:text-slate-700"
        )}
      >
        <List className="h-4 w-4 mr-1.5" />
        List
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange("board")}
        className={cn(
          "h-8 px-3 rounded-lg transition-all",
          view === "board"
            ? "bg-white dark:bg-slate-700 shadow-sm text-teal-600"
            : "text-slate-500 hover:text-slate-700"
        )}
      >
        <LayoutGrid className="h-4 w-4 mr-1.5" />
        Board
      </Button>
    </div>
  );
}
