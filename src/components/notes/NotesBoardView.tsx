import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { NotesNoteRow } from "./NotesNoteRow";
import { NotesActivityDot, getMostRecentUpdate } from "./NotesActivityDot";
import { ChevronRight, Plus } from "lucide-react";
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
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleAddFolder = (groupId: string) => {
    if (newFolderName.trim()) {
      onAddFolder(groupId, newFolderName.trim());
      setNewFolderName("");
      setNewFolderGroupId(null);
    }
  };

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

                  {/* Folders / Sections */}
                  {groupFolders.map((folder) => {
                    const folderNotes = notes.filter((n) => n.folderId === folder.id);
                    const folderMostRecent = getMostRecentUpdate(folderNotes);
                    const isFolderExpanded = expandedFolders.has(folder.id);
                    
                    return (
                      <div key={folder.id} className="mt-3">
                        <button
                          onClick={() => toggleFolder(folder.id)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground/70 hover:text-foreground/80 uppercase tracking-wide transition-colors"
                        >
                          <ChevronRight 
                            className={`h-3 w-3 transition-transform ${isFolderExpanded ? "rotate-90" : ""}`}
                          />
                          <span className="flex-1 text-left">{folder.name}</span>
                          {folderMostRecent && (
                            <NotesActivityDot updatedAt={folderMostRecent} size="sm" />
                          )}
                          <span className="ml-auto">{folderNotes.length}</span>
                        </button>
                        
                        {isFolderExpanded && (
                          <div className="ml-4 space-y-1 mt-1">
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
                            
                            {/* Add note to section */}
                            <button
                              onClick={() => onAddNote(group.id, folder.id)}
                              className="w-full text-xs text-muted-foreground/40 hover:text-muted-foreground/70 py-1.5 transition-colors text-left pl-2"
                            >
                              + Add note
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add section input */}
                  {newFolderGroupId === group.id ? (
                    <div className="mt-2 flex gap-1">
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Section name..."
                        className="flex-1 text-xs px-2 py-1.5 rounded bg-background border border-border/50 focus:outline-none focus:border-primary/50"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddFolder(group.id);
                          if (e.key === "Escape") {
                            setNewFolderGroupId(null);
                            setNewFolderName("");
                          }
                        }}
                        onBlur={() => {
                          if (!newFolderName.trim()) {
                            setNewFolderGroupId(null);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleAddFolder(group.id)}
                        className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setNewFolderGroupId(group.id)}
                      className="w-full text-sm text-muted-foreground/40 hover:text-muted-foreground/70 py-1.5 transition-colors flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add section
                    </button>
                  )}

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
