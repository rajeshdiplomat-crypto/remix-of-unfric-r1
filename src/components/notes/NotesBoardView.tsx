import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { NotesActivityDot, getMostRecentUpdate } from "./NotesActivityDot";
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
}: NotesBoardViewProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [newFolderGroupId, setNewFolderGroupId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    e.dataTransfer.setData("text/plain", noteId);
    setDraggedNoteId(noteId);
  };

  const handleDragEnd = () => {
    setDraggedNoteId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetGroupId: string, targetFolderId: string | null) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData("text/plain");
    if (noteId && onUpdateNote) {
      const note = notes.find((n) => n.id === noteId);
      if (note && (note.groupId !== targetGroupId || note.folderId !== targetFolderId)) {
        onUpdateNote({ ...note, groupId: targetGroupId, folderId: targetFolderId });
      }
    }
    setDraggedNoteId(null);
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

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-5 pb-6 min-w-max">
        {sortedGroups.map((group) => {
          const groupNotes = notes.filter((n) => n.groupId === group.id);
          const groupFolders = folders.filter((f) => f.groupId === group.id);
          const mostRecentUpdate = getMostRecentUpdate(groupNotes);

          return (
            <div
              key={group.id}
              className="w-[280px] shrink-0 flex flex-col h-full bg-background/0"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, group.id, null)}
            >
              {/* Column header with thin accent line */}
              <div className="mb-2">
                <div
                  className="h-0.5 rounded-sm mb-3"
                  style={{ background: CATEGORY_GRADIENTS[group.id] || group.color }}
                />
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-medium text-foreground/80 text-sm">{group.name}</h3>
                  <span className="text-xs text-muted-foreground">{groupNotes.length}</span>
                </div>
              </div>

              {/* Add note button only */}
              <button
                onClick={() => onAddNote(group.id, null)}
                className="w-full flex items-center justify-center gap-1.5 px-2 py-2 mb-2 text-xs text-muted-foreground hover:text-foreground bg-background/60 hover:bg-background/90 rounded-sm border border-dashed border-border/50 hover:border-border transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                Add note
              </button>

              {/* Notes list - Infinite scroll appearance */}
              <ScrollArea className="flex-1 h-full min-h-[calc(100vh-350px)]">
                <div className="space-y-3 pb-20 pr-1">
                  {/* Direct notes - clean white cards on transparency */}
                  {groupNotes
                    .filter((n) => !n.folderId)
                    .map((note) => (
                      <div
                        key={note.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, note.id)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "rounded-sm bg-card/95 backdrop-blur-sm border transition-all cursor-pointer shadow-sm group relative",
                          selectedNoteId === note.id
                            ? "border-primary/50 ring-1 ring-primary/20"
                            : "border-border/20 hover:bg-card hover:shadow-md",
                          draggedNoteId === note.id && "opacity-50",
                          note.isCompleted && "opacity-60",
                          note.isPinned && "border-l-2 border-l-primary/50",
                        )}
                        onClick={() => onNoteClick(note)}
                      >
                        <div className="p-3">
                          <div className="flex items-start gap-2">
                            {/* Pin indicator */}
                            {note.isPinned && <Pin className="h-3 w-3 text-primary/70 shrink-0 mt-0.5" />}

                            {/* Completion Ring */}
                            <button
                              onClick={(e) => toggleComplete(e, note)}
                              className={cn(
                                "w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 transition-colors flex items-center justify-center",
                                note.isCompleted
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-muted-foreground/30 hover:border-primary/60",
                              )}
                            >
                              {note.isCompleted && <div className="w-1.5 h-1.5 bg-current rounded-full" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h4
                                  className={cn(
                                    "text-sm text-foreground line-clamp-2 transition-all",
                                    note.isCompleted && "line-through text-muted-foreground",
                                  )}
                                >
                                  {note.title || "Untitled"}
                                </h4>

                                {/* Options Menu */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted/50 rounded-sm transition-opacity">
                                      <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 rounded-sm">
                                    <DropdownMenuLabel>Note Options</DropdownMenuLabel>

                                    {/* Pin/Unpin option */}
                                    <DropdownMenuItem
                                      onClick={(e) => togglePin(e, note)}
                                      className="rounded-sm cursor-pointer"
                                    >
                                      <Pin className={cn("h-3 w-3 mr-2", note.isPinned && "text-primary")} />
                                      {note.isPinned ? "Unpin Note" : "Pin Note"}
                                    </DropdownMenuItem>

                                    <DropdownMenuSub>
                                      <DropdownMenuSubTrigger>
                                        <ArrowRight className="h-3 w-3 mr-2" />
                                        Change Group
                                      </DropdownMenuSubTrigger>
                                      <DropdownMenuSubContent className="rounded-sm">
                                        {sortedGroups
                                          .filter((g) => g.id !== group.id)
                                          .map((g) => (
                                            <DropdownMenuItem
                                              key={g.id}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (onUpdateNote) onUpdateNote({ ...note, groupId: g.id });
                                              }}
                                              className="rounded-sm"
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
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive rounded-sm"
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

                  {/* Sections/Folders */}
                  {groupFolders.map((folder) => {
                    const folderNotes = notes.filter((n) => n.folderId === folder.id);
                    const isFolderExpanded = expandedFolders.has(folder.id);

                    return (
                      <div key={folder.id} className="pt-2">
                        <button
                          onClick={() => toggleFolder(folder.id)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ChevronRight
                            className={"h-3 w-3 transition-transform " + (isFolderExpanded ? "rotate-90" : "")}
                          />
                          <span className="flex-1 text-left font-medium">{folder.name}</span>
                          <span className="text-[10px]">{folderNotes.length}</span>
                        </button>

                        {isFolderExpanded && (
                          <div className="mt-1 ml-3 space-y-2">
                            {folderNotes.map((note) => (
                              <div
                                key={note.id}
                                className={
                                  "rounded-lg bg-background border transition-all cursor-pointer " +
                                  (selectedNoteId === note.id
                                    ? "border-primary/50 shadow-sm"
                                    : "border-border/30 hover:border-border/60")
                                }
                                onClick={() => onNoteClick(note)}
                              >
                                <div className="p-3">
                                  <div className="flex items-start gap-2">
                                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0 mt-0.5" />
                                    <h4 className="text-sm text-foreground line-clamp-2">{note.title || "Untitled"}</h4>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add section input (only shows when triggered from header) */}
                  {newFolderGroupId === group.id && (
                    <div className="flex gap-2 mt-2">
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
                </div>
              </ScrollArea>
            </div>
          );
        })}

        {/* Add Group Column */}
        {onAddGroup && (
          <div className="w-[200px] shrink-0 flex flex-col h-full">
            <div className="mb-2">
              <div className="h-0.5 rounded-sm mb-3 bg-border/30" />
            </div>
            <button
              onClick={onAddGroup}
              className="w-full flex items-center justify-center gap-2 px-3 py-8 text-sm text-muted-foreground hover:text-foreground bg-background/40 hover:bg-background/70 rounded-md border border-dashed border-border/40 hover:border-border transition-all"
            >
              <Plus className="h-4 w-4" />
              Add a new bucket
            </button>
          </div>
        )}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
