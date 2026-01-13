import { useState, useRef } from "react";
import type { DragEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, GripVertical, Trash2, Edit2, Check, X, ChevronDown, ChevronRight, Folder } from "lucide-react";
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
  // Primary colors
  "hsl(221, 83%, 53%)", // Blue
  "hsl(142, 71%, 45%)", // Green
  "hsl(262, 83%, 58%)", // Purple
  "hsl(25, 95%, 53%)", // Orange
  "hsl(0, 84%, 60%)", // Red
  "hsl(47, 95%, 53%)", // Yellow
  "hsl(199, 95%, 73%)", // Cyan
  "hsl(339, 81%, 51%)", // Pink
  // Extended palette
  "hsl(180, 70%, 45%)", // Teal
  "hsl(280, 70%, 50%)", // Violet
  "hsl(15, 90%, 55%)", // Coral
  "hsl(160, 60%, 45%)", // Mint
  "hsl(210, 60%, 40%)", // Navy
  "hsl(45, 80%, 50%)", // Gold
  "hsl(320, 70%, 55%)", // Magenta
  "hsl(195, 80%, 40%)", // Ocean
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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<{ id: string; index: number } | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);

  const toggleExpanded = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  };

  const handleEditGroup = (group: NoteGroup) => {
    setEditingGroup(group.id);
    setEditName(group.name);
    setEditColor(group.color);
  };

  const handleSaveEdit = () => {
    if (!editingGroup || !editName.trim()) return;
    onGroupsChange(groups.map((g) => (g.id === editingGroup ? { ...g, name: editName, color: editColor } : g)));
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
    const maxOrder = groups.reduce((max, g) => Math.max(max, g.sortOrder), -1);
    const newGroup: NoteGroup = {
      id: crypto.randomUUID(),
      name: newGroupName,
      color: newGroupColor,
      sortOrder: maxOrder + 1,
    };
    onGroupsChange([...groups, newGroup]);
    setNewGroupName("");
    toast({ title: "Group added" });
  };

  const handleDeleteGroup = (groupId: string) => {
    onGroupsChange(groups.filter((g) => g.id !== groupId));
    onFoldersChange(folders.filter((f) => f.groupId !== groupId));
    toast({ title: "Group deleted" });
  };

  const handleDeleteFolder = (folderId: string) => {
    onFoldersChange(folders.filter((f) => f.id !== folderId));
    toast({ title: "Folder deleted" });
  };

  // Drag and drop handlers
  const handleDragStart = (e: DragEvent, id: string, index: number) => {
    setDraggedItem({ id, index });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent, index: number) => {
    e.preventDefault();
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (draggedItem === null || dragOverItem.current === null) {
      setDraggedItem(null);
      return;
    }

    const dragIndex = draggedItem.index;
    const hoverIndex = dragOverItem.current;

    if (dragIndex === hoverIndex) {
      setDraggedItem(null);
      dragOverItem.current = null;
      return;
    }

    const reorderedGroups = [...sortedGroups];
    const [removed] = reorderedGroups.splice(dragIndex, 1);
    reorderedGroups.splice(hoverIndex, 0, removed);

    const updatedGroups = reorderedGroups.map((g, idx) => ({ ...g, sortOrder: idx }));
    onGroupsChange(updatedGroups);

    setDraggedItem(null);
    dragOverItem.current = null;
    toast({ title: "Groups reordered" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Manage Groups</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[420px]">
          <div className="space-y-2 py-4">
            {sortedGroups.map((group, index) => {
              const groupFolders = folders.filter((f) => f.groupId === group.id);
              const isExpanded = expandedGroups.has(group.id);

              return (
                <div key={group.id} className="space-y-1">
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, group.id, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 p-2 rounded-xl bg-muted/25 border border-border/30 transition-colors ${
                      draggedItem?.id === group.id ? "opacity-50" : ""
                    }`}
                  >
                    <div
                      className="w-1 h-6 rounded-full shrink-0"
                      style={{ backgroundColor: editingGroup === group.id ? editColor : group.color }}
                    />
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />

                    {groupFolders.length > 0 && (
                      <button onClick={() => toggleExpanded(group.id)} className="p-0.5">
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    )}

                    {editingGroup === group.id ? (
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 text-sm rounded-xl flex-1"
                            autoFocus
                          />
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveEdit}>
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEdit}>
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-8 gap-1.5">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              className={`h-6 rounded-md transition-all hover:scale-105 relative overflow-hidden ${
                                editColor === color
                                  ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                                  : "hover:ring-1 hover:ring-border"
                              }`}
                              onClick={() => setEditColor(color)}
                            >
                              {/* Top accent line like board view */}
                              <div
                                className="absolute top-0 left-0 right-0 h-0.5 rounded-t-md"
                                style={{ backgroundColor: color }}
                              />
                              {/* Body with gradient */}
                              <div
                                className="absolute inset-0 opacity-20"
                                style={{ background: `linear-gradient(180deg, ${color} 0%, transparent 100%)` }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 font-medium text-sm">{group.name}</span>
                        <span className="text-xs text-muted-foreground">{groupFolders.length} folders</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditGroup(group)}>
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

                  {isExpanded && groupFolders.length > 0 && (
                    <div className="ml-8 space-y-1">
                      {groupFolders.map((folder) => (
                        <div
                          key={folder.id}
                          className="flex items-center gap-2 px-2 py-2 rounded-xl bg-muted/15 border border-border/20"
                        >
                          <Folder className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground flex-1">{folder.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteFolder(folder.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3">Add New Group</h4>
              <div className="space-y-3">
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group name..."
                  className="rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddGroup();
                  }}
                />
                {/* Color picker - accent bars like board view */}
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">Choose color</span>
                  <div className="grid grid-cols-8 gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`h-8 rounded-lg transition-all hover:scale-105 relative overflow-hidden ${
                          newGroupColor === color
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : "hover:ring-1 hover:ring-border"
                        }`}
                        onClick={() => setNewGroupColor(color)}
                        title={color}
                      >
                        {/* Top accent line like board view */}
                        <div
                          className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
                          style={{ backgroundColor: color }}
                        />
                        {/* Body with gradient */}
                        <div
                          className="absolute inset-0 opacity-20"
                          style={{ background: `linear-gradient(180deg, ${color} 0%, transparent 100%)` }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full h-10 rounded-xl"
                  onClick={handleAddGroup}
                  disabled={!newGroupName.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
