import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { NotesActivityDot, getMostRecentUpdate } from "./NotesActivityDot";
import { ChevronRight, Plus, FolderPlus } from "lucide-react";
import type { Note, NoteGroup, NoteFolder } from "@/pages/Notes";

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
}

export function NotesBoardView({
  groups,
  folders,
  notes,
  selectedNoteId,
  onNoteClick,
  onAddNote,
  onAddFolder,
}: NotesBoardViewProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [newFolderGroupId, setNewFolderGroupId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");

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
            <div key={group.id} className="w-[280px] shrink-0 flex flex-col">
              {/* Column header with thin accent line */}
              <div className="mb-2">
                <div
                  className="h-0.5 rounded-full mb-3"
                  style={{ background: CATEGORY_GRADIENTS[group.id] || group.color }}
                />
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-medium text-foreground/80 text-sm">{group.name}</h3>
                  <span className="text-xs text-muted-foreground">{groupNotes.length}</span>
                </div>
              </div>

              {/* Add note button */}
              <button
                onClick={() => onAddNote(group.id, null)}
                className="w-full flex items-center gap-2 px-3 py-2.5 mb-2 text-sm text-muted-foreground hover:text-foreground bg-background/60 hover:bg-background/90 rounded-lg border border-dashed border-border/50 hover:border-border transition-all"
              >
                <Plus className="h-4 w-4" />
                Add note
              </button>

              {/* Notes list */}
              <ScrollArea className="flex-1 max-h-[calc(100vh-280px)]">
                <div className="space-y-2 pr-1">
                  {/* Direct notes - clean simple cards */}
                  {groupNotes
                    .filter((n) => !n.folderId)
                    .map((note) => (
                      <div
                        key={note.id}
                        className={
                          "rounded-lg bg-background border transition-all cursor-pointer " +
                          (selectedNoteId === note.id
                            ? "border-primary/50 shadow-sm"
                            : "border-border/30 hover:border-border/60 hover:shadow-sm")
                        }
                        onClick={() => onNoteClick(note)}
                      >
                        <div className="p-3">
                          <div className="flex items-start gap-2">
                            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm text-foreground line-clamp-2">{note.title || "Untitled"}</h4>
                              {note.plainText && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{note.plainText}</p>
                              )}
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

                  {/* Add section (minimal) */}
                  {newFolderGroupId === group.id ? (
                    <div className="flex gap-2 mt-2">
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
                  ) : (
                    <button
                      onClick={() => setNewFolderGroupId(group.id)}
                      className="w-full flex items-center gap-2 text-xs text-muted-foreground/60 hover:text-muted-foreground py-2 transition-colors"
                    >
                      <FolderPlus className="h-3 w-3" />
                      Add section
                    </button>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
