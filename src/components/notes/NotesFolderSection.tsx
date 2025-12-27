import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotesNoteRow } from "./NotesNoteRow";
import type { Note, NoteFolder, NoteGroup } from "@/pages/Notes";

interface NotesFolderSectionProps {
  folder: NoteFolder;
  notes: Note[];
  group: NoteGroup;
  selectedNoteId?: string;
  onNoteClick: (note: Note) => void;
  onAddNote: (folderId: string) => void;
}

export function NotesFolderSection({
  folder,
  notes,
  group,
  selectedNoteId,
  onNoteClick,
  onAddNote,
}: NotesFolderSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const folderNotes = notes.filter((n) => n.folderId === folder.id);

  return (
    <div className="ml-4">
      {/* Folder Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/30 transition-colors group"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        {isExpanded ? (
          <FolderOpen className="h-4 w-4" style={{ color: group.color }} />
        ) : (
          <Folder className="h-4 w-4" style={{ color: group.color }} />
        )}
        <span className="text-sm font-medium text-foreground/80">{folder.name}</span>
        <span className="text-xs text-muted-foreground ml-1">
          ({folderNotes.length})
        </span>
      </button>

      {/* Folder Content (Notes) */}
      {isExpanded && (
        <div className="mt-1 space-y-1">
          {folderNotes.length === 0 ? (
            <div className="ml-6 py-3 text-center">
              <p className="text-sm text-muted-foreground mb-2">No notes yet</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddNote(folder.id)}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add note
              </Button>
            </div>
          ) : (
            <>
              {folderNotes.map((note) => (
                <NotesNoteRow
                  key={note.id}
                  note={note}
                  group={group}
                  isIndented
                  isSelected={selectedNoteId === note.id}
                  onClick={() => onNoteClick(note)}
                />
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddNote(folder.id)}
                className="ml-6 text-xs text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add note
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
