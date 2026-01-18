import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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

  const size = 180;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);

  const content = (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", flexDirection: "column" }}>
      {/* Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: goal.vision_image_url ? `url(${goal.vision_image_url})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: goal.vision_image_url ? undefined : "#0f172a",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.4))",
          }}
        />
      </div>

      {/* Floating particles */}
      {!isPaused &&
        Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(20,184,166,0.8), transparent)",
              left: `${15 + i * 12}%`,
              bottom: "-20px",
              animation: `floatUp ${10 + i}s linear infinite`,
              animationDelay: `${i * -1.5}s`,
            }}
          />
        ))}

      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 10,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <X style={{ width: 20, height: 20 }} />
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
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: 3,
            marginBottom: 32,
          }}
        >
          {isPaused ? "Paused" : "Breathe & Visualize"}
        </p>

        {/* Timer */}
        <div style={{ position: "relative", width: size, height: size, marginBottom: 40 }}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={strokeWidth}
            />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#grad)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div
            style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <span style={{ fontSize: 48, fontWeight: 200, color: "white" }}>{formatTime(secondsLeft)}</span>
          </div>
        </div>

        {/* Affirmation */}
        <p
          style={{
            fontSize: 22,
            fontWeight: 300,
            color: "white",
            textAlign: "center",
            maxWidth: 500,
            lineHeight: 1.6,
            marginBottom: 48,
          }}
        >
          "{affirmation}"
        </p>

        {/* Controls */}
        <div style={{ display: "flex", gap: 16 }}>
          <button
            onClick={() => setIsPaused(!isPaused)}
            style={{
              height: 52,
              padding: "0 32px",
              borderRadius: 9999,
              background: isPaused ? "linear-gradient(135deg, #14b8a6, #06b6d4)" : "rgba(255,255,255,0.1)",
              border: isPaused ? "none" : "1px solid rgba(255,255,255,0.2)",
              color: "white",
              fontSize: 16,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
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
              height: 52,
              padding: "0 24px",
              borderRadius: 9999,
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <SkipForward style={{ width: 18, height: 18 }} /> Skip
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "rgba(255,255,255,0.1)" }}
      >
        <div
          style={{
            height: "100%",
            background: "linear-gradient(to right, #14b8a6, #06b6d4)",
            width: `${progress}%`,
            transition: "width 1s linear",
          }}
        />
      </div>

      <style>{`@keyframes floatUp { 0% { transform: translateY(100vh); opacity: 0; } 10% { opacity: 0.6; } 90% { opacity: 0.6; } 100% { transform: translateY(-100vh); opacity: 0; } }`}</style>
    </div>
  );

  return createPortal(content, document.body);
}
