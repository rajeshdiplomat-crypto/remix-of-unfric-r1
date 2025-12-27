import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronRight, FolderOpen } from "lucide-react";
import type { NoteGroup, NoteFolder } from "@/pages/Notes";

interface NotesLocationPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: NoteGroup[];
  folders: NoteFolder[];
  onConfirm: (groupId: string, folderId: string | null) => void;
}

export function NotesLocationPicker({
  open,
  onOpenChange,
  groups,
  folders,
  onConfirm,
}: NotesLocationPickerProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedGroup("");
      setSelectedFolder(null);
    }
  }, [open]);

  const availableFolders = folders.filter((f) => f.groupId === selectedGroup);

  const handleConfirm = () => {
    if (selectedGroup) {
      onConfirm(selectedGroup, selectedFolder);
      onOpenChange(false);
    }
  };

  const getGroupName = (groupId: string) => {
    return groups.find((g) => g.id === groupId)?.name || "";
  };

  const getFolderName = (folderId: string | null) => {
    if (!folderId) return null;
    return folders.find((f) => f.id === folderId)?.name || null;
  };

  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Choose location for new note</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Group Selection - Required */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Group *</Label>
            <div className="flex flex-wrap gap-2">
              {sortedGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => {
                    setSelectedGroup(group.id);
                    setSelectedFolder(null);
                  }}
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

          {/* Folder Selection - Optional (only shown if group has folders) */}
          {selectedGroup && availableFolders.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Select Section (optional)
              </Label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                    ${selectedFolder === null 
                      ? "ring-2 ring-primary/50 bg-muted" 
                      : "bg-muted/30 hover:bg-muted/50"}
                  `}
                >
                  No section
                </button>
                {availableFolders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                      ${selectedFolder === folder.id 
                        ? "ring-2 ring-primary/50 bg-muted" 
                        : "bg-muted/30 hover:bg-muted/50"}
                    `}
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    {folder.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {selectedGroup && (
            <div className="bg-muted/30 rounded-lg px-3 py-2.5 text-sm text-muted-foreground flex items-center gap-1.5">
              Creating in: 
              <span className="text-foreground font-medium ml-1">{getGroupName(selectedGroup)}</span>
              {selectedFolder && (
                <>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="text-foreground font-medium">{getFolderName(selectedFolder)}</span>
                </>
              )}
            </div>
          )}

          {/* Actions */}
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
              disabled={!selectedGroup}
            >
              Create Note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
