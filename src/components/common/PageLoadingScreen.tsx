import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ModuleType = 'diary' | 'journal' | 'notes' | 'tasks' | 'emotions' | 'manifest' | 'trackers' | 'settings';

interface PageLoadingScreenProps {
  module: ModuleType;
}

const LOADING_QUOTES: Record<ModuleType, string[]> = {
  diary: [
    "Reflecting on your journey...",
    "Every day is a new story",
    "Your memories are being gathered",
    "Moments worth remembering",
  ],
  journal: [
    "Preparing your canvas...",
    "Words hold power",
    "Your thoughts matter",
    "Writing is thinking on paper",
  ],
  notes: [
    "Organizing your ideas...",
    "Great minds take notes",
    "Knowledge is being organized",
    "Capture every insight",
  ],
  tasks: [
    "Prioritizing what matters...",
    "Small steps, big results",
    "Your productivity awaits",
    "Focus on what counts",
  ],
  emotions: [
    "Creating a safe space...",
    "Feelings are valid",
    "Self-awareness begins here",
    "Embrace every emotion",
  ],
  manifest: [
    "Aligning with your vision...",
    "Dream it. Believe it. Achieve it.",
    "Your goals are within reach",
    "Manifest your reality",
  ],
  trackers: [
    "Tracking your progress...",
    "Consistency builds habits",
    "Every action counts",
    "Building momentum",
  ],
  settings: [
    "Loading your preferences...",
    "Personalizing your experience",
    "Making it yours",
    "Tailored just for you",
  ],
};

const MODULE_ICONS: Record<ModuleType, string> = {
  diary: "📖",
  journal: "✍️",
  notes: "📝",
  tasks: "✓",
  emotions: "💭",
  manifest: "✨",
  trackers: "📊",
  settings: "⚙️",
};

export function PageLoadingScreen({ module }: PageLoadingScreenProps) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const quotes = LOADING_QUOTES[module];
  const icon = MODULE_ICONS[module];

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % quotes.length);
        setFadeIn(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [quotes.length]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full px-6">
      {/* Animated Icon Container */}
      <div className="relative mb-8">
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
        
        {/* Icon circle */}
        <div 
          className={cn(
            "relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5",
            "border border-border/50 flex items-center justify-center",
            "animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"
          )}
        >
          <span className="text-3xl">{icon}</span>
        </div>
      </div>

      {/* Quote with fade animation */}
      <p 
        className={cn(
          "text-lg text-muted-foreground text-center max-w-md transition-all duration-300",
          fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}
      >
        {quotes[quoteIndex]}
      </p>

      {/* Loading dots */}
      <div className="flex gap-1.5 mt-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary/40"
            style={{
              animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
