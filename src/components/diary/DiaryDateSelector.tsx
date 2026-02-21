import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";

interface DiaryDateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DiaryDateSelector({ selectedDate, onDateChange }: DiaryDateSelectorProps) {
  const [open, setOpen] = useState(false);

  const label = format(selectedDate, "EEE, MMM d");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border/40 hover:bg-muted/60 transition-colors mx-auto"
      >
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl bg-background/95 backdrop-blur-xl border-t border-foreground/[0.08]"
        >
          <SheetHeader className="pb-2">
            <SheetTitle className="text-base font-semibold">Select Date</SheetTitle>
          </SheetHeader>
          <div className="flex justify-center pb-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  onDateChange(date);
                  setOpen(false);
                }
              }}
              className="pointer-events-auto"
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
