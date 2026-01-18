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
  const displayHour = hour % 12 || 12;
  const displayMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${period}`;
}

export function CheckinReminders() {
  const [reminders, setReminders] = useState<ReminderTime[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_TIMES;
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
    if (reminder && !reminder.enabled) {
      toast.success(`Reminder set for ${formatTime(reminder.hour, reminder.minute)}`);
    }
  };

  const addReminder = () => {
    const hour = parseInt(newHour);
    const minute = parseInt(newMinute);

    const newReminder: ReminderTime = {
      id: Date.now().toString(),
      hour,
      minute,
      enabled: true,
    };

    setReminders((prev) => [...prev, newReminder].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)));

    toast.success(`Reminder added for ${formatTime(hour, minute)}`);
    setOpen(false);
  };

  const removeReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const enabledCount = reminders.filter((r) => r.enabled).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Reminders</h3>
            {enabledCount > 0 && <p className="text-xs text-slate-500">{enabledCount} active</p>}
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[320px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add Reminder</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center gap-3 py-6">
              <Select value={newHour} onValueChange={setNewHour}>
                <SelectTrigger className="w-[90px] h-12 rounded-xl text-lg font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {(i % 12 || 12).toString().padStart(2, "0")} {i >= 12 ? "PM" : "AM"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-2xl font-light text-slate-300">:</span>
              <Select value={newMinute} onValueChange={setNewMinute}>
                <SelectTrigger className="w-[80px] h-12 rounded-xl text-lg font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {["0", "15", "30", "45"].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m.padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={addReminder}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white"
            >
              Add Reminder
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reminders List */}
      <div className="space-y-2">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className={`flex items-center justify-between p-3 rounded-xl transition-all ${
              reminder.enabled
                ? "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800"
                : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-3">
              <Switch checked={reminder.enabled} onCheckedChange={() => toggleReminder(reminder.id)} />
              <Label
                className="text-sm font-medium cursor-pointer flex items-center gap-2"
                onClick={() => toggleReminder(reminder.id)}
              >
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {formatTime(reminder.hour, reminder.minute)}
              </Label>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
              onClick={() => removeReminder(reminder.id)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {reminders.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No reminders set yet</p>}
      </div>

      <p className="text-[10px] text-slate-400 text-center">Browser notifications require permission</p>
    </div>
  );
}
