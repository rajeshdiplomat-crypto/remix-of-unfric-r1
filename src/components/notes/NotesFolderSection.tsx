import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus } from "lucide-react";
import { NotesNoteRow } from "./NotesNoteRow";
import { NotesActivityDot, getMostRecentUpdate } from "./NotesActivityDot";
import type { Note, NoteFolder, NoteGroup } from "@/pages/Notes";

interface NotesFolderSectionProps {
  folder: NoteFolder;
  notes: Note[];
  group: NoteGroup;
  allGroups?: NoteGroup[];
  selectedNoteId?: string;
  onNoteClick: (note: Note) => void;
  onDeleteNote?: (noteId: string) => void;
  onUpdateNote?: (note: Note) => void;
  onAddNote: (folderId: string) => void;
}

export function NotesFolderSection({
  folder,
  notes,
  group,
  allGroups = [],
  selectedNoteId,
  onNoteClick,
  onDeleteNote,
  onUpdateNote,
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
        className="w-full flex items-center gap-2 py-2 px-2 rounded hover:bg-primary/5 transition-colors group"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-primary/70" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
        )}
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-primary" />
        ) : (
          <Folder className="h-4 w-4 text-amber-500/80" />
        )}
        <span className="text-sm font-medium text-foreground/90">{folder.name}</span>

        {/* Activity Dot */}
        {mostRecentUpdate && <NotesActivityDot updatedAt={mostRecentUpdate} size="sm" />}

        <span className="text-[10px] text-muted-foreground/50 ml-auto">{folderNotes.length}</span>
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
                  allGroups={allGroups}
                  isIndented
                  isSelected={selectedNoteId === note.id}
                  onClick={() => onNoteClick(note)}
                  onDelete={onDeleteNote}
                  onUpdateNote={onUpdateNote}
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
