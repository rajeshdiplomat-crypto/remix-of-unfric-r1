import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, GripVertical, Trash2, Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { NoteGroup, NoteFolder } from "@/pages/Notes";

interface NotesGroupSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: NoteGroup[];
  onGroupsChange: (groups: NoteGroup[]) => void;
  folders: NoteFolder[];
  onFoldersChange: (folders: NoteFolder[]) => void;
}

const PRESET_COLORS = [
  "hsl(221, 83%, 53%)", // Blue
  "hsl(142, 71%, 45%)", // Green
  "hsl(262, 83%, 58%)", // Purple
  "hsl(25, 95%, 53%)",  // Orange
  "hsl(0, 84%, 60%)",   // Red
  "hsl(47, 95%, 53%)",  // Yellow
  "hsl(199, 95%, 73%)", // Cyan
  "hsl(339, 81%, 51%)", // Pink
];

export function NotesGroupSettings({
  open,
  onOpenChange,
  groups,
  onGroupsChange,
  folders,
  onFoldersChange,
}: NotesGroupSettingsProps) {
  const { toast } = useToast();
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState(PRESET_COLORS[0]);

  const handleEditGroup = (group: NoteGroup) => {
    setEditingGroup(group.id);
    setEditName(group.name);
    setEditColor(group.color);
  };

  const handleSaveEdit = () => {
    if (!editingGroup || !editName.trim()) return;
    onGroupsChange(
      groups.map((g) =>
        g.id === editingGroup ? { ...g, name: editName, color: editColor } : g
      )
    );
    setEditingGroup(null);
    toast({ title: "Group updated" });
  };

  const handleCancelEdit = () => {
    setEditingGroup(null);
    setEditName("");
    setEditColor("");
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const newGroup: NoteGroup = {
      id: crypto.randomUUID(),
      name: newGroupName,
      color: newGroupColor,
      sortOrder: groups.length,
    };
    onGroupsChange([...groups, newGroup]);
    setNewGroupName("");
    toast({ title: "Group added" });
  };

  const handleDeleteGroup = (groupId: string) => {
    // Check if there are notes in this group first
    onGroupsChange(groups.filter((g) => g.id !== groupId));
    onFoldersChange(folders.filter((f) => f.groupId !== groupId));
    toast({ title: "Group deleted" });
  };

  const handleDeleteFolder = (folderId: string) => {
    onFoldersChange(folders.filter((f) => f.id !== folderId));
    toast({ title: "Folder deleted" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Groups</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          <div className="space-y-4 py-4">
            {/* Existing Groups */}
            {groups.map((group) => (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: editingGroup === group.id ? editColor : group.color }}
                  />
                  {editingGroup === group.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 flex-1"
                      />
                      <div className="flex gap-1">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            className={`h-5 w-5 rounded-full border-2 ${
                              editColor === color ? "border-foreground" : "border-transparent"
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setEditColor(color)}
                          />
                        ))}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveEdit}>
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-medium">{group.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditGroup(group)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteGroup(group.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Folders under this group */}
                {folders
                  .filter((f) => f.groupId === group.id)
                  .map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center gap-2 pl-8 pr-2 py-1"
                    >
                      <span className="text-sm text-muted-foreground flex-1">{folder.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteFolder(folder.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
              </div>
            ))}

            {/* Add New Group */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Add New Group</h4>
              <div className="flex items-center gap-2">
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group name..."
                  className="flex-1"
                />
                <div className="flex gap-1">
                  {PRESET_COLORS.slice(0, 4).map((color) => (
                    <button
                      key={color}
                      className={`h-5 w-5 rounded-full border-2 ${
                        newGroupColor === color ? "border-foreground" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewGroupColor(color)}
                    />
                  ))}
                </div>
                <Button size="sm" onClick={handleAddGroup} disabled={!newGroupName.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
