import { useRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { useMotion } from "@/contexts/MotionContext";
import { FogLayer } from "./FogLayer";
import { BoyFigure } from "./BoyFigure";
import { LifeProofPopover } from "./LifeProofPopover";
import { FOG_MESSAGES, getFogAriaLabel } from "@/lib/clarityMicrocopy";
import type { FogBucket, LifeProof } from "./types";

interface WindowVignetteProps {
  fogValue: number;
  fogBucket: FogBucket;
  proofs: LifeProof[];
  proofsLoading?: boolean;
  className?: string;
}

export function WindowVignette({ 
  fogValue, 
  fogBucket, 
  proofs, 
  proofsLoading,
  className 
}: WindowVignetteProps) {
  const { motionEnabled } = useMotion();
  const windowRef = useRef<HTMLDivElement>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setPopoverOpen(true);
    }
  }, []);
  
  return (
    <div 
      className={cn(
        "relative w-full max-w-2xl aspect-[4/3] mx-auto",
        className
      )}
    >
      {/* Main scene container */}
      <div className="absolute inset-0 flex items-end">
        
        {/* Boy figure on the left */}
        <div className="relative z-10 w-1/4 h-3/4 mb-4 ml-4">
          <BoyFigure />
        </div>
        
        {/* Window area */}
        <div className="relative flex-1 h-full flex items-center justify-center p-4">
          <LifeProofPopover
            open={popoverOpen}
            onOpenChange={setPopoverOpen}
            proofs={proofs}
            loading={proofsLoading}
          >
            <div
              ref={windowRef}
              role="button"
              tabIndex={0}
              aria-label={getFogAriaLabel(fogBucket, proofs.length)}
              onClick={() => setPopoverOpen(true)}
              onKeyDown={handleKeyDown}
              className={cn(
                "relative w-full h-full max-w-md",
                "rounded-lg overflow-hidden",
                "cursor-pointer",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                "border-4 border-muted-foreground/20",
                "shadow-lg",
                motionEnabled && "transition-shadow duration-300 hover:shadow-xl"
              )}
            >
              {/* Window frame */}
              <div className="absolute inset-0 pointer-events-none z-20">
                {/* Horizontal divider */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted-foreground/30 -translate-y-1/2" />
                {/* Vertical divider */}
                <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-muted-foreground/30 -translate-x-1/2" />
              </div>
              
              {/* Outside scene (gradient background) */}
              <div 
                className={cn(
                  "absolute inset-0",
                  "bg-gradient-to-b from-sky-200/50 via-sky-300/40 to-amber-100/30",
                  "dark:from-slate-700/50 dark:via-slate-600/40 dark:to-slate-800/30"
                )}
              >
                {/* Simple outdoor elements */}
                <svg 
                  viewBox="0 0 200 150" 
                  className="absolute inset-0 w-full h-full opacity-30"
                  aria-hidden="true"
                >
                  {/* Sun/moon */}
                  <circle 
                    cx="150" 
                    cy="40" 
                    r="20" 
                    className="fill-amber-300 dark:fill-slate-400"
                  />
                  {/* Hills/horizon */}
                  <path 
                    d="M0 120 Q50 90 100 110 T200 100 L200 150 L0 150 Z" 
                    className="fill-green-600/30 dark:fill-slate-600/30"
                  />
                  {/* Tree silhouette */}
                  <path 
                    d="M30 150 L30 100 L20 100 L35 70 L25 75 L40 50 L55 75 L45 70 L50 100 L40 100 L40 150 Z" 
                    className="fill-green-800/40 dark:fill-slate-700/40"
                  />
                </svg>
              </div>
              
              {/* Fog overlay */}
              <FogLayer 
                fogValue={fogValue} 
                fogBucket={fogBucket}
                className="z-10"
              />
              
              {/* Subtle reflection effect */}
              <div 
                className={cn(
                  "absolute inset-0 z-15",
                  "bg-gradient-to-br from-white/5 via-transparent to-transparent",
                  "pointer-events-none"
                )}
              />
            </div>
          </LifeProofPopover>
        </div>
      </div>
      
      {/* Fog message - below the window */}
      <div className="absolute bottom-0 left-0 right-0 text-center pb-2">
        <p 
          className={cn(
            "text-sm text-muted-foreground italic",
            motionEnabled && "transition-opacity duration-500"
          )}
        >
          {FOG_MESSAGES[fogBucket]}
        </p>
      </div>
    </div>
  );
}
