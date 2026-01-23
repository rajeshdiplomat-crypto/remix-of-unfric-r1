import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { useTimezone } from "@/hooks/useTimezone";
import { MapPin } from "lucide-react";

export function TasksClockCard() {
  const [now, setNow] = useState(new Date());
  const { timezone } = useTimezone();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Use timezone for display
  const timeInTz = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  const seconds = parseInt(format(now, "ss"));

  return (
    <Card className="h-full min-h-[200px] rounded-[32px] border-0 bg-gradient-to-br from-card via-card/95 to-card/90 shadow-2xl overflow-hidden relative group">
      {/* Animated gradient orbs */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-gradient-to-tr from-primary/8 via-primary/3 to-transparent rounded-full blur-3xl pointer-events-none" style={{ animationDelay: '1s' }} />
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} 
      />

      {/* Glowing accent line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <CardContent className="h-full flex flex-col items-center justify-center p-8 relative z-10">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Day label with elegant styling */}
          <div className="flex items-center gap-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary/30" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary/70">
              {format(now, "EEEE")}
            </span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary/30" />
          </div>

          {/* Main time display */}
          <div className="flex items-baseline gap-1 relative">
            {/* Subtle glow behind time */}
            <div className="absolute inset-0 blur-2xl bg-primary/5 scale-150 pointer-events-none" />
            
            <span className="text-7xl font-black tracking-tight text-foreground drop-shadow-sm relative">
              {format(now, "h:mm")}
            </span>
            <div className="flex flex-col items-start ml-2 gap-0.5">
              <span className="text-xl font-bold text-muted-foreground/50 uppercase">
                {format(now, "a")}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-lg font-mono text-primary/40 tabular-nums">
                  {format(now, "ss")}
                </span>
                {/* Animated seconds indicator */}
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Elegant date display */}
          <div className="flex items-center gap-3 mt-2">
            <div className="h-px w-10 bg-gradient-to-r from-transparent via-border/60 to-border/60" />
            <span className="text-base font-medium text-muted-foreground/90 tracking-wide">
              {format(now, "MMMM do, yyyy")}
            </span>
            <div className="h-px w-10 bg-gradient-to-l from-transparent via-border/60 to-border/60" />
          </div>

          {/* Timezone with location icon */}
          <div className="flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-full bg-muted/30 backdrop-blur-sm border border-border/30">
            <MapPin className="w-3 h-3 text-primary/50" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-medium">
              {timezone}
            </span>
          </div>

          {/* Decorative bottom element */}
          <div className="flex items-center gap-1.5 mt-2">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className="w-1 h-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: seconds % 3 === i ? 'hsl(var(--primary) / 0.6)' : 'hsl(var(--muted-foreground) / 0.2)'
                }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
