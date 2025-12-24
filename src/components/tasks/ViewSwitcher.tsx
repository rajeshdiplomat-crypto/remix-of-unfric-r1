import { cn } from "@/lib/utils";

type View = 'board' | 'quadrant';

interface ViewSwitcherProps {
  view: View;
  onViewChange: (view: View) => void;
}

export function ViewSwitcher({ view, onViewChange }: ViewSwitcherProps) {
  return (
    <div className="flex items-center bg-muted/50 rounded-lg p-1">
      <button
        onClick={() => onViewChange('board')}
        className={cn(
          "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
          view === 'board' 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Board
      </button>
      <button
        onClick={() => onViewChange('quadrant')}
        className={cn(
          "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
          view === 'quadrant' 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Quadrant
      </button>
    </div>
  );
}
