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
  const size = 200;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  // Fallback affirmation if empty
  const affirmationText = goal.daily_affirmation?.trim() || goal.title || "I am becoming who I want to be.";

  // CSS Keyframes for animations
  const animationStyles = `
    @keyframes float1 {
      0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
      50% { transform: translate(30px, -40px) scale(1.1); opacity: 0.5; }
    }
    @keyframes float2 {
      0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
      50% { transform: translate(-40px, -30px) scale(1.2); opacity: 0.4; }
    }
    @keyframes float3 {
      0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.25; }
      50% { transform: translate(20px, 50px) scale(0.9); opacity: 0.45; }
    }
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 30px rgba(20, 184, 166, 0.3), 0 0 60px rgba(6, 182, 212, 0.2); }
      50% { box-shadow: 0 0 50px rgba(20, 184, 166, 0.5), 0 0 100px rgba(6, 182, 212, 0.4); }
    }
    @keyframes breathe {
      0%, 100% { transform: scale(1); opacity: 0.7; }
      50% { transform: scale(1.05); opacity: 1; }
    }
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes particle {
      0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
      10% { opacity: 0.6; }
      90% { opacity: 0.6; }
      100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
    }
  `;

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
      <style>{animationStyles}</style>

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
          {/* Dark overlay with gradient */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.6) 100%)",
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

      {/* Floating Energy Particles */}
      {!isPaused &&
        [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: `${8 + Math.random() * 12}px`,
              height: `${8 + Math.random() * 12}px`,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(20, 184, 166, 0.8) 0%, rgba(6, 182, 212, 0.4) 50%, transparent 70%)`,
              left: `${10 + i * 10}%`,
              animation: `particle ${12 + i * 2}s linear infinite`,
              animationDelay: `${i * -1.5}s`,
            }}
          />
        ))}

      {/* Floating Orbs */}
      <div
        style={{
          position: "absolute",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, transparent 70%)",
          top: "10%",
          left: "-5%",
          animation: "float1 8s ease-in-out infinite",
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "250px",
          height: "250px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)",
          bottom: "15%",
          right: "-5%",
          animation: "float2 10s ease-in-out infinite",
          filter: "blur(50px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(34, 211, 238, 0.1) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          animation: "float3 12s ease-in-out infinite",
          filter: "blur(30px)",
        }}
      />

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
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.3s ease",
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
        {/* Breathing Guide Text */}
        <p
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "4px",
            marginBottom: "40px",
            animation: isPaused ? "none" : "breathe 4s ease-in-out infinite",
          }}
        >
          {isPaused ? "⏸ Paused" : "✨ Breathe & Visualize"}
        </p>

        {/* Timer Ring with Glow */}
        <div
          style={{
            position: "relative",
            width: size,
            height: size,
            marginBottom: "48px",
            animation: isPaused ? "none" : "pulse-glow 3s ease-in-out infinite",
            borderRadius: "50%",
          }}
        >
          <svg
            width={size}
            height={size}
            style={{
              transform: "rotate(-90deg)",
            }}
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
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
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: "56px",
                fontWeight: 200,
                color: "white",
                letterSpacing: "2px",
              }}
            >
              {formatTime(secondsLeft)}
            </span>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>remaining</span>
          </div>
        </div>

        {/* Affirmation with Shimmer */}
        <div
          style={{
            textAlign: "center",
            maxWidth: "600px",
            marginBottom: "56px",
          }}
        >
          <p
            style={{
              fontSize: "26px",
              fontWeight: 300,
              color: "white",
              lineHeight: 1.6,
              letterSpacing: "0.5px",
              textShadow: "0 2px 20px rgba(0,0,0,0.3)",
            }}
          >
            "{affirmationText}"
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => setIsPaused(!isPaused)}
            style={{
              height: "56px",
              padding: "0 36px",
              borderRadius: "9999px",
              background: isPaused ? "linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)" : "rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
              border: isPaused ? "none" : "1px solid rgba(255,255,255,0.2)",
              color: "white",
              fontSize: "16px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: isPaused ? "0 8px 32px rgba(20, 184, 166, 0.4)" : "none",
            }}
          >
            {isPaused ? (
              <>
                <Play style={{ width: "22px", height: "22px", fill: "currentColor" }} />
                Resume
              </>
            ) : (
              <>
                <Pause style={{ width: "22px", height: "22px" }} />
                Pause
              </>
            )}
          </button>

          <button
            onClick={handleSkip}
            style={{
              height: "56px",
              padding: "0 28px",
              borderRadius: "9999px",
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              transition: "all 0.3s ease",
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
            background: "linear-gradient(to right, #14b8a6, #06b6d4, #22d3ee)",
            width: `${progress}%`,
            transition: "width 1s linear",
            boxShadow: "0 0 20px rgba(20, 184, 166, 0.6)",
          }}
        />
      </div>
    </div>
  );

  // Use portal to render at document body level
  return createPortal(visualizationContent, document.body);
}
