import { useState, useMemo, useRef, useCallback } from "react";
import { FileText, ZoomIn, ZoomOut, RotateCcw, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotesActivityDot, getMostRecentUpdate } from "./NotesActivityDot";
import type { Note, NoteGroup, NoteFolder } from "@/pages/Notes";
import { cn } from "@/lib/utils";

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
  
  // Pan and zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef<Position>({ x: 0, y: 0 });

  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);

  // Canvas dimensions
  const canvasWidth = 1200;
  const canvasHeight = 800;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  // Radius for each level
  const level1Radius = 180; // Groups
  const level2Radius = 110; // Folders from group
  const level3Radius = 80;  // Notes from folder

  // Calculate group positions in a circle around center
  const groupPositions = useMemo(() => {
    const positions: Record<string, Position> = {};
    const count = sortedGroups.length;
    sortedGroups.forEach((group, index) => {
      const angle = (index * 2 * Math.PI / count) - Math.PI / 2;
      positions[group.id] = {
        x: centerX + level1Radius * Math.cos(angle),
        y: centerY + level1Radius * Math.sin(angle),
      };
    });
    return positions;
  }, [sortedGroups, centerX, centerY]);

  // Handle zoom
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 2.5));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.4));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setExpandedGroups(new Set());
    setExpandedFolders(new Set());
  };
  const handleExpandAll = () => {
    setExpandedGroups(new Set(sortedGroups.map(g => g.id)));
    setExpandedFolders(new Set(folders.map(f => f.id)));
  };
  const handleCollapseAll = () => {
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
    setZoom(z => Math.max(0.4, Math.min(2.5, z + delta)));
  }, []);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
        // Also collapse child folders
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

  // Calculate folder positions around a group
  const getFolderPositions = (groupPos: Position, folderCount: number, groupAngle: number) => {
    const positions: Position[] = [];
    const spreadAngle = Math.PI * 0.7;
    
    for (let i = 0; i < folderCount; i++) {
      const offset = (i - (folderCount - 1) / 2) * (spreadAngle / Math.max(folderCount - 1, 1));
      const angle = groupAngle + offset;
      positions.push({
        x: groupPos.x + level2Radius * Math.cos(angle),
        y: groupPos.y + level2Radius * Math.sin(angle),
      });
    }
    return positions;
  };

  // Calculate note positions around a folder or group
  const getNotePositions = (parentPos: Position, noteCount: number, parentAngle: number) => {
    const positions: Position[] = [];
    const spreadAngle = Math.PI * 0.6;
    const displayCount = Math.min(noteCount, 6);
    
    for (let i = 0; i < displayCount; i++) {
      const offset = (i - (displayCount - 1) / 2) * (spreadAngle / Math.max(displayCount - 1, 1));
      const angle = parentAngle + offset;
      positions.push({
        x: parentPos.x + level3Radius * Math.cos(angle),
        y: parentPos.y + level3Radius * Math.sin(angle),
      });
    }
    return positions;
  };

  // Convert canvas coords to screen coords
  const toScreen = (pos: Position) => ({
    x: (pos.x - canvasWidth / 2) * zoom + pan.x,
    y: (pos.y - canvasHeight / 2) * zoom + pan.y,
  });

  return (
    <div className="relative w-full h-[650px] overflow-hidden rounded-xl bg-gradient-to-br from-muted/30 via-background to-muted/20 border border-border/30">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-1 shadow-sm">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleZoomIn} title="Zoom In">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border/50" />
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleExpandAll} title="Expand All">
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleCollapseAll} title="Collapse All">
          <Minimize2 className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border/50" />
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleResetView} title="Reset View">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground px-2 tabular-nums">{Math.round(zoom * 100)}%</span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-4 bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-primary" />
          <span>Groups</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary/60" />
          <span>Folders</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
          <span>Notes</span>
        </div>
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
        {/* SVG for connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Level 1: Center to Groups */}
          {sortedGroups.map((group) => {
            const pos = groupPositions[group.id];
            const screenCenter = toScreen({ x: centerX, y: centerY });
            const screenGroup = toScreen(pos);
            
            return (
              <line
                key={`center-to-${group.id}`}
                x1={screenCenter.x + canvasWidth / 2}
                y1={screenCenter.y + canvasHeight / 2}
                x2={screenGroup.x + canvasWidth / 2}
                y2={screenGroup.y + canvasHeight / 2}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeOpacity={0.3}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Level 2: Groups to Folders */}
          {sortedGroups.map((group) => {
            if (!expandedGroups.has(group.id)) return null;
            const groupPos = groupPositions[group.id];
            const groupAngle = Math.atan2(groupPos.y - centerY, groupPos.x - centerX);
            const groupFolders = folders.filter(f => f.groupId === group.id);
            const folderPositions = getFolderPositions(groupPos, groupFolders.length, groupAngle);
            
            return groupFolders.map((folder, i) => {
              const folderPos = folderPositions[i];
              if (!folderPos) return null;
              const screenGroup = toScreen(groupPos);
              const screenFolder = toScreen(folderPos);
              
              return (
                <g key={`group-to-folder-${folder.id}`}>
                  <line
                    x1={screenGroup.x + canvasWidth / 2}
                    y1={screenGroup.y + canvasHeight / 2}
                    x2={screenFolder.x + canvasWidth / 2}
                    y2={screenFolder.y + canvasHeight / 2}
                    stroke="hsl(var(--primary))"
                    strokeWidth={1.5}
                    strokeOpacity={0.25}
                    className="transition-all duration-300"
                  />
                  
                  {/* Level 3: Folders to Notes */}
                  {expandedFolders.has(folder.id) && (
                    <>
                      {notes
                        .filter(n => n.folderId === folder.id)
                        .slice(0, 6)
                        .map((note, ni) => {
                          const folderAngle = Math.atan2(folderPos.y - groupPos.y, folderPos.x - groupPos.x);
                          const notePositions = getNotePositions(folderPos, notes.filter(n => n.folderId === folder.id).length, folderAngle);
                          const notePos = notePositions[ni];
                          if (!notePos) return null;
                          const screenNote = toScreen(notePos);
                          
                          return (
                            <line
                              key={`folder-to-note-${note.id}`}
                              x1={screenFolder.x + canvasWidth / 2}
                              y1={screenFolder.y + canvasHeight / 2}
                              x2={screenNote.x + canvasWidth / 2}
                              y2={screenNote.y + canvasHeight / 2}
                              stroke="hsl(var(--primary))"
                              strokeWidth={1}
                              strokeOpacity={0.15}
                              className="transition-all duration-300"
                            />
                          );
                        })}
                    </>
                  )}
                </g>
              );
            });
          })}

          {/* Direct notes from group (no folder) */}
          {sortedGroups.map((group) => {
            if (!expandedGroups.has(group.id)) return null;
            const groupPos = groupPositions[group.id];
            const groupAngle = Math.atan2(groupPos.y - centerY, groupPos.x - centerX);
            const directNotes = notes.filter(n => n.groupId === group.id && !n.folderId);
            const groupFolders = folders.filter(f => f.groupId === group.id);
            const angleOffset = groupFolders.length > 0 ? Math.PI * 0.4 : 0;
            const notePositions = getNotePositions(groupPos, directNotes.length, groupAngle + angleOffset);
            
            return directNotes.slice(0, 6).map((note, ni) => {
              const notePos = notePositions[ni];
              if (!notePos) return null;
              const screenGroup = toScreen(groupPos);
              const screenNote = toScreen(notePos);
              
              return (
                <line
                  key={`group-to-note-${note.id}`}
                  x1={screenGroup.x + canvasWidth / 2}
                  y1={screenGroup.y + canvasHeight / 2}
                  x2={screenNote.x + canvasWidth / 2}
                  y2={screenNote.y + canvasHeight / 2}
                  stroke="hsl(var(--primary))"
                  strokeWidth={1}
                  strokeOpacity={0.15}
                  className="transition-all duration-300"
                />
              );
            });
          })}
        </svg>

        {/* Center Node - Darkest */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: `calc(50% + ${toScreen({ x: centerX, y: centerY }).x}px)`,
            top: `calc(50% + ${toScreen({ x: centerX, y: centerY }).y}px)`,
            transform: `translate(-50%, -50%) scale(${zoom})`,
          }}
        >
          <div className="w-28 h-28 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/30 pointer-events-auto">
            <div className="text-center">
              <span className="text-base font-bold text-primary-foreground">Notes</span>
              <span className="block text-xs text-primary-foreground/80">{notes.length} total</span>
            </div>
          </div>
        </div>

        {/* Level 1: Group Nodes - Dark bubbles */}
        {sortedGroups.map((group) => {
          const pos = groupPositions[group.id];
          const screenPos = toScreen(pos);
          const groupNotes = notes.filter(n => n.groupId === group.id);
          const isExpanded = expandedGroups.has(group.id);

          return (
            <div
              key={group.id}
              className="absolute pointer-events-auto transition-all duration-300"
              style={{
                left: `calc(50% + ${screenPos.x}px)`,
                top: `calc(50% + ${screenPos.y}px)`,
                transform: `translate(-50%, -50%) scale(${zoom})`,
                zIndex: isExpanded ? 20 : 10,
              }}
            >
              <button
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  "w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-300",
                  "shadow-lg hover:shadow-xl",
                  isExpanded ? "scale-110 ring-4 ring-primary-foreground/20" : "hover:scale-105"
                )}
                style={{ 
                  backgroundColor: group.color,
                  boxShadow: `0 8px 32px ${group.color}40`
                }}
              >
                <span className="text-xs font-semibold text-white truncate max-w-[60px] px-1">
                  {group.name}
                </span>
                <span className="text-[10px] text-white/80 mt-0.5">
                  ({groupNotes.length})
                </span>
              </button>
            </div>
          );
        })}

        {/* Level 2: Folder Nodes - Medium bubbles */}
        {sortedGroups.map((group) => {
          if (!expandedGroups.has(group.id)) return null;
          const groupPos = groupPositions[group.id];
          const groupAngle = Math.atan2(groupPos.y - centerY, groupPos.x - centerX);
          const groupFolders = folders.filter(f => f.groupId === group.id);
          const folderPositions = getFolderPositions(groupPos, groupFolders.length, groupAngle);

          return groupFolders.map((folder, i) => {
            const folderPos = folderPositions[i];
            if (!folderPos) return null;
            const screenPos = toScreen(folderPos);
            const folderNotes = notes.filter(n => n.folderId === folder.id);
            const isExpanded = expandedFolders.has(folder.id);

            return (
              <div
                key={folder.id}
                className="absolute pointer-events-auto transition-all duration-300"
                style={{
                  left: `calc(50% + ${screenPos.x}px)`,
                  top: `calc(50% + ${screenPos.y}px)`,
                  transform: `translate(-50%, -50%) scale(${zoom})`,
                  zIndex: isExpanded ? 25 : 15,
                }}
              >
                <button
                  onClick={() => toggleFolder(folder.id)}
                  className={cn(
                    "w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all duration-300",
                    "shadow-md hover:shadow-lg",
                    isExpanded ? "scale-110 ring-2 ring-white/30" : "hover:scale-105"
                  )}
                  style={{ 
                    backgroundColor: `${group.color}99`,
                    boxShadow: `0 4px 16px ${group.color}30`
                  }}
                >
                  <span className="text-[10px] font-medium text-white truncate max-w-[50px] px-1">
                    {folder.name}
                  </span>
                  <span className="text-[9px] text-white/80">
                    ({folderNotes.length})
                  </span>
                </button>
              </div>
            );
          });
        })}

        {/* Level 3: Note Nodes from Folders - Light bubbles */}
        {sortedGroups.map((group) => {
          if (!expandedGroups.has(group.id)) return null;
          const groupPos = groupPositions[group.id];
          const groupAngle = Math.atan2(groupPos.y - centerY, groupPos.x - centerX);
          const groupFolders = folders.filter(f => f.groupId === group.id);
          const folderPositions = getFolderPositions(groupPos, groupFolders.length, groupAngle);

          return groupFolders.map((folder, fi) => {
            if (!expandedFolders.has(folder.id)) return null;
            const folderPos = folderPositions[fi];
            if (!folderPos) return null;
            const folderAngle = Math.atan2(folderPos.y - groupPos.y, folderPos.x - groupPos.x);
            const folderNotes = notes.filter(n => n.folderId === folder.id);
            const notePositions = getNotePositions(folderPos, folderNotes.length, folderAngle);

            return folderNotes.slice(0, 6).map((note, ni) => {
              const notePos = notePositions[ni];
              if (!notePos) return null;
              const screenPos = toScreen(notePos);
              const isSelected = note.id === selectedNoteId;

              return (
                <div
                  key={note.id}
                  className="absolute pointer-events-auto transition-all duration-300"
                  style={{
                    left: `calc(50% + ${screenPos.x}px)`,
                    top: `calc(50% + ${screenPos.y}px)`,
                    transform: `translate(-50%, -50%) scale(${zoom})`,
                    zIndex: 30,
                  }}
                >
                  <button
                    onClick={() => onNoteClick(note)}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                      "shadow-sm hover:shadow-md hover:scale-110",
                      isSelected && "ring-2 ring-primary"
                    )}
                    style={{ 
                      backgroundColor: `${group.color}40`,
                      border: `1px solid ${group.color}60`
                    }}
                    title={note.title}
                  >
                    <FileText className="h-4 w-4" style={{ color: group.color }} />
                  </button>
                </div>
              );
            });
          });
        })}

        {/* Direct Notes from Groups (no folder) - Light bubbles */}
        {sortedGroups.map((group) => {
          if (!expandedGroups.has(group.id)) return null;
          const groupPos = groupPositions[group.id];
          const groupAngle = Math.atan2(groupPos.y - centerY, groupPos.x - centerX);
          const directNotes = notes.filter(n => n.groupId === group.id && !n.folderId);
          const groupFolders = folders.filter(f => f.groupId === group.id);
          const angleOffset = groupFolders.length > 0 ? Math.PI * 0.4 : 0;
          const notePositions = getNotePositions(groupPos, directNotes.length, groupAngle + angleOffset);

          return directNotes.slice(0, 6).map((note, ni) => {
            const notePos = notePositions[ni];
            if (!notePos) return null;
            const screenPos = toScreen(notePos);
            const isSelected = note.id === selectedNoteId;

            return (
              <div
                key={note.id}
                className="absolute pointer-events-auto transition-all duration-300"
                style={{
                  left: `calc(50% + ${screenPos.x}px)`,
                  top: `calc(50% + ${screenPos.y}px)`,
                  transform: `translate(-50%, -50%) scale(${zoom})`,
                  zIndex: 30,
                }}
              >
                <button
                  onClick={() => onNoteClick(note)}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                    "shadow-sm hover:shadow-md hover:scale-110",
                    isSelected && "ring-2 ring-primary"
                  )}
                  style={{ 
                    backgroundColor: `${group.color}40`,
                    border: `1px solid ${group.color}60`
                  }}
                  title={note.title}
                >
                  <FileText className="h-4 w-4" style={{ color: group.color }} />
                </button>
              </div>
            );
          });
        })}

        {/* Overflow indicator for notes */}
        {sortedGroups.map((group) => {
          if (!expandedGroups.has(group.id)) return null;
          const groupPos = groupPositions[group.id];
          const groupAngle = Math.atan2(groupPos.y - centerY, groupPos.x - centerX);
          const groupFolders = folders.filter(f => f.groupId === group.id);
          const folderPositions = getFolderPositions(groupPos, groupFolders.length, groupAngle);

          return groupFolders.map((folder, fi) => {
            if (!expandedFolders.has(folder.id)) return null;
            const folderPos = folderPositions[fi];
            if (!folderPos) return null;
            const folderNotes = notes.filter(n => n.folderId === folder.id);
            if (folderNotes.length <= 6) return null;

            const folderAngle = Math.atan2(folderPos.y - groupPos.y, folderPos.x - groupPos.x);
            const overflowPos = {
              x: folderPos.x + (level3Radius + 40) * Math.cos(folderAngle),
              y: folderPos.y + (level3Radius + 40) * Math.sin(folderAngle),
            };
            const screenPos = toScreen(overflowPos);

            return (
              <div
                key={`overflow-${folder.id}`}
                className="absolute pointer-events-auto"
                style={{
                  left: `calc(50% + ${screenPos.x}px)`,
                  top: `calc(50% + ${screenPos.y}px)`,
                  transform: `translate(-50%, -50%) scale(${zoom})`,
                  zIndex: 25,
                }}
              >
                <span 
                  className="text-[10px] font-medium px-2 py-1 rounded-full"
                  style={{ 
                    backgroundColor: `${group.color}30`,
                    color: group.color
                  }}
                >
                  +{folderNotes.length - 6}
                </span>
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}
