import { useState } from "react";
import { ChevronRight, FileText } from "lucide-react";
import { NotesActivityDot, getMostRecentUpdate } from "./NotesActivityDot";
import type { Note, NoteGroup, NoteFolder } from "@/pages/Notes";

interface NotesMindMapViewProps {
  groups: NoteGroup[];
  folders: NoteFolder[];
  notes: Note[];
  selectedNoteId?: string;
  onNoteClick: (note: Note) => void;
}

export function NotesMindMapView({
  groups,
  folders,
  notes,
  selectedNoteId,
  onNoteClick,
}: NotesMindMapViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

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

  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Central Hub */}
      <div className="relative">
        {/* Center point */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">Notes</span>
          </div>
        </div>

        {/* Groups as branches */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedGroups.map((group) => {
            const groupNotes = notes.filter((n) => n.groupId === group.id);
            const groupFolders = folders.filter((f) => f.groupId === group.id);
            const isExpanded = expandedGroups.has(group.id);
            const mostRecentUpdate = getMostRecentUpdate(groupNotes);

            return (
              <div 
                key={group.id}
                className="relative"
              >
                {/* Connection line */}
                <div 
                  className="absolute -top-6 left-1/2 w-px h-6 bg-border/50"
                  style={{ backgroundColor: `${group.color}40` }}
                />

                {/* Group Node */}
                <div 
                  className="rounded-lg border border-border/50 overflow-hidden transition-all"
                  style={{ borderColor: `${group.color}40` }}
                >
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors"
                  >
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="font-medium text-foreground/90 flex-1 text-left">
                      {group.name}
                    </span>
                    {mostRecentUpdate && (
                      <NotesActivityDot updatedAt={mostRecentUpdate} size="md" />
                    )}
                    <span className="text-xs text-muted-foreground/60">
                      {groupNotes.length}
                    </span>
                    <ChevronRight 
                      className={`h-4 w-4 text-muted-foreground/50 transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-border/30 p-2 space-y-1 bg-muted/10">
                      {/* Folders */}
                      {groupFolders.map((folder) => {
                        const folderNotes = notes.filter((n) => n.folderId === folder.id);
                        const isFolderExpanded = expandedFolders.has(folder.id);
                        const folderMostRecent = getMostRecentUpdate(folderNotes);

                        return (
                          <div key={folder.id}>
                            <button
                              onClick={() => toggleFolder(folder.id)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/30 transition-colors"
                            >
                              <ChevronRight 
                                className={`h-3 w-3 text-muted-foreground/50 transition-transform ${
                                  isFolderExpanded ? "rotate-90" : ""
                                }`}
                              />
                              <span className="text-sm text-foreground/70 flex-1 text-left">
                                {folder.name}
                              </span>
                              {folderMostRecent && (
                                <NotesActivityDot updatedAt={folderMostRecent} size="sm" />
                              )}
                              <span className="text-xs text-muted-foreground/50">
                                {folderNotes.length}
                              </span>
                            </button>

                            {isFolderExpanded && (
                              <div className="ml-4 space-y-0.5">
                                {folderNotes.map((note) => (
                                  <button
                                    key={note.id}
                                    onClick={() => onNoteClick(note)}
                                    className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors ${
                                      selectedNoteId === note.id 
                                        ? "bg-primary/10" 
                                        : "hover:bg-muted/20"
                                    }`}
                                  >
                                    <FileText className="h-3 w-3 text-muted-foreground/40" />
                                    <span className="text-sm text-foreground/80 truncate flex-1">
                                      {note.title || "Untitled"}
                                    </span>
                                    <NotesActivityDot updatedAt={note.updatedAt} size="sm" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Direct notes (not in folders) */}
                      {groupNotes
                        .filter((n) => !n.folderId)
                        .map((note) => (
                          <button
                            key={note.id}
                            onClick={() => onNoteClick(note)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                              selectedNoteId === note.id 
                                ? "bg-primary/10" 
                                : "hover:bg-muted/20"
                            }`}
                          >
                            <FileText className="h-3.5 w-3.5 text-muted-foreground/40" />
                            <span className="text-sm text-foreground/80 truncate flex-1">
                              {note.title || "Untitled"}
                            </span>
                            <NotesActivityDot updatedAt={note.updatedAt} size="sm" />
                          </button>
                        ))}

                      {groupNotes.length === 0 && groupFolders.length === 0 && (
                        <p className="text-xs text-muted-foreground/50 text-center py-2">
                          No notes yet
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
