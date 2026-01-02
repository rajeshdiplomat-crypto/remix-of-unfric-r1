import { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown, Plus, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotesFolderSection } from "./NotesFolderSection";
import { NotesNoteRow } from "./NotesNoteRow";
import { NotesActivityDot, getMostRecentUpdate } from "./NotesActivityDot";
import type { Note, NoteGroup, NoteFolder } from "@/pages/Notes";

interface NotesGroupSectionProps {
  group: NoteGroup;
  folders: NoteFolder[];
  notes: Note[];
  selectedNoteId?: string;
  onNoteClick: (note: Note) => void;
  onAddNote: (groupId: string, folderId: string | null) => void;
  onAddFolder: (groupId: string, folderName: string) => void;
  isInFocusMode?: boolean;
  isFocusedGroup?: boolean;
}

export function NotesGroupSection({
  group,
  folders,
  notes,
  selectedNoteId,
  onNoteClick,
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
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        {/* Accent line */}
        <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: group.color }} />

        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-5 py-4 text-left hover:bg-muted/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/30 ring-1 ring-border/40">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.color }} />
                <h2 className="text-base font-semibold text-foreground truncate">{group.name}</h2>
                {mostRecentUpdate && <NotesActivityDot updatedAt={mostRecentUpdate} size="md" />}
              </div>

              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{allGroupNotes.length} notes</span>
                {groupFolders.length > 0 && (
                  <>
                    <span className="opacity-50">•</span>
                    <span>{groupFolders.length} sections</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddNote(group.id, null);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            </div>
          </div>
        </button>

        {/* Body */}
        {isExpanded && (
          <div className="px-5 pb-5">
            <div className="rounded-2xl border border-border/40 bg-background/40 p-4">
              {/* Empty */}
              {allGroupNotes.length === 0 && groupFolders.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">No notes here yet.</p>
                  <div className="mt-3 flex justify-center gap-2">
                    <Button variant="outline" className="h-9 rounded-xl" onClick={() => onAddNote(group.id, null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add note
                    </Button>
                    <Button variant="ghost" className="h-9 rounded-xl" onClick={() => setIsAddingFolder(true)}>
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Add section
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Folders */}
                  {groupFolders.map((folder) => (
                    <NotesFolderSection
                      key={folder.id}
                      folder={folder}
                      notes={notes}
                      group={group}
                      selectedNoteId={selectedNoteId}
                      onNoteClick={onNoteClick}
                      onAddNote={(folderId) => onAddNote(group.id, folderId)}
                    />
                  ))}

                  {/* Direct Notes */}
                  {directNotes.length > 0 && (
                    <div className="space-y-0.5">
                      {groupFolders.length > 0 && (
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider pt-2">Ungrouped</p>
                      )}
                      <div className="rounded-xl border border-border/40 bg-background/50 p-2">
                        {directNotes.map((note) => (
                          <NotesNoteRow
                            key={note.id}
                            note={note}
                            group={group}
                            isSelected={selectedNoteId === note.id}
                            onClick={() => onNoteClick(note)}
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
                          className="h-9 rounded-xl"
                          onClick={() => onAddNote(group.id, null)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add note
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 rounded-xl"
                          onClick={() => setIsAddingFolder(true)}
                        >
                          <FolderPlus className="h-4 w-4 mr-2" />
                          Add section
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          ref={folderInputRef}
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          placeholder="Section name…"
                          className="h-9 w-52 rounded-xl bg-background"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateFolder();
                            if (e.key === "Escape") {
                              setIsAddingFolder(false);
                              setNewFolderName("");
                            }
                          }}
                        />
                        <Button size="sm" className="h-9 rounded-xl" onClick={handleCreateFolder}>
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 rounded-xl"
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
  );
}
