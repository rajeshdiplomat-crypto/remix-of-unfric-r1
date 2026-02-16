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
  Download, Trash2, UserX, ChevronRight, Loader2,
  Plus, RotateCcw, GripVertical, Edit3
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { JournalTemplate, JournalQuestion, DEFAULT_QUESTIONS, DEFAULT_TEMPLATE, JOURNAL_SKINS } from "@/components/journal/types";

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
  default_task_tab: string | null;
  default_task_view: string | null;
  default_notes_view: string | null;
  default_emotions_tab: string | null;
  journal_mode: string | null;
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

  // Default views are now stored in DB via settings object

  // Journal template state
  const [template, setTemplate] = useState<JournalTemplate>(() => {
    const saved = localStorage.getItem("journal_template");
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATE;
  });
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
          default_task_tab: (data as any).default_task_tab ?? "board",
          default_task_view: (data as any).default_task_view ?? "status",
          default_notes_view: (data as any).default_notes_view ?? "list",
          default_emotions_tab: (data as any).default_emotions_tab ?? "feel",
          journal_mode: (data as any).journal_mode ?? "structured",
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
          default_task_tab: "board",
          default_task_view: "status",
          default_notes_view: "atlas",
          default_emotions_tab: "feel",
          journal_mode: "structured",
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

  // Default views are now saved via saveField to DB

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
        <SettingsRow label="Journal Mode" description="Structured uses prompts, unstructured is freeform">
          <Select
            value={settings.journal_mode || "structured"}
            onValueChange={(v) => saveField("journal_mode", v)}
          >
            <SelectTrigger className="w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="structured">Structured</SelectItem>
              <SelectItem value="unstructured">Unstructured</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label="Auto-apply prompts on new entries" description="Add template questions when you start a new day">
          <Switch
            checked={template.applyOnNewEntry}
            onCheckedChange={(v) => {
              const updated = { ...template, applyOnNewEntry: v };
              setTemplate(updated);
              localStorage.setItem("journal_template", JSON.stringify(updated));
            }}
          />
        </SettingsRow>
        <SettingsRow label="Default Journal Skin" description="Choose the default skin for journal entries">
          <Select
            value={template.defaultSkinId}
            onValueChange={(v) => {
              const updated = { ...template, defaultSkinId: v };
              setTemplate(updated);
              localStorage.setItem("journal_template", JSON.stringify(updated));
              localStorage.setItem("journal_skin_id", v);
            }}
          >
            <SelectTrigger className="w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JOURNAL_SKINS.map((skin) => (
                <SelectItem key={skin.id} value={skin.id} className="text-xs">{skin.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label="Default Editor Lines" description="Line style for the writing area">
          <Select
            value={template.defaultLineStyle || "none"}
            onValueChange={(v) => {
              const updated = { ...template, defaultLineStyle: v };
              setTemplate(updated);
              localStorage.setItem("journal_template", JSON.stringify(updated));
            }}
          >
            <SelectTrigger className="w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Lines</SelectItem>
              <SelectItem value="ruled">Ruled</SelectItem>
              <SelectItem value="grid">Grid</SelectItem>
              <SelectItem value="dotted">Dotted</SelectItem>
              <SelectItem value="college">College</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        <div className="px-4 py-2">
          <p className="text-[11px] text-muted-foreground italic">These settings apply to new journal entries going forward. Existing entries keep their original look.</p>
        </div>

        {/* Questions inline editor */}
        <div className="px-4 py-3 border-b border-border last:border-b-0">
          <p className="text-sm font-light text-foreground mb-1">Template Questions</p>
          <p className="text-[11px] text-muted-foreground mb-3">Drag to reorder, click to edit</p>
          <div className="space-y-2">
            {template.questions.map((question, index) => (
              <div
                key={question.id}
                draggable
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggedIndex === null || draggedIndex === index) return;
                  const newQuestions = [...template.questions];
                  const [item] = newQuestions.splice(draggedIndex, 1);
                  newQuestions.splice(index, 0, item);
                  const updated = { ...template, questions: newQuestions };
                  setTemplate(updated);
                  localStorage.setItem("journal_template", JSON.stringify(updated));
                  setDraggedIndex(index);
                }}
                onDragEnd={() => setDraggedIndex(null)}
                className={cn(
                  "group flex items-center gap-2 p-2 rounded-lg border border-border bg-background transition-all hover:border-primary/30",
                  draggedIndex === index && "opacity-50 scale-[0.98]",
                )}
              >
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 cursor-grab" />
                <div className="flex-1 min-w-0">
                  {editingQuestionId === question.id ? (
                    <Input
                      value={question.text}
                      onChange={(e) => {
                        const updated = { ...template, questions: template.questions.map(q => q.id === question.id ? { ...q, text: e.target.value } : q) };
                        setTemplate(updated);
                        localStorage.setItem("journal_template", JSON.stringify(updated));
                      }}
                      onBlur={() => setEditingQuestionId(null)}
                      onKeyDown={(e) => e.key === "Enter" && setEditingQuestionId(null)}
                      autoFocus
                      className="h-7 text-xs"
                    />
                  ) : (
                    <button
                      onClick={() => setEditingQuestionId(question.id)}
                      className="w-full text-left text-xs text-foreground hover:text-primary truncate"
                    >
                      {question.text}
                    </button>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const updated = { ...template, questions: template.questions.filter(q => q.id !== question.id) };
                    setTemplate(updated);
                    localStorage.setItem("journal_template", JSON.stringify(updated));
                  }}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newQ: JournalQuestion = { id: `q${Date.now()}`, text: "New question...", type: "heading+answer" };
                const updated = { ...template, questions: [...template.questions, newQ] };
                setTemplate(updated);
                localStorage.setItem("journal_template", JSON.stringify(updated));
                setEditingQuestionId(newQ.id);
              }}
              className="flex-1 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const updated = { ...template, questions: [...DEFAULT_QUESTIONS] };
                setTemplate(updated);
                localStorage.setItem("journal_template", JSON.stringify(updated));
              }}
              className="text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Reset
            </Button>
          </div>
        </div>
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
        <SettingsRow label="Default Task Tab" description="Which task tab to show first">
          <Select
            value={settings.default_task_tab || "board"}
            onValueChange={(v) => saveField("default_task_tab", v)}
          >
            <SelectTrigger className="w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lists">Lists</SelectItem>
              <SelectItem value="board">Board</SelectItem>
              <SelectItem value="timeline">Timeline</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label="Default Board Mode" description="Which board categorization to use">
          <Select
            value={settings.default_task_view || "status"}
            onValueChange={(v) => saveField("default_task_view", v)}
          >
            <SelectTrigger className="w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="urgent-important">Urgent × Important</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="time">Time of Day</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label="Default Notes View" description="Which notes layout to show first">
          <Select
            value={settings.default_notes_view || "atlas"}
            onValueChange={(v) => saveField("default_notes_view", v)}
          >
            <SelectTrigger className="w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="atlas">Atlas</SelectItem>
              <SelectItem value="board">Board</SelectItem>
              <SelectItem value="mindmap">Mind Map</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label="Default Emotions Tab" description="Which emotions tab to show first">
          <Select
            value={settings.default_emotions_tab || "feel"}
            onValueChange={(v) => saveField("default_emotions_tab", v)}
          >
            <SelectTrigger className="w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feel">Feel</SelectItem>
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
