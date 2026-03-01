import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

import { LOADING_QUOTES, type ModuleType } from "@/constants/quotes";

interface PageLoadingScreenProps {
  module: ModuleType;
  isDataReady?: boolean;
  onFinished?: () => void;
}


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

  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

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
        onFinishedRef.current?.();
      }, 400);
      return () => clearTimeout(exitTimer);
    }
  }, [isExiting, hasExited]);

  if (hasExited) {
    return null;
  }

  return createPortal(
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
          backgroundColor: "hsl(var(--background) / 0.30)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "0.5px solid hsl(var(--foreground) / 0.06)",
          boxShadow: "inset 0 1px 0 0 hsl(var(--foreground) / 0.04), 0 8px 32px -4px hsl(var(--foreground) / 0.08)",
          transition: "opacity 0.4s ease-out, transform 0.4s ease-out",
          opacity: isExiting ? 0 : isVisible ? 1 : 0,
          transform: isExiting ? "scale(0.98)" : "scale(1)",
          pointerEvents: isExiting ? "none" : "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2rem",
            padding: "2rem",
          }}
        >
          <div
            className={cn(
              "transition-all duration-500",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
          >
            <AnimatedUnfricLogo />
          </div>

          <div
            className="w-16 h-px bg-foreground/20 origin-center"
            style={{
              animation: isVisible ? "lineExpand 0.6s ease-out 0.3s forwards" : "none",
              transform: "scaleX(0)",
            }}
          />

          <div
            className={cn(
              "flex flex-col items-center gap-3 max-w-md px-6 text-center",
              "transition-all duration-500 delay-200",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
          >
            <p className="text-base md:text-lg font-light text-foreground/80 leading-relaxed">"{currentQuote.text}"</p>
            <p className="text-xs text-muted-foreground/60 tracking-widest uppercase">— {currentQuote.author}</p>
          </div>

          <div className={cn("mt-4 transition-all duration-500 delay-300", isVisible ? "opacity-100" : "opacity-0")}>
            <LoadingDots />
          </div>

          <p
            className={cn(
              "mt-6 text-[10px] text-muted-foreground/40 tracking-[0.3em] uppercase",
              "transition-all duration-500 delay-400",
              isVisible ? "opacity-100" : "opacity-0",
            )}
          >
            {module}
          </p>
        </div>
      </div>
    </>,
    document.body
  );
}

export { PageLoadingScreen as default };
