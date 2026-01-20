import { QuadrantType } from "./types";
import { StrategiesPanelEnhanced } from "./StrategiesPanelEnhanced";
import { CheckinReminders } from "./CheckinReminders";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Heart, Bell } from "lucide-react";

interface WellbeingToolkitProps {
  currentQuadrant: QuadrantType | null;
  currentEmotion: string | null;
}

export function WellbeingToolkit({ currentQuadrant, currentEmotion }: WellbeingToolkitProps) {
  return (
    <div className="rounded-2xl border border-border/50 bg-muted/20 overflow-hidden">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="strategies" className="border-none">
          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" />
              <span className="text-sm font-medium">Wellbeing Tools</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-4">
            <StrategiesPanelEnhanced 
              currentQuadrant={currentQuadrant} 
              currentEmotion={currentEmotion} 
            />
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="reminders" className="border-none border-t border-border/30">
          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Reminders</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-4">
            <CheckinReminders />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
