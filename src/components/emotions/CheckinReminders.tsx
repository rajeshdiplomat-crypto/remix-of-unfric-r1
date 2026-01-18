import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Plus, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ReminderTime {
  id: string;
  hour: number;
  minute: number;
  enabled: boolean;
}

const STORAGE_KEY = "emotion-checkin-reminders";
const DEFAULT_TIMES: ReminderTime[] = [
  { id: "1", hour: 9, minute: 0, enabled: false },
  { id: "2", hour: 14, minute: 0, enabled: false },
  { id: "3", hour: 20, minute: 0, enabled: false },
];

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${minute.toString().padStart(2, "0")} ${period}`;
}

export function CheckinReminders() {
  const [reminders, setReminders] = useState<ReminderTime[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "") || DEFAULT_TIMES;
    } catch {
      return DEFAULT_TIMES;
    }
  });
  const [open, setOpen] = useState(false);
  const [newHour, setNewHour] = useState("9");
  const [newMinute, setNewMinute] = useState("0");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  }, [reminders]);

  const toggleReminder = (id: string) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
    const reminder = reminders.find((r) => r.id === id);
    if (reminder && !reminder.enabled) toast.success(`Reminder set for ${formatTime(reminder.hour, reminder.minute)}`);
  };

  const addReminder = () => {
    const hour = parseInt(newHour),
      minute = parseInt(newMinute);
    setReminders((prev) =>
      [...prev, { id: Date.now().toString(), hour, minute, enabled: true }].sort(
        (a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute),
      ),
    );
    toast.success(`Reminder added for ${formatTime(hour, minute)}`);
    setOpen(false);
  };

  const enabledCount = reminders.filter((r) => r.enabled).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">Check-in Reminders</h3>
          {enabledCount > 0 && <span className="text-xs text-muted-foreground">({enabledCount} active)</span>}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[300px] rounded-xl">
            <DialogHeader>
              <DialogTitle>Add Reminder</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center gap-2 py-4">
              <Select value={newHour} onValueChange={setNewHour}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {(i % 12 || 12).toString().padStart(2, "0")} {i >= 12 ? "PM" : "AM"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">:</span>
              <Select value={newMinute} onValueChange={setNewMinute}>
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["0", "15", "30", "45"].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m.padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addReminder} className="w-full">
              Add Reminder
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {reminders.map((r) => (
          <div key={r.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Switch checked={r.enabled} onCheckedChange={() => toggleReminder(r.id)} />
              <Label className="text-sm cursor-pointer" onClick={() => toggleReminder(r.id)}>
                {formatTime(r.hour, r.minute)}
              </Label>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => setReminders((prev) => prev.filter((x) => x.id !== r.id))}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {reminders.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No reminders set</p>}
      </div>
      <p className="text-[10px] text-muted-foreground text-center">Browser notifications require permission</p>
    </div>
  );
}
