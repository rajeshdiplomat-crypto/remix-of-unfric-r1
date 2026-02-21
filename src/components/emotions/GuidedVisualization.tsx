import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, Check } from "lucide-react";
import { Strategy } from "./types";
import { cn } from "@/lib/utils";

interface GuidedVisualizationProps {
  strategy: Strategy;
  onComplete: () => void;
  onSkip: () => void;
}

const BREATHING_STEPS = [
  { label: "Breathe In", duration: 4 },
  { label: "Hold", duration: 4 },
  { label: "Breathe Out", duration: 4 },
  { label: "Hold", duration: 4 },
];

const GROUNDING_STEPS = [
  { label: "5 things you can SEE", duration: 15 },
  { label: "4 things you can HEAR", duration: 12 },
  { label: "3 things you can TOUCH", duration: 10 },
  { label: "2 things you can SMELL", duration: 8 },
  { label: "1 thing you can TASTE", duration: 6 },
];

export function GuidedVisualization({ strategy, onComplete, onSkip }: GuidedVisualizationProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isBreathing = strategy.type === "breathing";
  const isGrounding = strategy.id === "5-4-3-2-1";
  const steps = isBreathing ? BREATHING_STEPS : isGrounding ? GROUNDING_STEPS : [];
  const hasSteps = steps.length > 0;
  const totalCycles = isBreathing ? 3 : 1;

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  useEffect(() => {
    if (!isPlaying || !hasSteps) return;

    const step = steps[currentStep];
    const tickMs = 50;
    const totalTicks = (step.duration * 1000) / tickMs;
    let tick = 0;

    intervalRef.current = setInterval(() => {
      tick++;
      setProgress((tick / totalTicks) * 100);

      if (tick >= totalTicks) {
        cleanup();
        const nextStep = currentStep + 1;
        if (nextStep < steps.length) {
          setCurrentStep(nextStep);
          setProgress(0);
        } else {
          const nextCycle = cycles + 1;
          if (nextCycle < totalCycles) {
            setCycles(nextCycle);
            setCurrentStep(0);
            setProgress(0);
          } else {
            setIsPlaying(false);
            setProgress(100);
          }
        }
      }
    }, tickMs);

    return cleanup;
  }, [isPlaying, currentStep, cycles, hasSteps, steps, totalCycles, cleanup]);

  const togglePlay = () => {
    if (!isPlaying && progress >= 100) {
      setCurrentStep(0);
      setCycles(0);
      setProgress(0);
    }
    setIsPlaying((p) => !p);
  };

  if (!hasSteps) {
    // Simple text-based strategy (cognitive, movement, mindfulness)
    return (
      <div className="p-6 space-y-6">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {strategy.description}
        </p>
        <p className="text-xs text-muted-foreground">
          Duration: {strategy.duration}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={onSkip} className="flex-1">
            <SkipForward className="h-4 w-4 mr-1" /> Skip
          </Button>
          <Button size="sm" onClick={onComplete} className="flex-1">
            <Check className="h-4 w-4 mr-1" /> Done
          </Button>
        </div>
      </div>
    );
  }

  const step = steps[currentStep];

  return (
    <div className="p-6 space-y-6">
      <p className="text-sm text-muted-foreground">{strategy.description}</p>

      {/* Visual indicator */}
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            "rounded-full flex items-center justify-center transition-all duration-500",
            isBreathing ? "border-2 border-primary/30" : "border-2 border-primary/20"
          )}
          style={{
            width: isBreathing ? `${80 + (progress / 100) * 60}px` : "140px",
            height: isBreathing ? `${80 + (progress / 100) * 60}px` : "140px",
          }}
        >
          <span className="text-sm font-medium text-center px-2">{step.label}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs bg-muted rounded-full h-1.5">
          <div
            className="h-full rounded-full bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {isBreathing && (
          <span className="text-xs text-muted-foreground">
            Cycle {cycles + 1} / {totalCycles}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={onSkip} className="flex-1">
          <SkipForward className="h-4 w-4 mr-1" /> Skip
        </Button>
        <Button size="sm" onClick={togglePlay} className="flex-1">
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4 mr-1" /> Pause
            </>
          ) : progress >= 100 ? (
            <>
              <Check className="h-4 w-4 mr-1" /> Complete
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-1" /> Start
            </>
          )}
        </Button>
        {progress >= 100 && (
          <Button size="sm" onClick={onComplete} className="flex-1">
            <Check className="h-4 w-4 mr-1" /> Done
          </Button>
        )}
      </div>
    </div>
  );
}
