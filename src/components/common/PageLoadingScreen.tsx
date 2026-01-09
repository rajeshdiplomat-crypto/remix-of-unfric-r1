import { useEffect, useState, useCallback } from "react";
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
  /** Called when loading animation completes (for transition orchestration) */
  onLoadComplete?: () => void;
  /** Minimum display time in ms (default: 2000) */
  minDisplayTime?: number;
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
    {
      text: "Start writing, no matter what. The water does not flow until the faucet is turned on.",
      author: "Louis L'Amour",
    },
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
    {
      text: "What lies behind us and before us are tiny matters compared to what lies within us.",
      author: "Ralph Waldo Emerson",
    },
    { text: "Vulnerability is the birthplace of connection.", author: "Brené Brown" },
    { text: "Be gentle with yourself. You're doing the best you can.", author: "Unknown" },
  ],
  manifest: [
    { text: "What you think, you become. What you feel, you attract.", author: "Buddha" },
    { text: "The universe is not outside of you. Look inside yourself.", author: "Rumi" },
    { text: "Whatever the mind can conceive, it can achieve.", author: "Napoleon Hill" },
    { text: "You are the creator of your own destiny.", author: "Swami Vivekananda" },
    { text: "Dream it. Believe it. Build it.", author: "Unknown" },
  ],
  trackers: [
    { text: "We are what we repeatedly do. Excellence is not an act, but a habit.", author: "Aristotle" },
    { text: "Small daily improvements lead to stunning results.", author: "Robin Sharma" },
    { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
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

// Module-specific accent colors for the animated elements
const MODULE_COLORS: Record<ModuleType, { gradient: string; glow: string; accent: string }> = {
  diary: { gradient: "from-amber-500 to-orange-600", glow: "amber-500/30", accent: "amber-400" },
  journal: { gradient: "from-violet-500 to-purple-600", glow: "violet-500/30", accent: "violet-400" },
  notes: { gradient: "from-emerald-500 to-teal-600", glow: "emerald-500/30", accent: "emerald-400" },
  tasks: { gradient: "from-blue-500 to-indigo-600", glow: "blue-500/30", accent: "blue-400" },
  emotions: { gradient: "from-rose-500 to-pink-600", glow: "rose-500/30", accent: "rose-400" },
  manifest: { gradient: "from-yellow-500 to-amber-600", glow: "yellow-500/30", accent: "yellow-400" },
  trackers: { gradient: "from-cyan-500 to-blue-600", glow: "cyan-500/30", accent: "cyan-400" },
  settings: { gradient: "from-slate-500 to-zinc-600", glow: "slate-500/30", accent: "slate-400" },
  clarity: { gradient: "from-sky-500 to-blue-600", glow: "sky-500/30", accent: "sky-400" },
};

// Module icons as SVG components for smooth animation
const ModuleIcon = ({ module, className }: { module: ModuleType; className?: string }) => {
  const icons: Record<ModuleType, JSX.Element> = {
    diary: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        <path d="M8 7h6" />
        <path d="M8 11h8" />
      </svg>
    ),
    journal: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m12 19 7-7 3 3-7 7-3-3z" />
        <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="m2 2 7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
    notes: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
        <path d="M15 3v6h6" />
        <path d="M7 13h10" />
        <path d="M7 17h10" />
        <path d="M7 9h2" />
      </svg>
    ),
    tasks: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5" width="6" height="6" rx="1" />
        <path d="m3 17 2 2 4-4" />
        <path d="M13 6h8" />
        <path d="M13 12h8" />
        <path d="M13 18h8" />
      </svg>
    ),
    emotions: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
    manifest: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    trackers: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
    settings: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    clarity: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
        <line x1="21.17" y1="8" x2="12" y2="8" />
        <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
        <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
      </svg>
    ),
  };
  return icons[module];
};

