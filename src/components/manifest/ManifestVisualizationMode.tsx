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

  // Timer ring calculations - smaller size for better fit
  const size = 160;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  // Fallback affirmation if empty
  const affirmationText = goal.daily_affirmation?.trim() || goal.title || "I am becoming who I want to be.";

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
      }}
    >
      {/* FULL SCREEN VISION IMAGE AS BACKGROUND */}
      {goal.vision_image_url ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${goal.vision_image_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Dark gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/50" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-teal-900 to-cyan-900" />
      )}

      {/* Close Button - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full h-10 w-10 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content - Centered */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 z-10">
        {/* Breathing Guide Text */}
        <p className="text-white/50 text-xs uppercase tracking-widest mb-6">
          {isPaused ? "Paused" : "Breathe & Visualize"}
        </p>

        {/* Timer Ring */}
        <div className="relative mb-8" style={{ width: size, height: size }}>
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox={`0 0 ${size} ${size}`}
            style={{ filter: "drop-shadow(0 0 20px rgba(20, 184, 166, 0.4))" }}
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={strokeWidth}
            />

            {/* Gradient definition */}
            <defs>
              <linearGradient id="timerGradientViz" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>

            {/* Progress circle with gradient */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#timerGradientViz)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Timer Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-light text-white">{formatTime(secondsLeft)}</span>
          </div>
        </div>

        {/* Affirmation Text */}
        <div className="text-center max-w-xl px-4 mb-10">
          <p className="text-xl md:text-2xl font-light text-white leading-relaxed">"{affirmationText}"</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <Button
            size="lg"
            onClick={() => setIsPaused(!isPaused)}
            className="rounded-full h-12 px-8 bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white border border-white/20"
          >
            {isPaused ? (
              <>
                <Play className="h-5 w-5 mr-2 fill-current" />
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
            className="rounded-full h-12 px-6 text-white/60 hover:text-white hover:bg-white/10"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Skip & Complete
          </Button>
        </div>
      </div>

      {/* Progress Bar at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
        <div
          className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
