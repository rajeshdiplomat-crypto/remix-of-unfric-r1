import { cn } from "@/lib/utils";
import { useMotion } from "@/contexts/MotionContext";
import type { FogBucket } from "./types";

interface FogLayerProps {
  fogValue: number;
  fogBucket: FogBucket;
  className?: string;
}

export function FogLayer({ fogValue, fogBucket, className }: FogLayerProps) {
  const { motionEnabled } = useMotion();
  
  // Calculate blur and opacity based on fog value
  const blurAmount = fogValue * 15; // 0-15px blur
  const fogOpacity = fogValue * 0.85; // 0-85% opacity
  
  // Clear patch size (inverse of fog)
  const clearPatchRadius = (1 - fogValue) * 40; // 0-40% radius
  
  return (
    <svg
      viewBox="0 0 200 150"
      className={cn("absolute inset-0 w-full h-full", className)}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        {/* Gaussian blur filter for fog effect */}
        <filter id="fogBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur 
            in="SourceGraphic" 
            stdDeviation={blurAmount}
          />
        </filter>
        
        {/* Radial gradient for clear patches */}
        <radialGradient id="clearPatch" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset={`${clearPatchRadius}%`} stopColor="transparent" />
          <stop offset={`${clearPatchRadius + 20}%`} stopColor="white" stopOpacity="0.5" />
          <stop offset="100%" stopColor="white" stopOpacity="1" />
        </radialGradient>
        
        {/* Noise pattern for organic fog texture */}
        <pattern id="noisePattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="hsl(var(--muted))" />
          {/* Scattered dots for noise effect */}
          {Array.from({ length: 50 }).map((_, i) => (
            <circle
              key={i}
              cx={Math.random() * 100}
              cy={Math.random() * 100}
              r={Math.random() * 2 + 0.5}
              fill="hsl(var(--muted-foreground))"
              opacity={Math.random() * 0.3}
            />
          ))}
        </pattern>
        
        {/* Mask combining clear patch with noise */}
        <mask id="fogMask">
          <rect width="100%" height="100%" fill="url(#clearPatch)" />
        </mask>
      </defs>
      
      {/* Main fog layer */}
      <rect
        width="100%"
        height="100%"
        fill="hsl(var(--background))"
        opacity={fogOpacity}
        filter="url(#fogBlur)"
        className={cn(
          motionEnabled && "transition-opacity duration-700 ease-out"
        )}
        style={motionEnabled ? {
          transitionProperty: 'opacity, filter'
        } : undefined}
      />
      
      {/* Noise texture overlay */}
      <rect
        width="100%"
        height="100%"
        fill="url(#noisePattern)"
        opacity={fogOpacity * 0.15}
        mask="url(#fogMask)"
      />
      
      {/* Subtle gradient overlay for depth */}
      <rect
        width="100%"
        height="100%"
        fill="url(#clearPatch)"
        opacity={1 - fogValue}
        className={cn(
          motionEnabled && "transition-opacity duration-700 ease-out"
        )}
      />
      
      {/* Condensation drops (visible in heavier fog) */}
      {fogBucket === 'heavy' || fogBucket === 'patchy' ? (
        <g opacity={fogOpacity * 0.5}>
          {Array.from({ length: 8 }).map((_, i) => (
            <ellipse
              key={i}
              cx={20 + i * 25}
              cy={100 + Math.sin(i) * 20}
              rx={2}
              ry={3}
              fill="hsl(var(--primary))"
              opacity={0.2}
            />
          ))}
        </g>
      ) : null}
    </svg>
  );
}
