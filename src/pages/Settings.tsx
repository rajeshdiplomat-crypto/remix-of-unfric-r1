import { useState, useEffect, useCallback } from "react";
import { useUserPreferences } from "@/hooks/useUserSettings";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  PenLine,
  Bell,
  Shield,
  Clock,
  LayoutDashboard,
  Download,
  Trash2,
  UserX,
  ChevronRight,
  Loader2,
  Plus,
  RotateCcw,
  GripVertical,
  Edit3,
  Save,
  MessageSquareHeart,
  ChevronDown,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UnifiedTimePicker } from "@/components/common/UnifiedTimePicker";
import { cn } from "@/lib/utils";
import { HelpFeedbackForm } from "@/components/settings/HelpFeedbackForm";
import { useNotificationPermission } from "@/hooks/useNotifications";
import {
  JournalTemplate,
  JournalQuestion,
  DEFAULT_QUESTIONS,
  DEFAULT_TEMPLATE,
  JOURNAL_SKINS,
} from "@/components/journal/types";

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
  time_format: string | null;
  reminder_time_diary: string | null;
  reminder_time_habits: string | null;
  reminder_time_emotions: string | null;
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
  const { permission, supported, requestPermission } = useNotificationPermission();

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (result === "granted") {
      toast.success("Notifications enabled! You'll get reminders at the scheduled time.");
    } else if (result === "denied") {
      toast.error("Notifications blocked. Please enable them in your browser settings.");
    }
  };

  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { prefs, updatePrefs } = useUserPreferences();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearDialog, setClearDialog] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Journal template state - load from DB prefs first, then localStorage fallback
  const [template, setTemplate] = useState<JournalTemplate>(() => {
    if (prefs.journal_template) {
      return prefs.journal_template as unknown as JournalTemplate;
    }
    const saved = localStorage.getItem("journal_template");
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATE;
  });
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Sync template from DB when prefs load
  useEffect(() => {
    if (prefs.journal_template) {
      setTemplate(prefs.journal_template as unknown as JournalTemplate);
    }
  }, [prefs.journal_template]);

  // ── Load Settings ────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("user_settings").select("*").eq("user_id", user.id).single();

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
          time_format: data.time_format ?? "24h",
          reminder_time_diary: (data as any).reminder_time_diary ?? "08:00",
          reminder_time_habits: (data as any).reminder_time_habits ?? "08:00",
          reminder_time_emotions: (data as any).reminder_time_emotions ?? "08:00",
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
          time_format: "24h",
          reminder_time_diary: "08:00",
          reminder_time_habits: "08:00",
          reminder_time_emotions: "08:00",
        };
        await supabase.from("user_settings").insert({ user_id: user.id, ...defaults });
        setSettings(defaults);
      }
      setLoading(false);
    })();
  }, [user]);

  // ── Dirty tracking for Save button ──────────────────────────────
  const [isDirty, setIsDirty] = useState(false);
  const [pendingSettings, setPendingSettings] = useState<Partial<UserSettings>>({});

  // ── Local change helper (no DB write) ──────────────────────────
  const updateField = (field: keyof UserSettings, value: any) => {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
    setPendingSettings((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // ── Save all pending changes ───────────────────────────────────
  const handleSaveAll = async () => {
    if (!user || !isDirty) return;
    setSaving(true);
    try {
      // Save DB settings
      if (Object.keys(pendingSettings).length > 0) {
        await supabase.from("user_settings").update(pendingSettings).eq("user_id", user.id);
      }
      // Save journal template to DB
      await updatePrefs({ journal_template: template as any });
      setPendingSettings({});
      setIsDirty(false);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Legacy helper kept for non-settings-page callers
  // Now also writes to DB immediately so changes like default_home_screen
  // and notification settings take effect right away
  const saveField = async (field: keyof UserSettings, value: any) => {
    updateField(field, value);

    // When a reminder time changes, clear the "already sent" flag so it can fire again today
    const reminderTypeMap: Record<string, string> = {
      reminder_time_diary: "diary",
      reminder_time_habits: "habits",
      reminder_time_emotions: "emotions",
    };
    const notifType = reminderTypeMap[field];
    if (notifType) {
      const today = new Date().toISOString().split("T")[0];
      localStorage.removeItem(`unfric_notif_sent_${notifType}_${today}`);
    }

    if (user) {
      await supabase
        .from("user_settings")
        .update({ [field]: value })
        .eq("user_id", user.id);
    }
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

  // ── Export PDF ────────────────────────────────────────────────────

  const handleExportPdf = async () => {
    if (!user) return;
    setExportLoading(true);
    try {
      const [emotions, journal, habits, notes, tasks, goals] = await Promise.all([
        supabase.from("emotions").select("*").eq("user_id", user.id),
        supabase.from("journal_entries").select("*").eq("user_id", user.id),
        supabase.from("habits").select("*").eq("user_id", user.id),
        supabase.from("notes").select("*").eq("user_id", user.id),
        supabase.from("tasks").select("*").eq("user_id", user.id),
        supabase.from("manifest_goals").select("*").eq("user_id", user.id),
      ]);

      const doc = new jsPDF();
      let y = 20;
      const pageH = 280;
      const marginLeft = 14;

      const checkPage = (needed: number) => {
        if (y + needed > pageH) { doc.addPage(); y = 20; }
      };

      const addHeading = (text: string) => {
        checkPage(14);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(text, marginLeft, y);
        y += 8;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
      };

      const addLine = (text: string) => {
        checkPage(6);
        const lines = doc.splitTextToSize(text, 180);
        doc.text(lines, marginLeft, y);
        y += lines.length * 4.5;
      };

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Unfric Data Export", marginLeft, y);
      y += 8;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Exported: ${new Date().toLocaleDateString()}`, marginLeft, y);
      y += 12;

      // Emotions
      addHeading(`Emotions (${emotions.data?.length || 0})`);
      (emotions.data || []).forEach((e: any) => {
        addLine(`${e.entry_date} — ${e.emotion}${e.notes ? ': ' + e.notes : ''}`);
      });
      y += 4;

      // Journal
      addHeading(`Journal Entries (${journal.data?.length || 0})`);
      (journal.data || []).forEach((e: any) => {
        addLine(`${e.entry_date}${e.daily_feeling ? ' — Feeling: ' + e.daily_feeling : ''}${e.daily_gratitude ? ' — Gratitude: ' + e.daily_gratitude : ''}`);
      });
      y += 4;

      // Habits
      addHeading(`Habits (${habits.data?.length || 0})`);
      (habits.data || []).forEach((h: any) => {
        addLine(`${h.name}${h.description ? ' — ' + h.description : ''} (${h.frequency || 'daily'})`);
      });
      y += 4;

      // Notes
      addHeading(`Notes (${notes.data?.length || 0})`);
      (notes.data || []).forEach((n: any) => {
        addLine(`${n.title}${n.category ? ' [' + n.category + ']' : ''}`);
      });
      y += 4;

      // Tasks
      addHeading(`Tasks (${tasks.data?.length || 0})`);
      (tasks.data || []).forEach((t: any) => {
        addLine(`${t.is_completed ? '✓' : '○'} ${t.title}${t.due_date ? ' — Due: ' + new Date(t.due_date).toLocaleDateString() : ''}`);
      });
      y += 4;

      // Manifest Goals
      addHeading(`Manifest Goals (${goals.data?.length || 0})`);
      (goals.data || []).forEach((g: any) => {
        addLine(`${g.is_completed ? '✓' : '○'} ${g.title}${g.description ? ' — ' + g.description : ''}`);
      });

      doc.save(`unfric-export-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF exported successfully");
    } catch (e) {
      toast.error("PDF export failed");
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

      await supabase
        .from(tableKey as any)
        .delete()
        .eq("user_id", user.id);
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
    <div className="max-w-2xl mx-auto px-4 py-8 pb-16 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light uppercase tracking-[0.15em] text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your preferences and data</p>
        </div>
        {isDirty && (
          <Button onClick={handleSaveAll} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Changes
          </Button>
        )}
      </div>

      {/* ─── Section 1: Journal Preferences ─── */}
      <SettingsSection icon={PenLine} title="Journal Preferences">
        <SettingsRow label="Journal Mode" description="Structured uses prompts, unstructured is freeform">
          <Select value={settings.journal_mode || "structured"} onValueChange={(v) => saveField("journal_mode", v)}>
            <SelectTrigger className="w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="structured">Structured</SelectItem>
              <SelectItem value="unstructured">Unstructured</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label="Default Journal Skin" description="Choose the default skin for journal entries">
          <Select
            value={template.defaultSkinId}
            onValueChange={(v) => {
              const updated = { ...template, defaultSkinId: v };
              setTemplate(updated);
              localStorage.setItem("journal_template", JSON.stringify(updated));
              localStorage.setItem("journal_skin_id", v);
              setIsDirty(true);
            }}
          >
            <SelectTrigger className="w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JOURNAL_SKINS.map((skin) => (
                <SelectItem key={skin.id} value={skin.id} className="text-xs">
                  {skin.name}
                </SelectItem>
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
              setIsDirty(true);
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
          <p className="text-[11px] text-muted-foreground italic">
            These settings apply to new journal entries going forward. Existing entries keep their original look.
          </p>
        </div>

        {/* Questions inline editor */}
        <div
          className={cn(
            "px-4 py-3 border-b border-border last:border-b-0",
            (settings.journal_mode || "structured") === "unstructured" && "opacity-50 pointer-events-none",
          )}
        >
          <p className="text-sm font-light text-foreground mb-1">Template Questions</p>
          <p className="text-[11px] text-muted-foreground mb-3">
            {(settings.journal_mode || "structured") === "unstructured"
              ? "Switch to Structured mode to edit questions"
              : "Drag to reorder, click to edit"}
          </p>
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
                  setIsDirty(true);
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
                        const updated = {
                          ...template,
                          questions: template.questions.map((q) =>
                            q.id === question.id ? { ...q, text: e.target.value } : q,
                          ),
                        };
                        setTemplate(updated);
                        localStorage.setItem("journal_template", JSON.stringify(updated));
                        setIsDirty(true);
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
                    const updated = { ...template, questions: template.questions.filter((q) => q.id !== question.id) };
                    setTemplate(updated);
                    localStorage.setItem("journal_template", JSON.stringify(updated));
                    setIsDirty(true);
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
                setIsDirty(true);
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
                setIsDirty(true);
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
        {/* Reminder Method */}
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-light text-foreground mb-1">Reminder Method</p>
          <p className="text-[11px] text-muted-foreground mb-3">Choose how you'd like to receive reminders</p>
          <div className="space-y-2">
            {/* App (Browser) Notifications — Active */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bell className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">App Notifications</p>
                  <p className="text-[10px] text-muted-foreground">
                    {permission === "granted"
                      ? "Enabled — reminders fire when browser is open"
                      : permission === "denied"
                        ? "Blocked in browser settings"
                        : "Browser push notifications"}
                  </p>
                </div>
              </div>
              {permission === "granted" ? (
                <span className="text-[10px] text-primary flex items-center gap-1 flex-shrink-0">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                  Active
                </span>
              ) : (
                <Button
                  variant={permission === "denied" ? "outline" : "default"}
                  size="sm"
                  onClick={handleRequestPermission}
                  className="text-[10px] h-7 px-2.5"
                  disabled={permission === "denied"}
                >
                  {permission === "denied" ? "Blocked" : "Enable"}
                </Button>
              )}
            </div>

            {/* WhatsApp — Coming Soon */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background opacity-60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.549 4.106 1.513 5.839L.06 23.49l5.824-1.525A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82c-1.908 0-3.727-.514-5.32-1.483l-.382-.227-3.96 1.039 1.057-3.863-.249-.396A9.808 9.808 0 012.18 12c0-5.422 4.398-9.82 9.82-9.82 5.422 0 9.82 4.398 9.82 9.82 0 5.422-4.398 9.82-9.82 9.82z"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">WhatsApp Reminders</p>
                  <p className="text-[10px] text-muted-foreground">Get reminders via WhatsApp messages</p>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">Coming Soon</span>
            </div>

            {/* SMS — Coming Soon */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background opacity-60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-md bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="h-3.5 w-3.5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">Text (SMS) Reminders</p>
                  <p className="text-[10px] text-muted-foreground">Get reminders via text message</p>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">Coming Soon</span>
            </div>
          </div>
        </div>

        {/* Individual reminder toggles with per-module times */}
        <div className="px-4 py-3 border-b border-border last:border-b-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-4">
              <p className="text-sm font-light text-foreground">Daily Journal Reminder</p>
              <p className="text-[11px] text-muted-foreground">Get reminded to write in your journal</p>
            </div>
            <Switch
              checked={settings.notification_diary_prompt ?? true}
              onCheckedChange={(v) => saveField("notification_diary_prompt", v)}
            />
          </div>
          <div className={cn("mt-2 flex items-center gap-2", !(settings.notification_diary_prompt ?? true) && "opacity-40 pointer-events-none")}>
            <span className="text-[11px] text-muted-foreground">Remind at</span>
            <UnifiedTimePicker
              value={settings.reminder_time_diary || "08:00"}
              onChange={(v) => saveField("reminder_time_diary", v)}
              triggerClassName="w-24 text-xs h-7"
            />
          </div>
        </div>
        <div className="px-4 py-3 border-b border-border last:border-b-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-4">
              <p className="text-sm font-light text-foreground">Habit Check-in Reminders</p>
              <p className="text-[11px] text-muted-foreground">Get nudged to complete your habits</p>
            </div>
            <Switch
              checked={settings.notification_task_reminder ?? true}
              onCheckedChange={(v) => saveField("notification_task_reminder", v)}
            />
          </div>
          <div className={cn("mt-2 flex items-center gap-2", !(settings.notification_task_reminder ?? true) && "opacity-40 pointer-events-none")}>
            <span className="text-[11px] text-muted-foreground">Remind at</span>
            <UnifiedTimePicker
              value={settings.reminder_time_habits || "08:00"}
              onChange={(v) => saveField("reminder_time_habits", v)}
              triggerClassName="w-24 text-xs h-7"
            />
          </div>
        </div>
        <div className="px-4 py-3 border-b border-border last:border-b-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-4">
              <p className="text-sm font-light text-foreground">Emotion Check-in Nudges</p>
              <p className="text-[11px] text-muted-foreground">Periodic reminders to log your emotions</p>
            </div>
            <Switch
              checked={settings.notification_emotion_checkin ?? true}
              onCheckedChange={(v) => saveField("notification_emotion_checkin", v)}
            />
          </div>
          <div className={cn("mt-2 flex items-center gap-2", !(settings.notification_emotion_checkin ?? true) && "opacity-40 pointer-events-none")}>
            <span className="text-[11px] text-muted-foreground">Remind at</span>
            <UnifiedTimePicker
              value={settings.reminder_time_emotions || "08:00"}
              onChange={(v) => saveField("reminder_time_emotions", v)}
              triggerClassName="w-24 text-xs h-7"
            />
          </div>
        </div>
      </SettingsSection>

      {/* ─── Section 3: Data & Privacy ─── */}
      <SettingsSection icon={Shield} title="Data & Privacy">
        <div className="px-4 py-3 border-b border-border last:border-b-0">
          <div className="flex-1 min-w-0 mb-2">
            <p className="text-sm font-light text-foreground">Export Data</p>
            <p className="text-[11px] text-muted-foreground">Download all your data</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              disabled={exportLoading}
              className="text-xs uppercase tracking-wider"
            >
              {exportLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={exportLoading}
              className="text-xs uppercase tracking-wider"
            >
              {exportLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}
              PDF
            </Button>
          </div>
        </div>
        <SettingsRow label="Clear Module Data" description="Reset data for a specific module">
          <Select onValueChange={(v) => setClearDialog(v)}>
            <SelectTrigger className="w-32 text-xs">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {MODULES_FOR_CLEAR.map((m) => (
                <SelectItem key={m.key} value={m.table}>
                  {m.label}
                </SelectItem>
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
        <SettingsRow label="Time Format" description="12-hour (AM/PM) or 24-hour clock">
          <Select
            value={settings.time_format || "24h"}
            onValueChange={(v) => saveField("time_format", v)}
          >
            <SelectTrigger className="w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12h">12-hour</SelectItem>
              <SelectItem value="24h">24-hour</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
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
                <SelectItem key={tz} value={tz} className="text-xs">
                  {tz.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label="Date Format" description="Controls all calendar and date displays">
          <Select value={settings.date_format || "MM/DD"} onValueChange={(v) => saveField("date_format", v)}>
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
          <Select value={settings.start_of_week || "monday"} onValueChange={(v) => saveField("start_of_week", v)}>
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
          <Select value={settings.default_task_tab || "board"} onValueChange={(v) => saveField("default_task_tab", v)}>
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
        <div className={cn((settings.default_task_tab || "board") !== "board" && "opacity-50 pointer-events-none")}>
          <SettingsRow
            label="Default Board Mode"
            description={
              (settings.default_task_tab || "board") !== "board"
                ? "Switch to Board tab to edit this"
                : "Which board categorization to use"
            }
          >
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
        </div>
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

      {/* ─── Section: Help & Feedback ─── */}
      <SettingsSection icon={MessageSquareHeart} title="Help & Feedback">
        <div className="px-4 py-4">
          <HelpFeedbackForm />
        </div>
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
            <Button variant="outline" onClick={() => setClearDialog(null)}>
              Cancel
            </Button>
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
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
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
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full group">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{title}</h2>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1 rounded-xl border border-border bg-card overflow-hidden mt-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
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
