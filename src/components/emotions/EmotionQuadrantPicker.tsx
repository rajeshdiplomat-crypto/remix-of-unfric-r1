import { cn } from "@/lib/utils";
import { QuadrantType, QUADRANTS } from "./types";

interface EmotionQuadrantPickerProps {
  selected: QuadrantType | null;
  onSelect: (quadrant: QuadrantType) => void;
}

export function EmotionQuadrantPicker({ selected, onSelect }: EmotionQuadrantPickerProps) {
  const quadrantOrder: QuadrantType[] = ['high-unpleasant', 'high-pleasant', 'low-unpleasant', 'low-pleasant'];
  
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <p className="text-sm text-muted-foreground">How are you feeling right now?</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Select the zone that matches your current mood</p>
      </div>
      
      {/* Axis labels */}
      <div className="relative">
        {/* Energy axis label */}
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground whitespace-nowrap">
          <span className="block">← Low Energy</span>
        </div>
        <div className="absolute -left-8 top-0 -rotate-90 origin-left text-xs text-muted-foreground whitespace-nowrap translate-x-2">
          High Energy →
        </div>
        
        {/* Pleasant axis label */}
        <div className="absolute -bottom-6 left-0 text-xs text-muted-foreground">
          Unpleasant
        </div>
        <div className="absolute -bottom-6 right-0 text-xs text-muted-foreground">
          Pleasant
        </div>
        
        {/* Quadrant grid */}
        <div className="grid grid-cols-2 gap-2 ml-4">
          {quadrantOrder.map((quadrantId) => {
            const quadrant = QUADRANTS[quadrantId];
            const isSelected = selected === quadrantId;
            
            return (
              <button
                key={quadrantId}
                onClick={() => onSelect(quadrantId)}
                className={cn(
                  "relative aspect-square rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all duration-200",
                  "hover:scale-[1.02] hover:shadow-lg",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  isSelected && "ring-2 ring-offset-2 scale-[1.02] shadow-lg"
                )}
                style={{
                  backgroundColor: isSelected ? quadrant.color : quadrant.bgColor,
                  borderColor: quadrant.borderColor,
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  color: isSelected ? 'white' : quadrant.color,
                  ['--tw-ring-color' as string]: quadrant.color
                }}
              >
                <span className={cn(
                  "text-2xl mb-2",
                  isSelected && "scale-110"
                )}>
                  {quadrantId === 'high-pleasant' && '😊'}
                  {quadrantId === 'high-unpleasant' && '😰'}
                  {quadrantId === 'low-unpleasant' && '😔'}
                  {quadrantId === 'low-pleasant' && '😌'}
                </span>
                <span className={cn(
                  "text-xs font-medium leading-tight",
                  isSelected ? "text-white" : "text-foreground/80"
                )}>
                  {quadrant.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
      <p className="text-center text-xs text-muted-foreground/60 mt-8 italic">
        All emotions are OK — they're signals, not judgments
      </p>
    </div>
  );
}
