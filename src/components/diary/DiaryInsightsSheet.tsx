import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DiaryProfileCard } from "./DiaryProfileCard";
import type { TimeRange } from "./types";

interface DiaryInsightsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  userEmail: string;
  avatarUrl?: string;
  metrics: any;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

export function DiaryInsightsSheet({
  open,
  onOpenChange,
  userName,
  userEmail,
  avatarUrl,
  metrics,
  timeRange,
  onTimeRangeChange,
}: DiaryInsightsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[85vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-t border-foreground/[0.08]"
      >
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base font-semibold">Your Insights</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          <DiaryProfileCard
            userName={userName}
            userEmail={userEmail}
            avatarUrl={avatarUrl}
            metrics={metrics}
            timeRange={timeRange}
            onTimeRangeChange={onTimeRangeChange}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
