import { Sparkles, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMotion } from "@/contexts/MotionContext";

export function MotionToggle() {
  const { motionEnabled, setMotionEnabled } = useMotion();
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Advanced Motion
        </CardTitle>
        <CardDescription>
          Enable premium animations and effects
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="motion-toggle" className="text-sm font-medium">
              Advanced Animations
            </Label>
            <p className="text-xs text-muted-foreground">
              Floating gradients, card hover effects, page transitions
            </p>
          </div>
          <Switch
            id="motion-toggle"
            checked={motionEnabled}
            onCheckedChange={setMotionEnabled}
            disabled={prefersReducedMotion}
          />
        </div>

        {prefersReducedMotion && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <Zap className="h-4 w-4" />
            <span>Disabled due to system "Reduce Motion" preference</span>
          </div>
        )}

        {motionEnabled && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Soft floating gradient following cursor
            </p>
            <p className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Card hover lift + parallax effects
            </p>
            <p className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Page transitions + section reveals
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
