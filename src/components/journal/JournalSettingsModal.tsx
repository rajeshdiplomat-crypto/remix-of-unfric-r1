import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, GripVertical, RotateCcw, Check, Sparkles, Palette, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { JournalTemplate, JournalQuestion, JournalSkin, JOURNAL_SKINS, DEFAULT_QUESTIONS } from "./types";

interface JournalSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: JournalTemplate;
  onTemplateChange: (template: JournalTemplate) => void;
}

export function JournalSettingsModal({ open, onOpenChange, template, onTemplateChange }: JournalSettingsModalProps) {
  const [localQuestions, setLocalQuestions] = useState<JournalQuestion[]>(template.questions);
  const [applyOnNewEntry, setApplyOnNewEntry] = useState(template.applyOnNewEntry);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

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
    setLocalQuestions([...DEFAULT_QUESTIONS]);
    setApplyOnNewEntry(true);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newQuestions = [...localQuestions];
    const [draggedItem] = newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(index, 0, draggedItem);
    setLocalQuestions(newQuestions);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = () => {
    onTemplateChange({
      ...template,
      questions: localQuestions,
      applyOnNewEntry,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col bg-gradient-to-b from-slate-50 to-white border-0 shadow-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Journal Settings
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Edit3 className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-semibold text-slate-700">Questions & Template</span>
          </div>

          <div className="flex-1 overflow-auto space-y-4">

            {/* Auto-apply Toggle (hidden when unstructured) */}
            {(
              <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-100 rounded-xl">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <Label htmlFor="apply-preset" className="text-sm font-semibold text-slate-700">
                      Auto-apply on new entries
                    </Label>
                    <p className="text-xs text-slate-400">Add these prompts when you start a new day</p>
                  </div>
                </div>
                <Switch
                  id="apply-preset"
                  checked={applyOnNewEntry}
                  onCheckedChange={setApplyOnNewEntry}
                  className="data-[state=checked]:bg-violet-500"
                />
              </div>
            )}

            {/* Questions List */}
            {<div className="space-y-2">
              {localQuestions.map((question, index) => (
                <div
                  key={question.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "group flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm transition-all hover:border-violet-200 hover:shadow-md",
                    draggedIndex === index && "opacity-50 scale-[0.98]",
                  )}
                >
                  <div className="cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-slate-100 transition-colors">
                    <GripVertical className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {editingId === question.id ? (
                      <Input
                        value={question.text}
                        onChange={(e) => handleQuestionTextChange(question.id, e.target.value)}
                        onBlur={() => setEditingId(null)}
                        onKeyDown={(e) => e.key === "Enter" && setEditingId(null)}
                        autoFocus
                        className="border-violet-200 focus-visible:ring-violet-300"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingId(question.id)}
                        className="w-full text-left text-sm font-medium text-slate-700 hover:text-violet-600 transition-colors truncate"
                      >
                        {question.text}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(question.id)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-violet-500 hover:bg-violet-50"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>}

            {/* Add & Reset Buttons */}
            {<div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddQuestion}
                className="flex-1 rounded-xl border-dashed border-violet-200 text-violet-600 hover:bg-violet-50 hover:border-violet-300"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Question
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetToDefault}
                className="rounded-xl text-slate-500 hover:text-slate-700"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset
              </Button>
            </div>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-purple-200/50"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
