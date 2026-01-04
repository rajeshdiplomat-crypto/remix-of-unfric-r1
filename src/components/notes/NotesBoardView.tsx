import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { NotesActivityDot, getMostRecentUpdate } from "./NotesActivityDot";
import { ChevronRight, Plus, FolderPlus } from "lucide-react";
import type { Note, NoteGroup, NoteFolder } from "@/pages/Notes";

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
            <div
              key={group.id}
              className="w-[360px] shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm"
            >
              {/* Accent */}
              <div className="h-1" style={{ backgroundColor: group.color }} />

              {/* Header */}
              <div className="px-4 py-4 bg-background/40 border-b border-border/40">
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.color }} />
                  <h3 className="font-semibold text-foreground flex-1 text-base">{group.name}</h3>

                  {mostRecentUpdate && <NotesActivityDot updatedAt={mostRecentUpdate} size="md" />}

                  <span className="text-xs font-medium text-muted-foreground bg-muted/40 px-2 py-1 rounded-full ring-1 ring-border/40">
                    {groupNotes.length}
                  </span>
                </div>
              </div>

              {/* Content */}
              <ScrollArea className="max-h-[calc(50vh-100px)]">
                <div className="p-4 space-y-3">
                  {/* Direct notes */}
                  {groupNotes
                    .filter((n) => !n.folderId)
                    .map((note) => (
                      <div
                        key={note.id}
                        className={
                          "rounded-xl border transition-all cursor-pointer " +
                          (selectedNoteId === note.id
                            ? "border-primary/40 bg-primary/5 shadow-sm"
                            : "border-border/40 bg-background/60 hover:bg-background/80 hover:shadow-sm")
                        }
                        onClick={() => onNoteClick(note)}
                      >
                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-foreground text-sm line-clamp-1 flex-1">
                              {note.title || "Untitled"}
                            </h4>
                            <NotesActivityDot updatedAt={note.updatedAt} size="sm" />
                          </div>
                          {note.plainText && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">{note.plainText}</p>
                          )}
                          {note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {note.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground ring-1 ring-border/30"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                  {/* Sections */}
                  {groupFolders.map((folder) => {
                    const folderNotes = notes.filter((n) => n.folderId === folder.id);
                    const folderMostRecent = getMostRecentUpdate(folderNotes);
                    const isFolderExpanded = expandedFolders.has(folder.id);

                    return (
                      <div key={folder.id} className="pt-1">
                        <button
                          onClick={() => toggleFolder(folder.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors border border-border/30"
                        >
                          <ChevronRight
                            className={
                              "h-4 w-4 text-muted-foreground transition-transform " +
                              (isFolderExpanded ? "rotate-90" : "")
                            }
                          />
                          <span className="flex-1 text-left text-xs font-semibold tracking-wider text-foreground/80 uppercase">
                            {folder.name}
                          </span>
                          {folderMostRecent && <NotesActivityDot updatedAt={folderMostRecent} size="sm" />}
                          <span className="text-[10px] text-muted-foreground bg-background/60 px-2 py-0.5 rounded-full ring-1 ring-border/30">
                            {folderNotes.length}
                          </span>
                        </button>

                        {isFolderExpanded && (
                          <div className="mt-2 ml-2 pl-3 border-l border-border/40 space-y-2">
                            {folderNotes.map((note) => (
                              <div
                                key={note.id}
                                className={
                                  "rounded-xl border transition-all cursor-pointer " +
                                  (selectedNoteId === note.id
                                    ? "border-primary/40 bg-primary/5"
                                    : "border-border/30 bg-background/40 hover:bg-background/70")
                                }
                                onClick={() => onNoteClick(note)}
                              >
                                <div className="p-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-medium text-foreground text-sm line-clamp-1 flex-1">
                                      {note.title || "Untitled"}
                                    </h4>
                                    <NotesActivityDot updatedAt={note.updatedAt} size="sm" />
                                  </div>
                                  {note.plainText && (
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{note.plainText}</p>
                                  )}
                                </div>
                              </div>
                            ))}

                            <button
                              onClick={() => onAddNote(group.id, folder.id)}
                              className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                              Add note
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add section */}
                  {newFolderGroupId === group.id ? (
                    <div className="flex gap-2 p-2 rounded-xl bg-muted/15 border border-border/30">
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Section name…"
                        className="flex-1 text-sm px-3 py-2 rounded-lg bg-background border border-border/50 focus:outline-none focus:border-primary/40"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddFolder(group.id);
                          if (e.key === "Escape") {
                            setNewFolderGroupId(null);
                            setNewFolderName("");
                          }
                        }}
                      />
                      <button
                        onClick={() => handleAddFolder(group.id)}
                        className="text-sm px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/15 font-medium"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setNewFolderGroupId(group.id)}
                      className="w-full flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-2 px-2 transition-colors rounded-xl hover:bg-muted/20"
                    >
                      <FolderPlus className="h-4 w-4" />
                      Add section
                    </button>
                  )}

                  {/* Add note */}
                  <button
                    onClick={() => onAddNote(group.id, null)}
                    className="w-full flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-2 px-2 transition-colors rounded-xl hover:bg-muted/20"
                  >
                    <Plus className="h-4 w-4" />
                    Add note
                  </button>
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
