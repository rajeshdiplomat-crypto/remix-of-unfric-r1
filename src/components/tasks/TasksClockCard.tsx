import { useEffect, useState } from "react";
import { useTimezone } from "@/hooks/useTimezone";

export function TasksClockCard() {
  const [time, setTime] = useState(new Date());
  const { timezone, getTimeInTimezone } = useTimezone();

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { hours, minutes, seconds } = getTimeInTimezone(time);

  // Calculate hand rotations
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const secondDeg = seconds * 6;

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Analog Clock */}
      <div className="relative w-36 h-36">
        {/* Clock face */}
        <div className="absolute inset-0 rounded-full border-2 border-border/50 bg-background">
          {/* Hour markers */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x = 50 + 42 * Math.cos(angle);
            const y = 50 + 42 * Math.sin(angle);
            return (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-muted-foreground/60"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            );
          })}

          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-primary" />
          </div>

          {/* Hour hand */}
          <div
            className="absolute left-1/2 bottom-1/2 w-1 h-8 bg-foreground rounded-full origin-bottom"
            style={{ transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
          />

          {/* Minute hand */}
          <div
            className="absolute left-1/2 bottom-1/2 w-0.5 h-12 bg-foreground/80 rounded-full origin-bottom"
            style={{ transform: `translateX(-50%) rotate(${minuteDeg}deg)` }}
          />

          {/* Second hand */}
          <div
            className="absolute left-1/2 bottom-1/2 w-px h-12 bg-primary rounded-full origin-bottom"
            style={{ transform: `translateX(-50%) rotate(${secondDeg}deg)` }}
          />
        </div>
      </div>

      {/* Digital time */}
      <p className="text-lg font-semibold text-foreground mt-2">
        {time.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true,
          timeZone: timezone
        })}
      </p>
      <p className="text-sm text-muted-foreground">
        {time.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          timeZone: timezone
        })}
      </p>
    </div>
  );
}
