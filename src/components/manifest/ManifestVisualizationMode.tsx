import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Pause, Play, SkipForward, Zap } from "lucide-react";
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
  const [pulseIntensity, setPulseIntensity] = useState(1);
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

  // Energy pulse effect
  useEffect(() => {
    if (isPaused) return;
    const pulseInterval = setInterval(() => {
      setPulseIntensity((prev) => (prev === 1 ? 1.15 : 1));
    }, 2000);
    return () => clearInterval(pulseInterval);
  }, [isPaused]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const affirmation = goal.daily_affirmation?.trim() || goal.title || "I am becoming who I want to be.";

  const size = 200;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);

  const content = (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", flexDirection: "column" }}>
      {/* Animated Energy Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: goal.vision_image_url ? `url(${goal.vision_image_url})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: goal.vision_image_url ? undefined : "#0a0a0f",
          transform: `scale(${pulseIntensity})`,
          transition: "transform 2s ease-in-out",
        }}
      >
        {/* Energy gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `
              radial-gradient(ellipse at 50% 0%, rgba(20,184,166,0.3) 0%, transparent 50%),
              radial-gradient(ellipse at 0% 50%, rgba(168,85,247,0.2) 0%, transparent 40%),
              radial-gradient(ellipse at 100% 50%, rgba(59,130,246,0.2) 0%, transparent 40%),
              radial-gradient(ellipse at 50% 100%, rgba(236,72,153,0.2) 0%, transparent 50%),
              linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.4))
            `,
          }}
        />
      </div>

      {/* Energy particles - more dynamic */}
      {!isPaused &&
        Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 4 + (i % 3) * 4,
              height: 4 + (i % 3) * 4,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${
                i % 4 === 0
                  ? "rgba(20,184,166,0.9)"
                  : i % 4 === 1
                    ? "rgba(168,85,247,0.9)"
                    : i % 4 === 2
                      ? "rgba(59,130,246,0.9)"
                      : "rgba(236,72,153,0.9)"
              }, transparent)`,
              left: `${5 + (i * 4.5)}%`,
              bottom: "-20px",
              animation: `energyFloat ${6 + (i % 5)}s ease-in-out infinite`,
              animationDelay: `${i * -0.3}s`,
              boxShadow: `0 0 ${10 + (i % 3) * 5}px ${
                i % 4 === 0
                  ? "rgba(20,184,166,0.5)"
                  : i % 4 === 1
                    ? "rgba(168,85,247,0.5)"
                    : i % 4 === 2
                      ? "rgba(59,130,246,0.5)"
                      : "rgba(236,72,153,0.5)"
              }`,
            }}
          />
        ))}

      {/* Side energy streams */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "20%",
          bottom: "20%",
          width: 2,
          background: "linear-gradient(to bottom, transparent, rgba(168,85,247,0.8), transparent)",
          animation: "sideGlow 3s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: "20%",
          bottom: "20%",
          width: 2,
          background: "linear-gradient(to bottom, transparent, rgba(59,130,246,0.8), transparent)",
          animation: "sideGlow 3s ease-in-out infinite",
          animationDelay: "1.5s",
        }}
      />

      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 10,
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.3s",
        }}
      >
        <X style={{ width: 22, height: 22 }} />
      </button>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          position: "relative",
          zIndex: 5,
        }}
      >
        {/* Energy Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "rgba(255,255,255,0.7)",
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: 4,
            marginBottom: 40,
            padding: "8px 20px",
            borderRadius: 9999,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Zap
            style={{
              width: 16,
              height: 16,
              color: isPaused ? "rgba(255,255,255,0.5)" : "#14b8a6",
              animation: isPaused ? "none" : "energyPulse 1s ease-in-out infinite",
            }}
          />
          {isPaused ? "Paused" : "Channeling Energy"}
        </div>

        {/* Timer with energy ring */}
        <div
          style={{
            position: "relative",
            width: size + 40,
            height: size + 40,
            marginBottom: 48,
          }}
        >
          {/* Outer glow ring */}
          <div
            style={{
              position: "absolute",
              inset: -10,
              borderRadius: "50%",
              background: `conic-gradient(from 0deg, rgba(20,184,166,0.3), rgba(168,85,247,0.3), rgba(59,130,246,0.3), rgba(236,72,153,0.3), rgba(20,184,166,0.3))`,
              animation: isPaused ? "none" : "energyRotate 8s linear infinite",
              filter: "blur(15px)",
            }}
          />

          <svg width={size + 40} height={size + 40} style={{ position: "relative", zIndex: 1 }}>
            <defs>
              <linearGradient id="energyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6">
                  <animate attributeName="stop-color" values="#14b8a6;#a855f7;#3b82f6;#ec4899;#14b8a6" dur="8s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="#a855f7">
                  <animate attributeName="stop-color" values="#a855f7;#3b82f6;#ec4899;#14b8a6;#a855f7" dur="8s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#3b82f6">
                  <animate attributeName="stop-color" values="#3b82f6;#ec4899;#14b8a6;#a855f7;#3b82f6" dur="8s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle
              cx={(size + 40) / 2}
              cy={(size + 40) / 2}
              r={radius + 10}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={(size + 40) / 2}
              cy={(size + 40) / 2}
              r={radius + 10}
              fill="none"
              stroke="url(#energyGrad)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference + 20}
              strokeDashoffset={offset}
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "center",
                transition: "stroke-dashoffset 1s linear",
                filter: "url(#glow)",
              }}
            />
          </svg>

          {/* Timer text */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 56,
                fontWeight: 200,
                color: "white",
                letterSpacing: 2,
                textShadow: "0 0 30px rgba(20,184,166,0.5)",
              }}
            >
              {formatTime(secondsLeft)}
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 3 }}>
              remaining
            </span>
          </div>
        </div>

        {/* Affirmation with energy styling */}
        <div
          style={{
            position: "relative",
            maxWidth: 600,
            marginBottom: 56,
          }}
        >
          <p
            style={{
              fontSize: 26,
              fontWeight: 300,
              color: "white",
              textAlign: "center",
              lineHeight: 1.7,
              textShadow: "0 0 40px rgba(168,85,247,0.3)",
            }}
          >
            "{affirmation}"
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 16 }}>
          <button
            onClick={() => setIsPaused(!isPaused)}
            style={{
              height: 56,
              padding: "0 36px",
              borderRadius: 9999,
              background: isPaused
                ? "linear-gradient(135deg, #14b8a6, #a855f7)"
                : "rgba(255,255,255,0.1)",
              border: isPaused ? "none" : "1px solid rgba(255,255,255,0.2)",
              color: "white",
              fontSize: 16,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "all 0.3s",
              boxShadow: isPaused ? "0 0 30px rgba(20,184,166,0.4)" : "none",
            }}
          >
            {isPaused ? (
              <>
                <Play style={{ width: 20, height: 20, fill: "white" }} /> Resume
              </>
            ) : (
              <>
                <Pause style={{ width: 20, height: 20 }} /> Pause
              </>
            )}
          </button>
          <button
            onClick={onComplete}
            style={{
              height: 56,
              padding: "0 28px",
              borderRadius: 9999,
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              transition: "color 0.3s",
            }}
          >
            <SkipForward style={{ width: 18, height: 18 }} /> Skip
          </button>
        </div>
      </div>

      {/* Progress bar with energy effect */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: "rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            height: "100%",
            background: "linear-gradient(to right, #14b8a6, #a855f7, #3b82f6)",
            width: `${progress}%`,
            transition: "width 1s linear",
            boxShadow: "0 0 20px rgba(168,85,247,0.5)",
          }}
        />
      </div>

      <style>{`
        @keyframes energyFloat {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 0.8; }
          50% { transform: translateY(50vh) rotate(180deg); opacity: 1; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes energyRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes energyPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        @keyframes sideGlow {
          0%, 100% { opacity: 0.3; height: 30%; }
          50% { opacity: 1; height: 60%; }
        }
      `}</style>
    </div>
  );

  return createPortal(content, document.body);
}
