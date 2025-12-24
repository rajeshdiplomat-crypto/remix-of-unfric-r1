import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { QuadrantTask } from "./types";

interface DeepFocusPromptProps {
  open: boolean;
  task: QuadrantTask | null;
  onClose: () => void;
  onStartFocus: () => void;
  onSkip: () => void;
}

export function DeepFocusPrompt({ open, task, onClose, onStartFocus, onSkip }: DeepFocusPromptProps) {
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Start Deep Focus?
          </DialogTitle>
          <DialogDescription className="pt-2">
            You're starting: <span className="font-medium text-foreground">{task.title}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Deep Focus mode helps you concentrate on a single task with a timer, minimal distractions, and session tracking.
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onSkip} className="flex-1">
            Not now
          </Button>
          <Button onClick={onStartFocus} className="flex-1">
            <Play className="h-4 w-4 mr-2" />
            Start Deep Focus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
