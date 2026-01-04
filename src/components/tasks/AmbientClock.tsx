import { useState, useEffect } from "react";
import { useTimezone } from "@/hooks/useTimezone";

export function AmbientClock() {
  const [time, setTime] = useState(new Date());
  const { timezone, getTimeInTimezone } = useTimezone();

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { hours, minutes, seconds } = getTimeInTimezone(time);
  const hourDeg = (hours % 12 * 30) + (minutes * 0.5);
  const minuteDeg = (minutes * 6) + (seconds * 0.1);
  const secondDeg = seconds * 6;

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      {/* Analog Clock - Always visible, non-interactive */}
      <div className="relative w-36 h-36">
        {/* Outer ring - subtle, no shadow */}
        <div className="absolute inset-0 rounded-full border border-border/40 bg-transparent">
          {/* Hour markers - thin and muted */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-px h-2 bg-muted-foreground/30"
              style={{
                left: '50%',
                top: '6px',
                transformOrigin: '50% 66px',
                transform: `translateX(-50%) rotate(${i * 30}deg)`,
              }}
            />
          ))}
          
          {/* Hour hand - thin stroke */}
          <div
            className="absolute w-0.5 h-8 bg-foreground/70 rounded-full"
            style={{
              left: '50%',
              bottom: '50%',
              transformOrigin: '50% 100%',
              transform: `translateX(-50%) rotate(${hourDeg}deg)`,
            }}
          />
          
          {/* Minute hand - thinner */}
          <div
            className="absolute w-px h-12 bg-foreground/60 rounded-full"
            style={{
              left: '50%',
              bottom: '50%',
              transformOrigin: '50% 100%',
              transform: `translateX(-50%) rotate(${minuteDeg}deg)`,
            }}
          />
          
          {/* Second hand - very thin, primary color */}
          <div
            className="absolute w-px h-14 bg-primary/50 rounded-full"
            style={{
              left: '50%',
              bottom: '50%',
              transformOrigin: '50% 100%',
              transform: `translateX(-50%) rotate(${secondDeg}deg)`,
            }}
          />
          
          {/* Center dot - subtle */}
          <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-muted-foreground/50 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Digital time below - subtle */}
      <div className="text-sm font-light tabular-nums text-muted-foreground">
        {time.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true,
          timeZone: timezone
        })}
      </div>
      
      {/* Date - very subtle */}
      <div className="text-xs text-muted-foreground/60">
        {time.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          timeZone: timezone
        })}
      </div>
    </div>
  );
}
