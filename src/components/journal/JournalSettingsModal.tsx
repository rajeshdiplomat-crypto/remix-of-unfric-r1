import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  JournalTemplate,
  JournalQuestion,
  JournalSkin,
  JOURNAL_SKINS,
  DEFAULT_QUESTIONS,
} from "./types";

interface JournalSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: JournalTemplate;
  onTemplateChange: (template: JournalTemplate) => void;
  currentSkinId: string;
  onSkinChange: (skinId: string) => void;
}

export function JournalSettingsModal({
  open,
  onOpenChange,
  template,
  onTemplateChange,
  currentSkinId,
  onSkinChange,
}: JournalSettingsModalProps) {
  const [localQuestions, setLocalQuestions] = useState<JournalQuestion[]>(
    template.questions
  );
  const [applyOnNewEntry, setApplyOnNewEntry] = useState(template.applyOnNewEntry);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleQuestionTextChange = (id: string, text: string) => {
    setLocalQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, text } : q))
    );
  };

  const handleAddQuestion = () => {
    const newQuestion: JournalQuestion = {
      id: `q${Date.now()}`,
      text: "New question...",
      type: "heading+answer",
    };
    setLocalQuestions((prev) => [...prev, newQuestion]);
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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Journal Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="questions" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="questions">Preset Questions</TabsTrigger>
            <TabsTrigger value="skins">Page Skins</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="flex-1 overflow-auto space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="apply-preset"
                  checked={applyOnNewEntry}
                  onCheckedChange={setApplyOnNewEntry}
                />
                <Label htmlFor="apply-preset" className="text-sm">
                  Apply preset questions on new entry
                </Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetToDefault}
                className="text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset to default
              </Button>
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
                    "flex items-center gap-2 p-2 rounded-md border border-border/50 bg-card transition-all",
                    draggedIndex === index && "opacity-50"
                  )}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab flex-shrink-0" />
                  <Input
                    value={question.text}
                    onChange={(e) =>
                      handleQuestionTextChange(question.id, e.target.value)
                    }
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleAddQuestion}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Question
            </Button>
          </TabsContent>

          <TabsContent value="skins" className="flex-1 overflow-auto mt-4">
            <div className="grid grid-cols-2 gap-3">
              {JOURNAL_SKINS.map((skin) => (
                <Card
                  key={skin.id}
                  className={cn(
                    "p-3 cursor-pointer transition-all hover:shadow-md relative overflow-hidden",
                    currentSkinId === skin.id && "ring-2 ring-primary"
                  )}
                  style={{
                    backgroundColor: skin.cardBg,
                    borderColor: skin.border,
                  }}
                  onClick={() => onSkinChange(skin.id)}
                >
                  {currentSkinId === skin.id && (
                    <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <div
                      className="h-12 rounded-md"
                      style={{ backgroundColor: skin.pageBg }}
                    >
                      <div
                        className="h-full m-1 rounded"
                        style={{ backgroundColor: skin.editorPaperBg }}
                      />
                    </div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: skin.text }}
                    >
                      {skin.name}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
