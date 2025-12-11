import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Bold, Italic, Underline } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DiarySkin {
  id: string;
  name: string;
  bg: string;
  lineColor: string;
  marginColor: string;
  lineStyle: "lined" | "grid" | "dotted" | "blank";
}

export interface SectionSettings {
  header: string;
  prompts: string[];
  promptAnswers?: { [promptIndex: number]: string };
  headerStyle: {
    fontSize: number;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    color: string;
  };
  promptStyle: {
    fontSize: number;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    color: string;
  };
}

export interface JournalSettings {
  skin: DiarySkin;
  pageSize: "a5" | "a4" | "letter" | "custom";
  zoom: number;
  sections: {
    feeling: SectionSettings;
    gratitude: SectionSettings;
    kindness: SectionSettings;
  };
}

export type SaveScope = "current" | "all" | "future";

// Diary skin presets with line styles
export const DIARY_SKINS: DiarySkin[] = [
  { id: "classic", name: "Classic", bg: "hsl(45, 30%, 96%)", lineColor: "hsl(200, 70%, 85%)", marginColor: "hsl(0, 70%, 70%)", lineStyle: "lined" },
  { id: "cream", name: "Cream", bg: "hsl(40, 40%, 94%)", lineColor: "hsl(30, 20%, 85%)", marginColor: "hsl(30, 50%, 60%)", lineStyle: "lined" },
  { id: "dark", name: "Dark Mode", bg: "hsl(222, 47%, 11%)", lineColor: "hsl(222, 30%, 25%)", marginColor: "hsl(200, 70%, 50%)", lineStyle: "lined" },
  { id: "pink", name: "Soft Pink", bg: "hsl(350, 50%, 96%)", lineColor: "hsl(350, 40%, 88%)", marginColor: "hsl(350, 60%, 70%)", lineStyle: "lined" },
  { id: "green", name: "Sage Green", bg: "hsl(120, 20%, 95%)", lineColor: "hsl(120, 30%, 85%)", marginColor: "hsl(120, 40%, 50%)", lineStyle: "lined" },
  { id: "kraft", name: "Kraft Paper", bg: "hsl(35, 35%, 85%)", lineColor: "hsl(35, 25%, 75%)", marginColor: "hsl(0, 60%, 50%)", lineStyle: "lined" },
  { id: "grid", name: "Graph Paper", bg: "hsl(0, 0%, 98%)", lineColor: "hsl(200, 50%, 88%)", marginColor: "hsl(200, 70%, 60%)", lineStyle: "grid" },
  { id: "dotted", name: "Dot Grid", bg: "hsl(40, 20%, 97%)", lineColor: "hsl(0, 0%, 75%)", marginColor: "hsl(0, 60%, 50%)", lineStyle: "dotted" },
  { id: "blank", name: "Blank", bg: "hsl(0, 0%, 100%)", lineColor: "transparent", marginColor: "hsl(0, 70%, 70%)", lineStyle: "blank" },
  { id: "vintage", name: "Vintage", bg: "hsl(45, 40%, 90%)", lineColor: "hsl(30, 30%, 80%)", marginColor: "hsl(20, 60%, 50%)", lineStyle: "lined" },
  { id: "blue-grid", name: "Blue Grid", bg: "hsl(210, 40%, 98%)", lineColor: "hsl(210, 50%, 85%)", marginColor: "hsl(210, 70%, 50%)", lineStyle: "grid" },
  { id: "sepia", name: "Sepia", bg: "hsl(35, 45%, 88%)", lineColor: "hsl(35, 30%, 75%)", marginColor: "hsl(20, 50%, 45%)", lineStyle: "lined" },
];

const DEFAULT_COLORS = [
  { name: "Default", value: "default" },
  { name: "Black", value: "hsl(222, 47%, 11%)" },
  { name: "Blue", value: "hsl(200, 98%, 39%)" },
  { name: "Red", value: "hsl(0, 72%, 50%)" },
  { name: "Green", value: "hsl(142, 76%, 36%)" },
  { name: "Purple", value: "hsl(270, 50%, 50%)" },
];

interface JournalSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: JournalSettings;
  onSave: (settings: JournalSettings, scope: SaveScope) => void;
}

