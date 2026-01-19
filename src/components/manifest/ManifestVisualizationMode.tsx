import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Pause, Play, SkipForward, Zap, Settings } from "lucide-react";
import { type ManifestGoal, type ManifestDailyPractice } from "./types";

interface ManifestVisualizationModeProps {
  goal: ManifestGoal;
  duration: 3 | 5 | 10;
  previousPractice?: ManifestDailyPractice | null;
  onComplete: () => void;
  onClose: () => void;
}

interface FloatingElement {
  id: string;
  type: "action" | "proof" | "note" | "image" | "word";
  content: string;
  imageUrl?: string;
  delay: number;
  duration: number;
  left: number;
  animationStyle: number; // 0-3 for different animation variations
  scale: number;
  rotation: number;
}

export function ManifestVisualizationMode({ 
  goal, 
  duration, 
  previousPractice,
  onComplete, 
  onClose 
}: ManifestVisualizationModeProps) {
  const totalSeconds = duration * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  // Get all vision images (including the main one)
  const visionImages = useMemo(() => {
    const images: string[] = [];
    if (goal.vision_image_url) images.push(goal.vision_image_url);
    if (goal.vision_images && goal.vision_images.length > 0) {
      images.push(...goal.vision_images.filter(img => img && !images.includes(img)));
    }
    if (goal.cover_image_url && !images.includes(goal.cover_image_url)) {
      images.push(goal.cover_image_url);
    }
    return images;
  }, [goal]);

  // Create floating elements from previous practice - split into words for advanced animation
  const floatingElements = useMemo<FloatingElement[]>(() => {
    const elements: FloatingElement[] = [];
    let idx = 0;

    const addWords = (text: string, type: FloatingElement["type"], baseDelay: number) => {
      const words = text.split(/\s+/).filter(w => w.length > 0);
      words.forEach((word, i) => {
        elements.push({
          id: `${type}-word-${idx}-${i}`,
          type: "word",
          content: word,
          delay: baseDelay + (i * 0.5),
          duration: 18 + Math.random() * 6, // Slower duration
          left: 5 + Math.random() * 85,
          animationStyle: Math.floor(Math.random() * 4),
          scale: 1.1 + Math.random() * 0.5, // Bigger scale
          rotation: -15 + Math.random() * 30,
        });
      });
      idx++;
    };

    // Add vision images as floating elements (instead of background)
    visionImages.forEach((img, i) => {
      elements.push({
        id: `vision-${i}`,
        type: "image",
        content: "",
        imageUrl: img,
        delay: i * 10, // Slower stagger
        duration: 24 + (i % 5) * 3, // Much slower
        left: 5 + (i * 25) % 70,
        animationStyle: Math.floor(Math.random() * 4),
        scale: 1.8, // Bigger
        rotation: -8 + Math.random() * 16,
      });
    });

    if (previousPractice) {
      // Add actions with word splitting (no separate timestamp)
      previousPractice.acts?.forEach((act, i) => {
        addWords(act.text, "action", i * 6 + 2);
        // Also add the full action as a card
        elements.push({
          id: `act-${act.id}`,
          type: "action",
          content: act.text,
          delay: (idx * 6) % 25,
          duration: 20 + (i % 4), // Slower
          left: 10 + (idx * 17) % 70,
          animationStyle: Math.floor(Math.random() * 4),
          scale: 1.2, // Bigger
          rotation: -5 + Math.random() * 10,
        });
        idx++;
      });

      // Add proofs with word splitting (no separate timestamp)
      previousPractice.proofs?.forEach((proof, i) => {
        if (proof.text) {
          addWords(proof.text, "proof", i * 7 + 2);
          elements.push({
            id: `proof-${proof.id}`,
            type: "proof",
            content: proof.text,
            imageUrl: proof.image_url,
            delay: (idx * 5) % 22,
            duration: 22 + (i % 3), // Slower
            left: 5 + (idx * 19) % 75,
            animationStyle: Math.floor(Math.random() * 4),
            scale: 1.2, // Bigger
            rotation: -3 + Math.random() * 6,
          });
          idx++;
        }
        if (proof.image_url) {
          elements.push({
            id: `img-${proof.id}`,
            type: "image",
            content: "",
            imageUrl: proof.image_url,
            delay: (idx * 4) % 18,
            duration: 22 + (i % 3), // Slower
            left: 15 + (idx * 15) % 60,
            animationStyle: Math.floor(Math.random() * 4),
            scale: 1.4, // Bigger
            rotation: -8 + Math.random() * 16,
          });
          idx++;
        }
      });

      // Add growth note with word splitting
      if (previousPractice.growth_note) {
        addWords(previousPractice.growth_note, "note", idx * 4);
        elements.push({
          id: "growth-note",
          type: "note",
          content: previousPractice.growth_note,
          delay: (idx * 4) % 18,
          duration: 22,
          left: 20 + (idx * 13) % 50,
          animationStyle: Math.floor(Math.random() * 4),
          scale: 1.2,
          rotation: 0,
        });
      }
    }

    return elements;
  }, [previousPractice, visionImages]);

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

  // Remove image cycling since images now float
  // Background will be static energy gradient

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

  const currentImage = null; // No background image - use energy gradient only

  const size = 200;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);

  const content = (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", flexDirection: "column" }}>
      {/* Animated Energy Background - no image, just gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#0a0a0f",
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
              radial-gradient(ellipse at 50% 0%, rgba(20,184,166,0.4) 0%, transparent 50%),
              radial-gradient(ellipse at 0% 50%, rgba(168,85,247,0.3) 0%, transparent 40%),
              radial-gradient(ellipse at 100% 50%, rgba(59,130,246,0.3) 0%, transparent 40%),
              radial-gradient(ellipse at 50% 100%, rgba(236,72,153,0.3) 0%, transparent 50%),
              linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3))
            `,
          }}
        />
      </div>

      {/* Floating Previous Practice Elements + Vision Images - FULLSCREEN */}
      {!isPaused && floatingElements.map((el) => {
        const isVisionImage = el.id.startsWith("vision-");
        return (
          <div
            key={el.id}
            style={{
              position: "absolute",
              left: `${el.left}%`,
              bottom: "-200px",
              maxWidth: el.type === "image" ? (isVisionImage ? "240px" : "160px") : el.type === "word" ? "auto" : "280px",
              padding: el.type === "image" ? "0" : el.type === "word" ? "10px 20px" : "14px 18px",
              background: el.type === "image" ? "transparent" : el.type === "word" 
                ? "rgba(255,255,255,0.18)" 
                : "rgba(255,255,255,0.12)",
              backdropFilter: el.type === "image" ? "none" : "blur(16px)",
              borderRadius: el.type === "image" ? "20px" : el.type === "word" ? "24px" : "16px",
              border: el.type === "image" ? "none" : "1px solid rgba(255,255,255,0.25)",
              color: "white",
              fontSize: el.type === "word" ? "22px" : "14px",
              fontWeight: el.type === "word" ? "600" : "400",
              animation: `floatUpFullscreen${el.animationStyle} ${el.duration}s ease-in-out infinite`,
              animationDelay: `${el.delay}s`,
              boxShadow: isVisionImage 
                ? "0 12px 50px rgba(20,184,166,0.5), 0 0 80px rgba(168,85,247,0.4)"
                : el.type === "word" 
                  ? "0 6px 30px rgba(20,184,166,0.4)" 
                  : el.type === "image" ? "0 12px 40px rgba(0,0,0,0.5)" : "0 10px 40px rgba(0,0,0,0.4)",
              zIndex: isVisionImage ? 4 : el.type === "word" ? 6 : 5,
              overflow: "hidden",
              transform: `scale(${el.scale}) rotate(${el.rotation}deg)`,
              textShadow: el.type === "word" ? "0 0 30px rgba(255,255,255,0.6)" : "none",
            }}
          >
            {el.type === "image" && el.imageUrl && (
              <img 
                src={el.imageUrl} 
                alt={isVisionImage ? "Vision" : "Proof"}
                style={{ 
                  width: isVisionImage ? "220px" : "140px", 
                  height: isVisionImage ? "220px" : "140px", 
                  objectFit: "cover", 
                  borderRadius: isVisionImage ? "18px" : "14px",
                  border: isVisionImage ? "4px solid rgba(20,184,166,0.6)" : "3px solid rgba(255,255,255,0.4)",
                  boxShadow: isVisionImage 
                    ? "0 0 40px rgba(20,184,166,0.6), inset 0 0 30px rgba(255,255,255,0.15)"
                    : "0 12px 40px rgba(0,0,0,0.5)",
                }} 
              />
            )}
            {el.type === "word" && el.content}
            {el.type !== "image" && el.type !== "word" && (
              <>
                <div style={{ 
                  fontSize: "10px", 
                  textTransform: "uppercase", 
                  letterSpacing: "1.5px",
                  opacity: 0.7,
                  marginBottom: "4px",
                }}>
                  {el.type === "action" ? "✨ Action" : el.type === "proof" ? "🎯 Proof" : "💭 Note"}
                </div>
                <div style={{ lineHeight: 1.5, fontSize: "14px" }}>{el.content}</div>
                {el.imageUrl && (
                  <img 
                    src={el.imageUrl} 
                    alt="Proof" 
                    style={{ 
                      width: "100%", 
                      height: "80px", 
                      objectFit: "cover", 
                      borderRadius: "10px",
                      marginTop: "8px",
                    }} 
                  />
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Energy particles */}
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

      {/* Close and Settings buttons */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 10,
          display: "flex",
          gap: 12,
        }}
      >
        <button
          onClick={() => {/* TODO: Add settings modal */}}
          style={{
            width: 44,
            height: 44,
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
          title="Edit visualization settings"
        >
          <Settings style={{ width: 18, height: 18 }} />
        </button>
        <button
          onClick={onClose}
          style={{
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
      </div>

      {/* Vision images count indicator */}
      {visionImages.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 8,
            alignItems: "center",
            zIndex: 10,
            padding: "8px 16px",
            borderRadius: 9999,
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.8)",
            fontSize: 12,
          }}
        >
          {visionImages.length} vision{visionImages.length > 1 ? "s" : ""} floating
        </div>
      )}

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
        @keyframes floatUpFullscreen0 {
          0% { opacity: 0; transform: translateY(0) scale(0.8) rotate(-5deg); }
          10% { opacity: 1; transform: translateY(-15vh) scale(1) rotate(0deg); }
          50% { opacity: 0.95; transform: translateY(-50vh) scale(1.05) rotate(2deg); }
          90% { opacity: 0.8; transform: translateY(-90vh) scale(1) rotate(-2deg); }
          100% { opacity: 0; transform: translateY(-105vh) scale(0.9) rotate(5deg); }
        }
        @keyframes floatUpFullscreen1 {
          0% { opacity: 0; transform: translateY(0) translateX(0) scale(0.7); }
          12% { opacity: 1; transform: translateY(-12vh) translateX(30px) scale(1); }
          55% { opacity: 0.9; transform: translateY(-55vh) translateX(-25px) scale(1.03); }
          88% { opacity: 0.75; transform: translateY(-92vh) translateX(15px) scale(0.98); }
          100% { opacity: 0; transform: translateY(-108vh) translateX(10px) scale(0.85); }
        }
        @keyframes floatUpFullscreen2 {
          0% { opacity: 0; transform: translateY(0) rotate(8deg) scale(0.85); }
          8% { opacity: 1; transform: translateY(-10vh) rotate(0deg) scale(1); }
          48% { opacity: 0.92; transform: translateY(-48vh) rotate(-3deg) scale(1.06); }
          85% { opacity: 0.7; transform: translateY(-88vh) rotate(2deg) scale(1); }
          100% { opacity: 0; transform: translateY(-102vh) rotate(-5deg) scale(0.9); }
        }
        @keyframes floatUpFullscreen3 {
          0% { opacity: 0; transform: translateY(0) translateX(-25px) scale(0.8); }
          15% { opacity: 1; transform: translateY(-18vh) translateX(35px) scale(1.02); }
          52% { opacity: 0.88; transform: translateY(-52vh) translateX(-20px) scale(1.05); }
          87% { opacity: 0.65; transform: translateY(-90vh) translateX(10px) scale(0.95); }
          100% { opacity: 0; transform: translateY(-110vh) translateX(0) scale(0.85); }
        }
      `}</style>
    </div>
  );

  return createPortal(content, document.body);
}
