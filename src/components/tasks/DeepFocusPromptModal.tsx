import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Play, X } from "lucide-react";
import type { QuadrantTask } from "./types";

interface DeepFocusPromptProps {
  open: boolean;
  task: QuadrantTask | null;
  onClose: () => void;
  onStartFocus: () => void;
  onSkip: () => void;
}

export function DeepFocusPrompt({ open, task, onClose, onStartFocus, onSkip }: DeepFocusPromptProps) {
  if (!task) return null;

  const dueLabel = task.due_date ? new Date(task.due_date) : null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/30 via-transparent to-transparent" />

          <div className="relative px-6 pt-6 pb-4">
            <div className="flex items-start justify-between gap-4">
              <DialogHeader className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Deep Focus</p>
                <DialogTitle className="text-lg">Start a focus session?</DialogTitle>
                <DialogDescription className="text-sm">
                  A calm timer + a single intention. We’ll track your focus minutes automatically.
                </DialogDescription>
              </DialogHeader>

              <Button variant="ghost" size="icon" className="rounded-2xl" onClick={onClose} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="h-px bg-border" />
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-2xl border border-border bg-muted/10 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Today’s intention</p>
            <p className="mt-1 text-sm font-medium leading-snug">{task.title}</p>

            {(task.urgency === "high" || task.importance === "high" || task.due_date) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {task.urgency === "high" && (
                  <span className="inline-flex items-center rounded-full border border-border bg-background/60 px-2 py-0.5 text-[11px]">
                    Urgent
                  </span>
                )}
                {task.importance === "high" && (
                  <span className="inline-flex items-center rounded-full border border-border bg-background/60 px-2 py-0.5 text-[11px]">
                    Important
                  </span>
                )}
                {dueLabel && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[11px]">
                    <Clock className="h-3.5 w-3.5" />
                    Due {dueLabel.toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-foreground" />
              <p>Choose a timer mode (countdown, stopwatch, or Pomodoro).</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-foreground" />
              <p>Stay in a distraction-free view while you work.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-foreground" />
              <p>Your focused minutes get added to this task when you save or complete.</p>
            </div>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Footer */}
        <DialogFooter className="px-6 py-4 flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={onSkip} className="rounded-2xl">
            Not now
          </Button>
          <Button onClick={onStartFocus} className="rounded-2xl">
            <Play className="h-4 w-4 mr-2" />
            Start focus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
