import { useState, useMemo } from "react";
import { FileText, Plus, FolderPlus } from "lucide-react";
import { NotesActivityDot, getMostRecentUpdate } from "./NotesActivityDot";
import type { Note, NoteGroup, NoteFolder } from "@/pages/Notes";

interface NotesMindMapViewProps {
  groups: NoteGroup[];
  folders: NoteFolder[];
  notes: Note[];
  selectedNoteId?: string;
  onNoteClick: (note: Note) => void;
  onAddNote: (groupId: string, folderId: string | null) => void;
  onAddFolder: (groupId: string, folderName: string) => void;
}

export function NotesMindMapView({
  groups,
  folders,
  notes,
  selectedNoteId,
  onNoteClick,
  onAddNote,
  onAddFolder,
}: NotesMindMapViewProps) {
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);
  const [newFolderGroupId, setNewFolderGroupId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");

  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);

  // Calculate positions for spatial layout
  const groupPositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number; angle: number }> = {};
    const centerX = 50; // percentage
    const centerY = 50;
    const radius = 35;
    
    sortedGroups.forEach((group, index) => {
      const angle = (index * 360 / sortedGroups.length) - 90; // Start from top
      const radians = (angle * Math.PI) / 180;
      positions[group.id] = {
        x: centerX + radius * Math.cos(radians),
        y: centerY + radius * Math.sin(radians),
        angle,
      };
    });
    
    return positions;
  }, [sortedGroups]);

  const handleAddFolder = (groupId: string) => {
    if (newFolderName.trim()) {
      onAddFolder(groupId, newFolderName.trim());
      setNewFolderName("");
      setNewFolderGroupId(null);
    }
  };

  return (
    <div className="relative w-full h-[600px] overflow-hidden rounded-xl bg-gradient-to-br from-muted/20 via-background to-muted/10">
      {/* Soft background pattern */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="mindmap-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="0.5" fill="currentColor" className="text-muted-foreground/20" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mindmap-grid)" />
        </svg>
      </div>

      {/* Central Hub */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
          <div className="text-center">
            <span className="text-sm font-medium text-primary">Notes</span>
            <span className="block text-xs text-muted-foreground">{notes.length}</span>
          </div>
        </div>
      </div>

      {/* Connection Lines (SVG) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        <defs>
          <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {sortedGroups.map((group) => {
          const pos = groupPositions[group.id];
          if (!pos) return null;
          
          return (
            <line
              key={`line-${group.id}`}
              x1="50%"
              y1="50%"
              x2={`${pos.x}%`}
              y2={`${pos.y}%`}
              stroke={group.color}
              strokeWidth="2"
              strokeOpacity="0.2"
              strokeDasharray="4 4"
            />
          );
        })}
      </svg>

      {/* Group Clusters */}
      {sortedGroups.map((group) => {
        const pos = groupPositions[group.id];
        if (!pos) return null;
        
        const groupNotes = notes.filter((n) => n.groupId === group.id);
        const groupFolders = folders.filter((f) => f.groupId === group.id);
        const mostRecentUpdate = getMostRecentUpdate(groupNotes);
        const isHovered = hoveredGroup === group.id;

        return (
          <div
            key={group.id}
            className="absolute transition-all duration-300 ease-out"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: `translate(-50%, -50%) ${isHovered ? 'scale(1.05)' : 'scale(1)'}`,
              zIndex: isHovered ? 20 : 5,
            }}
            onMouseEnter={() => setHoveredGroup(group.id)}
            onMouseLeave={() => setHoveredGroup(null)}
          >
            {/* Group Node - Cluster Style */}
            <div 
              className={`relative rounded-2xl transition-all duration-300 ${
                isHovered 
                  ? 'bg-background shadow-xl border-2' 
                  : 'bg-background/80 shadow-md border'
              }`}
              style={{ 
                borderColor: isHovered ? group.color : `${group.color}40`,
                minWidth: isHovered ? '200px' : '140px',
              }}
            >
              {/* Group Header */}
              <div className="p-3 flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: group.color }}
                />
                <span className="font-medium text-foreground/90 flex-1 text-sm">
                  {group.name}
                </span>
                {mostRecentUpdate && (
                  <NotesActivityDot updatedAt={mostRecentUpdate} size="md" />
                )}
                <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                  {groupNotes.length}
                </span>
              </div>

              {/* Expanded Content on Hover */}
              {isHovered && (
                <div className="border-t border-border/30 p-2 space-y-1 max-h-64 overflow-y-auto">
                  {/* Folders / Sections */}
                  {groupFolders.map((folder) => {
                    const folderNotes = notes.filter((n) => n.folderId === folder.id);
                    const folderMostRecent = getMostRecentUpdate(folderNotes);
                    const isFolderHovered = hoveredFolder === folder.id;

                    return (
                      <div 
                        key={folder.id} 
                        className="relative"
                        onMouseEnter={() => setHoveredFolder(folder.id)}
                        onMouseLeave={() => setHoveredFolder(null)}
                      >
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/30">
                          <span className="text-xs text-foreground/70 flex-1">
                            {folder.name}
                          </span>
                          {folderMostRecent && (
                            <NotesActivityDot updatedAt={folderMostRecent} size="sm" />
                          )}
                          <span className="text-xs text-muted-foreground/50">
                            {folderNotes.length}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddNote(group.id, folder.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-0.5 rounded hover:bg-primary/10 transition-opacity"
                            style={{ opacity: isFolderHovered ? 1 : 0 }}
                          >
                            <Plus className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>

                        {/* Folder Notes */}
                        {isFolderHovered && folderNotes.length > 0 && (
                          <div className="ml-3 mt-1 space-y-0.5">
                            {folderNotes.slice(0, 5).map((note) => (
                              <button
                                key={note.id}
                                onClick={() => onNoteClick(note)}
                                className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors ${
                                  selectedNoteId === note.id 
                                    ? "bg-primary/10" 
                                    : "hover:bg-muted/50"
                                }`}
                              >
                                <FileText className="h-3 w-3 text-muted-foreground/40" />
                                <span className="text-xs text-foreground/80 truncate flex-1">
                                  {note.title || "Untitled"}
                                </span>
                                <NotesActivityDot updatedAt={note.updatedAt} size="sm" />
                              </button>
                            ))}
                            {folderNotes.length > 5 && (
                              <span className="text-xs text-muted-foreground/50 pl-2">
                                +{folderNotes.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Direct notes (not in folders) */}
                  {groupNotes
                    .filter((n) => !n.folderId)
                    .slice(0, 5)
                    .map((note) => (
                      <button
                        key={note.id}
                        onClick={() => onNoteClick(note)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                          selectedNoteId === note.id 
                            ? "bg-primary/10" 
                            : "hover:bg-muted/30"
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5 text-muted-foreground/40" />
                        <span className="text-xs text-foreground/80 truncate flex-1">
                          {note.title || "Untitled"}
                        </span>
                        <NotesActivityDot updatedAt={note.updatedAt} size="sm" />
                      </button>
                    ))}

                  {groupNotes.filter((n) => !n.folderId).length > 5 && (
                    <span className="text-xs text-muted-foreground/50 pl-2 block">
                      +{groupNotes.filter((n) => !n.folderId).length - 5} more notes
                    </span>
                  )}

                  {/* Creation Actions */}
                  <div className="pt-2 border-t border-border/20 mt-2 space-y-1">
                    {newFolderGroupId === group.id ? (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          placeholder="Section name..."
                          className="flex-1 text-xs px-2 py-1 rounded bg-muted border border-border/50 focus:outline-none focus:border-primary/50"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter") handleAddFolder(group.id);
                            if (e.key === "Escape") {
                              setNewFolderGroupId(null);
                              setNewFolderName("");
                            }
                          }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddFolder(group.id);
                          }}
                          className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewFolderGroupId(group.id);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground/60 hover:text-foreground/80 transition-colors"
                      >
                        <FolderPlus className="h-3 w-3" />
                        Add section
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddNote(group.id, null);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground/60 hover:text-foreground/80 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      Add note
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Floating Note Indicators - Visual leaves */}
            {!isHovered && groupNotes.length > 0 && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {Array.from({ length: Math.min(groupNotes.length, 5) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-foreground/20"
                    style={{ 
                      opacity: 0.3 + (i * 0.1),
                    }}
                  />
                ))}
                {groupNotes.length > 5 && (
                  <span className="text-[10px] text-muted-foreground/50 ml-1">
                    +{groupNotes.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs text-muted-foreground/60">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border-2 border-primary/30" />
          <span>Group</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText className="w-3 h-3" />
          <span>Note</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Recent</span>
        </div>
      </div>
    </div>
  );
}
