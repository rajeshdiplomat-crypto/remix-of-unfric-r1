import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelRightClose } from "lucide-react";
import { useState, useEffect } from "react";
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

const TABLET_BREAKPOINT = 1024;

function useIsTablet() {
  const [isTablet, setIsTablet] = useState<boolean>(false);

  useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 768 && width < TABLET_BREAKPOINT);
    };
    
    checkTablet();
    window.addEventListener("resize", checkTablet);
    return () => window.removeEventListener("resize", checkTablet);
  }, []);

  return isTablet;
}

/**
 * 3-Zone Center-Dominant Layout
 * - Desktop: 3 columns with muted rails and dominant center
 * - Tablet (768-1023px): Collapsible rails with toggle buttons
 * - Mobile (<768px): Full-width center, rails in bottom drawers
 */
export function EmotionThreeZoneLayout({
  leftRail,
  center,
  rightRail,
  railsDimmed = false,
  centerExpanded = false,
}: EmotionThreeZoneLayoutProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
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

  // Tablet (768-1023px): Collapsible rails with toggle buttons
  if (isTablet) {
    return (
      <div className="flex h-full overflow-hidden relative">
        {/* Left Rail Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLeftRailOpen(!leftRailOpen)}
          className={cn(
            "absolute left-2 top-4 z-10 h-8 w-8 p-0 rounded-lg",
            "bg-background/80 backdrop-blur-sm border border-border shadow-sm",
            "hover:bg-muted"
          )}
          aria-label={leftRailOpen ? "Close left panel" : "Open left panel"}
        >
          {leftRailOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        {/* Left Rail - Collapsible */}
        <aside
          className={cn(
            "flex flex-col gap-4 h-full overflow-y-auto transition-all duration-300 ease-in-out",
            railsDimmed ? "opacity-35" : "opacity-50",
            leftRailOpen ? "w-[220px] min-w-[220px] px-4 py-4" : "w-0 min-w-0 px-0 overflow-hidden"
          )}
          aria-label="Context information"
          aria-hidden={!leftRailOpen}
        >
          <div className="rounded-2xl bg-muted/30 p-4 space-y-4 mt-10">
            {leftRail}
          </div>
        </aside>

        {/* Center - Main Flow */}
        <main 
          className="flex-1 flex flex-col h-full overflow-y-auto px-4 py-4"
          role="main"
        >
          <div className="max-w-[820px] w-full mx-auto">
            {center}
          </div>
        </main>

        {/* Right Rail - Collapsible */}
        <aside
          className={cn(
            "flex flex-col gap-4 h-full overflow-y-auto transition-all duration-300 ease-in-out",
            railsDimmed ? "opacity-35" : "opacity-45",
            rightRailOpen ? "w-[220px] min-w-[220px] px-4 py-4" : "w-0 min-w-0 px-0 overflow-hidden"
          )}
          aria-label="Recent entries and calendar"
          aria-hidden={!rightRailOpen}
        >
          <div className="mt-10">
            {rightRail}
          </div>
        </aside>

        {/* Right Rail Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRightRailOpen(!rightRailOpen)}
          className={cn(
            "absolute right-2 top-4 z-10 h-8 w-8 p-0 rounded-lg",
            "bg-background/80 backdrop-blur-sm border border-border shadow-sm",
            "hover:bg-muted"
          )}
          aria-label={rightRailOpen ? "Close right panel" : "Open right panel"}
        >
          {rightRailOpen ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }

  // Desktop/Laptop (≥1024px): 3-column grid
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
