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
              <div className="px-4 pb-4 pt-2">
                {/* Accent gradient bar */}
                <div
                  className="h-0.5 rounded-full mb-3 opacity-60"
                  style={{ background: `linear-gradient(90deg, ${group.color || "#64748b"} 0%, transparent 100%)` }}
                />

                <div className="rounded-xl bg-gradient-to-b from-muted/30 to-background/50 p-4 border border-border/20">
                  {/* Empty */}
                  {allGroupNotes.length === 0 && groupFolders.length === 0 ? (
                    <div className="py-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                        <Plus className="h-5 w-5 text-muted-foreground/50" />
                      </div>
                      <p className="text-xs text-muted-foreground">No notes yet</p>
                      <div className="mt-3 flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg text-xs"
                          onClick={() => onAddNote(group.id, null)}
                        >
                          <Plus className="h-3 w-3 mr-1.5" />
                          Add note
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Sections Header */}
                      {groupFolders.length > 0 && (
                        <div className="flex items-center gap-2 pb-2">
                          <div className="h-4 w-1 rounded-full bg-cyan-500" />
                          <span className="text-[11px] font-semibold text-cyan-600 uppercase tracking-wide">
                            Sections
                          </span>
                          <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
                        </div>
                      )}

                      {/* Folders */}
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

                      {/* Direct Notes */}
                      {directNotes.length > 0 && (
                        <div className="space-y-2">
                          {/* Notes Header */}
                          <div className="flex items-center gap-2 pb-1">
                            <div className="h-4 w-1 rounded-full" style={{ background: group.color || "#64748b" }} />
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                              {groupFolders.length > 0 ? "Ungrouped Notes" : "Notes"}
                            </span>
                            <span className="text-[10px] text-muted-foreground/50">({directNotes.length})</span>
                            <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent" />
                          </div>

                          <div className="rounded-lg border border-border/40 bg-card/60 overflow-hidden divide-y divide-border/20">
                            {directNotes.map((note) => (
                              <NotesNoteRow
                                key={note.id}
                                note={note}
                                group={group}
                                allGroups={allGroups}
                                isSelected={selectedNoteId === note.id}
                                onClick={() => onNoteClick(note)}
                                onDelete={onDeleteNote}
                                onUpdateNote={onUpdateNote}
                                showActivityDot
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-2">
                        {!isAddingFolder ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 rounded text-xs"
                              onClick={() => onAddNote(group.id, null)}
                            >
                              <Plus className="h-3 w-3 mr-1.5" />
                              Add note
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <Input
                              ref={folderInputRef}
                              value={newFolderName}
                              onChange={(e) => setNewFolderName(e.target.value)}
                              placeholder="Section name…"
                              className="h-8 w-40 rounded-lg bg-background text-xs"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleCreateFolder();
                                if (e.key === "Escape") {
                                  setIsAddingFolder(false);
                                  setNewFolderName("");
                                }
                              }}
                            />
                            <Button size="sm" className="h-8 rounded-lg text-xs" onClick={handleCreateFolder}>
                              Add
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 rounded-lg text-xs"
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
