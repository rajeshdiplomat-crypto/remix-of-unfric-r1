import { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown, Plus, FolderPlus, MoreHorizontal, Pin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotesFolderSection } from "./NotesFolderSection";
import { NotesNoteRow } from "./NotesNoteRow";
import { NotesActivityDot, getMostRecentUpdate } from "./NotesActivityDot";
import { getPresetImage } from "@/lib/presetImages";
import type { Note, NoteGroup, NoteFolder } from "@/pages/Notes";

interface NotesGroupSectionProps {
  group: NoteGroup;
  folders: NoteFolder[];
  notes: Note[];
  allGroups?: NoteGroup[];
  selectedNoteId?: string;
  onNoteClick: (note: Note) => void;
  onDeleteNote?: (noteId: string) => void;
  onUpdateNote?: (note: Note) => void;
  onAddNote: (groupId: string, folderId: string | null) => void;
  onAddFolder: (groupId: string, folderName: string) => void;
  isInFocusMode?: boolean;
  isFocusedGroup?: boolean;
}

export function NotesGroupSection({
  group,
  folders,
  notes,
  allGroups = [],
  selectedNoteId,
  onNoteClick,
  onDeleteNote,
  onUpdateNote,
  onAddNote,
  onAddFolder,
  isInFocusMode = false,
  isFocusedGroup = false,
}: NotesGroupSectionProps) {
  const [isExpanded, setIsExpanded] = useState(isFocusedGroup);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFocusedGroup) setIsExpanded(true);
  }, [isFocusedGroup]);

  const groupFolders = folders.filter((f) => f.groupId === group.id);
  const directNotes = notes.filter((n) => n.groupId === group.id && !n.folderId);
  const allGroupNotes = notes.filter((n) => n.groupId === group.id);
  const mostRecentUpdate = getMostRecentUpdate(allGroupNotes);
  const pinnedCount = allGroupNotes.filter((n) => n.isPinned).length;

  // Get preview from most recent note
  const mostRecentNote =
    allGroupNotes.length > 0
      ? allGroupNotes.reduce((a, b) => (new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b))
      : null;

  useEffect(() => {
    if (isAddingFolder && folderInputRef.current) folderInputRef.current.focus();
  }, [isAddingFolder]);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    onAddFolder(group.id, newFolderName.trim());
    setNewFolderName("");
    setIsAddingFolder(false);
  };

  const focusModeClasses = isInFocusMode && !isFocusedGroup ? "opacity-50 pointer-events-none" : "";

  return (
    <div className={focusModeClasses}>
      <div className="rounded-xl border border-border/40 bg-card shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
        <div className="flex">
          {/* Left: Wide Cover Image */}
          <div className="w-32 shrink-0 overflow-hidden rounded-l-xl self-start">
            <img
              src={getPresetImage("notes", group.id)}
              alt=""
              className="w-full h-auto object-cover min-h-[100px] max-h-[120px]"
            />
          </div>

          {/* Right: Header & Content */}
          <div className="flex-1">
            {/* Compact Card Header */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full px-4 py-3 text-left hover:bg-muted/5 transition-colors group"
            >
              <div className="flex items-center gap-4">
                {/* Group info - left side */}
                <div className="min-w-0 w-36 shrink-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-medium text-foreground truncate">{group.name}</h2>
                    <span className="text-xs text-muted-foreground/60">({allGroupNotes.length})</span>
                  </div>
                  {/* Last edited */}
                  {mostRecentNote && (
                    <p className="mt-0.5 text-xs text-muted-foreground/50 truncate">
                      {formatDistanceToNow(new Date(mostRecentNote.updatedAt), { addSuffix: true })}
                    </p>
                  )}
                </div>

                {/* Recent notes preview - fills the center space */}
                <div className="flex-1 flex items-center gap-2 overflow-hidden">
                  {allGroupNotes.slice(0, 3).map((note, idx) => (
                    <div
                      key={note.id}
                      className="flex items-center gap-2 px-2.5 py-1.5 bg-muted/30 hover:bg-muted/50 rounded-md text-xs max-w-[180px] transition-colors"
                      style={{ opacity: 1 - idx * 0.2 }}
                    >
                      {note.isPinned && <Pin className="h-2.5 w-2.5 text-primary/70 shrink-0" />}
                      <span className="truncate text-muted-foreground">{note.title || "Untitled"}</span>
                    </div>
                  ))}
                  {allGroupNotes.length > 3 && (
                    <span className="text-xs text-muted-foreground/40 shrink-0">+{allGroupNotes.length - 3} more</span>
                  )}
                  {allGroupNotes.length === 0 && (
                    <span className="text-xs text-muted-foreground/40 italic">No notes yet</span>
                  )}
                </div>

                {/* Right side - activity dot and chevron */}
                <div className="flex items-center gap-2 shrink-0">
                  {pinnedCount > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground/50">
                      <Pin className="h-2.5 w-2.5" />
                      {pinnedCount}
                    </span>
                  )}
                  {mostRecentUpdate && <NotesActivityDot updatedAt={mostRecentUpdate} size="sm" />}

                  {/* Quick add button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onAddNote(group.id, null);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>

                  <div className="h-6 w-6 flex items-center justify-center rounded-lg">
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                    )}
                  </div>
                </div>
              </div>
            </button>

            {/* Expanded Body */}
            {isExpanded && (
              <div className="px-4 pb-5 pt-3">
                {/* Empty */}
                {allGroupNotes.length === 0 && groupFolders.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-muted/60 to-muted/20 flex items-center justify-center">
                      <Plus className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground/60 mb-3">Start adding notes</p>
                    <Button
                      size="sm"
                      className="h-9 rounded-full px-5 text-xs bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm"
                      onClick={() => onAddNote(group.id, null)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-2" />
                      New Note
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Sections */}
                    {groupFolders.length > 0 && (
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-500">
                            Sections
                          </span>
                          <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/30 via-cyan-500/10 to-transparent" />
                        </div>
                        <div className="grid gap-2">
                          {groupFolders.map((folder) => (
                            <NotesFolderSection
                              key={folder.id}
                              folder={folder}
                              notes={notes}
                              group={group}
                              allGroups={allGroups}
                              selectedNoteId={selectedNoteId}
                              onNoteClick={onNoteClick}
                              onDeleteNote={onDeleteNote}
                              onUpdateNote={onUpdateNote}
                              onAddNote={(folderId) => onAddNote(group.id, folderId)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Direct Notes */}
                    {directNotes.length > 0 && (
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                            {groupFolders.length > 0 ? "Quick Notes" : "All Notes"}
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground/40 bg-muted/40 px-2 py-0.5 rounded-full">
                            {directNotes.length}
                          </span>
                          <div className="flex-1 h-px bg-gradient-to-r from-border/40 to-transparent" />
                        </div>

                        <div className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/30 shadow-sm overflow-hidden">
                          {directNotes.map((note, idx) => (
                            <div key={note.id} className={idx > 0 ? "border-t border-border/20" : ""}>
                              <NotesNoteRow
                                note={note}
                                group={group}
                                allGroups={allGroups}
                                isSelected={selectedNoteId === note.id}
                                onClick={() => onNoteClick(note)}
                                onDelete={onDeleteNote}
                                onUpdateNote={onUpdateNote}
                                showActivityDot
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-3">
                      {!isAddingFolder ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-full px-4 text-xs border-dashed hover:border-solid"
                          onClick={() => onAddNote(group.id, null)}
                        >
                          <Plus className="h-3.5 w-3.5 mr-2" />
                          Add note
                        </Button>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            ref={folderInputRef}
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Section name…"
                            className="h-9 w-44 rounded-xl bg-background text-xs"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCreateFolder();
                              if (e.key === "Escape") {
                                setIsAddingFolder(false);
                                setNewFolderName("");
                              }
                            }}
                          />
                          <Button size="sm" className="h-9 rounded-xl text-xs" onClick={handleCreateFolder}>
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 rounded-xl text-xs"
                            onClick={() => {
                              setIsAddingFolder(false);
                              setNewFolderName("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
