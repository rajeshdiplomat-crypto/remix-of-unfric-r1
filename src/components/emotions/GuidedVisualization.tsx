import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Strategy } from "./types";
import { Play, Pause, SkipForward, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuidedVisualizationProps {
  strategy: Strategy;
  onComplete: () => void;
  onSkip: () => void;
}

// Duration options in seconds
const DURATION_OPTIONS = [
  { label: '2 min', value: 120 },
  { label: '3 min', value: 180 },
  { label: '5 min', value: 300 },
];

// Ambient sounds (using Web Audio API for simple tones)
const SOUND_TYPES = {
  breathing: { frequency: 200, type: 'sine' as OscillatorType, volume: 0.1 },
  grounding: { frequency: 150, type: 'sine' as OscillatorType, volume: 0.08 },
  mindfulness: { frequency: 180, type: 'sine' as OscillatorType, volume: 0.12 },
  cognitive: { frequency: 220, type: 'sine' as OscillatorType, volume: 0.05 },
  movement: { frequency: 250, type: 'sine' as OscillatorType, volume: 0.08 },
};

// Visualization prompts for each phase
const VISUALIZATION_PROMPTS: Record<string, string[]> = {
  'box-breathing': [
    'Find a comfortable position and close your eyes...',
    'Breathe in slowly through your nose... 1... 2... 3... 4...',
    'Hold your breath gently... 1... 2... 3... 4...',
    'Exhale slowly through your mouth... 1... 2... 3... 4...',
    'Hold again... 1... 2... 3... 4...',
    'Continue this rhythm... let your body relax...',
    'With each breath, tension melts away...',
    'You are calm, centered, and present...'
  ],
  '5-4-3-2-1': [
    'Look around you gently...',
    'Notice 5 things you can see...',
    'Feel 4 things you can touch...',
    'Listen for 3 sounds around you...',
    'Notice 2 things you can smell...',
    'Become aware of 1 taste in your mouth...',
    'You are grounded and present...',
    'Feel the stability of this moment...'
  ],
  'body-scan': [
    'Close your eyes and take a deep breath...',
    'Focus on the top of your head...',
    'Move your attention to your face and neck...',
    'Notice your shoulders... let them drop...',
    'Feel your arms and hands...',
    'Bring awareness to your chest and stomach...',
    'Move down to your legs and feet...',
    'Your whole body is relaxed and present...'
  ],
  'default': [
    'Take a moment to settle into this practice...',
    'Let your breath flow naturally...',
    'Notice any thoughts without judgment...',
    'Gently return your focus to the present...',
    'You are safe in this moment...',
    'Feel the peace within you growing...',
    'Embrace this time for yourself...',
    'You are doing wonderfully...'
  ]
};

export function GuidedVisualization({ strategy, onComplete, onSkip }: GuidedVisualizationProps) {
  const [duration, setDuration] = useState(180);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isMuted, setIsMuted] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const prompts = VISUALIZATION_PROMPTS[strategy.id] || VISUALIZATION_PROMPTS['default'];
  const progress = ((duration - timeRemaining) / duration) * 100;
  const soundConfig = SOUND_TYPES[strategy.type] || SOUND_TYPES.mindfulness;

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Handle duration change
  useEffect(() => {
    if (!isPlaying) {
      setTimeRemaining(duration);
    }
  }, [duration, isPlaying]);

  // Timer and prompt cycling
  useEffect(() => {
    if (isPlaying && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            stopAudio();
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Cycle prompts
      const promptInterval = Math.floor(duration / prompts.length);
      const elapsed = duration - timeRemaining;
      const newIndex = Math.min(Math.floor(elapsed / promptInterval), prompts.length - 1);
      if (newIndex !== currentPromptIndex) {
        setCurrentPromptIndex(newIndex);
      }
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, timeRemaining, duration, prompts.length, currentPromptIndex, onComplete]);

  const startAudio = () => {
    if (isMuted) return;
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      oscillatorRef.current = audioContextRef.current.createOscillator();
      gainNodeRef.current = audioContextRef.current.createGain();

      oscillatorRef.current.type = soundConfig.type;
      oscillatorRef.current.frequency.setValueAtTime(soundConfig.frequency, audioContextRef.current.currentTime);
      
      gainNodeRef.current.gain.setValueAtTime(soundConfig.volume, audioContextRef.current.currentTime);
      
      oscillatorRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);
      
      oscillatorRef.current.start();
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  const stopAudio = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (e) {}
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
    }
    oscillatorRef.current = null;
    audioContextRef.current = null;
    gainNodeRef.current = null;
  };

  const handlePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopAudio();
    } else {
      setIsPlaying(true);
      if (timeRemaining === 0) {
        setTimeRemaining(duration);
        setCurrentPromptIndex(0);
      }
      startAudio();
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (!isMuted && isPlaying) {
      stopAudio();
    } else if (isMuted && isPlaying) {
      startAudio();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Animation classes based on strategy type
  const getAnimationClass = () => {
    if (!isPlaying) return '';
    switch (strategy.type) {
      case 'breathing':
        return 'animate-pulse';
      case 'grounding':
        return 'animate-bounce';
      default:
        return 'animate-pulse';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Visualization area */}
        <div 
          className={cn(
            "relative h-64 flex items-center justify-center transition-colors duration-1000",
            isPlaying ? "bg-gradient-to-b from-primary/10 to-primary/5" : "bg-muted/30"
          )}
        >
          {/* Animated circle */}
          <div 
            className={cn(
              "w-32 h-32 rounded-full transition-all duration-[4000ms] ease-in-out",
              isPlaying ? "scale-110 opacity-80" : "scale-100 opacity-40",
              getAnimationClass()
            )}
            style={{
              background: `radial-gradient(circle, ${QUADRANT_COLORS[strategy.type] || 'hsl(var(--primary))'} 0%, transparent 70%)`
            }}
          />
          
          {/* Current prompt */}
          <div className="absolute inset-x-4 bottom-8 text-center">
            <p className={cn(
              "text-lg font-medium transition-all duration-500",
              isPlaying ? "text-foreground opacity-100" : "text-muted-foreground opacity-60"
            )}>
              {isPlaying ? prompts[currentPromptIndex] : 'Press play to begin...'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 space-y-4 bg-card">
          {/* Progress bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatTime(duration - timeRemaining)}</span>
              <span>{formatTime(timeRemaining)}</span>
            </div>
          </div>

          {/* Duration selector */}
          {!isPlaying && timeRemaining === duration && (
            <div className="flex gap-2 justify-center">
              {DURATION_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={duration === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDuration(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          )}

          {/* Playback controls */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMuteToggle}
              className="text-muted-foreground"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            
            <Button
              size="lg"
              onClick={handlePlay}
              className="h-14 w-14 rounded-full"
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onSkip}
              className="text-muted-foreground"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const QUADRANT_COLORS: Record<string, string> = {
  breathing: 'hsl(200, 80%, 50%)',
  grounding: 'hsl(30, 70%, 50%)',
  cognitive: 'hsl(280, 60%, 55%)',
  movement: 'hsl(340, 70%, 55%)',
  mindfulness: 'hsl(160, 60%, 45%)'
};
