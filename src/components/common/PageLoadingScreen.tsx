import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

type ModuleType =
  | "diary"
  | "journal"
  | "notes"
  | "tasks"
  | "emotions"
  | "manifest"
  | "habits"
  | "settings";

interface PageLoadingScreenProps {
  module: ModuleType;
  isDataReady?: boolean;
  onFinished?: () => void;
}

const MINDFULNESS_QUOTES = [
  { text: "Breathe in calm, breathe out tension.", author: "Thich Nhat Hanh" },
  { text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh" },
  { text: "Almost everything will work again if you unplug it for a few minutes — including you.", author: "Anne Lamott" },
  { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Feelings are just visitors. Let them come and go.", author: "Mooji" },
  { text: "What you think, you become. What you feel, you attract.", author: "Buddha" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Small daily improvements lead to stunning results.", author: "Robin Sharma" },
  { text: "Be where you are, not where you think you should be.", author: "Unknown" },
];

const MIN_DISPLAY_TIME = 2400;

export function PageLoadingScreen({ module, isDataReady = false, onFinished }: PageLoadingScreenProps) {
  const quote = useMemo(() => MINDFULNESS_QUOTES[Math.floor(Math.random() * MINDFULNESS_QUOTES.length)], []);
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasMetMinTime, setHasMetMinTime] = useState(false);
  const [hasExited, setHasExited] = useState(false);
  const [progress, setProgress] = useState(0);

  // Entrance
  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Min time
  useEffect(() => {
    const t = setTimeout(() => setHasMetMinTime(true), MIN_DISPLAY_TIME);
    return () => clearTimeout(t);
  }, []);

  // Progress bar simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90 && !isDataReady) return p;
        if (p >= 100) return 100;
        const increment = p < 60 ? 2 : p < 85 ? 1 : 0.5;
        return Math.min(p + increment, isDataReady ? 100 : 90);
      });
    }, 40);
    return () => clearInterval(interval);
  }, [isDataReady]);

  // Trigger exit
  useEffect(() => {
    if (hasMetMinTime && isDataReady && !isExiting && !hasExited) {
      setProgress(100);
      setIsExiting(true);
    }
  }, [hasMetMinTime, isDataReady, isExiting, hasExited]);

  useEffect(() => {
    if (hasMetMinTime && !isExiting && !hasExited) {
      const t = setTimeout(() => setIsExiting(true), 100);
      return () => clearTimeout(t);
    }
  }, [hasMetMinTime, isExiting, hasExited]);

  // Exit animation
  useEffect(() => {
    if (isExiting && !hasExited) {
      const t = setTimeout(() => {
        setHasExited(true);
        onFinished?.();
      }, 600);
      return () => clearTimeout(t);
    }
  }, [isExiting, hasExited, onFinished]);

  if (hasExited) return null;

  return (
    <>
      <style>{`
        @keyframes meshShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50%      { transform: scale(1.03); opacity: 1; }
        }
      `}</style>

      {/* Full-screen container */}
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center"
        style={{
          transition: "opacity 0.6s ease-out, backdrop-filter 0.6s ease-out",
          opacity: isExiting ? 0 : isVisible ? 1 : 0,
          pointerEvents: isExiting ? "none" : "auto",
        }}
      >
        {/* Mesh gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(-45deg, hsl(174 40% 85%), hsl(260 30% 88%), hsl(200 40% 90%), hsl(170 40% 84%))",
            backgroundSize: "400% 400%",
            animation: "meshShift 12s ease infinite",
          }}
        />
        {/* Dark-mode overlay */}
        <div className="absolute inset-0 bg-background/40 dark:bg-background/80" />

        {/* Progress line — 1px at very top */}
        <div className="absolute top-0 left-0 right-0 h-px">
          <div
            className="h-full bg-foreground/40"
            style={{
              width: `${progress}%`,
              transition: "width 0.15s linear",
            }}
          />
        </div>

        {/* Content — centered on screen */}
        <div className="relative flex flex-col items-center justify-center gap-8 px-6 z-10">
          {/* Breathing logo */}
          <div
            className={cn(
              "transition-all duration-700",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
            style={{ animation: isVisible ? "breathe 4s ease-in-out infinite" : "none" }}
          >
            <span
              className="text-4xl md:text-5xl font-light tracking-[0.15em] lowercase select-none text-foreground drop-shadow-sm"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              unfric
            </span>
          </div>

          {/* Thin separator */}
          <div
            className={cn(
              "w-12 h-px bg-foreground/30 transition-all duration-700 delay-200",
              isVisible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0",
            )}
          />

          {/* Quote */}
          <div
            className={cn(
              "flex flex-col items-center gap-3 max-w-sm text-center transition-all duration-700 delay-300",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
            )}
          >
            <p className="text-sm md:text-base font-light text-foreground/90 leading-relaxed tracking-wide drop-shadow-sm">
              "{quote.text}"
            </p>
            <p className="text-[10px] text-foreground/50 tracking-[0.25em] uppercase">
              — {quote.author}
            </p>
          </div>

          {/* Module label */}
          <p
            className={cn(
              "mt-4 text-[10px] text-muted-foreground/30 tracking-[0.3em] uppercase transition-all duration-500 delay-500",
              isVisible ? "opacity-100" : "opacity-0",
            )}
          >
            {module}
          </p>
        </div>
      </div>
    </>
  );
}

export { PageLoadingScreen as default };
