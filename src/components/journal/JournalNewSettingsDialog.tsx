import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, GripVertical, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PresetQuestion {
  id: string;
  text: string;
}

export interface JournalSkin {
  id: string;
  name: string;
  bg: string;
  cardBg: string;
  borderColor: string;
  shadowIntensity: "none" | "light" | "medium";
  texture?: string;
}

export interface JournalSettingsData {
  presetQuestions: PresetQuestion[];
  enablePresetOnNewEntry: boolean;
  selectedSkin: string;
}

// Premium page skins
export const JOURNAL_SKINS: JournalSkin[] = [
  {
    id: "minimal-light",
    name: "Minimal Light",
    bg: "hsl(0, 0%, 98%)",
    cardBg: "hsl(0, 0%, 100%)",
    borderColor: "hsl(0, 0%, 90%)",
    shadowIntensity: "light",
  },
  {
    id: "warm-paper",
    name: "Warm Paper",
    bg: "hsl(40, 30%, 96%)",
    cardBg: "hsl(40, 40%, 98%)",
    borderColor: "hsl(35, 25%, 88%)",
    shadowIntensity: "light",
    texture: "paper",
  },
  {
    id: "soft-mint",
    name: "Soft Mint",
    bg: "hsl(150, 20%, 96%)",
    cardBg: "hsl(150, 25%, 98%)",
    borderColor: "hsl(150, 20%, 88%)",
    shadowIntensity: "light",
  },
  {
    id: "midnight-dark",
    name: "Midnight Dark",
    bg: "hsl(222, 47%, 8%)",
    cardBg: "hsl(222, 47%, 12%)",
    borderColor: "hsl(222, 30%, 20%)",
    shadowIntensity: "medium",
  },
  {
    id: "focus-grey",
    name: "Focus Grey",
    bg: "hsl(220, 10%, 94%)",
    cardBg: "hsl(220, 10%, 98%)",
    borderColor: "hsl(220, 10%, 85%)",
    shadowIntensity: "none",
  },
  {
    id: "sunset-beige",
    name: "Sunset Beige",
    bg: "hsl(30, 30%, 95%)",
    cardBg: "hsl(30, 35%, 98%)",
    borderColor: "hsl(25, 25%, 88%)",
    shadowIntensity: "light",
  },
  {
    id: "lavender-dream",
    name: "Lavender Dream",
    bg: "hsl(270, 20%, 96%)",
    cardBg: "hsl(270, 25%, 98%)",
    borderColor: "hsl(270, 20%, 88%)",
    shadowIntensity: "light",
  },
  {
    id: "ocean-calm",
    name: "Ocean Calm",
    bg: "hsl(200, 25%, 95%)",
    cardBg: "hsl(200, 30%, 98%)",
    borderColor: "hsl(200, 20%, 88%)",
    shadowIntensity: "light",
  },
];

const DEFAULT_QUESTIONS: PresetQuestion[] = [
  { id: "q1", text: "How are you feeling today?" },
  { id: "q2", text: "What are you grateful for?" },
  { id: "q3", text: "What act of kindness did you do or receive?" },
];

interface JournalNewSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: JournalSettingsData;
  onSave: (settings: JournalSettingsData) => void;
}

