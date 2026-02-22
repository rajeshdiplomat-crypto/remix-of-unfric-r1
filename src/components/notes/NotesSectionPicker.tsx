import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderPlus } from "lucide-react";
import type { NoteGroup } from "@/pages/Notes";

interface NotesSectionPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: NoteGroup[];
  onConfirm: (groupId: string, sectionName: string) => void;
}

export function NotesSectionPicker({
  open,
  onOpenChange,
  groups,
  onConfirm,
}: NotesSectionPickerProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [sectionName, setSectionName] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedGroup("");
      setSectionName("");
    }
  }, [open]);

  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleConfirm = () => {
    if (selectedGroup && sectionName.trim()) {
      onConfirm(selectedGroup, sectionName.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md p-0 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-4 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold text-primary-foreground flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            New Section
          </DialogTitle>
          <p className="text-xs text-primary-foreground/70 mt-0.5">Add a section to organize notes within a group</p>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Group Selection */}
          <div className="space-y-2.5">
            <Label className="text-sm font-medium">Select Group</Label>
            <div className="flex flex-wrap gap-2">
              {sortedGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(group.id)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all
                    ${selectedGroup === group.id
                      ? "ring-2 ring-primary bg-primary/10 shadow-sm"
                      : "bg-muted/50 hover:bg-muted border border-border/30"}
                  `}
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  {group.name}
                </button>
              ))}
            </div>
          </div>

          {/* Section Name */}
          {selectedGroup && (
            <div className="space-y-2.5">
              <Label className="text-sm font-medium">Section Name</Label>
              <Input
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                placeholder="e.g. Research, Ideas, Archive..."
                className="h-10 rounded-xl"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirm();
                }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl"
              onClick={handleConfirm}
              disabled={!selectedGroup || !sectionName.trim()}
            >
              Create Section
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
