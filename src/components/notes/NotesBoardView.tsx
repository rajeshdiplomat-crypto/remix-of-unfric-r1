import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { NotesActivityDot, getMostRecentUpdate } from "./NotesActivityDot";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronRight, Plus, FolderPlus, MoreHorizontal, ArrowRight, Trash2, Copy, Pin } from "lucide-react";
import type { Note, NoteGroup, NoteFolder } from "@/pages/Notes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";

// Creative gradient presets for dots
const CATEGORY_GRADIENTS: Record<string, string> = {
  inbox: "linear-gradient(135deg, #94a3b8 0%, #64748b 50%, #475569 100%)",
  work: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #1d4ed8 100%)",
  personal: "linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)",
  wellness: "linear-gradient(135deg, #c084fc 0%, #a855f7 50%, #7c3aed 100%)",
  hobby: "linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)",
};

interface NotesBoardViewProps {
  groups: NoteGroup[];
  folders: NoteFolder[];
  notes: Note[];
  selectedNoteId?: string;
  onNoteClick: (note: Note) => void;
  onAddNote: (groupId: string, folderId: string | null) => void;
  onAddFolder: (groupId: string, folderName: string) => void;
  onUpdateNote?: (note: Note) => void;
  onDeleteNote?: (noteId: string) => void;
  onAddGroup?: () => void;
  onUpdateFolder?: (folder: NoteFolder) => void;
  onReorderFolders?: (groupId: string, folders: NoteFolder[]) => void;
  onReorderGroups?: (groups: NoteGroup[]) => void;
}

