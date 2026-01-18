import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
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

  // Lock body scroll when visualization is open
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

  const handleSkip = () => {
    onComplete();
  };

  // Timer ring calculations
  const size = 180;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  // Fallback affirmation if empty
  const affirmationText = goal.daily_affirmation?.trim() || goal.title || "I am becoming who I want to be.";

  const visualizationContent = (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Background Image or Gradient */}
      {goal.vision_image_url ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${goal.vision_image_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Dark overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.4), rgba(0,0,0,0.55))",
            }}
          />
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(135deg, #0f172a 0%, #134e4a 50%, #164e63 100%)",
          }}
        />
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 10,
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <X style={{ width: "20px", height: "20px" }} />
      </button>

      {/* Main Content - Centered */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          position: "relative",
          zIndex: 5,
        }}
      >
        {/* Breathing Text */}
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "3px",
            marginBottom: "32px",
          }}
        >
          {isPaused ? "Paused" : "Breathe & Visualize"}
        </p>

        {/* Timer Ring */}
        <div style={{ position: "relative", width: size, height: size, marginBottom: "40px" }}>
          <svg
            width={size}
            height={size}
            style={{ transform: "rotate(-90deg)", filter: "drop-shadow(0 0 25px rgba(20, 184, 166, 0.5))" }}
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
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#timerGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>

          {/* Timer Text */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: "48px",
                fontWeight: 300,
                color: "white",
              }}
            >
              {formatTime(secondsLeft)}
            </span>
          </div>
        </div>

        {/* Affirmation */}
        <p
          style={{
            fontSize: "24px",
            fontWeight: 300,
            color: "white",
            textAlign: "center",
            maxWidth: "600px",
            lineHeight: 1.5,
            marginBottom: "48px",
          }}
        >
          "{affirmationText}"
        </p>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => setIsPaused(!isPaused)}
            style={{
              height: "52px",
              padding: "0 32px",
              borderRadius: "9999px",
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "white",
              fontSize: "16px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
            }}
          >
            {isPaused ? (
              <>
                <Play style={{ width: "20px", height: "20px", fill: "currentColor" }} />
                Resume
              </>
            ) : (
              <>
                <Pause style={{ width: "20px", height: "20px" }} />
                Pause
              </>
            )}
          </button>

          <button
            onClick={handleSkip}
            style={{
              height: "52px",
              padding: "0 24px",
              borderRadius: "9999px",
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.6)",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <SkipForward style={{ width: "18px", height: "18px" }} />
            Skip & Complete
          </button>
        </div>
      </div>

      {/* Progress Bar at Bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "rgba(255,255,255,0.1)",
        }}
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
    </div>
  );

  // Use portal to render at document body level, escaping all parent containers
  return createPortal(visualizationContent, document.body);
}
