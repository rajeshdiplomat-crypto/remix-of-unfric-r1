import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Pause, Play, SkipForward, Volume2, VolumeX } from "lucide-react";
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

  // Timer ring calculations
  const size = 200;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  // Fallback affirmation if empty
  const affirmationText = goal.daily_affirmation?.trim() || goal.title || "I am becoming who I want to be.";

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden">
      {/* FULL SCREEN VISION IMAGE AS BACKGROUND */}
      {goal.vision_image_url ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${goal.vision_image_url})` }}
        >
          {/* Dark gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-slate-900 to-cyan-900" />
      )}

      {/* Animated floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute top-1/2 right-1/3 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
      </div>

      {/* Close Button - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full h-12 w-12 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/20"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content - Centered */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-8 z-10">
        {/* Breathing Guide Text */}
        <div className="text-center mb-8">
          <p className="text-white/60 text-sm uppercase tracking-widest mb-2 animate-pulse">
            {isPaused ? "Paused" : "Breathe & Visualize"}
          </p>
        </div>

        {/* Timer Ring */}
        <div className="relative mb-10" style={{ width: size, height: size }}>
          {/* Outer breathing ring */}
          <div
            className="absolute inset-0 rounded-full border-2 border-teal-400/30"
            style={{
              transform: "scale(1.3)",
              animation: "breathe 4s ease-in-out infinite",
            }}
          />

          <svg
            className="w-full h-full transform -rotate-90"
            viewBox={`0 0 ${size} ${size}`}
            style={{ filter: "drop-shadow(0 0 30px rgba(20, 184, 166, 0.5))" }}
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
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-extralight tracking-tight text-white drop-shadow-lg">
              {formatTime(secondsLeft)}
            </span>
          </div>
        </div>

        {/* Affirmation Text - Large and Prominent */}
        <div className="text-center max-w-3xl px-6 mb-10">
          <p className="text-3xl md:text-4xl lg:text-5xl font-light text-white leading-relaxed drop-shadow-lg">
            "{affirmationText}"
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <Button
            size="lg"
            onClick={() => setIsPaused(!isPaused)}
            className="rounded-full h-16 px-10 bg-white/15 backdrop-blur-md hover:bg-white/25 text-white border border-white/30 transition-all shadow-xl"
          >
            {isPaused ? (
              <>
                <Play className="h-6 w-6 mr-3 fill-current" />
                <span className="text-lg">Resume</span>
              </>
            ) : (
              <>
                <Pause className="h-6 w-6 mr-3" />
                <span className="text-lg">Pause</span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={handleSkip}
            className="rounded-full h-16 px-8 text-white/70 hover:text-white hover:bg-white/10"
          >
            <SkipForward className="h-5 w-5 mr-2" />
            Skip & Complete
          </Button>
        </div>
      </div>

      {/* Progress Bar at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-300 transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1.3); opacity: 0.3; }
          50% { transform: scale(1.5); opacity: 0.15; }
        }
      `}</style>
    </div>
  );
}
