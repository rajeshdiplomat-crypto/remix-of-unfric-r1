import { cn } from "@/lib/utils";

interface MenuToggleProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export function MenuToggle({ isOpen, onClick, className }: MenuToggleProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed top-4 left-4 z-50 flex flex-col justify-center items-center w-10 h-10 bg-card/80 backdrop-blur-sm border border-border rounded-lg transition-all duration-300",
        className
      )}
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      <div className="relative w-5 h-4 flex flex-col justify-between">
        {/* Top line */}
        <span
          className={cn(
            "block h-0.5 w-5 bg-foreground rounded-full transition-all duration-300 origin-center",
            isOpen && "translate-y-[7px] rotate-45"
          )}
        />
        {/* Middle line */}
        <span
          className={cn(
            "block h-0.5 w-5 bg-foreground rounded-full transition-all duration-300",
            isOpen && "opacity-0 scale-x-0"
          )}
        />
        {/* Bottom line */}
        <span
          className={cn(
            "block h-0.5 w-5 bg-foreground rounded-full transition-all duration-300 origin-center",
            isOpen && "-translate-y-[7px] -rotate-45"
          )}
        />
      </div>
    </button>
  );
}
