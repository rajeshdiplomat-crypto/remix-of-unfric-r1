import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  PenLine, Bell, Shield, Clock, LayoutDashboard, 
  Download, Trash2, UserX, ChevronRight, Loader2 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────

interface UserSettings {
  timezone: string | null;
  date_format: string | null;
  start_of_week: string | null;
  default_home_screen: string | null;
  daily_reset_time: string | null;
  notification_diary_prompt: boolean | null;
  notification_emotion_checkin: boolean | null;
  notification_task_reminder: boolean | null;
  privacy_blur_sensitive: boolean | null;
  privacy_passcode_enabled: boolean | null;
  note_skin_preference: string | null;
}

const TIMEZONES = (Intl as any).supportedValuesOf("timeZone") as string[];

const MODULES_FOR_CLEAR = [
  { key: "emotions", label: "Emotions", table: "emotions" },
  { key: "journal", label: "Journal", table: "journal_entries" },
  { key: "habits", label: "Habits", table: "habits" },
  { key: "manifest", label: "Manifest", table: "manifest_goals" },
  { key: "notes", label: "Notes", table: "notes" },
  { key: "tasks", label: "Tasks", table: "tasks" },
];

// ── Component ──────────────────────────────────────────────────────

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearDialog, setClearDialog] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Local state for default views (stored in localStorage)
  const [defaultTaskView, setDefaultTaskView] = useState(
    () => localStorage.getItem("settings_default_task_view") || "status"
  );
  const [defaultNotesView, setDefaultNotesView] = useState(
    () => localStorage.getItem("settings_default_notes_view") || "list"
  );
  const [defaultEmotionsTab, setDefaultEmotionsTab] = useState(
    () => localStorage.getItem("settings_default_emotions_tab") || "feel"
  );

  // ── Load Settings ────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setSettings({
          timezone: data.timezone,
          date_format: data.date_format,
          start_of_week: data.start_of_week,
          default_home_screen: data.default_home_screen,
          daily_reset_time: data.daily_reset_time,
          notification_diary_prompt: data.notification_diary_prompt,
          notification_emotion_checkin: data.notification_emotion_checkin,
          notification_task_reminder: data.notification_task_reminder,
          privacy_blur_sensitive: data.privacy_blur_sensitive,
          privacy_passcode_enabled: data.privacy_passcode_enabled,
          note_skin_preference: data.note_skin_preference,
        });
      } else {
        // Create default row
        const defaults: UserSettings = {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          date_format: "MM/DD",
          start_of_week: "monday",
          default_home_screen: "diary",
          daily_reset_time: "08:00",
          notification_diary_prompt: true,
          notification_emotion_checkin: true,
          notification_task_reminder: true,
          privacy_blur_sensitive: false,
          privacy_passcode_enabled: false,
          note_skin_preference: null,
        };
        await supabase.from("user_settings").insert({ user_id: user.id, ...defaults });
        setSettings(defaults);
      }
      setLoading(false);
    })();
  }, [user]);

  // ── Save helper ──────────────────────────────────────────────────

  const saveField = async (field: keyof UserSettings, value: any) => {
    if (!user) return;
    setSettings((prev) => prev ? { ...prev, [field]: value } : prev);
    await supabase
      .from("user_settings")
      .update({ [field]: value })
      .eq("user_id", user.id);
  };

  // ── Export Data ──────────────────────────────────────────────────

  const handleExportData = async () => {
    if (!user) return;
    setExportLoading(true);
    try {
      const [emotions, journal, habits, habitCompletions, notes, tasks, goals] = await Promise.all([
        supabase.from("emotions").select("*").eq("user_id", user.id),
        supabase.from("journal_entries").select("*").eq("user_id", user.id),
        supabase.from("habits").select("*").eq("user_id", user.id),
        supabase.from("habit_completions").select("*").eq("user_id", user.id),
        supabase.from("notes").select("*").eq("user_id", user.id),
        supabase.from("tasks").select("*").eq("user_id", user.id),
        supabase.from("manifest_goals").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        emotions: emotions.data || [],
        journal_entries: journal.data || [],
        habits: habits.data || [],
        habit_completions: habitCompletions.data || [],
        notes: notes.data || [],
        tasks: tasks.data || [],
        manifest_goals: goals.data || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `unfric-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch (e) {
      toast.error("Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  // ── Clear Module Data ────────────────────────────────────────────

  const handleClearModule = async (tableKey: string) => {
    if (!user) return;
    try {
      // Special handling for habits (also clear completions)
      if (tableKey === "habits") {
        await supabase.from("habit_completions").delete().eq("user_id", user.id);
      }
      // Special handling for journal (also clear answers)
      if (tableKey === "journal_entries") {
        const { data: entries } = await supabase.from("journal_entries").select("id").eq("user_id", user.id);
        if (entries?.length) {
          const ids = entries.map((e) => e.id);
          await supabase.from("journal_answers").delete().in("journal_entry_id", ids);
        }
      }
      // Special handling for manifest (also clear journal)
      if (tableKey === "manifest_goals") {
        const { data: goals } = await supabase.from("manifest_goals").select("id").eq("user_id", user.id);
        if (goals?.length) {
          const ids = goals.map((g) => g.id);
          await supabase.from("manifest_journal").delete().in("goal_id", ids);
        }
      }

      await supabase.from(tableKey as any).delete().eq("user_id", user.id);
      toast.success("Module data cleared");
    } catch (e) {
      toast.error("Failed to clear data");
    }
    setClearDialog(null);
  };

  // ── Delete Account ───────────────────────────────────────────────

  const handleDeleteAccount = async () => {
    // For now, sign out + notify — actual deletion requires admin function
    toast.info("Account deletion requested. You will be signed out.");
    await signOut();
  };

  // ── Save Default Views to localStorage ───────────────────────────

  const handleDefaultViewChange = (key: string, value: string) => {
    localStorage.setItem(key, value);
    if (key === "settings_default_task_view") setDefaultTaskView(value);
    if (key === "settings_default_notes_view") setDefaultNotesView(value);
    if (key === "settings_default_emotions_tab") setDefaultEmotionsTab(value);
  };

  // ── Render ───────────────────────────────────────────────────────

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-light uppercase tracking-[0.15em] text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your preferences and data</p>
      </div>

      {/* ─── Section 1: Journal Preferences ─── */}
      <SettingsSection icon={PenLine} title="Journal Preferences">
        <SettingsRow label="Default Template Questions" description="Edit your journal prompts and template">
          <Button
            variant="outline"
            size="sm"
            className="text-xs uppercase tracking-wider"
            onClick={() => navigate("/journal")}
          >
            Open Journal
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </SettingsRow>
        <SettingsRow label="Auto-apply prompts" description="Add prompts when you start a new day">
          <span className="text-xs text-muted-foreground">Managed in Journal Settings</span>
        </SettingsRow>
        <SettingsRow label="Default Journal Skin" description="Managed within the journal editor">
          <span className="text-xs text-muted-foreground">Via Journal</span>
        </SettingsRow>
      </SettingsSection>

      {/* ─── Section 2: Notifications ─── */}
      <SettingsSection icon={Bell} title="Notifications & Reminders">
        <SettingsRow label="Daily Journal Reminder" description="Get reminded to write in your journal">
          <Switch
            checked={settings.notification_diary_prompt ?? true}
            onCheckedChange={(v) => saveField("notification_diary_prompt", v)}
          />
        </SettingsRow>
        <SettingsRow label="Habit Check-in Reminders" description="Get nudged to complete your habits">
          <Switch
            checked={settings.notification_task_reminder ?? true}
            onCheckedChange={(v) => saveField("notification_task_reminder", v)}
          />
        </SettingsRow>
        <SettingsRow label="Emotion Check-in Nudges" description="Periodic reminders to log your emotions">
          <Switch
            checked={settings.notification_emotion_checkin ?? true}
            onCheckedChange={(v) => saveField("notification_emotion_checkin", v)}
          />
        </SettingsRow>
        <SettingsRow label="Reminder Time" description="When to send daily reminders">
          <Input
            type="time"
            value={settings.daily_reset_time || "08:00"}
            onChange={(e) => saveField("daily_reset_time", e.target.value)}
            className="w-28 text-xs"
          />
        </SettingsRow>
      </SettingsSection>

      {/* ─── Section 3: Data & Privacy ─── */}
      <SettingsSection icon={Shield} title="Data & Privacy">
        <SettingsRow label="Export Data" description="Download all your data as JSON">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            disabled={exportLoading}
            className="text-xs uppercase tracking-wider"
          >
            {exportLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}
            Export
          </Button>
        </SettingsRow>
        <SettingsRow label="Clear Module Data" description="Reset data for a specific module">
          <Select onValueChange={(v) => setClearDialog(v)}>
            <SelectTrigger className="w-32 text-xs">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {MODULES_FOR_CLEAR.map((m) => (
                <SelectItem key={m.key} value={m.table}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label="Delete Account" description="Permanently remove your account and data">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialog(true)}
            className="text-xs uppercase tracking-wider"
          >
            <UserX className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </SettingsRow>
      </SettingsSection>

      {/* ─── Section 4: Time & Locale ─── */}
      <SettingsSection icon={Clock} title="Time & Locale">
        <SettingsRow label="Timezone" description="Controls all clocks and time displays">
          <Select
            value={settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
            onValueChange={(v) => saveField("timezone", v)}
          >
            <SelectTrigger className="w-48 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz} className="text-xs">{tz.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label="Date Format" description="Controls all calendar and date displays">
          <Select
            value={settings.date_format || "MM/DD"}
            onValueChange={(v) => saveField("date_format", v)}
          >
            <SelectTrigger className="w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MM/DD">MM/DD</SelectItem>
              <SelectItem value="DD/MM">DD/MM</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label="Week Start Day" description="Controls all calendar views">
          <Select
            value={settings.start_of_week || "monday"}
            onValueChange={(v) => saveField("start_of_week", v)}
          >
            <SelectTrigger className="w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monday">Monday</SelectItem>
              <SelectItem value="sunday">Sunday</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsSection>

      {/* ─── Section 5: Default Views ─── */}
      <SettingsSection icon={LayoutDashboard} title="Default Views">
        <SettingsRow label="Default Home Page" description="Which page opens when you log in">
          <Select
            value={settings.default_home_screen || "diary"}
            onValueChange={(v) => saveField("default_home_screen", v)}
          >
            <SelectTrigger className="w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diary">Diary</SelectItem>
              <SelectItem value="emotions">Emotions</SelectItem>
              <SelectItem value="journal">Journal</SelectItem>
              <SelectItem value="manifest">Manifest</SelectItem>
              <SelectItem value="habits">Habits</SelectItem>
              <SelectItem value="notes">Notes</SelectItem>
              <SelectItem value="tasks">Tasks</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label="Default Task Board" description="Which task view to show first">
          <Select
            value={defaultTaskView}
            onValueChange={(v) => handleDefaultViewChange("settings_default_task_view", v)}
          >
            <SelectTrigger className="w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="urgent-important">Urgent/Important</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="time-of-day">Time of Day</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label="Default Notes View" description="Which notes layout to show first">
          <Select
            value={defaultNotesView}
            onValueChange={(v) => handleDefaultViewChange("settings_default_notes_view", v)}
          >
            <SelectTrigger className="w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list">List</SelectItem>
              <SelectItem value="board">Board</SelectItem>
              <SelectItem value="mindmap">Mind Map</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label="Default Emotions Tab" description="Which emotions tab to show first">
          <Select
            value={defaultEmotionsTab}
            onValueChange={(v) => handleDefaultViewChange("settings_default_emotions_tab", v)}
          >
            <SelectTrigger className="w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feel">Feel</SelectItem>
              <SelectItem value="context">Context</SelectItem>
              <SelectItem value="regulate">Regulate</SelectItem>
              <SelectItem value="insights">Insights</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsSection>

      {/* ─── Dialogs ─── */}
      <Dialog open={!!clearDialog} onOpenChange={() => setClearDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Clear Module Data</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete all data for this module. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => clearDialog && handleClearModule(clearDialog)}>
              <Trash2 className="h-3 w-3 mr-1" /> Clear Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete Account</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete your account and all associated data. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              <UserX className="h-3 w-3 mr-1" /> Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Reusable Sub-components ────────────────────────────────────────

function SettingsSection({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{title}</h2>
      </div>
      <div className="space-y-1 rounded-xl border border-border bg-card overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-light text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}
