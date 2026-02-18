import { useEffect, useState } from "react";
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

const LOADING_QUOTES: Record<ModuleType, { text: string; author: string }[]> = {
  diary: [
    { text: "Every moment is a fresh beginning.", author: "T.S. Eliot" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
    { text: "Today is the first day of the rest of your life.", author: "Charles Dederich" },
    { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  ],
  journal: [
    { text: "Writing is the painting of the voice.", author: "Voltaire" },
    { text: "I write to discover what I know.", author: "Flannery O'Connor" },
    { text: "The pen is mightier than the sword.", author: "Edward Bulwer-Lytton" },
    { text: "There is no greater agony than bearing an untold story.", author: "Maya Angelou" },
    { text: "Start writing, no matter what.", author: "Louis L'Amour" },
  ],
  notes: [
    { text: "Knowledge is power.", author: "Francis Bacon" },
    { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
    { text: "The beautiful thing about learning is that no one can take it away.", author: "B.B. King" },
    { text: "Ideas are the beginning points of all fortunes.", author: "Napoleon Hill" },
    { text: "The art of simplicity is a puzzle of complexity.", author: "Douglas Horton" },
  ],
  tasks: [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
    { text: "What you do today can improve all your tomorrows.", author: "Ralph Marston" },
    { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  ],
  emotions: [
    { text: "Feelings are just visitors, let them come and go.", author: "Mooji" },
    { text: "The only way out is through.", author: "Robert Frost" },
    { text: "What lies within us is what matters most.", author: "Ralph Waldo Emerson" },
    { text: "Vulnerability is the birthplace of connection.", author: "Brené Brown" },
    { text: "Be gentle with yourself.", author: "Unknown" },
  ],
  manifest: [
    { text: "What you think, you become. What you feel, you attract.", author: "Buddha" },
    { text: "The universe is not outside of you. Look inside yourself.", author: "Rumi" },
    { text: "Whatever the mind can conceive, it can achieve.", author: "Napoleon Hill" },
    { text: "You are the creator of your own destiny.", author: "Swami Vivekananda" },
    { text: "Dream it. Believe it. Build it.", author: "Unknown" },
  ],
  habits: [
    { text: "We are what we repeatedly do.", author: "Aristotle" },
    { text: "Small daily improvements lead to stunning results.", author: "Robin Sharma" },
    { text: "Success is the sum of small efforts repeated daily.", author: "Robert Collier" },
    { text: "Consistency is more important than perfection.", author: "Unknown" },
    { text: "Progress, not perfection.", author: "Unknown" },
  ],
  settings: [
    { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
    { text: "The details are not the details. They make the design.", author: "Charles Eames" },
    { text: "Make it simple, but significant.", author: "Don Draper" },
    { text: "Less is more.", author: "Ludwig Mies van der Rohe" },
    { text: "Perfection is achieved when there is nothing left to take away.", author: "Antoine de Saint-Exupéry" },
  ],
};

const AnimatedUnfricLogo = () => {
  const letters = "unfric".split("");

  return (
    <div className="flex items-center justify-center gap-0.5">
      {letters.map((letter, index) => (
        <span
          key={index}
          className="inline-block text-4xl md:text-5xl font-light tracking-[0.15em] lowercase text-foreground"
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            animation: `wave 1.5s ease-in-out infinite`,
            animationDelay: `${index * 0.1}s`,
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
};

const LoadingDots = () => (
  <div className="flex gap-1.5 items-center justify-center">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-foreground/50"
        style={{
          animation: `dotPulse 1.4s ease-in-out infinite`,
          animationDelay: `${i * 0.16}s`,
        }}
      />
    ))}
  </div>
);

const MIN_DISPLAY_TIME = 2000;

export function PageLoadingScreen({ module, isDataReady = false, onFinished }: PageLoadingScreenProps) {
  const [quoteIndex] = useState(() => Math.floor(Math.random() * LOADING_QUOTES[module].length));
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasMetMinTime, setHasMetMinTime] = useState(false);
  const [hasExited, setHasExited] = useState(false);

  const quotes = LOADING_QUOTES[module];
  const currentQuote = quotes[quoteIndex];

  useEffect(() => {
    const entranceTimer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(entranceTimer);
  }, []);

  useEffect(() => {
    const minTimeTimer = setTimeout(() => {
      setHasMetMinTime(true);
    }, MIN_DISPLAY_TIME);
    return () => clearTimeout(minTimeTimer);
  }, []);

  useEffect(() => {
    if (hasMetMinTime && isDataReady && !isExiting && !hasExited) {
      setIsExiting(true);
    }
  }, [hasMetMinTime, isDataReady, isExiting, hasExited]);

  useEffect(() => {
    if (hasMetMinTime && !isExiting && !hasExited) {
      const autoExitTimer = setTimeout(() => {
        setIsExiting(true);
      }, 100);
      return () => clearTimeout(autoExitTimer);
    }
  }, [hasMetMinTime, isExiting, hasExited]);

  useEffect(() => {
    if (isExiting && !hasExited) {
      const exitTimer = setTimeout(() => {
        setHasExited(true);
        onFinished?.();
      }, 400);
      return () => clearTimeout(exitTimer);
    }
  }, [isExiting, hasExited, onFinished]);

  if (hasExited) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes wave {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-8px); }
          50% { transform: translateY(0); }
          75% { transform: translateY(4px); }
        }
        
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes lineExpand {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>

      {/* Full-screen glass overlay */}
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center"
        style={{
          backgroundColor: "hsl(var(--foreground) / 0.06)",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
          transition: "opacity 0.4s ease-out, transform 0.4s ease-out",
          opacity: isExiting ? 0 : isVisible ? 1 : 0,
          transform: isExiting ? "scale(0.98)" : "scale(1)",
          pointerEvents: isExiting ? "none" : "auto",
        }}
      >
        {/* Ambient mesh gradient behind glass card */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.07] dark:opacity-[0.12]"
          style={{
            background:
              "radial-gradient(ellipse at 30% 20%, hsl(200 80% 60%) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, hsl(280 60% 60%) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, hsl(160 70% 50%) 0%, transparent 60%)",
          }}
        />

        {/* Glass card */}
        <div
          className={cn(
            "relative flex flex-col items-center justify-center gap-8 px-12 py-14 rounded-2xl",
            "bg-background/60 backdrop-blur-2xl",
            "border-[0.5px] border-foreground/[0.08]",
            "shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.04),_0_24px_64px_-12px_hsl(var(--foreground)/0.12)]",
            "max-w-sm w-full mx-4",
          )}
        >
          {/* Subtle top highlight edge */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent rounded-t-2xl" />

          {/* Animated unfric logo */}
          <div
            className={cn(
              "transition-all duration-700 ease-out",
              isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-95",
            )}
          >
            <AnimatedUnfricLogo />
          </div>

          {/* Animated line separator */}
          <div
            className="w-12 h-px bg-foreground/15 origin-center"
            style={{
              animation: isVisible ? "lineExpand 0.8s ease-out 0.3s forwards" : "none",
              transform: "scaleX(0)",
            }}
          />

          {/* Quote section */}
          <div
            className={cn(
              "flex flex-col items-center gap-2.5 max-w-xs text-center",
              "transition-all duration-700 ease-out delay-200",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
          >
            <p className="text-sm md:text-base font-light text-foreground/70 leading-relaxed italic">
              "{currentQuote.text}"
            </p>
            <p className="text-[10px] text-muted-foreground/50 tracking-[0.2em] uppercase">
              — {currentQuote.author}
            </p>
          </div>

          {/* Loading dots */}
          <div
            className={cn(
              "transition-all duration-700 ease-out delay-300",
              isVisible ? "opacity-100" : "opacity-0",
            )}
          >
            <LoadingDots />
          </div>

          {/* Module indicator pill */}
          <div
            className={cn(
              "px-4 py-1 rounded-full bg-foreground/[0.04] border border-foreground/[0.06]",
              "transition-all duration-700 ease-out delay-[400ms]",
              isVisible ? "opacity-100" : "opacity-0",
            )}
          >
            <p className="text-[9px] text-muted-foreground/50 tracking-[0.3em] uppercase font-light">
              {module}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export { PageLoadingScreen as default };
