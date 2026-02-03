import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface EmotionThreeZoneLayoutProps {
  leftRail: React.ReactNode;
  center: React.ReactNode;
  rightRail: React.ReactNode;
  railsDimmed?: boolean;
  centerExpanded?: boolean;
}

/**
 * 3-Zone Center-Dominant Layout
 * - Desktop: 3 columns with muted rails and dominant center
 * - Tablet: Collapsible rails with toggle buttons
 * - Mobile: Full-width center, rails in bottom drawers
 */
export function EmotionThreeZoneLayout({
  leftRail,
  center,
  rightRail,
  railsDimmed = false,
  centerExpanded = false,
}: EmotionThreeZoneLayoutProps) {
  const isMobile = useIsMobile();
  const [leftRailOpen, setLeftRailOpen] = useState(true);
  const [rightRailOpen, setRightRailOpen] = useState(true);

  // Mobile: Full-width center with drawer rails
  if (isMobile) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Center - Full Width */}
        <main className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-[820px] mx-auto">
            {center}
          </div>
        </main>

        {/* Bottom Drawer Triggers */}
        <div className="flex gap-2 p-3 border-t border-border bg-background shrink-0">
          <Drawer>
            <DrawerTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 h-10 rounded-xl"
                aria-label="Open context panel"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Context
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[70vh]">
              <div className="p-4 overflow-y-auto">
                {leftRail}
              </div>
            </DrawerContent>
          </Drawer>

          <Drawer>
            <DrawerTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 h-10 rounded-xl"
                aria-label="Open history panel"
              >
                History
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[70vh]">
              <div className="p-4 overflow-y-auto">
                {rightRail}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    );
  }

  // Desktop/Tablet: 3-column grid
  return (
    <div
      className={cn(
        "grid gap-4 h-full px-4 lg:px-6 py-4 overflow-hidden",
        centerExpanded
          ? "grid-cols-1 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,5fr)_minmax(0,0.8fr)]"
          : "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)_minmax(0,1fr)]"
      )}
    >
      {/* Left Rail */}
      <aside
        className={cn(
          "hidden lg:flex flex-col gap-4 h-full overflow-y-auto transition-opacity duration-300",
          railsDimmed ? "opacity-35" : "opacity-50",
          "text-sm"
        )}
        aria-label="Context information"
      >
        <div className="rounded-2xl bg-muted/30 p-4 space-y-4">
          {leftRail}
        </div>
      </aside>

      {/* Center - Main Flow */}
      <main 
        className="flex flex-col h-full overflow-y-auto"
        role="main"
      >
        <div className="max-w-[820px] w-full mx-auto">
          {center}
        </div>
      </main>

      {/* Right Rail */}
      <aside
        className={cn(
          "hidden lg:flex flex-col gap-4 h-full overflow-y-auto transition-opacity duration-300",
          railsDimmed ? "opacity-35" : "opacity-45",
          "text-sm"
        )}
        aria-label="Recent entries and calendar"
      >
        {rightRail}
      </aside>
    </div>
  );
}
