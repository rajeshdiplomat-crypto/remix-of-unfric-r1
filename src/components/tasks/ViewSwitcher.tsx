import { cn } from "@/lib/utils";

type View = 'board' | 'quadrant';

interface ViewSwitcherProps {
  view: View;
  onViewChange: (view: View) => void;
}

export function ViewSwitcher({ view, onViewChange }: ViewSwitcherProps) {
  return (
    <div className="inline-flex items-center bg-muted/30 rounded-full p-1 border border-border/30">
      <button
        onClick={() => onViewChange('board')}
        className={cn(
          "px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
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
          "px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
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