// Floating particles component
const FloatingParticles = ({ color }: { color: string }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={cn("absolute w-1 h-1 rounded-full opacity-40", `bg-${color}`)}
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
            animation: `float-particle ${3 + Math.random() * 2}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
};

// Animated progress ring
const ProgressRing = ({ progress, color }: { progress: number; color: string }) => {
  const radius = 62;
  const strokeWidth = 2;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg height={radius * 2} width={radius * 2} className="absolute -rotate-90">
      {/* Background ring */}
      <circle
        stroke="currentColor"
        fill="transparent"
        strokeWidth={strokeWidth}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        className="text-muted/20"
      />
      {/* Progress ring */}
      <circle
        stroke="currentColor"
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        style={{ strokeDashoffset, transition: "stroke-dashoffset 0.3s ease-out" }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        className={cn("text-primary transition-all duration-300")}
        strokeLinecap="round"
      />
    </svg>
  );
};

export function PageLoadingScreen({ module, onLoadComplete, minDisplayTime = 2000 }: PageLoadingScreenProps) {
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * LOADING_QUOTES[module].length));
  const [fadeIn, setFadeIn] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [interactionCount, setInteractionCount] = useState(0);

  const quotes = LOADING_QUOTES[module];
  const colors = MODULE_COLORS[module];
  const currentQuote = quotes[quoteIndex];

  // Progress animation
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / minDisplayTime) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            onLoadComplete?.();
          }, 500);
        }, 200);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [minDisplayTime, onLoadComplete]);

  // Quote rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % quotes.length);
        setFadeIn(true);
      }, 400);
    }, 4000);

    return () => clearInterval(interval);
  }, [quotes.length]);

  // Handle interaction (clicking increases progress slightly)
  const handleInteraction = useCallback(() => {
    setInteractionCount((prev) => prev + 1);
    // Add a small ripple effect on click
  }, []);

  return (
    <>
      {/* Global styles for animations */}
      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.8; }
        }
        
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(50px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(50px) rotate(-360deg); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        
        @keyframes text-reveal {
          from { clip-path: inset(0 100% 0 0); }
          to { clip-path: inset(0 0 0 0); }
        }
        
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .loading-icon-breathe {
          animation: breathe 3s ease-in-out infinite;
        }
        
        .orbit-dot {
          animation: orbit 8s linear infinite;
        }
        
        .orbit-dot-reverse {
          animation: orbit 12s linear infinite reverse;
        }
        
        .glow-pulse {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        .shimmer-text {
          background: linear-gradient(90deg, 
            transparent, 
            rgba(255,255,255,0.4), 
            transparent
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>

      <div
        className={cn(
          "fixed inset-0 z-50 flex flex-col items-center justify-center",
          "bg-background/95 backdrop-blur-xl",
          "transition-all duration-500 ease-out cursor-pointer select-none",
          isExiting && "opacity-0 scale-95 blur-sm",
        )}
        onClick={handleInteraction}
      >
        {/* Floating particles background */}
        <FloatingParticles color={colors.accent} />

        {/* Ambient gradient orbs */}
        <div
          className={cn("absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl glow-pulse", `bg-${colors.glow}`)}
        />
        <div
          className={cn(
            "absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full blur-3xl glow-pulse",
            `bg-${colors.glow}`,
          )}
          style={{ animationDelay: "1s" }}
        />

        {/* Main content */}
        <div className="relative flex flex-col items-center z-10">
          {/* Icon container with orbital rings */}
          <div className="relative mb-10">
            {/* Outer glow */}
            <div
              className={cn(
                "absolute inset-[-20px] rounded-full blur-2xl glow-pulse",
                `bg-gradient-to-br ${colors.gradient} opacity-20`,
              )}
            />

            {/* Progress ring */}
            <ProgressRing progress={progress} color={colors.accent} />

            {/* Orbiting dots */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="orbit-dot">
                <div className={cn("w-2 h-2 rounded-full", `bg-gradient-to-r ${colors.gradient}`)} />
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="orbit-dot-reverse">
                <div className={cn("w-1.5 h-1.5 rounded-full opacity-60", `bg-gradient-to-r ${colors.gradient}`)} />
              </div>
            </div>

            {/* Icon circle */}
            <div
              className={cn(
                "relative w-[124px] h-[124px] rounded-full flex items-center justify-center",
                "bg-gradient-to-br from-card to-card/50",
                "border border-border/30",
                "shadow-2xl",
                "loading-icon-breathe",
              )}
            >
              {/* Inner gradient overlay */}
              <div className={cn("absolute inset-2 rounded-full", `bg-gradient-to-br ${colors.gradient} opacity-10`)} />

              {/* Icon */}
              <ModuleIcon
                module={module}
                className={cn("w-12 h-12 relative z-10", `text-${colors.accent}`)}
                style={{ color: `var(--${colors.accent.replace("-", "-")})` }}
              />
            </div>

            {/* Ripple effect on interaction */}
            {interactionCount > 0 && (
              <div
                key={interactionCount}
                className={cn("absolute inset-0 rounded-full border-2", `border-${colors.accent}`)}
                style={{ animation: "ripple 0.6s ease-out forwards" }}
              />
            )}
          </div>

          {/* Module name */}
          <h2
            className={cn(
              "text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground mb-8",
              "transition-all duration-300",
            )}
          >
            {module}
          </h2>

          {/* Quote section */}
          <div className="relative max-w-md px-8 min-h-[100px] flex flex-col items-center justify-center">
            {/* Quote text */}
            <p
              className={cn(
                "text-xl font-light text-center text-foreground/90 leading-relaxed mb-3",
                "transition-all duration-400",
                fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
            >
              "{currentQuote.text}"
            </p>

            {/* Author */}
            <p
              className={cn(
                "text-sm text-muted-foreground/70 font-light tracking-wide",
                "transition-all duration-400 delay-100",
                fadeIn ? "opacity-100" : "opacity-0",
              )}
            >
              — {currentQuote.author}
            </p>
          </div>

          {/* Progress indicator */}
          <div className="mt-12 flex flex-col items-center gap-4">
            {/* Progress bar */}
            <div className="w-48 h-0.5 bg-muted/20 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-300", `bg-gradient-to-r ${colors.gradient}`)}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Animated loading dots */}
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn("w-1.5 h-1.5 rounded-full", `bg-gradient-to-r ${colors.gradient}`)}
                  style={{
                    animation: `pulse 1.5s ease-in-out ${i * 0.15}s infinite`,
                    opacity: 0.4 + i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Subtle hint text */}
          <p className="mt-8 text-xs text-muted-foreground/40 tracking-widest uppercase">Click anywhere to interact</p>
        </div>
      </div>
    </>
  );
}

// Export a version that includes skeleton fallback
export { PageLoadingScreen as default };
