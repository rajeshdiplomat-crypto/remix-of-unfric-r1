import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical, RotateCcw, Check, Sparkles, Edit3, Palette, Type, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { JournalTemplate, JournalQuestion, JournalSkin, JOURNAL_SKINS, DEFAULT_QUESTIONS } from "./types";

const LINE_STYLE_OPTIONS = [
  { value: "none", label: "No Lines" },
  { value: "ruled", label: "Ruled" },
  { value: "grid", label: "Grid" },
  { value: "dotted", label: "Dotted" },
  { value: "college", label: "College" },
];

interface JournalSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "global" | "entry";
  // Global mode props
  template?: JournalTemplate;
  onTemplateChange?: (template: JournalTemplate) => void;
  currentSkinId: string;
  onSkinChange: (skinId: string) => void;
  currentLineStyle?: string;
  onLineStyleChange?: (lineStyle: string) => void;
  // Entry mode props
  entryMode?: "structured" | "unstructured";
  onEntryOverrideSave?: (skinId: string, lineStyle: string, mode?: "structured" | "unstructured") => void;
  onEntryOverrideReset?: () => void;
}

export function JournalSettingsModal({
  open, onOpenChange, mode,
  template, onTemplateChange,
  currentSkinId, onSkinChange,
  currentLineStyle = "none",
  onLineStyleChange,
  entryMode,
  onEntryOverrideSave,
  onEntryOverrideReset,
}: JournalSettingsModalProps) {
  const [localQuestions, setLocalQuestions] = useState<JournalQuestion[]>(template?.questions || []);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedSkinId, setSelectedSkinId] = useState(currentSkinId);
  const [selectedLineStyle, setSelectedLineStyle] = useState(currentLineStyle);
  const [selectedMode, setSelectedMode] = useState<"structured" | "unstructured">(entryMode || "structured");

  // Re-sync internal state when modal opens with new props
  useEffect(() => {
    if (open) {
      setSelectedSkinId(currentSkinId);
      setSelectedLineStyle(currentLineStyle);
      setSelectedMode(entryMode || "structured");
      setLocalQuestions(template?.questions || []);
      setEditingId(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQuestionTextChange = (id: string, text: string) => {
    setLocalQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, text } : q)));
  };

  const handleAddQuestion = () => {
    const newQuestion: JournalQuestion = {
      id: `q${Date.now()}`,
      text: "New question...",
      type: "heading+answer",
    };
    setLocalQuestions((prev) => [...prev, newQuestion]);
    setEditingId(newQuestion.id);
  };

  const handleDeleteQuestion = (id: string) => {
    setLocalQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleResetToDefault = () => {
    if (mode === "entry") {
      onEntryOverrideReset?.();
      onOpenChange(false);
      return;
    }
    setLocalQuestions([...DEFAULT_QUESTIONS]);
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newQuestions = [...localQuestions];
    const [draggedItem] = newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(index, 0, draggedItem);
    setLocalQuestions(newQuestions);
    setDraggedIndex(index);
  };
  const handleDragEnd = () => setDraggedIndex(null);

  const handleSave = () => {
    if (mode === "entry") {
      onEntryOverrideSave?.(selectedSkinId, selectedLineStyle, selectedMode);
      onOpenChange(false);
      return;
    }
    if (template && onTemplateChange) {
      onTemplateChange({
        ...template,
        questions: localQuestions,
        defaultSkinId: selectedSkinId,
        defaultLineStyle: selectedLineStyle,
      });
    }
    onSkinChange(selectedSkinId);
    onLineStyleChange?.(selectedLineStyle);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col bg-card border border-border shadow-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-light uppercase tracking-wider text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            {mode === "entry" ? "Entry Appearance" : "Journal Settings"}
          </DialogTitle>
          {mode === "entry" && (
            <p className="text-xs text-muted-foreground mt-1">Customize the look of this entry only</p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          {/* Skin Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Journal Skin</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {JOURNAL_SKINS.map((skin) => (
                <button
                  key={skin.id}
                  onClick={() => setSelectedSkinId(skin.id)}
                  className={cn(
                    "relative p-3 rounded-lg border transition-all text-left",
                    selectedSkinId === skin.id
                      ? "border-primary ring-1 ring-primary"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <div
                    className="h-8 rounded-md mb-2 border"
                    style={{ backgroundColor: skin.cardBg, borderColor: skin.border }}
                  >
                    <div className="h-2 w-2/3 rounded-sm mt-2 ml-2" style={{ backgroundColor: skin.accent }} />
                  </div>
                  <p className="text-xs font-medium text-foreground">{skin.name}</p>
                  {selectedSkinId === skin.id && (
                    <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Line Style */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Type className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Editor Lines</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {LINE_STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedLineStyle(opt.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                    selectedLineStyle === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground/30"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Entry mode: Reset button */}
          {mode === "entry" && (
            <>
              {/* Entry Mode */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Entry Mode</span>
                </div>
                <div className="flex gap-2">
                  {(["structured", "unstructured"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedMode(m)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all capitalize",
                        selectedMode === m
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-muted-foreground/30"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={handleResetToDefault} className="text-xs w-full">
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset to Default
              </Button>
            </>
          )}

          {/* Global mode: Questions & Template */}
          {mode === "global" && template && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Edit3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Questions & Template</span>
              </div>


              <div className="space-y-2">
                {localQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "group flex items-center gap-3 p-3 rounded-lg bg-background border border-border transition-all hover:border-primary/30",
                      draggedIndex === index && "opacity-50 scale-[0.98]",
                    )}
                  >
                    <div className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted transition-colors">
                      <GripVertical className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingId === question.id ? (
                        <Input
                          value={question.text}
                          onChange={(e) => handleQuestionTextChange(question.id, e.target.value)}
                          onBlur={() => setEditingId(null)}
                          onKeyDown={(e) => e.key === "Enter" && setEditingId(null)}
                          autoFocus
                          className="h-7 text-xs"
                        />
                      ) : (
                        <button
                          onClick={() => setEditingId(question.id)}
                          className="w-full text-left text-sm text-foreground hover:text-primary transition-colors truncate"
                        >
                          {question.text}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(question.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-primary">
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(question.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={handleAddQuestion} className="flex-1 text-xs border-dashed">
                  <Plus className="h-4 w-4 mr-1.5" /> Add Question
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setLocalQuestions([...DEFAULT_QUESTIONS]); }} className="text-xs">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
