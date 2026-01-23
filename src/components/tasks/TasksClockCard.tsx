import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { useTimezone } from "@/hooks/useTimezone";

export function TasksClockCard() {
  const [now, setNow] = useState(new Date());
  const { timezone } = useTimezone();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Use timezone for display
  const timeInTz = new Date(now.toLocaleString("en-US", { timeZone: timezone }));

  return (
    <Card className="h-full min-h-[160px] rounded-[32px] border border-primary/20 bg-card/30 backdrop-blur-xl shadow-xl overflow-hidden relative group">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <CardContent className="h-full flex flex-col items-center justify-center p-6 relative z-10">
        <div className="flex flex-col items-center text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/50 mb-1">
            {format(now, "EEEE")}
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-6xl font-black tracking-tighter text-foreground drop-shadow-sm">
              {format(now, "h:mm")}
            </span>
            <span className="text-xl font-bold text-muted-foreground/40 ml-1.5">{format(now, "a")}</span>
            <span className="text-lg font-mono text-primary/30 ml-3 tabular-nums w-8 text-left">
              {format(now, "ss")}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="h-px w-6 bg-border/40" />
            <span className="text-base font-medium text-muted-foreground/80 tracking-tight">
              {format(now, "MMMM do, yyyy")}
            </span>
            <div className="h-px w-6 bg-border/40" />
          </div>

          <div className="mt-2 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40 font-medium">
            {timezone}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