export function JournalNewSettingsDialog({
  open,
  onOpenChange,
  settings,
  onSave,
}: JournalNewSettingsDialogProps) {
  const [tempSettings, setTempSettings] = useState<JournalSettingsData>(settings);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addQuestion = () => {
    setTempSettings({
      ...tempSettings,
      presetQuestions: [
        ...tempSettings.presetQuestions,
        { id: generateId(), text: "New question..." },
      ],
    });
  };

  const updateQuestion = (id: string, text: string) => {
    setTempSettings({
      ...tempSettings,
      presetQuestions: tempSettings.presetQuestions.map((q) =>
        q.id === id ? { ...q, text } : q
      ),
    });
  };

  const removeQuestion = (id: string) => {
    if (tempSettings.presetQuestions.length <= 1) return;
    setTempSettings({
      ...tempSettings,
      presetQuestions: tempSettings.presetQuestions.filter((q) => q.id !== id),
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newQuestions = [...tempSettings.presetQuestions];
    const draggedItem = newQuestions[draggedIndex];
    newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(index, 0, draggedItem);

    setTempSettings({ ...tempSettings, presetQuestions: newQuestions });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const resetToDefault = () => {
    setTempSettings({
      ...tempSettings,
      presetQuestions: [...DEFAULT_QUESTIONS],
    });
  };

  const handleSave = () => {
    onSave(tempSettings);
    onOpenChange(false);
  };

  const selectedSkin = JOURNAL_SKINS.find((s) => s.id === tempSettings.selectedSkin) || JOURNAL_SKINS[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Journal Settings</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh] pr-4">
          <Tabs defaultValue="questions" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="questions" className="flex-1 text-xs">
                Preset Questions
              </TabsTrigger>
              <TabsTrigger value="skins" className="flex-1 text-xs">
                Page Skins
              </TabsTrigger>
            </TabsList>

            <TabsContent value="questions" className="space-y-4 py-4">
              {/* Enable preset toggle */}
              <div className="flex items-center justify-between">
                <Label className="text-sm">Apply preset questions on new entry</Label>
                <Switch
                  checked={tempSettings.enablePresetOnNewEntry}
                  onCheckedChange={(checked) =>
                    setTempSettings({ ...tempSettings, enablePresetOnNewEntry: checked })
                  }
                />
              </div>

              {/* Questions list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Questions</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetToDefault}
                      className="h-7 text-xs gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addQuestion}
                      className="h-7 text-xs gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {tempSettings.presetQuestions.map((question, index) => (
                    <div
                      key={question.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-card transition-all",
                        draggedIndex === index && "opacity-50 border-primary"
                      )}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab flex-shrink-0" />
                      <Input
                        value={question.text}
                        onChange={(e) => updateQuestion(question.id, e.target.value)}
                        className="text-sm border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                        placeholder="Enter question..."
                      />
                      {tempSettings.presetQuestions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(question.id)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="skins" className="py-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">Page Skins</Label>
                <div className="grid grid-cols-2 gap-3">
                  {JOURNAL_SKINS.map((skin) => (
                    <button
                      key={skin.id}
                      type="button"
                      onClick={() =>
                        setTempSettings({ ...tempSettings, selectedSkin: skin.id })
                      }
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all text-left",
                        tempSettings.selectedSkin === skin.id
                          ? "border-primary ring-1 ring-primary"
                          : "border-transparent hover:border-muted"
                      )}
                      style={{ backgroundColor: skin.bg }}
                    >
                      {/* Preview card */}
                      <div
                        className="h-12 rounded-lg mb-2"
                        style={{
                          backgroundColor: skin.cardBg,
                          borderColor: skin.borderColor,
                          borderWidth: 1,
                          boxShadow:
                            skin.shadowIntensity === "light"
                              ? "0 1px 3px rgba(0,0,0,0.05)"
                              : skin.shadowIntensity === "medium"
                              ? "0 2px 6px rgba(0,0,0,0.1)"
                              : "none",
                        }}
                      >
                        <div className="p-2 space-y-1">
                          <div
                            className="h-1.5 w-3/4 rounded"
                            style={{ backgroundColor: skin.borderColor }}
                          />
                          <div
                            className="h-1 w-1/2 rounded"
                            style={{ backgroundColor: skin.borderColor, opacity: 0.6 }}
                          />
                        </div>
                      </div>
                      <span
                        className="text-xs font-medium"
                        style={{
                          color: skin.id === "midnight-dark" ? "hsl(210, 40%, 90%)" : "hsl(222, 47%, 20%)",
                        }}
                      >
                        {skin.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: selectedSkin.bg }}>
                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: selectedSkin.cardBg,
                    borderColor: selectedSkin.borderColor,
                    borderWidth: 1,
                  }}
                >
                  <p
                    className="text-sm font-medium mb-2"
                    style={{
                      color: selectedSkin.id === "midnight-dark" ? "hsl(210, 40%, 95%)" : "hsl(222, 47%, 15%)",
                    }}
                  >
                    Preview: {selectedSkin.name}
                  </p>
                  <p
                    className="text-xs"
                    style={{
                      color: selectedSkin.id === "midnight-dark" ? "hsl(210, 30%, 70%)" : "hsl(222, 20%, 50%)",
                    }}
                  >
                    This is how your journal will look with this skin applied.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Apply Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
