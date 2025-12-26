import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { NoteGroup, NoteFolder } from "@/pages/Notes";

interface NotesNewNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: NoteGroup[];
  folders: NoteFolder[];
  defaultGroupId?: string;
  defaultFolderId?: string | null;
  onCreate: (groupId: string, folderId: string | null, tags: string[]) => void;
}

export function NotesNewNoteDialog({
  open,
  onOpenChange,
  groups,
  folders,
  defaultGroupId,
  defaultFolderId,
  onCreate,
}: NotesNewNoteDialogProps) {
  const [selectedGroup, setSelectedGroup] = useState(defaultGroupId || groups[0]?.id || "");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(defaultFolderId || null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const availableFolders = folders.filter(f => f.groupId === selectedGroup);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleCreate = () => {
    onCreate(selectedGroup, selectedFolder, tags);
    setTags([]);
    setNewTag("");
    onOpenChange(false);
  };

  // Reset when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelectedGroup(defaultGroupId || groups[0]?.id || "");
      setSelectedFolder(defaultFolderId || null);
      setTags([]);
      setNewTag("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Group Selection */}
          <div className="space-y-2">
            <Label>Select Group *</Label>
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <Button
                  key={group.id}
                  variant={selectedGroup === group.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedGroup(group.id);
                    setSelectedFolder(null);
                  }}
                  className="rounded-full"
                  style={{
                    backgroundColor: selectedGroup === group.id ? group.color : undefined,
                    borderColor: group.color,
                  }}
                >
                  {group.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Folder Selection (optional) */}
          {availableFolders.length > 0 && (
            <div className="space-y-2">
              <Label>Select Folder (optional)</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedFolder === null ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFolder(null)}
                >
                  No Folder
                </Button>
                {availableFolders.map((folder) => (
                  <Button
                    key={folder.id}
                    variant={selectedFolder === folder.id ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFolder(folder.id)}
                  >
                    {folder.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Tags (optional) */}
          <div className="space-y-2">
            <Label>Add Tags (optional)</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Enter tag..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button variant="outline" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleCreate} disabled={!selectedGroup}>
              Create Note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
