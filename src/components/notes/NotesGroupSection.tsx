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
    <div className="border border-border/50 rounded-lg overflow-hidden bg-card/30">
      {/* Group Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/20 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
        
        <div
          className="h-3 w-3 rounded-full shrink-0"
          style={{ backgroundColor: group.color }}
        />
        
        <h2 className="font-semibold text-foreground">{group.name}</h2>
        
        <span className="text-sm text-muted-foreground ml-auto">
          {allGroupNotes.length} {allGroupNotes.length === 1 ? "note" : "notes"}
          {groupFolders.length > 0 && ` · ${groupFolders.length} ${groupFolders.length === 1 ? "folder" : "folders"}`}
        </span>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {/* Empty State */}
          {allGroupNotes.length === 0 && groupFolders.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">This group is empty</p>
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddNote(group.id, null)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add your first note
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingFolder(true)}
                >
                  <FolderPlus className="h-4 w-4 mr-1" />
                  Create a section
                </Button>
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
            <div className="space-y-1">
              {groupFolders.length > 0 && (
                <p className="text-xs text-muted-foreground px-2 pt-2 uppercase tracking-wide">
                  Ungrouped Notes
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

          {/* Inline Add Actions */}
          {(allGroupNotes.length > 0 || groupFolders.length > 0) && (
            <div className="flex items-center gap-2 pt-2 border-t border-border/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddNote(group.id, null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add note
              </Button>
              
              {!isAddingFolder ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingFolder(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <FolderPlus className="h-4 w-4 mr-1" />
                  Add section
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    ref={folderInputRef}
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Section name..."
                    className="h-8 w-40 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateFolder();
                      if (e.key === "Escape") {
                        setIsAddingFolder(false);
                        setNewFolderName("");
                      }
                    }}
                  />
                  <Button size="sm" className="h-8" onClick={handleCreateFolder}>
                    Add
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
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
          )}
        </div>
      )}
    </div>
  );
}
