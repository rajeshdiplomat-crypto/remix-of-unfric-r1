import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WindowVignette } from "@/components/clarity/WindowVignette";
import { useClarityProgress, useLifeProofs } from "@/hooks/useClarityProgress";
import { cn } from "@/lib/utils";
import { useMotion } from "@/contexts/MotionContext";

export default function ClarityWindow() {
  const { motionEnabled } = useMotion();
  const progress = useClarityProgress();
  const { data: proofs = [], isLoading: proofsLoading } = useLifeProofs(3);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal header */}
      <header className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground">
          <Link to="/diary" aria-label="Back to Diary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>

        <h1 className="text-sm font-medium text-muted-foreground">Clarity Window</h1>

        {/* Spacer for alignment */}
        <div className="w-10" />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {progress.loading ? (
          <div className={cn("text-center", motionEnabled && "animate-pulse")}>
            <div className="w-64 h-48 bg-muted/30 rounded-lg mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Looking through the window...</p>
          </div>
        ) : (
          <WindowVignette
            fogValue={progress.fogValue}
            fogBucket={progress.fogBucket}
            proofs={proofs}
            proofsLoading={proofsLoading}
          />
        )}

        {/* Subtle score indicators (for debugging/dev - can be removed in production) */}
        {!progress.loading && (
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground/50">
            <span>Check-ins: {(progress.checkins * 100).toFixed(0)}%</span>
            <span>Recovery: {(progress.recovery * 100).toFixed(0)}%</span>
            <span>Alignment: {(progress.alignment * 100).toFixed(0)}%</span>
            <span>Reflection: {(progress.reflection * 100).toFixed(0)}%</span>
            <span>Consistency: {(progress.consistency * 100).toFixed(0)}%</span>
          </div>
        )}
      </main>

      {/* Footer hint */}
      <footer className="p-4 text-center">
        <p className="text-xs text-muted-foreground/60">Tap the window to see your recent moments</p>
      </footer>
    </div>
  );
}
