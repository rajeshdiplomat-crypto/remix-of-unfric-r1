import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Pause, Play, SkipForward, Zap, Settings, Check, Volume2, VolumeX } from "lucide-react";
import { type ManifestGoal, type ManifestDailyPractice } from "./types";
import { useUserPreferences } from "@/hooks/useUserSettings";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ManifestVisualizationModeProps {
  goal: ManifestGoal;
  duration: 3 | 5 | 10;
  previousPractice?: ManifestDailyPractice | null;
  onComplete: () => void;
  onClose: () => void;
}

interface FloatingElement {
  id: string;
  type: "action" | "proof" | "note" | "image";
  content: string;
  imageUrl?: string;
  horizontalPosition: number; // percentage from left (10-80)
}

interface VisualizationSettings {
  showActions: boolean;
  showProofs: boolean;
  showNotes: boolean;
  showImages: boolean;
  soundType: string;
}

const SOUND_OPTIONS = [
  { id: "ocean", label: "Ocean Waves", emoji: "🌊" },
  { id: "rain", label: "Gentle Rain", emoji: "🌧️" },
  { id: "forest", label: "Forest Calm", emoji: "🌲" },
  { id: "wind", label: "Soft Wind", emoji: "💨" },
  { id: "crystal", label: "Crystal Tones", emoji: "🔮" },
];

