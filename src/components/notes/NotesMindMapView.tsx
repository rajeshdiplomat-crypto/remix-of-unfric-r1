import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { FileText, Plus, FolderPlus, ZoomIn, ZoomOut, RotateCcw, Maximize2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface Position {
  x: number;
  y: number;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [newFolderGroupId, setNewFolderGroupId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  
  // Pan and zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef<Position>({ x: 0, y: 0 });

  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);

  // Calculate center position
  const centerX = 400;
  const centerY = 300;
  const groupRadius = 200;

  // Calculate group positions in a circle
  const groupPositions = useMemo(() => {
    const positions: Record<string, Position> = {};
    sortedGroups.forEach((group, index) => {
      const angle = (index * 2 * Math.PI / sortedGroups.length) - Math.PI / 2;
      positions[group.id] = {
        x: centerX + groupRadius * Math.cos(angle),
        y: centerY + groupRadius * Math.sin(angle),
      };
    });
    return positions;
  }, [sortedGroups]);

  // Handle zoom
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setExpandedGroups(new Set());
    setExpandedFolders(new Set());
  };

  // Handle pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.max(0.5, Math.min(2, z + delta)));
  }, []);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
        // Collapse all folders in this group too
        setExpandedFolders(pf => {
          const nf = new Set(pf);
          folders.filter(f => f.groupId === groupId).forEach(f => nf.delete(f.id));
          return nf;
        });
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
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

  // Calculate folder positions for an expanded group
  const getFolderPositions = (groupId: string, groupPos: Position, folderCount: number) => {
    const positions: Position[] = [];
    const startAngle = Math.atan2(groupPos.y - centerY, groupPos.x - centerX);
    const spreadAngle = Math.PI / 3;
    const radius = 80;
    
    for (let i = 0; i < folderCount; i++) {
      const angle = startAngle + (i - (folderCount - 1) / 2) * (spreadAngle / Math.max(folderCount - 1, 1));
      positions.push({
        x: groupPos.x + radius * Math.cos(angle),
        y: groupPos.y + radius * Math.sin(angle),
      });
    }
    return positions;
  };

  // Calculate note positions for an expanded folder or group
  const getNotePositions = (parentPos: Position, noteCount: number, parentAngle: number) => {
    const positions: Position[] = [];
    const spreadAngle = Math.PI / 4;
    const radius = 60;
    
    for (let i = 0; i < Math.min(noteCount, 5); i++) {
      const angle = parentAngle + (i - Math.min(noteCount - 1, 4) / 2) * (spreadAngle / Math.max(Math.min(noteCount - 1, 4), 1));
      positions.push({
        x: parentPos.x + radius * Math.cos(angle),
        y: parentPos.y + radius * Math.sin(angle),
      });
    }
    return positions;
  };

  return (
    <div className="relative w-full h-[600px] overflow-hidden rounded-xl bg-gradient-to-br from-muted/20 via-background to-muted/10 border border-border/30">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg p-1">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border/50" />
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleResetView}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground px-2">{Math.round(zoom * 100)}%</span>
      </div>

      {/* Mind Map Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          className="w-full h-full"
          viewBox={`${-pan.x / zoom} ${-pan.y / zoom} ${800 / zoom} ${600 / zoom}`}
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
        >
          <defs>
            <pattern id="mindmap-dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="0.5" fill="currentColor" className="text-muted-foreground/10" />
            </pattern>
          </defs>
          <rect x="-1000" y="-1000" width="2000" height="2000" fill="url(#mindmap-dots)" />

          {/* Connection lines from center to groups */}
          {sortedGroups.map((group) => {
            const pos = groupPositions[group.id];
            return (
              <line
                key={`line-${group.id}`}
                x1={centerX}
                y1={centerY}
                x2={pos.x}
                y2={pos.y}
                stroke={group.color}
                strokeWidth="2"
                strokeOpacity="0.3"
                strokeDasharray="6 4"
              />
            );
          })}

          {/* Expanded group connections */}
          {sortedGroups.map((group) => {
            if (!expandedGroups.has(group.id)) return null;
            const groupPos = groupPositions[group.id];
            const groupFolders = folders.filter(f => f.groupId === group.id);
            const folderPositions = getFolderPositions(group.id, groupPos, groupFolders.length);
            
            return (
              <g key={`expanded-${group.id}`}>
                {/* Folder connections */}
                {groupFolders.map((folder, i) => {
                  const folderPos = folderPositions[i];
                  if (!folderPos) return null;
                  
                  return (
                    <g key={`folder-line-${folder.id}`}>
                      <line
                        x1={groupPos.x}
                        y1={groupPos.y}
                        x2={folderPos.x}
                        y2={folderPos.y}
                        stroke={group.color}
                        strokeWidth="1.5"
                        strokeOpacity="0.4"
                      />
                      
                      {/* Note connections from folder */}
                      {expandedFolders.has(folder.id) && (
                        <>
                          {notes
                            .filter(n => n.folderId === folder.id)
                            .slice(0, 5)
                            .map((note, ni) => {
                              const parentAngle = Math.atan2(folderPos.y - groupPos.y, folderPos.x - groupPos.x);
                              const notePositions = getNotePositions(folderPos, notes.filter(n => n.folderId === folder.id).length, parentAngle);
                              const notePos = notePositions[ni];
                              if (!notePos) return null;
                              
                              return (
                                <line
                                  key={`note-line-${note.id}`}
                                  x1={folderPos.x}
                                  y1={folderPos.y}
                                  x2={notePos.x}
                                  y2={notePos.y}
                                  stroke={group.color}
                                  strokeWidth="1"
                                  strokeOpacity="0.3"
                                />
                              );
                            })}
                        </>
                      )}
                    </g>
                  );
                })}

                {/* Direct notes connections (not in folders) */}
                {notes
                  .filter(n => n.groupId === group.id && !n.folderId)
                  .slice(0, 5)
                  .map((note, ni) => {
                    const parentAngle = Math.atan2(groupPos.y - centerY, groupPos.x - centerX);
                    const offset = groupFolders.length > 0 ? Math.PI / 4 : 0;
                    const notePositions = getNotePositions(groupPos, notes.filter(n => n.groupId === group.id && !n.folderId).length, parentAngle + offset);
                    const notePos = notePositions[ni];
                    if (!notePos) return null;
                    
                    return (
                      <line
                        key={`direct-note-line-${note.id}`}
                        x1={groupPos.x}
                        y1={groupPos.y}
                        x2={notePos.x}
                        y2={notePos.y}
                        stroke={group.color}
                        strokeWidth="1"
                        strokeOpacity="0.3"
                      />
                    );
                  })}
              </g>
            );
          })}
        </svg>

        {/* Center Node */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: `calc(50% + ${pan.x}px)`,
            top: `calc(50% + ${pan.y}px)`,
            transform: `translate(-50%, -50%) scale(${zoom})`,
          }}
        >
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/40 flex items-center justify-center shadow-lg shadow-primary/10 pointer-events-auto">
            <div className="text-center">
              <span className="text-base font-semibold text-primary">Notes</span>
              <span className="block text-xs text-muted-foreground">{notes.length} total</span>
            </div>
          </div>
        </div>

        {/* Group Nodes */}
        {sortedGroups.map((group) => {
          const pos = groupPositions[group.id];
          const groupNotes = notes.filter(n => n.groupId === group.id);
          const groupFolders = folders.filter(f => f.groupId === group.id);
          const mostRecentUpdate = getMostRecentUpdate(groupNotes);
          const isExpanded = expandedGroups.has(group.id);

          // Calculate pixel position
          const pixelX = (pos.x - 400) * zoom + pan.x;
          const pixelY = (pos.y - 300) * zoom + pan.y;

          return (
            <div key={group.id}>
              {/* Group bubble */}
              <div
                className="absolute pointer-events-auto"
                style={{
                  left: `calc(50% + ${pixelX}px)`,
                  top: `calc(50% + ${pixelY}px)`,
                  transform: `translate(-50%, -50%) scale(${zoom})`,
                  zIndex: isExpanded ? 10 : 5,
                }}
              >
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200 border-2 shadow-md hover:shadow-lg ${
                    isExpanded 
                      ? 'bg-card shadow-lg scale-105' 
                      : 'bg-card/90 hover:bg-card'
                  }`}
                  style={{ borderColor: group.color }}
                >
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="font-medium text-foreground text-sm whitespace-nowrap">
                    {group.name}
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
                    {groupNotes.length}
                  </span>
                  {mostRecentUpdate && (
                    <NotesActivityDot updatedAt={mostRecentUpdate} size="sm" />
                  )}
                  <ChevronRight 
                    className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </button>
              </div>

              {/* Expanded: Folders and Notes */}
              {isExpanded && (
                <>
                  {/* Folder nodes */}
                  {groupFolders.map((folder, i) => {
                    const folderPositions = getFolderPositions(group.id, pos, groupFolders.length);
                    const folderPos = folderPositions[i];
                    if (!folderPos) return null;
                    
                    const folderNotes = notes.filter(n => n.folderId === folder.id);
                    const folderMostRecent = getMostRecentUpdate(folderNotes);
                    const isFolderExpanded = expandedFolders.has(folder.id);
                    
                    const folderPixelX = (folderPos.x - 400) * zoom + pan.x;
                    const folderPixelY = (folderPos.y - 300) * zoom + pan.y;

                    return (
                      <div key={folder.id}>
                        <div
                          className="absolute pointer-events-auto"
                          style={{
                            left: `calc(50% + ${folderPixelX}px)`,
                            top: `calc(50% + ${folderPixelY}px)`,
                            transform: `translate(-50%, -50%) scale(${zoom})`,
                            zIndex: isFolderExpanded ? 15 : 8,
                          }}
                        >
                          <button
                            onClick={() => toggleFolder(folder.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border bg-card/90 hover:bg-card shadow-sm hover:shadow-md text-sm ${
                              isFolderExpanded ? 'border-primary/50 bg-card' : 'border-border/50'
                            }`}
                          >
                            <span className="text-foreground/80">{folder.name}</span>
                            <span className="text-xs text-muted-foreground/60">
                              {folderNotes.length}
                            </span>
                            {folderMostRecent && (
                              <NotesActivityDot updatedAt={folderMostRecent} size="sm" />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddNote(group.id, folder.id);
                              }}
                              className="p-0.5 rounded hover:bg-primary/10 ml-1"
                            >
                              <Plus className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </button>
                        </div>

                        {/* Notes in folder */}
                        {isFolderExpanded && folderNotes.slice(0, 5).map((note, ni) => {
                          const parentAngle = Math.atan2(folderPos.y - pos.y, folderPos.x - pos.x);
                          const notePositions = getNotePositions(folderPos, folderNotes.length, parentAngle);
                          const notePos = notePositions[ni];
                          if (!notePos) return null;

                          const notePixelX = (notePos.x - 400) * zoom + pan.x;
                          const notePixelY = (notePos.y - 300) * zoom + pan.y;

                          return (
                            <div
                              key={note.id}
                              className="absolute pointer-events-auto"
                              style={{
                                left: `calc(50% + ${notePixelX}px)`,
                                top: `calc(50% + ${notePixelY}px)`,
                                transform: `translate(-50%, -50%) scale(${zoom})`,
                                zIndex: 12,
                              }}
                            >
                              <button
                                onClick={() => onNoteClick(note)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border transition-all bg-card/80 hover:bg-card shadow-sm max-w-32 ${
                                  selectedNoteId === note.id 
                                    ? 'border-primary/50 bg-primary/5' 
                                    : 'border-border/40'
                                }`}
                              >
                                <FileText className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                                <span className="text-foreground/80 truncate">
                                  {note.title || "Untitled"}
                                </span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  {/* Direct notes (not in folders) */}
                  {notes
                    .filter(n => n.groupId === group.id && !n.folderId)
                    .slice(0, 5)
                    .map((note, ni) => {
                      const parentAngle = Math.atan2(pos.y - centerY, pos.x - centerX);
                      const offset = groupFolders.length > 0 ? Math.PI / 4 : 0;
                      const directNotes = notes.filter(n => n.groupId === group.id && !n.folderId);
                      const notePositions = getNotePositions(pos, directNotes.length, parentAngle + offset);
                      const notePos = notePositions[ni];
                      if (!notePos) return null;

                      const notePixelX = (notePos.x - 400) * zoom + pan.x;
                      const notePixelY = (notePos.y - 300) * zoom + pan.y;

                      return (
                        <div
                          key={note.id}
                          className="absolute pointer-events-auto"
                          style={{
                            left: `calc(50% + ${notePixelX}px)`,
                            top: `calc(50% + ${notePixelY}px)`,
                            transform: `translate(-50%, -50%) scale(${zoom})`,
                            zIndex: 12,
                          }}
                        >
                          <button
                            onClick={() => onNoteClick(note)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border transition-all bg-card/80 hover:bg-card shadow-sm max-w-32 ${
                              selectedNoteId === note.id 
                                ? 'border-primary/50 bg-primary/5' 
                                : 'border-border/40'
                            }`}
                          >
                            <FileText className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                            <span className="text-foreground/80 truncate">
                              {note.title || "Untitled"}
                            </span>
                          </button>
                        </div>
                      );
                    })}

                  {/* Add actions for expanded group */}
                  {(() => {
                    const actionPixelX = (pos.x - 400 + 60) * zoom + pan.x;
                    const actionPixelY = (pos.y - 300 + 60) * zoom + pan.y;
                    
                    return (
                      <div
                        className="absolute pointer-events-auto"
                        style={{
                          left: `calc(50% + ${actionPixelX}px)`,
                          top: `calc(50% + ${actionPixelY}px)`,
                          transform: `translate(-50%, -50%) scale(${zoom})`,
                          zIndex: 20,
                        }}
                      >
                        <div className="flex flex-col gap-1 bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-2 shadow-lg">
                          {newFolderGroupId === group.id ? (
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="Section..."
                                className="w-24 text-xs px-2 py-1 rounded bg-background border border-border/50 focus:outline-none focus:border-primary/50"
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
                              <Button
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddFolder(group.id);
                                }}
                              >
                                Add
                              </Button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNewFolderGroupId(group.id);
                                }}
                                className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted/50"
                              >
                                <FolderPlus className="h-3 w-3" />
                                Section
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddNote(group.id, null);
                                }}
                                className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted/50"
                              >
                                <Plus className="h-3 w-3" />
                                Note
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs text-muted-foreground/70 bg-card/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
        <span className="font-medium">Click groups to expand</span>
        <div className="w-px h-3 bg-border/50" />
        <span>Scroll to zoom • Drag to pan</span>
      </div>
    </div>
  );
}
