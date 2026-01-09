import { cn } from "@/lib/utils";
import { useMotion } from "@/contexts/MotionContext";

interface BoyFigureProps {
  className?: string;
}

export function BoyFigure({ className }: BoyFigureProps) {
  const { motionEnabled } = useMotion();
  
  return (
    <svg
      viewBox="0 0 120 200"
      className={cn("w-full h-full", className)}
      aria-hidden="true"
    >
      {/* Chair */}
      <g className="fill-muted-foreground/20 stroke-muted-foreground/40">
        {/* Chair back */}
        <rect x="25" y="80" width="8" height="80" rx="2" strokeWidth="1" />
        {/* Chair seat */}
        <rect x="25" y="140" width="60" height="8" rx="2" strokeWidth="1" />
        {/* Chair legs */}
        <rect x="28" y="148" width="6" height="40" rx="1" strokeWidth="1" />
        <rect x="76" y="148" width="6" height="40" rx="1" strokeWidth="1" />
      </g>
      
      {/* Person silhouette */}
      <g 
        className={cn(
          "fill-foreground/70",
          motionEnabled && "animate-pulse"
        )}
        style={motionEnabled ? { 
          animationDuration: '4s',
          animationTimingFunction: 'ease-in-out'
        } : undefined}
      >
        {/* Head */}
        <circle cx="60" cy="55" r="18" />
        
        {/* Neck */}
        <rect x="54" y="70" width="12" height="10" />
        
        {/* Torso */}
        <path 
          d="M40 80 L80 80 L85 140 L35 140 Z" 
          className="fill-foreground/60"
        />
        
        {/* Arms */}
        <path 
          d="M40 85 L25 110 L28 115 L45 95" 
          className="fill-foreground/50"
        />
        <path 
          d="M80 85 L95 110 L92 115 L75 95" 
          className="fill-foreground/50"
        />
        
        {/* Legs */}
        <path 
          d="M42 140 L40 185 L48 185 L52 140" 
          className="fill-foreground/50"
        />
        <path 
          d="M68 140 L72 185 L80 185 L78 140" 
          className="fill-foreground/50"
        />
      </g>
      
      {/* Hair detail */}
      <path 
        d="M45 48 Q60 35 75 48" 
        className="fill-foreground/80"
      />
    </svg>
  );
}
