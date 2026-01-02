import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { NotesNoteRow } from "./NotesNoteRow";
import { NotesActivityDot, getMostRecentUpdate } from "./NotesActivityDot";
import { ChevronRight, Plus, FolderPlus } from "lucide-react";
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
              className="w-80 shrink-0 bg-card/50 rounded-xl border border-border/40 flex flex-col"
            >
              {/* Column Header - Enhanced */}
              <div 
                className="p-4 border-b border-border/30 border-t-2"
                style={{ borderTopColor: group.color }}
              >
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-foreground flex-1 text-base">{group.name}</h3>
                  {mostRecentUpdate && (
                    <NotesActivityDot updatedAt={mostRecentUpdate} size="md" />
                  )}
                  <span className="text-sm font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                    {groupNotes.length}
                  </span>
                </div>
              </div>

              {/* Column Content */}
              <ScrollArea className="flex-1 max-h-[calc(100vh-320px)]">
                <div className="p-3 space-y-2">
                  {/* Notes directly in group */}
                  {groupNotes
                    .filter((n) => !n.folderId)
                    .map((note) => (
                      <div key={note.id} className="relative group">
                        <div 
                          className={`rounded-lg border transition-all cursor-pointer ${
                            selectedNoteId === note.id 
                              ? 'border-primary/50 bg-primary/5 shadow-sm' 
                              : 'border-border/30 bg-background/50 hover:border-border/60 hover:shadow-sm'
                          }`}
                          onClick={() => onNoteClick(note)}
                        >
                          <div className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-medium text-foreground text-sm line-clamp-1 flex-1">
                                {note.title || "Untitled"}
                              </h4>
                              <NotesActivityDot updatedAt={note.updatedAt} size="sm" />
                            </div>
                            {note.plainText && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">
                                {note.plainText}
                              </p>
                            )}
                            {note.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {note.tags.slice(0, 3).map((tag) => (
                                  <span 
                                    key={tag} 
                                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                  {/* Sections / Folders */}
                  {groupFolders.map((folder) => {
                    const folderNotes = notes.filter((n) => n.folderId === folder.id);
                    const folderMostRecent = getMostRecentUpdate(folderNotes);
                    const isFolderExpanded = expandedFolders.has(folder.id);
                    
                    return (
                      <div key={folder.id} className="mt-3">
                        {/* Section Header */}
                        <button
                          onClick={() => toggleFolder(folder.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/20"
                        >
                          <ChevronRight 
                            className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isFolderExpanded ? "rotate-90" : ""}`}
                          />
                          <span className="flex-1 text-left font-medium text-foreground/80 uppercase tracking-wide">
                            {folder.name}
                          </span>
                          {folderMostRecent && (
                            <NotesActivityDot updatedAt={folderMostRecent} size="sm" />
                          )}
                          <span className="text-muted-foreground/60 bg-background/50 px-1.5 py-0.5 rounded text-[10px]">
                            {folderNotes.length}
                          </span>
                        </button>
                        
                        {/* Section Notes */}
                        {isFolderExpanded && (
                          <div className="mt-2 ml-2 pl-3 border-l-2 border-border/30 space-y-2">
                            {folderNotes.map((note) => (
                              <div 
                                key={note.id} 
                                className={`rounded-lg border transition-all cursor-pointer ${
                                  selectedNoteId === note.id 
                                    ? 'border-primary/50 bg-primary/5' 
                                    : 'border-border/20 bg-background/30 hover:border-border/40'
                                }`}
                                onClick={() => onNoteClick(note)}
                              >
                                <div className="p-2.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-medium text-foreground text-sm line-clamp-1 flex-1">
                                      {note.title || "Untitled"}
                                    </h4>
                                    <NotesActivityDot updatedAt={note.updatedAt} size="sm" />
                                  </div>
                                  {note.plainText && (
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                      {note.plainText}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                            
                            {/* Add note to section */}
                            <button
                              onClick={() => onAddNote(group.id, folder.id)}
                              className="w-full flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground py-1.5 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                              Add note
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Divider */}
                  {(groupNotes.length > 0 || groupFolders.length > 0) && (
                    <div className="border-t border-border/20 my-3" />
                  )}

                  {/* Add section input */}
                  {newFolderGroupId === group.id ? (
                    <div className="flex gap-2 p-2 bg-muted/20 rounded-lg border border-border/30">
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Section name..."
                        className="flex-1 text-sm px-2 py-1.5 rounded bg-background border border-border/50 focus:outline-none focus:border-primary/50"
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
                        className="text-sm px-3 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 font-medium"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setNewFolderGroupId(group.id)}
                      className="w-full flex items-center gap-2 text-sm text-muted-foreground/50 hover:text-muted-foreground py-2 px-2 transition-colors rounded-lg hover:bg-muted/30"
                    >
                      <FolderPlus className="h-4 w-4" />
                      Add section
                    </button>
                  )}

                  {/* Add note button */}
                  <button
                    onClick={() => onAddNote(group.id, null)}
                    className="w-full flex items-center gap-2 text-sm text-muted-foreground/50 hover:text-muted-foreground py-2 px-2 transition-colors rounded-lg hover:bg-muted/30"
                  >
                    <Plus className="h-4 w-4" />
                    Add note
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
