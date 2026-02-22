import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronRight, FolderOpen, FileText } from "lucide-react";
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

  const getGroupName = (groupId: string) => groups.find((g) => g.id === groupId)?.name || "";
  const getFolderName = (folderId: string | null) => {
    if (!folderId) return null;
    return folders.find((f) => f.id === folderId)?.name || null;
  };

  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md p-0 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-4 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold text-primary-foreground flex items-center gap-2">
            <FileText className="h-5 w-5" />
            New Note
          </DialogTitle>
          <p className="text-xs text-primary-foreground/70 mt-0.5">Choose where to save your note</p>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Group Selection */}
          <div className="space-y-2.5">
            <Label className="text-sm font-medium">Select Group</Label>
            <div className="flex flex-wrap gap-2">
              {sortedGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => {
                    setSelectedGroup(group.id);
                    setSelectedFolder(null);
                  }}
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

          {/* Folder Selection */}
          {selectedGroup && availableFolders.length > 0 && (
            <div className="space-y-2.5">
              <Label className="text-sm font-medium text-muted-foreground">
                Select Section (optional)
              </Label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all
                    ${selectedFolder === null 
                      ? "ring-2 ring-primary/50 bg-muted shadow-sm" 
                      : "bg-muted/30 hover:bg-muted/50 border border-border/30"}
                  `}
                >
                  No section
                </button>
                {availableFolders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all
                      ${selectedFolder === folder.id 
                        ? "ring-2 ring-primary/50 bg-muted shadow-sm" 
                        : "bg-muted/30 hover:bg-muted/50 border border-border/30"}
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
            <div className="bg-muted/30 rounded-xl px-4 py-3 text-sm text-muted-foreground flex items-center gap-1.5 border border-border/20">
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
