import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Wind, Play, Pause, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Phase = 'idle' | 'inhale' | 'hold1' | 'exhale' | 'hold2' | 'complete';

const PHASE_DURATION = 4000; // 4 seconds each
const TOTAL_CYCLES = 3;

const PHASE_LABELS: Record<Phase, string> = {
  idle: 'Ready to breathe',
  inhale: 'Breathe in...',
  hold1: 'Hold...',
  exhale: 'Breathe out...',
  hold2: 'Hold...',
  complete: 'Great job! 🌟',
};

export function BreathingWidget() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [isRunning, setIsRunning] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [progress, setProgress] = useState(0);

  const startExercise = useCallback(() => {
    setIsRunning(true);
    setPhase('inhale');
    setCycle(1);
    setProgress(0);
  }, []);

  const stopExercise = useCallback(() => {
    setIsRunning(false);
    setPhase('idle');
    setCycle(0);
    setProgress(0);
  }, []);

  useEffect(() => {
    if (!isRunning || phase === 'idle' || phase === 'complete') return;

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 2, 100));
    }, PHASE_DURATION / 50);

    const timer = setTimeout(() => {
      setProgress(0);
      
      if (phase === 'inhale') setPhase('hold1');
      else if (phase === 'hold1') setPhase('exhale');
      else if (phase === 'exhale') setPhase('hold2');
      else if (phase === 'hold2') {
        if (cycle >= TOTAL_CYCLES) {
          setPhase('complete');
          setIsRunning(false);
        } else {
          setCycle(prev => prev + 1);
          setPhase('inhale');
        }
      }
    }, PHASE_DURATION);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [phase, isRunning, cycle]);

  const getCircleScale = () => {
    if (phase === 'inhale') return 1.3;
    if (phase === 'hold1') return 1.3;
    if (phase === 'exhale') return 1;
    if (phase === 'hold2') return 1;
    return 1;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-gradient-to-br from-sky-50/80 to-cyan-50/80 dark:from-sky-950/30 dark:to-cyan-950/30 border border-sky-100/50 dark:border-sky-800/30"
    >
      <div className="flex items-center gap-2 mb-4">
        <motion.div
          className="p-1.5 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-500"
          animate={{ rotate: isRunning ? 360 : 0 }}
          transition={{ duration: 8, repeat: isRunning ? Infinity : 0, ease: "linear" }}
        >
          <Wind className="h-4 w-4 text-white" />
        </motion.div>
        <span className="font-medium text-sm">Box Breathing</span>
        {isRunning && (
          <span className="ml-auto text-xs text-muted-foreground">
            Cycle {cycle}/{TOTAL_CYCLES}
          </span>
        )}
      </div>

      {/* Breathing Circle */}
      <div className="flex justify-center py-6">
        <div className="relative w-32 h-32">
          {/* Outer ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-sky-100 dark:text-sky-900"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="58"
              stroke="url(#breathGradient)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDasharray: "364.4", strokeDashoffset: 364.4 }}
              animate={{ 
                strokeDashoffset: 364.4 - (progress / 100 * 364.4)
              }}
              transition={{ duration: 0.1 }}
            />
            <defs>
              <linearGradient id="breathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>

          {/* Inner breathing circle */}
          <motion.div
            className="absolute inset-4 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center"
            animate={{ scale: getCircleScale() }}
            transition={{ duration: PHASE_DURATION / 1000, ease: "easeInOut" }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={phase}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-white text-xs font-medium text-center px-2"
              >
                {phase === 'complete' ? '🌟' : PHASE_LABELS[phase].split('...')[0]}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Phase indicator */}
      <motion.p 
        key={phase}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-sm font-medium text-sky-700 dark:text-sky-300 mb-4"
      >
        {PHASE_LABELS[phase]}
      </motion.p>

      {/* Controls */}
      <div className="flex gap-2">
        {!isRunning && phase !== 'complete' && (
          <Button
            onClick={startExercise}
            className="flex-1 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600"
          >
            <Play className="h-4 w-4 mr-2" />
            Start
          </Button>
        )}
        
        {isRunning && (
          <Button
            onClick={stopExercise}
            variant="outline"
            className="flex-1"
          >
            <Pause className="h-4 w-4 mr-2" />
            Stop
          </Button>
        )}

        {phase === 'complete' && (
          <>
            <Button
              onClick={startExercise}
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Again
            </Button>
            <Button
              onClick={stopExercise}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
            >
              <Check className="h-4 w-4 mr-2" />
              Done
            </Button>
          </>
        )}
      </div>

      <p className="text-[10px] text-center text-muted-foreground mt-3">
        4 seconds each: inhale → hold → exhale → hold
      </p>
    </motion.div>
  );
}