export function NotesBoardView({
  groups,
  folders,
  notes,
  selectedNoteId,
  onNoteClick,
  onAddNote,
  onAddFolder,
  onUpdateNote,
  onDeleteNote,
  onAddGroup,
  onUpdateFolder,
  onReorderFolders,
  onReorderGroups,
}: NotesBoardViewProps) {
  const isMobile = useIsMobile();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [expandedMobileGroups, setExpandedMobileGroups] = useState<Set<string>>(new Set());
  const [newFolderGroupId, setNewFolderGroupId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);

  // Note drag handlers
  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    e.stopPropagation(); // Prevent group drag from interfering
    e.dataTransfer.setData("noteId", noteId);
    e.dataTransfer.setData("dragType", "note");
    e.dataTransfer.effectAllowed = "move";
    setDraggedNoteId(noteId);
  };

  const handleDragEnd = () => {
    setDraggedNoteId(null);
    setDraggedFolderId(null);
    setDragOverFolderId(null);
    setDragOverNoteId(null);
    setDraggedGroupId(null);
    setDragOverGroupId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetGroupId: string, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    const dragType = e.dataTransfer.getData("dragType");
    const noteId = e.dataTransfer.getData("noteId");

    // Only handle note drops here
    if (dragType === "note" && noteId && onUpdateNote) {
      const note = notes.find((n) => n.id === noteId);
      if (note && (note.groupId !== targetGroupId || note.folderId !== targetFolderId)) {
        onUpdateNote({ ...note, groupId: targetGroupId, folderId: targetFolderId });
      }
      handleDragEnd();
    }
  };

  // Folder/Section drag handlers
  const handleFolderDragStart = (e: React.DragEvent, folderId: string) => {
    e.stopPropagation(); // Prevent group drag from interfering
    e.dataTransfer.setData("folderId", folderId);
    e.dataTransfer.setData("dragType", "folder");
    e.dataTransfer.effectAllowed = "move";
    setDraggedFolderId(folderId);
  };

  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    if (draggedFolderId && draggedFolderId !== folderId) {
      setDragOverFolderId(folderId);
    }
  };

  const handleFolderDrop = (
    e: React.DragEvent,
    targetFolderId: string,
    groupFolders: NoteFolder[],
    groupId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceFolderId = e.dataTransfer.getData("folderId");
    if (sourceFolderId && sourceFolderId !== targetFolderId && onReorderFolders) {
      const sourceIndex = groupFolders.findIndex((f) => f.id === sourceFolderId);
      const targetIndex = groupFolders.findIndex((f) => f.id === targetFolderId);
      if (sourceIndex !== -1 && targetIndex !== -1) {
        const reordered = [...groupFolders];
        const [moved] = reordered.splice(sourceIndex, 1);
        reordered.splice(targetIndex, 0, moved);
        // Update sortOrder
        const updated = reordered.map((f, i) => ({ ...f, sortOrder: i }));
        onReorderFolders(groupId, updated);
      }
    }
    handleDragEnd();
  };

  // Group/Column drag handlers
  const handleGroupDragStart = (e: React.DragEvent, groupId: string) => {
    e.dataTransfer.setData("groupId", groupId);
    e.dataTransfer.setData("dragType", "group");
    e.dataTransfer.effectAllowed = "move";
    setDraggedGroupId(groupId);
  };

  const handleGroupDragOver = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    if (draggedGroupId && draggedGroupId !== groupId) {
      setDragOverGroupId(groupId);
    }
  };

  const handleGroupDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceGroupId = e.dataTransfer.getData("groupId");
    if (sourceGroupId && sourceGroupId !== targetGroupId && onReorderGroups) {
      const sourceIndex = sortedGroups.findIndex((g) => g.id === sourceGroupId);
      const targetIndex = sortedGroups.findIndex((g) => g.id === targetGroupId);
      if (sourceIndex !== -1 && targetIndex !== -1) {
        const reordered = [...sortedGroups];
        const [moved] = reordered.splice(sourceIndex, 1);
        reordered.splice(targetIndex, 0, moved);
        // Update sortOrder
        const updated = reordered.map((g, i) => ({ ...g, sortOrder: i }));
        onReorderGroups(updated);
      }
    }
    handleDragEnd();
  };

  // Note reordering within the same context
  const handleNoteDragOver = (e: React.DragEvent, noteId: string) => {
    e.preventDefault();
    if (draggedNoteId && draggedNoteId !== noteId) {
      setDragOverNoteId(noteId);
    }
  };

  const handleNoteReorder = (e: React.DragEvent, targetNoteId: string, groupId: string, folderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceNoteId = e.dataTransfer.getData("noteId");
    if (sourceNoteId && sourceNoteId !== targetNoteId && onUpdateNote) {
      const sourceNote = notes.find((n) => n.id === sourceNoteId);
      const targetNote = notes.find((n) => n.id === targetNoteId);
      if (sourceNote && targetNote) {
        // Move source note to target's group/folder and swap sortOrder
        const updatedNote = {
          ...sourceNote,
          groupId,
          folderId,
          sortOrder: targetNote.sortOrder,
        };
        onUpdateNote(updatedNote);
      }
    }
    handleDragEnd();
  };

  const toggleComplete = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    if (onUpdateNote) {
      onUpdateNote({ ...note, isCompleted: !note.isCompleted });
    }
  };

  const togglePin = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    if (onUpdateNote) {
      onUpdateNote({ ...note, isPinned: !note.isPinned });
    }
  };

  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.has(folderId) ? next.delete(folderId) : next.add(folderId);
      return next;
    });
  };

  const handleAddFolder = (groupId: string) => {
    if (!newFolderName.trim()) return;
    onAddFolder(groupId, newFolderName.trim());
    setNewFolderName("");
    setNewFolderGroupId(null);
  };

  const toggleMobileGroup = (groupId: string) => {
    setExpandedMobileGroups((prev) => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  };

  // Mobile: vertical accordion layout
  if (isMobile) {
    return (
      <div className="space-y-2">
        {sortedGroups.map((group) => {
          const groupNotes = notes.filter((n) => n.groupId === group.id);
          const groupFolders = folders.filter((f) => f.groupId === group.id);
          const isExpanded = expandedMobileGroups.has(group.id);

          return (
            <div key={group.id} className="rounded-[12px] border border-white/[0.1] bg-white/[0.03] backdrop-blur-xl overflow-hidden">
              <button
                onClick={() => toggleMobileGroup(group.id)}
                className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-muted/5 transition-colors"
              >
                <div
                  className="w-1 h-6 rounded-full shrink-0"
                  style={{ background: CATEGORY_GRADIENTS[group.id] || group.color }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-light tracking-widest text-foreground truncate">{group.name}</h3>
                </div>
                <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">{groupNotes.length}</span>
                <Plus
                  className="h-4 w-4 text-muted-foreground"
                  onClick={(e) => { e.stopPropagation(); onAddNote(group.id, null); }}
                />
                <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-2">
                  {/* Folders */}
                  {[...groupFolders].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((folder) => {
                    const folderNotes = notes.filter((n) => n.folderId === folder.id);
                    const isFolderExpanded = expandedFolders.has(folder.id);
                    return (
                      <div key={folder.id}>
                        <button
                          onClick={() => toggleFolder(folder.id)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md transition-colors"
                        >
                          <ChevronRight className={`h-3 w-3 transition-transform ${isFolderExpanded ? "rotate-90" : ""}`} />
                          <span className="flex-1 text-left font-medium">{folder.name}</span>
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{folderNotes.length}</span>
                        </button>
                        {isFolderExpanded && folderNotes.map((note) => (
                          <div
                            key={note.id}
                            className={cn(
                              "ml-4 p-2.5 rounded-lg border border-border/30 mb-1.5 active:bg-muted/50",
                              selectedNoteId === note.id && "border-primary/50 bg-primary/5",
                            )}
                            onClick={() => onNoteClick(note)}
                          >
                            <h4 className="text-sm text-foreground line-clamp-1">{note.title || "Untitled"}</h4>
                            <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}

                  {/* Add section button for mobile */}
                  <button
                    onClick={() => setNewFolderGroupId(group.id)}
                    className="w-full flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground hover:text-foreground rounded-lg border border-dashed border-border/50 hover:border-border transition-colors"
                  >
                    <FolderPlus className="h-3.5 w-3.5" />
                    Add section
                  </button>

                  {/* Add section input for mobile */}
                  {newFolderGroupId === group.id && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Section name…"
                        className="flex-1 text-sm px-3 py-1.5 rounded-lg bg-background border border-border/50 focus:outline-none focus:border-primary/40"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddFolder(group.id);
                          if (e.key === "Escape") {
                            setNewFolderGroupId(null);
                            setNewFolderName("");
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Direct notes */}
                  {groupNotes.filter((n) => !n.folderId).map((note) => (
                    <div
                      key={note.id}
                      className={cn(
                        "p-2.5 rounded-lg border border-border/30 active:bg-muted/50",
                        selectedNoteId === note.id && "border-primary/50 bg-primary/5",
                        note.isPinned && "border-l-2 border-l-primary/50",
                      )}
                      onClick={() => onNoteClick(note)}
                    >
                      <div className="flex items-start gap-2">
                        {note.isPinned && <Pin className="h-3 w-3 text-primary/70 shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm text-foreground line-clamp-1">{note.title || "Untitled"}</h4>
                          {note.plainText && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{note.plainText}</p>}
                          <span className="text-[10px] text-muted-foreground/70 mt-1 block">{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {onAddGroup && (
          <button
            onClick={onAddGroup}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium text-muted-foreground hover:text-foreground rounded-xl border border-dashed border-border/50 hover:border-border transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add group
          </button>
        )}
      </div>
    );
  }

  // Desktop: horizontal columns
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-5 pb-6 pl-1 pr-4 min-w-max relative film-grain">
        {sortedGroups.map((group) => {
          const groupNotes = notes.filter((n) => n.groupId === group.id);
          const groupFolders = folders.filter((f) => f.groupId === group.id);
          const mostRecentUpdate = getMostRecentUpdate(groupNotes);
          const isDraggedGroup = draggedGroupId === group.id;
          const isDragOverGroup = dragOverGroupId === group.id;

          return (
            <div
              key={group.id}
              className={cn(
                "w-[280px] shrink-0 flex flex-col h-full bg-background/0 transition-all",
                isDraggedGroup && "opacity-50 scale-95",
                isDragOverGroup && "border-l-4 border-l-primary pl-2",
              )}
              onDragOver={(e) => {
                handleDragOver(e);
                if (draggedGroupId) {
                  handleGroupDragOver(e, group.id);
                }
              }}
              onDrop={(e) => {
                const dragType = e.dataTransfer.getData("dragType");
                if (dragType === "group") {
                  handleGroupDrop(e, group.id);
                } else if (dragType === "note") {
                  handleDrop(e, group.id, null);
                }
              }}
              onDragLeave={() => setDragOverGroupId(null)}
            >
              {/* Column header with thin accent line - drag handle for group */}
              <div
                className="mb-2 cursor-grab active:cursor-grabbing"
                draggable
                onDragStart={(e) => handleGroupDragStart(e, group.id)}
                onDragEnd={handleDragEnd}
              >
                <div
                  className="h-0.5 rounded-sm mb-3"
                  style={{ background: CATEGORY_GRADIENTS[group.id] || group.color }}
                />
              <div className="flex items-center justify-between px-1">
                  <h3 className="font-light text-foreground/80 text-sm tracking-widest">{group.name}</h3>
                  <span className="text-[11px] font-light tracking-[0.3em] text-muted-foreground/50">{groupNotes.length}</span>
                </div>
              </div>

              {/* Add note + Add section buttons - Modern glassmorphism style */}
              <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => onAddNote(group.id, null)}
                    className="group flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[11px] font-light tracking-[0.3em] text-muted-foreground hover:text-foreground rounded-[6px] bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm border border-white/[0.05] hover:border-white/[0.1] transition-all duration-300"
                  >
                    <Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                    <span>Add note</span>
                  </button>
                  <button
                    onClick={() => setNewFolderGroupId(group.id)}
                    className="group flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[11px] font-light tracking-[0.3em] text-muted-foreground hover:text-foreground rounded-[6px] bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm border border-white/[0.05] hover:border-white/[0.1] transition-all duration-300"
                  >
                    <FolderPlus className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                    <span>Add section</span>
                  </button>
              </div>

              {/* Notes list - Infinite scroll appearance */}
              <ScrollArea className="flex-1 h-full min-h-[calc(100vh-350px)]">
                <div className="space-y-3 pb-20 pr-2">
                  {/* Add section input (only shows when triggered from header) - at top */}
                  {newFolderGroupId === group.id && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Section name…"
                        className="flex-1 text-sm px-3 py-1.5 rounded bg-background border border-border/50 focus:outline-none focus:border-primary/40"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddFolder(group.id);
                          if (e.key === "Escape") {
                            setNewFolderGroupId(null);
                            setNewFolderName("");
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Sections/Folders - Draggable to reorder */}
                  {[...groupFolders]
                    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                    .map((folder) => {
                      const folderNotes = notes.filter((n) => n.folderId === folder.id);
                      const isFolderExpanded = expandedFolders.has(folder.id);
                      const isDraggedFolder = draggedFolderId === folder.id;
                      const isDragOverFolder = dragOverFolderId === folder.id;

                      return (
                        <div
                          key={folder.id}
                          className={cn(
                            "pt-1 transition-all",
                            isDraggedFolder && "opacity-50",
                            isDragOverFolder && "border-t-2 border-primary",
                          )}
                          draggable
                          onDragStart={(e) => handleFolderDragStart(e, folder.id)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => {
                            handleDragOver(e);
                            handleFolderDragOver(e, folder.id);
                          }}
                          onDrop={(e) => {
                            if (draggedFolderId) {
                              handleFolderDrop(e, folder.id, groupFolders, group.id);
                            } else {
                              handleDrop(e, group.id, folder.id);
                            }
                          }}
                          onDragLeave={() => setDragOverFolderId(null)}
                        >
                          <button
                            onClick={() => toggleFolder(folder.id)}
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-all rounded-md cursor-grab active:cursor-grabbing",
                              draggedNoteId && "bg-cyan-500/10 border border-dashed border-cyan-400/50",
                            )}
                          >
                            <ChevronRight
                              className={"h-3 w-3 transition-transform " + (isFolderExpanded ? "rotate-90" : "")}
                            />
                            <span className="flex-1 text-left font-medium">{folder.name}</span>
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{folderNotes.length}</span>
                            {draggedNoteId && <span className="text-[10px] text-cyan-500 font-medium">Drop here</span>}
                          </button>

                          {isFolderExpanded && (
                            <div className="mt-1 ml-3 space-y-2">
                              {[...folderNotes]
                                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                                .map((note) => (
                                  <div
                                    key={note.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, note.id)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => handleNoteDragOver(e, note.id)}
                                    onDrop={(e) => handleNoteReorder(e, note.id, group.id, folder.id)}
                                    onDragLeave={() => setDragOverNoteId(null)}
                                    className={cn(
                  "rounded-[6px] bg-white/[0.03] backdrop-blur-md border transition-all cursor-grab active:cursor-grabbing group active:scale-[0.98]",
                                      selectedNoteId === note.id
                                        ? "border-[hsl(215,15%,40%)]/30 shadow-sm"
                                        : "border-white/[0.05] hover:border-white/[0.1]",
                                      draggedNoteId === note.id && "opacity-50 scale-95",
                                      dragOverNoteId === note.id && "border-t-2 border-t-primary",
                                    )}
                                    onClick={() => onNoteClick(note)}
                                  >
                                    <div className="p-3">
                                      <h4 className="text-sm text-foreground line-clamp-2">
                                        {note.title || "Untitled"}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-medium text-cyan-500">{folder.name}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                          {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              {/* Add note to section button */}
                              <button
                                onClick={() => onAddNote(group.id, folder.id)}
                                className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] text-muted-foreground hover:text-foreground bg-background/40 hover:bg-background/70 rounded border border-dashed border-border/30 hover:border-border/50 transition-all"
                              >
                                <Plus className="h-3 w-3" />
                                Add to {folder.name}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                  {/* Direct notes - clean white cards on transparency */}
                  {groupNotes
                    .filter((n) => !n.folderId)
                    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                    .map((note) => (
                      <div
                        key={note.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, note.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleNoteDragOver(e, note.id)}
                        onDrop={(e) => handleNoteReorder(e, note.id, group.id, null)}
                        onDragLeave={() => setDragOverNoteId(null)}
                        className={cn(
                          "rounded-[6px] bg-white/[0.03] backdrop-blur-md border transition-all cursor-grab active:cursor-grabbing group relative active:scale-[0.98]",
                          selectedNoteId === note.id
                            ? "border-[hsl(215,15%,40%)]/30 ring-1 ring-[hsl(215,15%,40%)]/10"
                            : "border-white/[0.05] hover:bg-white/[0.05] hover:shadow-sm",
                          draggedNoteId === note.id && "opacity-50 scale-95",
                          dragOverNoteId === note.id && "border-t-2 border-t-primary",
                          note.isPinned && "border-l-2 border-l-primary/50",
                        )}
                        onClick={() => onNoteClick(note)}
                      >
                        <div className="p-3">
                          <div className="flex items-start gap-2">
                            {/* Pin indicator */}
                            {note.isPinned && <Pin className="h-3 w-3 text-primary/70 shrink-0 mt-0.5" />}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h4 className="text-sm font-light text-foreground line-clamp-2 transition-all">
                                  {note.title || "Untitled"}
                                </h4>

                                {/* Options Menu */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted/50 rounded-lg transition-opacity">
                                      <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 rounded-lg">
                                    <DropdownMenuLabel>Note Options</DropdownMenuLabel>

                                    {/* Pin/Unpin option */}
                                    <DropdownMenuItem
                                      onClick={(e) => togglePin(e, note)}
                                      className="rounded-lg cursor-pointer"
                                    >
                                      <Pin className={cn("h-3 w-3 mr-2", note.isPinned && "text-primary")} />
                                      {note.isPinned ? "Unpin Note" : "Pin Note"}
                                    </DropdownMenuItem>

                                    <DropdownMenuSub>
                                      <DropdownMenuSubTrigger>
                                        <ArrowRight className="h-3 w-3 mr-2" />
                                        Change Group
                                      </DropdownMenuSubTrigger>
                                      <DropdownMenuSubContent className="rounded-lg">
                                        {sortedGroups
                                          .filter((g) => g.id !== group.id)
                                          .map((g) => (
                                            <DropdownMenuItem
                                              key={g.id}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (onUpdateNote)
                                                  onUpdateNote({ ...note, groupId: g.id, folderId: null });
                                              }}
                                              className="rounded-lg"
                                            >
                                              <span
                                                className="w-2 h-2 rounded-full mr-2"
                                                style={{ background: g.color }}
                                              />
                                              {g.name}
                                            </DropdownMenuItem>
                                          ))}
                                      </DropdownMenuSubContent>
                                    </DropdownMenuSub>

                                    {/* Move to Section submenu */}
                                    {groupFolders.length > 0 && (
                                      <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                          <FolderPlus className="h-3 w-3 mr-2" />
                                          Move to Section
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent className="rounded-lg">
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (onUpdateNote) onUpdateNote({ ...note, folderId: null });
                                            }}
                                            className="rounded-lg"
                                          >
                                            <span className="text-muted-foreground">No section</span>
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          {groupFolders.map((f) => (
                                            <DropdownMenuItem
                                              key={f.id}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (onUpdateNote) onUpdateNote({ ...note, folderId: f.id });
                                              }}
                                              className={cn("rounded-lg", note.folderId === f.id && "bg-primary/10")}
                                            >
                                              <span className="w-2 h-2 rounded-full mr-2 bg-cyan-500" />
                                              {f.name}
                                            </DropdownMenuItem>
                                          ))}
                                        </DropdownMenuSubContent>
                                      </DropdownMenuSub>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive rounded-lg"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onDeleteNote) onDeleteNote(note.id);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {note.plainText && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{note.plainText}</p>
                              )}

                              {/* Time and Date */}
                              <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground/70">
                                <span>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
                                <span>·</span>
                                <span>{format(new Date(note.updatedAt), "MMM d")}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          );
        })}

        {/* Add Group Column */}
        {onAddGroup && (
          <div className="w-[120px] shrink-0 flex flex-col h-full">
            <div className="mb-2">
              <div className="h-0.5 rounded-sm mb-3 bg-gradient-to-r from-emerald-500/30 to-transparent" />
            </div>
            <button
              onClick={onAddGroup}
              className="group w-full flex items-center justify-center gap-1.5 px-2 py-3 text-xs font-medium text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl bg-gradient-to-br from-emerald-500/5 via-background/80 to-background/60 hover:from-emerald-500/15 hover:via-emerald-500/5 hover:to-background/80 backdrop-blur-sm border border-emerald-500/10 hover:border-emerald-500/30 shadow-sm hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-300"
            >
              <Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90 group-hover:scale-110" />
              <span className="group-hover:tracking-wide transition-all">Add group</span>
            </button>
          </div>
        )}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
