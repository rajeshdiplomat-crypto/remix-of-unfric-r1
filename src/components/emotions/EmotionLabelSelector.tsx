import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { QuadrantType, QUADRANTS } from "./types";
import { ArrowLeft } from "lucide-react";

interface EmotionLabelSelectorProps {
  quadrant: QuadrantType;
  selected: string | null;
  onSelect: (emotion: string) => void;
  onBack: () => void;
}

export function EmotionLabelSelector({ quadrant, selected, onSelect, onBack }: EmotionLabelSelectorProps) {
  const quadrantInfo = QUADRANTS[quadrant];
  
  return (
    <div className="w-full max-w-md mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to quadrants
      </Button>
      
      <div 
        className="rounded-xl p-4 mb-6"
        style={{ 
          backgroundColor: quadrantInfo.bgColor,
          borderColor: quadrantInfo.borderColor,
          borderWidth: '1px',
          borderStyle: 'solid'
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {quadrant === 'high-pleasant' && '😊'}
            {quadrant === 'high-unpleasant' && '😰'}
            {quadrant === 'low-unpleasant' && '😔'}
            {quadrant === 'low-pleasant' && '😌'}
          </span>
          <div>
            <p className="font-medium text-sm" style={{ color: quadrantInfo.color }}>
              {quadrantInfo.label}
            </p>
            <p className="text-xs text-muted-foreground">{quadrantInfo.description}</p>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Which word best describes how you feel?
      </p>
      
      <div className="flex flex-wrap gap-2">
        {quadrantInfo.emotions.map((emotion) => {
          const isSelected = selected === emotion;
          
          return (
            <button
              key={emotion}
              onClick={() => onSelect(emotion)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150",
                "border focus:outline-none focus:ring-2 focus:ring-offset-2",
                isSelected 
                  ? "scale-105 shadow-md" 
                  : "hover:scale-[1.02]"
              )}
              style={{
                backgroundColor: isSelected ? quadrantInfo.color : 'transparent',
                borderColor: quadrantInfo.borderColor,
                color: isSelected ? 'white' : quadrantInfo.color,
                ['--tw-ring-color' as string]: quadrantInfo.color
              }}
            >
              {emotion}
            </button>
          );
        })}
      </div>
      
      {selected && (
        <div className="mt-6 p-3 rounded-lg bg-muted/30 text-center">
          <p className="text-sm">
            You're feeling <span className="font-semibold" style={{ color: quadrantInfo.color }}>{selected}</span>
          </p>
        </div>
      )}
    </div>
  );
}
