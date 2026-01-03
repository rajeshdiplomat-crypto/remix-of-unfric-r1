import { Button } from "@/components/ui/button";
import { Plus, Flame, Target, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ManifestTopBarProps {
  activeCount: number;
  streak: number;
  avgMomentum: number;
  onNewManifest: () => void;
}

export function ManifestTopBar({ activeCount, streak, avgMomentum, onNewManifest }: ManifestTopBarProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/70 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-card/60">
      {/* subtle sheen */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-foreground/[0.06] via-transparent to-transparent" />

      <div className="relative p-5 sm:p-6">
        {/* Top row: title + CTA */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Inbalance</p>
            <h1 className="mt-1 font-serif text-3xl sm:text-4xl leading-tight text-foreground tracking-tight">
              Manifest
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Practice daily. Track proof. Build momentum.</p>
          </div>

          <Button
            onClick={onNewManifest}
            size="sm"
            className="h-10 rounded-full px-4 shadow-sm transition hover:shadow-md"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Manifestation
          </Button>
        </div>

        {/* Divider */}
        <div className="my-5 h-px w-full bg-border/60" />

        {/* Metrics row */}
        <TooltipProvider>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Active */}
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60">
                <Target className="h-4 w-4 text-muted-foreground" />
              </span>
              <div className="leading-tight">
                <div className="text-sm font-medium text-foreground">{activeCount}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Active</div>
              </div>
            </div>

            {/* Streak */}
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60">
                <Flame className="h-4 w-4 text-muted-foreground" />
              </span>
              <div className="leading-tight">
                <div className="text-sm font-medium text-foreground">{streak}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Streak</div>
              </div>
            </div>

            {/* Momentum (with tooltip) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="group flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-2 transition hover:border-border"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60">
                    <TrendingUp className="h-4 w-4 text-muted-foreground transition group-hover:scale-[1.02]" />
                  </span>
                  <div className="leading-tight text-left">
                    <div className="text-sm font-medium text-foreground">{avgMomentum}%</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Momentum</div>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-xs">
                  Momentum measures how consistently this assumption is being practiced.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}
