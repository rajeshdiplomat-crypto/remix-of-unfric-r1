import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { NotesNoteRow } from "./NotesNoteRow";
import { NotesActivityDot, getMostRecentUpdate } from "./NotesActivityDot";
import type { Note, NoteGroup, NoteFolder } from "@/pages/Notes";

interface NotesBoardViewProps {
  groups: NoteGroup[];
  folders: NoteFolder[];
  notes: Note[];
  selectedNoteId?: string;
  onNoteClick: (note: Note) => void;
  onAddNote: (groupId: string, folderId: string | null) => void;
}

export function NotesBoardView({
  groups,
  folders,
  notes,
  selectedNoteId,
  onNoteClick,
  onAddNote,
}: NotesBoardViewProps) {
  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4 min-w-max">
        {sortedGroups.map((group) => {
          const groupNotes = notes.filter((n) => n.groupId === group.id);
          const groupFolders = folders.filter((f) => f.groupId === group.id);
          const mostRecentUpdate = getMostRecentUpdate(groupNotes);

          return (
            <div 
              key={group.id} 
              className="w-72 shrink-0 bg-muted/20 rounded-lg border border-border/30"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  <h3 className="font-medium text-foreground/90 flex-1">{group.name}</h3>
                  {mostRecentUpdate && (
                    <NotesActivityDot updatedAt={mostRecentUpdate} size="md" />
                  )}
                  <span className="text-xs text-muted-foreground/60">
                    {groupNotes.length}
                  </span>
                </div>
              </div>

              {/* Column Content */}
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="p-2 space-y-1">
                  {/* Notes directly in group */}
                  {groupNotes
                    .filter((n) => !n.folderId)
                    .map((note) => (
                      <div key={note.id} className="relative">
                        <NotesNoteRow
                          note={note}
                          group={group}
                          isSelected={selectedNoteId === note.id}
                          onClick={() => onNoteClick(note)}
                        />
                        <NotesActivityDot 
                          updatedAt={note.updatedAt} 
                          size="sm" 
                          className="absolute top-2 right-2"
                        />
                      </div>
                    ))}

                  {/* Folders */}
                  {groupFolders.map((folder) => {
                    const folderNotes = notes.filter((n) => n.folderId === folder.id);
                    const folderMostRecent = getMostRecentUpdate(folderNotes);
                    
                    return (
                      <div key={folder.id} className="mt-3">
                        <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground/70 uppercase tracking-wide">
                          <span>{folder.name}</span>
                          {folderMostRecent && (
                            <NotesActivityDot updatedAt={folderMostRecent} size="sm" />
                          )}
                          <span className="ml-auto">{folderNotes.length}</span>
                        </div>
                        {folderNotes.map((note) => (
                          <div key={note.id} className="relative">
                            <NotesNoteRow
                              note={note}
                              group={group}
                              isIndented
                              isSelected={selectedNoteId === note.id}
                              onClick={() => onNoteClick(note)}
                            />
                            <NotesActivityDot 
                              updatedAt={note.updatedAt} 
                              size="sm" 
                              className="absolute top-2 right-2"
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })}

                  {/* Add note button */}
                  <button
                    onClick={() => onAddNote(group.id, null)}
                    className="w-full text-sm text-muted-foreground/50 hover:text-foreground py-2 transition-colors"
                  >
                    + Add note
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
