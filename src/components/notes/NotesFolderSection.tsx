import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react";
import { NotesNoteRow } from "./NotesNoteRow";
import { NotesActivityDot, getMostRecentUpdate } from "./NotesActivityDot";
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
  const mostRecentUpdate = getMostRecentUpdate(folderNotes);

  return (
    <div className="ml-2">
      {/* Folder Header - lighter than group */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 py-1.5 px-1 rounded hover:bg-muted/10 transition-colors group"
      >
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
        )}
        {isExpanded ? (
          <FolderOpen className="h-3.5 w-3.5 text-muted-foreground/60" />
        ) : (
          <Folder className="h-3.5 w-3.5 text-muted-foreground/60" />
        )}
        <span className="text-sm text-foreground/70">{folder.name}</span>
        
        {/* Activity Dot */}
        {mostRecentUpdate && (
          <NotesActivityDot updatedAt={mostRecentUpdate} size="sm" />
        )}
        
        <span className="text-[10px] text-muted-foreground/50 ml-auto">
          {folderNotes.length}
        </span>
      </button>

      {/* Folder Content (Notes) */}
      {isExpanded && (
        <div className="ml-5 mt-0.5 space-y-0.5">
          {folderNotes.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-xs text-muted-foreground/50 mb-2">No notes yet</p>
              <button
                onClick={() => onAddNote(folder.id)}
                className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                + Add note
              </button>
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
                  showActivityDot
                />
              ))}
              <button
                onClick={() => onAddNote(folder.id)}
                className="text-xs text-muted-foreground/40 hover:text-foreground transition-colors py-1"
              >
                + Add note
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
