import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ModuleType =
  | "diary"
  | "journal"
  | "notes"
  | "tasks"
  | "emotions"
  | "manifest"
  | "trackers"
  | "settings"
  | "clarity";

interface PageLoadingScreenProps {
  module: ModuleType;
  /** Set to true when data is ready to show */
  isDataReady?: boolean;
  /** Called when loading screen finishes (after minimum display time) */
  onFinished?: () => void;
}

// Inspirational quotes organized by module
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
  trackers: [
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
  clarity: [
    { text: "Clarity comes from engagement, not thought.", author: "Marie Forleo" },
    { text: "The soul always knows what to do to heal itself.", author: "Caroline Myss" },
    { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "The clearer you are, the faster you manifest.", author: "Unknown" },
    { text: "When you let go of what you are, you become what you might be.", author: "Lao Tzu" },
  ],
};

// Animated Logo Component with wave effect
const AnimatedUnfricLogo = () => {
  const letters = "unfric".split("");

  return (
    <div className="flex items-center justify-center gap-0.5">
      {letters.map((letter, index) => (
        <span
          key={index}
          className="inline-block text-4xl md:text-5xl font-light tracking-[0.15em] lowercase"
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            animation: `wave 1.5s ease-in-out infinite`,
            animationDelay: `${index * 0.1}s`,
            color: "rgba(255, 255, 255, 0.95)",
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
};

// Animated dots loader
const LoadingDots = () => (
  <div className="flex gap-1.5 items-center justify-center">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.5)",
          animation: `dotPulse 1.4s ease-in-out infinite`,
          animationDelay: `${i * 0.16}s`,
        }}
      />
    ))}
  </div>
);

// Minimum display time in milliseconds
const MIN_DISPLAY_TIME = 2000; // 2 SECONDS

export function PageLoadingScreen({ module, isDataReady = false, onFinished }: PageLoadingScreenProps) {
  const [quoteIndex] = useState(() => Math.floor(Math.random() * LOADING_QUOTES[module].length));
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasMetMinTime, setHasMetMinTime] = useState(false);
  const [hasExited, setHasExited] = useState(false);

  const quotes = LOADING_QUOTES[module];
  const currentQuote = quotes[quoteIndex];

  // Entrance animation
  useEffect(() => {
    const entranceTimer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(entranceTimer);
  }, []);

  // Minimum display time tracker
  useEffect(() => {
    const minTimeTimer = setTimeout(() => {
      setHasMetMinTime(true);
    }, MIN_DISPLAY_TIME);

    return () => clearTimeout(minTimeTimer);
  }, []);

  // Exit when BOTH minimum time passed AND data is ready
  useEffect(() => {
    if (hasMetMinTime && isDataReady && !isExiting && !hasExited) {
      setIsExiting(true);
    }
  }, [hasMetMinTime, isDataReady, isExiting, hasExited]);

  // If no isDataReady prop provided, auto-exit after min time
  useEffect(() => {
    if (hasMetMinTime && !isExiting && !hasExited) {
      const autoExitTimer = setTimeout(() => {
        setIsExiting(true);
      }, 100);
      return () => clearTimeout(autoExitTimer);
    }
  }, [hasMetMinTime, isExiting, hasExited]);

  // Call onFinished after exit animation completes
  useEffect(() => {
    if (isExiting && !hasExited) {
      const exitTimer = setTimeout(() => {
        setHasExited(true);
        onFinished?.();
      }, 400);
      return () => clearTimeout(exitTimer);
    }
  }, [isExiting, hasExited, onFinished]);

  // Don't render if already exited
  if (hasExited) {
    return null;
  }

  return (
    <>
      {/* CSS Animations */}
      <style>{`
        @keyframes wave {
          0%, 100% {
            transform: translateY(0);
          }
          25% {
            transform: translateY(-8px);
          }
          50% {
            transform: translateY(0);
          }
          75% {
            transform: translateY(4px);
          }
        }
        
        @keyframes dotPulse {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.4;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes lineExpand {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
        
        @keyframes subtleGlow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>

      {/* DARK FULL SCREEN OVERLAY - TRUE CENTER */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // DARK BACKGROUND with subtle gradient
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)",
          transition: "opacity 0.4s ease-out, transform 0.4s ease-out",
          opacity: isExiting ? 0 : isVisible ? 1 : 0,
          transform: isExiting ? "scale(0.98)" : "scale(1)",
          pointerEvents: isExiting ? "none" : "auto",
        }}
      >
        {/* Subtle ambient glow effects */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "30%",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "subtleGlow 4s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "30%",
            right: "25%",
            width: "250px",
            height: "250px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "subtleGlow 4s ease-in-out infinite",
            animationDelay: "2s",
          }}
        />

        {/* Main centered content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2rem",
            padding: "2rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Animated unfric logo */}
          <div
            className={cn(
              "transition-all duration-500",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
          >
            <AnimatedUnfricLogo />
          </div>

          {/* Animated line separator */}
          <div
            style={{
              width: "64px",
              height: "1px",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              transformOrigin: "center",
              animation: isVisible ? "lineExpand 0.6s ease-out 0.3s forwards" : "none",
              transform: "scaleX(0)",
            }}
          />

          {/* Quote section */}
          <div
            className={cn(
              "flex flex-col items-center gap-3 max-w-md px-6 text-center",
              "transition-all duration-500 delay-200",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
          >
            <p
              style={{ color: "rgba(255, 255, 255, 0.85)" }}
              className="text-base md:text-lg font-light leading-relaxed"
            >
              "{currentQuote.text}"
            </p>
            <p style={{ color: "rgba(255, 255, 255, 0.4)" }} className="text-xs tracking-widest uppercase">
              — {currentQuote.author}
            </p>
          </div>

          {/* Loading dots */}
          <div className={cn("mt-4 transition-all duration-500 delay-300", isVisible ? "opacity-100" : "opacity-0")}>
            <LoadingDots />
          </div>

          {/* Module indicator (subtle) */}
          <p
            style={{ color: "rgba(255, 255, 255, 0.25)" }}
            className={cn(
              "mt-6 text-[10px] tracking-[0.3em] uppercase",
              "transition-all duration-500 delay-400",
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