export function ManifestVisualizationMode({
  goal,
  duration,
  previousPractice,
  onComplete,
  onClose,
}: ManifestVisualizationModeProps) {
  const totalSeconds = duration * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const { prefs, updatePrefs } = useUserPreferences();
  const { user } = useAuth();
  const [settings, setSettings] = useState<VisualizationSettings>(() => {
    if (prefs.manifest_viz_settings) {
      return prefs.manifest_viz_settings as unknown as VisualizationSettings;
    }
    return { showActions: true, showProofs: true, showNotes: true, showImages: true, soundType: "ocean" };
  });
  const [activeElements, setActiveElements] = useState<FloatingElement[]>([]);
  const [elementIndex, setElementIndex] = useState(0);

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainsRef = useRef<GainNode[]>([]);

  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  // Save settings to DB when they change
  useEffect(() => {
    updatePrefs({ manifest_viz_settings: settings as any });
  }, [settings]);

  // Get all vision images
  const visionImages = useMemo(() => {
    const images: string[] = [];
    if (goal.vision_image_url) images.push(goal.vision_image_url);

    let parsedVisionImages: string[] = [];
    if (Array.isArray(goal.vision_images)) {
      parsedVisionImages = goal.vision_images;
    } else if (typeof goal.vision_images === 'string') {
      try {
        const parsed = JSON.parse(goal.vision_images);
        parsedVisionImages = Array.isArray(parsed) ? parsed : [];
      } catch {
        parsedVisionImages = [];
      }
    }

    if (parsedVisionImages.length > 0) {
      images.push(...parsedVisionImages.filter((img) => img && !images.includes(img)));
    }
    if (goal.cover_image_url && !images.includes(goal.cover_image_url)) {
      images.push(goal.cover_image_url);
    }
    return images;
  }, [goal]);

  // Helper to get random position avoiding center (35-65%)
  const getRandomSafePosition = () => {
    // 50% chance for left side (5-30%), 50% for right side (70-95%)
    const isLeft = Math.random() > 0.5;
    if (isLeft) {
      return 5 + Math.random() * 25; // 5% to 30%
    } else {
      return 70 + Math.random() * 25; // 70% to 95%
    }
  };

  // Load today's practice from DB
  const [todaysPractice, setTodaysPractice] = useState<Partial<ManifestDailyPractice> | null>(null);
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    supabase.functions.invoke("manage-manifest", {
      body: {
        action: "fetch_practice",
        goalId: goal.id,
        dateStr: today,
      }
    }).then(({ data: res }) => {
      const data = res?.data;
      if (data) {
        setTodaysPractice({
          acts: (data as any).acts || [],
          proofs: (data as any).proofs || [],
          growth_note: (data as any).growth_note,
          gratitudes: (data as any).gratitudes || [],
        });
      }
    });
  }, [user, goal.id]);

  // Create all floating elements - includes today's answers AND previous practice
  const allElements = useMemo(() => {
    const elements: FloatingElement[] = [];

    // Add vision images
    if (settings.showImages) {
      visionImages.forEach((img, idx) => {
        elements.push({
          id: `vision-${idx}`,
          type: "image",
          content: "",
          imageUrl: img,
          horizontalPosition: getRandomSafePosition(),
        });
      });
    }

    // Combine today's practice with previous practice
    const todayActs = Array.isArray(todaysPractice?.acts) ? todaysPractice!.acts : [];
    const prevActs = Array.isArray(previousPractice?.acts) ? previousPractice!.acts : [];
    const todayProofs = Array.isArray(todaysPractice?.proofs) ? todaysPractice!.proofs : [];
    const prevProofs = Array.isArray(previousPractice?.proofs) ? previousPractice!.proofs : [];

    const combinedPractice = {
      acts: [...todayActs, ...prevActs],
      proofs: [...todayProofs, ...prevProofs],
      growth_note: todaysPractice?.growth_note || previousPractice?.growth_note,
      gratitudes: [...(todaysPractice?.gratitudes || []), ...(previousPractice?.gratitudes || [])],
    };

    // Add actions
    if (settings.showActions && combinedPractice.acts.length > 0) {
      combinedPractice.acts.forEach((act: any) => {
        if (act && act.text) {
          elements.push({
            id: `act-${act.id || crypto.randomUUID()}`,
            type: "action",
            content: act.text,
            horizontalPosition: getRandomSafePosition(),
          });
        }
      });
    }

    // Add proofs (with images if they have them)
    if (settings.showProofs && combinedPractice.proofs.length > 0) {
      combinedPractice.proofs.forEach((proof: any) => {
        if (proof) {
          elements.push({
            id: `proof-${proof.id || crypto.randomUUID()}`,
            type: "proof",
            content: proof.text || "",
            imageUrl: proof.image_url,
            horizontalPosition: getRandomSafePosition(),
          });
        }
      });
    }

    // Add growth note / gratitude
    if (settings.showNotes) {
      if (combinedPractice.growth_note) {
        elements.push({
          id: "growth-note",
          type: "note",
          content: combinedPractice.growth_note,
          horizontalPosition: getRandomSafePosition(),
        });
      }
      if (combinedPractice.gratitudes && combinedPractice.gratitudes.length > 0) {
        combinedPractice.gratitudes.forEach((gratitude: any) => {
          if (gratitude && gratitude.text && gratitude.text !== combinedPractice.growth_note) {
            elements.push({
              id: `gratitude-${gratitude.id || crypto.randomUUID()}`,
              type: "note",
              content: gratitude.text,
              horizontalPosition: getRandomSafePosition(),
            });
          }
        });
      }
    }

    // Shuffle elements for variety
    for (let i = elements.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [elements[i], elements[j]] = [elements[j], elements[i]];
    }

    return elements;
  }, [previousPractice, todaysPractice, visionImages, settings, goal.id]);

  // Spawn new floating elements one by one
  useEffect(() => {
    if (isPaused || allElements.length === 0) return;

    // Add initial element
    if (activeElements.length === 0 && allElements.length > 0) {
      setActiveElements([{ ...allElements[0], id: `${allElements[0].id}-${Date.now()}` }]);
      setElementIndex(1);
    }

    // Add new element every 3 seconds
    const interval = setInterval(() => {
      if (allElements.length === 0) return;
      const nextIdx = elementIndex % allElements.length;
      const newElement = {
        ...allElements[nextIdx],
        id: `${allElements[nextIdx].id}-${Date.now()}`,
        horizontalPosition: getRandomSafePosition(),
      };

      setActiveElements((prev) => {
        // Keep max 4 elements at a time, remove oldest
        const updated = [...prev, newElement];
        if (updated.length > 4) {
          return updated.slice(-4);
        }
        return updated;
      });
      setElementIndex((prev) => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused, allElements, elementIndex, activeElements.length]);

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
      stopAudio();
    };
  }, []);

  // Audio functions for ambient sounds
  const createAmbientSound = useCallback((soundType: string) => {
    if (audioContextRef.current) {
      stopAudio();
    }

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const masterGain = audioContext.createGain();
      masterGain.gain.value = 0.3;
      masterGain.connect(audioContext.destination);

      switch (soundType) {
        case "ocean": {
          // Low rumbling noise for ocean
          const bufferSize = 2 * audioContext.sampleRate;
          const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }
          const noise = audioContext.createBufferSource();
          noise.buffer = noiseBuffer;
          noise.loop = true;

          const filter = audioContext.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.value = 200;

          const lfo = audioContext.createOscillator();
          lfo.frequency.value = 0.1;
          const lfoGain = audioContext.createGain();
          lfoGain.gain.value = 100;
          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);

          noise.connect(filter);
          filter.connect(masterGain);
          noise.start();
          lfo.start();
          oscillatorsRef.current = [lfo as any];
          break;
        }
        case "rain": {
          // Higher frequency noise for rain
          const bufferSize = 2 * audioContext.sampleRate;
          const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }
          const noise = audioContext.createBufferSource();
          noise.buffer = noiseBuffer;
          noise.loop = true;

          const filter = audioContext.createBiquadFilter();
          filter.type = "highpass";
          filter.frequency.value = 1000;

          const gain = audioContext.createGain();
          gain.gain.value = 0.5;

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(masterGain);
          noise.start();
          gainsRef.current = [gain];
          break;
        }
        case "forest": {
          // Soft sine waves at various frequencies
          [220, 330, 440].forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            osc.type = "sine";
            osc.frequency.value = freq;

            const gain = audioContext.createGain();
            gain.gain.value = 0.05;

            // Slow modulation
            const lfo = audioContext.createOscillator();
            lfo.frequency.value = 0.2 + i * 0.1;
            const lfoGain = audioContext.createGain();
            lfoGain.gain.value = 0.03;
            lfo.connect(lfoGain);
            lfoGain.connect(gain.gain);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start();
            lfo.start();
            oscillatorsRef.current.push(osc, lfo);
            gainsRef.current.push(gain);
          });
          break;
        }
        case "wind": {
          // Very low frequency modulated noise
          const bufferSize = 2 * audioContext.sampleRate;
          const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }
          const noise = audioContext.createBufferSource();
          noise.buffer = noiseBuffer;
          noise.loop = true;

          const filter = audioContext.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.value = 300;
          filter.Q.value = 0.5;

          const lfo = audioContext.createOscillator();
          lfo.frequency.value = 0.05;
          const lfoGain = audioContext.createGain();
          lfoGain.gain.value = 200;
          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);

          noise.connect(filter);
          filter.connect(masterGain);
          noise.start();
          lfo.start();
          oscillatorsRef.current = [lfo as any];
          break;
        }
        case "crystal": {
          // Pure harmonic tones
          [261.63, 329.63, 392, 523.25].forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            osc.type = "sine";
            osc.frequency.value = freq;

            const gain = audioContext.createGain();
            gain.gain.value = 0.08;

            // Slow fade in/out
            const lfo = audioContext.createOscillator();
            lfo.frequency.value = 0.1 + i * 0.02;
            const lfoGain = audioContext.createGain();
            lfoGain.gain.value = 0.05;
            lfo.connect(lfoGain);
            lfoGain.connect(gain.gain);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start();
            lfo.start();
            oscillatorsRef.current.push(osc, lfo);
            gainsRef.current.push(gain);
          });
          break;
        }
      }

      gainsRef.current.push(masterGain);
    } catch (e) {
      console.warn("Failed to create audio:", e);
    }
  }, []);

  const stopAudio = useCallback(() => {
    oscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop();
      } catch { }
    });
    oscillatorsRef.current = [];
    gainsRef.current = [];
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch { }
      audioContextRef.current = null;
    }
  }, []);

  // Start/stop audio based on pause and mute state
  useEffect(() => {
    if (!isPaused && !isMuted) {
      createAmbientSound(settings.soundType);
    } else {
      stopAudio();
    }
    return () => stopAudio();
  }, [isPaused, isMuted, settings.soundType, createAmbientSound, stopAudio]);

  const handleSoundChange = (soundType: string) => {
    setSettings((prev) => ({ ...prev, soundType }));
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

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
          backgroundColor: "#0a0a0f",
          transform: `scale(${pulseIntensity})`,
          transition: "transform 2s ease-in-out",
        }}
      >
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

      {/* Floating Elements - one by one from bottom */}
      {activeElements.map((el) => {
        const isVisionImage = el.id.startsWith("vision-");
        const isProofWithImage = el.type === "proof" && el.imageUrl;

        return (
          <div
            key={el.id}
            style={{
              position: "absolute",
              left: `${el.horizontalPosition}%`,
              bottom: "-200px",
              maxWidth: el.type === "image" ? (isVisionImage ? "280px" : "220px") : "360px",
              padding: el.type === "image" ? "0" : "20px 28px",
              background: el.type === "image" ? "transparent" : "rgba(255,255,255,0.12)",
              backdropFilter: el.type === "image" ? "none" : "blur(16px)",
              borderRadius: el.type === "image" ? "24px" : "20px",
              border: el.type === "image" ? "none" : "1px solid rgba(255,255,255,0.25)",
              color: "white",
              fontSize: "18px",
              animation: `floatUpSmooth 12s ease-in-out forwards`,
              animationPlayState: isPaused ? "paused" : "running",
              boxShadow: isVisionImage
                ? "0 16px 60px rgba(20,184,166,0.5), 0 0 100px rgba(168,85,247,0.4)"
                : "0 12px 50px rgba(0,0,0,0.4)",
              zIndex: isVisionImage ? 4 : 5,
              overflow: "hidden",
            }}
          >
            {el.type === "image" && el.imageUrl && (
              <img
                src={el.imageUrl}
                alt={isVisionImage ? "Vision" : "Proof"}
                style={{
                  width: isVisionImage ? "280px" : "200px",
                  height: isVisionImage ? "280px" : "200px",
                  objectFit: "cover",
                  borderRadius: isVisionImage ? "22px" : "18px",
                  border: isVisionImage ? "4px solid rgba(20,184,166,0.6)" : "3px solid rgba(255,255,255,0.4)",
                  boxShadow: isVisionImage
                    ? "0 0 50px rgba(20,184,166,0.6), inset 0 0 40px rgba(255,255,255,0.15)"
                    : "0 16px 50px rgba(0,0,0,0.5)",
                }}
              />
            )}
            {el.type !== "image" && (
              <>
                <div
                  style={{
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    opacity: 0.7,
                    marginBottom: "10px",
                    fontWeight: 600,
                  }}
                >
                  {el.type === "action" ? "✨ Action" : el.type === "proof" ? "🎯 Proof" : "💭 Note"}
                </div>
                <div style={{ lineHeight: 1.7, fontSize: "18px", fontWeight: 500 }}>{el.content}</div>
                {isProofWithImage && (
                  <img
                    src={el.imageUrl}
                    alt="Proof"
                    style={{
                      width: "100%",
                      height: "140px",
                      objectFit: "cover",
                      borderRadius: "14px",
                      marginTop: "14px",
                      border: "2px solid rgba(255,255,255,0.3)",
                    }}
                  />
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Energy particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 4 + (i % 3) * 4,
            height: 4 + (i % 3) * 4,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${i % 4 === 0
                ? "rgba(20,184,166,0.9)"
                : i % 4 === 1
                  ? "rgba(168,85,247,0.9)"
                  : i % 4 === 2
                    ? "rgba(59,130,246,0.9)"
                    : "rgba(236,72,153,0.9)"
              }, transparent)`,
            left: `${5 + i * 4.5}%`,
            bottom: "-20px",
            animation: `energyFloat ${6 + (i % 5)}s ease-in-out infinite`,
            animationDelay: `${i * -0.3}s`,
            animationPlayState: isPaused ? "paused" : "running",
            boxShadow: `0 0 ${10 + (i % 3) * 5}px ${i % 4 === 0
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
          animationPlayState: isPaused ? "paused" : "running",
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
          animationPlayState: isPaused ? "paused" : "running",
        }}
      />

      {/* Settings Modal */}
      {showSettings && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setShowSettings(false)}
        >
          <div
            style={{
              background: "rgba(30,30,40,0.95)",
              borderRadius: 24,
              padding: 28,
              minWidth: 320,
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: "white", fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Visualization Settings</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { key: "showActions", label: "Show Actions", icon: "✨" },
                { key: "showProofs", label: "Show Proofs", icon: "🎯" },
                { key: "showNotes", label: "Show Notes", icon: "💭" },
                { key: "showImages", label: "Show Vision Images", icon: "🖼️" },
              ].map(({ key, label, icon }) => {
                const isChecked = settings[key as keyof Omit<VisualizationSettings, "soundType">] === true;
                return (
                  <label
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      cursor: "pointer",
                      padding: "12px 16px",
                      borderRadius: 14,
                      background: isChecked ? "rgba(20,184,166,0.2)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${isChecked ? "rgba(20,184,166,0.4)" : "rgba(255,255,255,0.1)"}`,
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 8,
                        background: isChecked ? "linear-gradient(135deg, #14b8a6, #06b6d4)" : "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isChecked && <Check style={{ width: 14, height: 14, color: "white" }} />}
                    </div>
                    <span style={{ color: "white", fontSize: 15 }}>
                      {icon} {label}
                    </span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.checked }))}
                      style={{ display: "none" }}
                    />
                  </label>
                );
              })}
            </div>

            {/* Sound Selection */}
            <div style={{ marginTop: 24, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20 }}>
              <h4 style={{ color: "white", fontSize: 16, fontWeight: 500, marginBottom: 12 }}>🎵 Ambient Sound</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {SOUND_OPTIONS.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => handleSoundChange(sound.id)}
                    style={{
                      padding: "14px",
                      borderRadius: 14,
                      background: settings.soundType === sound.id ? "rgba(20,184,166,0.25)" : "rgba(255,255,255,0.05)",
                      border:
                        settings.soundType === sound.id
                          ? "1px solid rgba(20,184,166,0.5)"
                          : "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                      cursor: "pointer",
                      fontSize: 14,
                      textAlign: "left",
                      transition: "all 0.2s",
                    }}
                  >
                    {sound.emoji} {sound.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              style={{
                marginTop: 24,
                width: "100%",
                padding: "14px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #14b8a6, #06b6d4)",
                border: "none",
                color: "white",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

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
        {/* Mute button */}
        <button
          onClick={toggleMute}
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: isMuted ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)",
            backdropFilter: "blur(12px)",
            border: `1px solid ${isMuted ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.2)"}`,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.3s",
          }}
          title={isMuted ? "Unmute sounds" : "Mute sounds"}
        >
          {isMuted ? <VolumeX style={{ width: 18, height: 18 }} /> : <Volume2 style={{ width: 18, height: 18 }} />}
        </button>
        <button
          onClick={() => setShowSettings(true)}
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

      {/* Element count indicator */}
      {allElements.length > 0 && (
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
          {Math.min(elementIndex, allElements.length)} / {allElements.length} visions
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

        {/* Timer Circle */}
        <div
          style={{
            position: "relative",
            width: size,
            height: size,
            marginBottom: 40,
          }}
        >
          {/* Glow background */}
          <div
            style={{
              position: "absolute",
              inset: -20,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(20,184,166,0.2), transparent 70%)",
              animation: isPaused ? "none" : "energyPulse 2s ease-in-out infinite",
            }}
          />
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={strokeWidth}
            />
            {/* Progress circle with gradient */}
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                transition: "stroke-dashoffset 1s linear",
                filter: "drop-shadow(0 0 10px rgba(168,85,247,0.5))",
              }}
            />
          </svg>
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
                fontSize: 48,
                fontWeight: "200",
                color: "white",
                letterSpacing: 4,
                fontFamily: "system-ui",
              }}
            >
              {formatTime(secondsLeft)}
            </span>
            <span
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
                letterSpacing: 4,
                marginTop: 4,
              }}
            >
              Remaining
            </span>
          </div>
        </div>

        {/* Affirmation */}
        <div
          style={{
            textAlign: "center",
            maxWidth: 600,
            padding: "0 32px",
          }}
        >
          <p
            style={{
              fontSize: 24,
              fontWeight: "300",
              color: "white",
              lineHeight: 1.6,
              fontStyle: "italic",
              textShadow: "0 0 40px rgba(20,184,166,0.4)",
            }}
          >
            "{affirmation}"
          </p>
        </div>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 48,
          }}
        >
          <button
            onClick={() => setIsPaused(!isPaused)}
            style={{
              height: 56,
              padding: "0 36px",
              borderRadius: 9999,
              background: isPaused ? "linear-gradient(135deg, #14b8a6, #06b6d4)" : "rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              border: isPaused ? "none" : "1px solid rgba(255,255,255,0.2)",
              color: "white",
              fontSize: 15,
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              transition: "all 0.3s",
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

      {/* Progress bar */}
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
        @keyframes energyPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        @keyframes sideGlow {
          0%, 100% { opacity: 0.3; height: 30%; }
          50% { opacity: 1; height: 60%; }
        }
        @keyframes floatUpSmooth {
          0% { 
            opacity: 0; 
            transform: translateY(0) scale(0.9); 
          }
          8% { 
            opacity: 1; 
            transform: translateY(-15vh) scale(1); 
          }
          85% { 
            opacity: 1; 
            transform: translateY(-85vh) scale(1); 
          }
          100% { 
            opacity: 0; 
            transform: translateY(-100vh) scale(0.95); 
          }
        }
      `}</style>
    </div>
  );

  return createPortal(content, document.body);
}
