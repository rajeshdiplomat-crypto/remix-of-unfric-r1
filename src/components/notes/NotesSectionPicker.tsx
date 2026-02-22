import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Section</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Group *</Label>
            <div className="flex flex-wrap gap-2">
              {sortedGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(group.id)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                    ${selectedGroup === group.id
                      ? "ring-2 ring-primary bg-primary/10"
                      : "bg-muted/50 hover:bg-muted"}
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

          {selectedGroup && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Section Name *</Label>
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

          <div className="flex gap-2 pt-1">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
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