export function JournalSettingsDialog({
  open,
  onOpenChange,
  settings,
  onSave,
}: JournalSettingsDialogProps) {
  const [tempSettings, setTempSettings] = useState<JournalSettings>(settings);
  const [saveScope, setSaveScope] = useState<SaveScope>("current");

  const updateSection = (
    section: "feeling" | "gratitude" | "kindness",
    updates: Partial<SectionSettings>
  ) => {
    setTempSettings({
      ...tempSettings,
      sections: {
        ...tempSettings.sections,
        [section]: { ...tempSettings.sections[section], ...updates },
      },
    });
  };

  const addPrompt = (section: "feeling" | "gratitude" | "kindness") => {
    const currentPrompts = tempSettings.sections[section].prompts;
    updateSection(section, { prompts: [...currentPrompts, "New prompt..."] });
  };

  const updatePrompt = (
    section: "feeling" | "gratitude" | "kindness",
    index: number,
    value: string
  ) => {
    const newPrompts = [...tempSettings.sections[section].prompts];
    newPrompts[index] = value;
    updateSection(section, { prompts: newPrompts });
  };

  const removePrompt = (section: "feeling" | "gratitude" | "kindness", index: number) => {
    const newPrompts = tempSettings.sections[section].prompts.filter((_, i) => i !== index);
    updateSection(section, { prompts: newPrompts.length > 0 ? newPrompts : [""] });
  };

  const handleSave = () => {
    onSave(tempSettings, saveScope);
    onOpenChange(false);
  };

  const renderStyleControls = (
    section: "feeling" | "gratitude" | "kindness",
    type: "headerStyle" | "promptStyle",
    label: string
  ) => {
    const style = tempSettings.sections[section][type];
    return (
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Label className="text-xs">Size:</Label>
            <Select
              value={style.fontSize.toString()}
              onValueChange={(v) =>
                updateSection(section, {
                  [type]: { ...style, fontSize: parseInt(v) },
                })
              }
            >
              <SelectTrigger className="w-16 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[8, 9, 10, 11, 12, 14, 16, 18, 20].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-0.5">
            <Button
              type="button"
              variant={style.bold ? "default" : "outline"}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() =>
                updateSection(section, {
                  [type]: { ...style, bold: !style.bold },
                })
              }
            >
              <Bold className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant={style.italic ? "default" : "outline"}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() =>
                updateSection(section, {
                  [type]: { ...style, italic: !style.italic },
                })
              }
            >
              <Italic className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant={style.underline ? "default" : "outline"}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() =>
                updateSection(section, {
                  [type]: { ...style, underline: !style.underline },
                })
              }
            >
              <Underline className="h-3 w-3" />
            </Button>
          </div>
          <Select
            value={style.color}
            onValueChange={(v) =>
              updateSection(section, {
                [type]: { ...style, color: v },
              })
            }
          >
            <SelectTrigger className="w-20 h-7 text-xs">
              <SelectValue placeholder="Color" />
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_COLORS.map((c) => (
                <SelectItem key={c.name} value={c.value}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: c.value === "default" ? "currentColor" : c.value }}
                    />
                    {c.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  const renderSectionSettings = (section: "feeling" | "gratitude" | "kindness") => {
    const sectionSettings = tempSettings.sections[section];
    const sectionLabel = section.charAt(0).toUpperCase() + section.slice(1);

    return (
      <div className="space-y-4 py-4">
        <div>
          <Label className="text-sm font-medium">Section Header</Label>
          <Input
            value={sectionSettings.header}
            onChange={(e) => updateSection(section, { header: e.target.value })}
            className="mt-1"
            placeholder={`${sectionLabel} header...`}
          />
        </div>

        {renderStyleControls(section, "headerStyle", "Header Style")}
        {renderStyleControls(section, "promptStyle", "Prompt Style")}

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Prompts (each gets its own writing space)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addPrompt(section)}
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Prompt
            </Button>
          </div>
          <div className="space-y-2">
            {sectionSettings.prompts.map((prompt, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={prompt}
                  onChange={(e) => updatePrompt(section, index, e.target.value)}
                  placeholder={`Prompt ${index + 1}...`}
                  className="text-sm"
                />
                {sectionSettings.prompts.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePrompt(section, index)}
                    className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Journal Settings</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[55vh] pr-4">
          <Tabs defaultValue="page" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="page" className="flex-1 text-xs">Page</TabsTrigger>
              <TabsTrigger value="feeling" className="flex-1 text-xs">Feelings</TabsTrigger>
              <TabsTrigger value="gratitude" className="flex-1 text-xs">Gratitude</TabsTrigger>
              <TabsTrigger value="kindness" className="flex-1 text-xs">Kindness</TabsTrigger>
            </TabsList>

            <TabsContent value="page" className="space-y-4 py-4">
              {/* Page Size */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Page Size</Label>
                <Select
                  value={tempSettings.pageSize}
                  onValueChange={(v: "a5" | "a4" | "letter" | "custom") =>
                    setTempSettings({ ...tempSettings, pageSize: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a5">A5 (148 × 210 mm)</SelectItem>
                    <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                    <SelectItem value="letter">Letter (8.5 × 11 in)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Zoom */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Page Zoom</Label>
                  <span className="text-sm text-muted-foreground">{tempSettings.zoom}%</span>
                </div>
                <Slider
                  value={[tempSettings.zoom]}
                  onValueChange={([v]) => setTempSettings({ ...tempSettings, zoom: v })}
                  min={50}
                  max={150}
                  step={5}
                />
              </div>

              {/* Skin Selection */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Page Skin</Label>
                <div className="grid grid-cols-4 gap-2">
                  {DIARY_SKINS.map((skin) => (
                    <button
                      key={skin.id}
                      type="button"
                      onClick={() => setTempSettings({ ...tempSettings, skin })}
                      className={cn(
                        "p-1.5 rounded-lg border-2 transition-all text-[10px]",
                        tempSettings.skin.id === skin.id
                          ? "border-primary ring-1 ring-primary"
                          : "border-transparent hover:border-muted"
                      )}
                      style={{ backgroundColor: skin.bg }}
                    >
                      <div
                        className="h-6 rounded mb-0.5"
                        style={{
                          backgroundImage:
                            skin.lineStyle === "lined"
                              ? `linear-gradient(${skin.lineColor} 1px, transparent 1px)`
                              : skin.lineStyle === "grid"
                              ? `linear-gradient(${skin.lineColor} 1px, transparent 1px), linear-gradient(90deg, ${skin.lineColor} 1px, transparent 1px)`
                              : skin.lineStyle === "dotted"
                              ? `radial-gradient(circle, ${skin.lineColor} 1px, transparent 1px)`
                              : undefined,
                          backgroundSize:
                            skin.lineStyle === "lined"
                              ? "100% 6px"
                              : skin.lineStyle === "grid"
                              ? "6px 6px"
                              : skin.lineStyle === "dotted"
                              ? "8px 8px"
                              : undefined,
                        }}
                      />
                      <span
                        className="block truncate"
                        style={{
                          color: skin.id === "dark" ? "hsl(210, 40%, 90%)" : "hsl(222, 47%, 20%)",
                        }}
                      >
                        {skin.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="feeling">
              {renderSectionSettings("feeling")}
            </TabsContent>

            <TabsContent value="gratitude">
              {renderSectionSettings("gratitude")}
            </TabsContent>

            <TabsContent value="kindness">
              {renderSectionSettings("kindness")}
            </TabsContent>
          </Tabs>
        </ScrollArea>

        {/* Save Scope Options */}
        <div className="border-t pt-4">
          <Label className="text-sm font-medium mb-2 block">Apply changes to:</Label>
          <RadioGroup value={saveScope} onValueChange={(v) => setSaveScope(v as SaveScope)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="current" id="current" />
              <Label htmlFor="current" className="text-sm font-normal cursor-pointer">
                <span className="font-medium">Current page only</span>
                <span className="text-xs text-muted-foreground ml-1">- apply changes to this date only</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="text-sm font-normal cursor-pointer">
                <span className="font-medium">All existing pages</span>
                <span className="text-xs text-muted-foreground ml-1">- apply changes to all dates</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="future" id="future" />
              <Label htmlFor="future" className="text-sm font-normal cursor-pointer">
                <span className="font-medium">All future pages (default template)</span>
                <span className="text-xs text-muted-foreground ml-1">- current + future dates, exclude past</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

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
