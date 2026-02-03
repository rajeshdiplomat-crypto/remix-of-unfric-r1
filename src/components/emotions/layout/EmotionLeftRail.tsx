import { useTimezone } from "@/hooks/useTimezone";
import { Circle } from "lucide-react";
import { QuadrantType, QUADRANTS } from "../types";

const CALMING_QUOTES = [
  "This moment is yours to define.",
  "Feelings are visitors. Let them come and go.",
  "You are not your emotions; you experience them.",
  "Be gentle with yourself today.",
  "Every check-in is an act of self-care.",
  "Awareness is the first step to understanding.",
  "There is wisdom in how you feel.",
  "Take a breath. You're exactly where you need to be.",
];

const getDailyQuote = (): string => {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return CALMING_QUOTES[dayOfYear % CALMING_QUOTES.length];
};

interface EmotionLeftRailProps {
  currentQuadrant?: QuadrantType | null;
}

/**
 * Left Rail Content
 * - Current date/time
 * - Calming quote
 * - Decorative breathing icon
 */
export function EmotionLeftRail({ currentQuadrant }: EmotionLeftRailProps) {
  const { timezone } = useTimezone();
  
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(now);
  
  const timeStr = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);

  const quadrantColor = currentQuadrant 
    ? QUADRANTS[currentQuadrant].color 
    : "hsl(var(--muted-foreground))";

  return (
    <div className="space-y-6">
      {/* Date & Time */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground/70">{dateStr}</p>
        <p className="text-lg font-light text-foreground/60">{timeStr}</p>
      </div>

      {/* Calming Quote */}
      <div className="space-y-2">
        <blockquote className="text-sm italic text-muted-foreground leading-relaxed">
          "{getDailyQuote()}"
        </blockquote>
      </div>

      {/* Breathing Icon - Decorative */}
      <div className="flex items-center justify-center pt-4">
        <div 
          className="relative"
          aria-hidden="true"
        >
          {/* Outer pulsing ring */}
          <div 
            className="absolute inset-0 rounded-full animate-pulse"
            style={{ 
              backgroundColor: quadrantColor,
              opacity: 0.1,
              transform: "scale(1.5)",
            }}
          />
          {/* Inner circle */}
          <Circle 
            className="h-8 w-8 animate-pulse" 
            style={{ color: quadrantColor, opacity: 0.4 }}
            strokeWidth={1}
          />
        </div>
      </div>

      {/* Subtle guidance text */}
      <p className="text-[10px] text-center text-muted-foreground/60">
        Breathe deeply
      </p>
    </div>
  );
}
