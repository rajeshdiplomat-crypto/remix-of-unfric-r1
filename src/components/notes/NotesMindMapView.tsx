import { useState, useMemo, useRef, useCallback } from "react";
import { FileText, Plus, FolderPlus, ZoomIn, ZoomOut, RotateCcw, Minimize2, Maximize2 } from "lucide-react";
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

// Bubble node component for consistent styling
function BubbleNode({
  label,
  count,
  color,
  isExpanded,
  onClick,
  size = "medium",
  isActive,
  activityDot,
  onAdd,
}: {
  label: string;
  count?: number;
  color?: string;
  isExpanded?: boolean;
  onClick: () => void;
  size?: "small" | "medium" | "large";
  isActive?: boolean;
  activityDot?: React.ReactNode;
  onAdd?: () => void;
}) {
  const sizeClasses = {
    small: "min-w-[80px] px-3 py-1.5 text-xs",
    medium: "min-w-[100px] px-4 py-2 text-sm",
    large: "min-w-[120px] px-5 py-3 text-base font-semibold",
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onClick}
        className={cn(
          "rounded-full transition-all duration-300 border-2 shadow-md hover:shadow-lg flex items-center gap-2 justify-center",
          sizeClasses[size],
          isExpanded
            ? "bg-card shadow-lg scale-105 ring-2 ring-primary/20"
            : "bg-card/90 hover:bg-card hover:scale-102",
          isActive && "ring-2 ring-primary/50"
        )}
        style={{ borderColor: color || "hsl(var(--border))" }}
      >
        {color && (
          <div
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        <span className="text-foreground whitespace-nowrap truncate max-w-[100px]">
          {label}
        </span>
        {count !== undefined && (
          <span className="text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full text-[10px]">
            {count}
          </span>
        )}
        {activityDot}
      </button>
      {onAdd && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className="p-1 rounded-full bg-card/80 border border-border/50 hover:bg-primary/10 transition-colors"
        >
          <Plus className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );
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
  const level1Radius = 200; // Groups
  const level2Radius = 100; // Folders from group
  const level3Radius = 70;  // Notes from folder

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
    const spreadAngle = Math.PI * 0.6;
    
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
    const spreadAngle = Math.PI * 0.5;
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
    <div className="relative w-full h-[650px] overflow-hidden rounded-xl bg-gradient-to-br from-muted/20 via-background to-muted/10 border border-border/30">
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
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3 bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">
        <span className="font-medium">Click to expand</span>
        <span>•</span>
        <span>Drag to pan</span>
        <span>•</span>
        <span>Scroll to zoom</span>
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
          <defs>
            <pattern id="mindmap-dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="0.8" fill="currentColor" className="text-muted-foreground/8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mindmap-dots)" />
          
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
                stroke={group.color}
                strokeWidth={2}
                strokeOpacity={0.25}
                strokeDasharray="8 4"
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
                    stroke={group.color}
                    strokeWidth={1.5}
                    strokeOpacity={0.35}
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
                              stroke={group.color}
                              strokeWidth={1}
                              strokeOpacity={0.25}
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
                  stroke={group.color}
                  strokeWidth={1}
                  strokeOpacity={0.25}
                  className="transition-all duration-300"
                />
              );
            });
          })}
        </svg>

        {/* Center Node */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: `calc(50% + ${toScreen({ x: centerX, y: centerY }).x}px)`,
            top: `calc(50% + ${toScreen({ x: centerX, y: centerY }).y}px)`,
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

        {/* Level 1: Group Nodes */}
        {sortedGroups.map((group) => {
          const pos = groupPositions[group.id];
          const screenPos = toScreen(pos);
          const groupNotes = notes.filter(n => n.groupId === group.id);
          const mostRecentUpdate = getMostRecentUpdate(groupNotes);
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
              <BubbleNode
                label={group.name}
                count={groupNotes.length}
                color={group.color}
                isExpanded={isExpanded}
                onClick={() => toggleGroup(group.id)}
                size="medium"
                activityDot={mostRecentUpdate && <NotesActivityDot updatedAt={mostRecentUpdate} size="sm" />}
              />
            </div>
          );
        })}

        {/* Level 2: Folder Nodes (when group expanded) */}
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
            const mostRecentUpdate = getMostRecentUpdate(folderNotes);
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
                <BubbleNode
                  label={folder.name}
                  count={folderNotes.length}
                  color={group.color}
                  isExpanded={isExpanded}
                  onClick={() => toggleFolder(folder.id)}
                  size="small"
                  activityDot={mostRecentUpdate && <NotesActivityDot updatedAt={mostRecentUpdate} size="sm" />}
                  onAdd={() => onAddNote(group.id, folder.id)}
                />
              </div>
            );
          });
        })}

        {/* Level 3: Note Nodes from Folders */}
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
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs transition-all",
                      "border shadow-sm hover:shadow-md bg-card/95 hover:bg-card",
                      isSelected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border/50 hover:border-border"
                    )}
                  >
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span className="text-foreground truncate max-w-[80px]">{note.title}</span>
                  </button>
                </div>
              );
            });
          });
        })}

        {/* Direct Notes from Groups (no folder) */}
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
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs transition-all",
                    "border shadow-sm hover:shadow-md bg-card/95 hover:bg-card",
                    isSelected
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border/50 hover:border-border"
                  )}
                >
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span className="text-foreground truncate max-w-[80px]">{note.title}</span>
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
              x: folderPos.x + (level3Radius + 30) * Math.cos(folderAngle),
              y: folderPos.y + (level3Radius + 30) * Math.sin(folderAngle),
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
                <span className="text-xs text-muted-foreground bg-muted/80 px-2 py-1 rounded-full">
                  +{folderNotes.length - 6} more
                </span>
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}
