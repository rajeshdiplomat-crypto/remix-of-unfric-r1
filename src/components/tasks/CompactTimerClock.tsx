import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function BigClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="h-full min-h-[180px] rounded-3xl border border-primary/20 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-700" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-700" />

      <CardContent className="h-full flex flex-col items-center justify-center p-8 relative z-10">
        <div className="flex flex-col items-center text-center">
          <div className="text-[12px] font-bold uppercase tracking-[0.3em] text-primary/60 mb-2">
            {format(now, "EEEE")}
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-7xl md:text-8xl font-black tracking-tighter text-foreground drop-shadow-sm">
              {format(now, "h:mm")}
            </span>
            <span className="text-2xl md:text-3xl font-bold text-muted-foreground/50 ml-2">{format(now, "a")}</span>
            <span className="text-xl md:text-2xl font-mono text-primary/40 ml-4 tabular-nums w-12 text-left">
              {format(now, "ss")}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-8 bg-border/60" />
            <span className="text-lg md:text-xl font-medium text-muted-foreground tracking-tight">
              {format(now, "MMMM do, yyyy")}
            </span>
            <div className="h-px w-8 bg-border/60" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
