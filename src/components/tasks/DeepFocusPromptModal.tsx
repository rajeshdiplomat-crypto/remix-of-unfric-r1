import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, X } from "lucide-react";
import type { QuadrantTask } from "./types";

interface DeepFocusPromptProps {
  open: boolean;
  task: QuadrantTask | null;
  onClose: () => void;
  onStartFocus: () => void;
  onSkip: () => void;
}

export function DeepFocusPrompt({
  open,
  task,
  onClose,
  onStartFocus,
  onSkip,
}: DeepFocusPromptProps) {
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start Deep Focus Session?</DialogTitle>
          <DialogDescription>
            Ready to focus on "{task.title}"? Start a timed focus session to track your productivity.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Deep focus sessions help you stay concentrated and measure time spent on tasks.
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={onSkip}>
            <X className="h-4 w-4 mr-2" />
            Skip
          </Button>
          <Button onClick={onStartFocus}>
            <Play className="h-4 w-4 mr-2" />
            Start Focus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
