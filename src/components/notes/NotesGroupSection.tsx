import { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown, Plus, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotesFolderSection } from "./NotesFolderSection";
import { NotesNoteRow } from "./NotesNoteRow";
import type { Note, NoteGroup, NoteFolder } from "@/pages/Notes";

interface NotesGroupSectionProps {
  group: NoteGroup;
  folders: NoteFolder[];
  notes: Note[];
  selectedNoteId?: string;
  onNoteClick: (note: Note) => void;
  onAddNote: (groupId: string, folderId: string | null) => void;
  onAddFolder: (groupId: string, folderName: string) => void;
}

export function NotesGroupSection({
  group,
  folders,
  notes,
  selectedNoteId,
  onNoteClick,
  onAddNote,
  onAddFolder,
}: NotesGroupSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Filter data for this group
  const groupFolders = folders.filter((f) => f.groupId === group.id);
  const directNotes = notes.filter((n) => n.groupId === group.id && !n.folderId);
  const allGroupNotes = notes.filter((n) => n.groupId === group.id);

  useEffect(() => {
    if (isAddingFolder && folderInputRef.current) {
      folderInputRef.current.focus();
    }
  }, [isAddingFolder]);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onAddFolder(group.id, newFolderName.trim());
      setNewFolderName("");
      setIsAddingFolder(false);
    }
  };

  return (
    <div className="group/section">
      {/* Group Header - Section title style, not card */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 py-3 px-1 hover:bg-muted/10 transition-colors rounded-md"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground/60" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
        )}
        
        <div
          className="h-2.5 w-2.5 rounded-full shrink-0 opacity-80"
          style={{ backgroundColor: group.color }}
        />
        
        <h2 className="text-base font-medium text-foreground/90">{group.name}</h2>
        
        <span className="text-xs text-muted-foreground/70 ml-auto">
          {allGroupNotes.length} {allGroupNotes.length === 1 ? "note" : "notes"}
          {groupFolders.length > 0 && ` · ${groupFolders.length} ${groupFolders.length === 1 ? "section" : "sections"}`}
        </span>
      </button>

      {/* Expanded Content - flows under header */}
      {isExpanded && (
        <div className="pl-8 pr-1 pb-6 pt-2 space-y-1">
          {/* Empty State */}
          {allGroupNotes.length === 0 && groupFolders.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground/70 mb-4">This group is empty</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => onAddNote(group.id, null)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  + Add your first note
                </button>
                <span className="text-muted-foreground/40">·</span>
                <button
                  onClick={() => setIsAddingFolder(true)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  + Create a section
                </button>
              </div>
            </div>
          )}

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

          {/* Direct Notes (not in any folder) */}
          {directNotes.length > 0 && (
            <div className="space-y-0.5">
              {groupFolders.length > 0 && (
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider pt-3 pb-1">
                  Ungrouped
                </p>
              )}
              {directNotes.map((note) => (
                <NotesNoteRow
                  key={note.id}
                  note={note}
                  group={group}
                  isSelected={selectedNoteId === note.id}
                  onClick={() => onNoteClick(note)}
                />
              ))}
            </div>
          )}

          {/* Inline Add Actions - text style */}
          {(allGroupNotes.length > 0 || groupFolders.length > 0) && (
            <div className="flex items-center gap-4 pt-4">
              <button
                onClick={() => onAddNote(group.id, null)}
                className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                + Add note
              </button>
              
              {!isAddingFolder ? (
                <button
                  onClick={() => setIsAddingFolder(true)}
                  className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  + Add section
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    ref={folderInputRef}
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Section name..."
                    className="h-7 w-36 text-sm bg-transparent border-muted-foreground/20"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateFolder();
                      if (e.key === "Escape") {
                        setIsAddingFolder(false);
                        setNewFolderName("");
                      }
                    }}
                  />
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleCreateFolder}>
                    Add
                  </Button>
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setIsAddingFolder(false);
                      setNewFolderName("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Divider between groups */}
      <div className="border-b border-border/30 mt-2" />
    </div>
  );
}
