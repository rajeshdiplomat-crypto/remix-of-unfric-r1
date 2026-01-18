import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Pause, Play, SkipForward } from "lucide-react";
import { type ManifestGoal } from "./types";

interface ManifestVisualizationModeProps {
  goal: ManifestGoal;
  duration: 3 | 5 | 10;
  onComplete: () => void;
  onClose: () => void;
}

export function ManifestVisualizationMode({ goal, duration, onComplete, onClose }: ManifestVisualizationModeProps) {
  const totalSeconds = duration * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isPaused, setIsPaused] = useState(false);

  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  useEffect(() => {
    if (isPaused || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, secondsLeft, onComplete]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const handleSkip = () => {
    onComplete();
  };

  // Calculate circle properties
  const size = 280;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[hsl(var(--accent-turquoise))] rounded-full blur-[200px] opacity-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[hsl(var(--accent-cyan))] rounded-full blur-[150px] opacity-10" />
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between p-5 border-b border-border/30">
        <h2 className="text-lg font-medium tracking-wide">Visualization</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted/50">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-6 gap-8">
        {/* Affirmation Text */}
        <div className="text-center max-w-xl px-4">
          <p className="text-2xl md:text-3xl font-light text-foreground leading-relaxed">"{goal.daily_affirmation}"</p>
        </div>

        {/* Timer Section */}
        <div className="relative flex items-center gap-8">
          {/* Breathing Guide Ring (outer) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="breathing-ring rounded-full border-2 border-[hsl(var(--accent-turquoise))]/20"
              style={{ width: size + 40, height: size + 40 }}
            />
          </div>

          {/* Timer Ring */}
          <div className="relative" style={{ width: size, height: size }}>
            <svg className="w-full h-full transform -rotate-90 timer-ring" viewBox={`0 0 ${size} ${size}`}>
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={strokeWidth}
                className="opacity-30"
              />

              {/* Gradient definition */}
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--accent-turquoise))" />
                  <stop offset="100%" stopColor="hsl(var(--accent-cyan))" />
                </linearGradient>
              </defs>

              {/* Progress circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="url(#timerGradient)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>

            {/* Timer Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-light tracking-tight text-foreground">{formatTime(secondsLeft)}</span>
            </div>
          </div>

          {/* Vision Image Card */}
          {goal.vision_image_url && (
            <div className="hidden md:block vision-card-float w-48 h-36 rounded-2xl overflow-hidden border border-border/30">
              <img src={goal.vision_image_url} alt="Vision" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Mobile Vision Image */}
        {goal.vision_image_url && (
          <div className="md:hidden vision-card-float w-40 h-28 rounded-xl overflow-hidden border border-border/30">
            <img src={goal.vision_image_url} alt="Vision" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4 mt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsPaused(!isPaused)}
            className="rounded-full h-14 px-8 border-border/50 bg-background/80 backdrop-blur-sm hover:bg-muted/50 hover:border-[hsl(var(--accent-turquoise))]/50 transition-all"
          >
            {isPaused ? (
              <>
                <Play className="h-5 w-5 mr-2 text-[hsl(var(--accent-turquoise))]" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={handleSkip}
            className="rounded-full h-14 px-6 text-muted-foreground hover:text-foreground"
          >
            <SkipForward className="h-5 w-5 mr-2" />
            Skip & Complete
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-muted/30">
        <div
          className="h-full progress-gradient transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
