import { useState, useMemo, useRef, useEffect } from "react";
import { FileText, FolderOpen } from "lucide-react";
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
  onUpdateNote?: (note: Note) => void;
  onDeleteNote?: (noteId: string) => void;
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
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const sortedGroups = useMemo(() => [...groups].sort((a, b) => a.sortOrder - b.sortOrder), [groups]);

  // Canvas dimensions
  const canvasSize = 1200;
  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;

  // Ring radii
  const rings = {
    center: 60,
    groups: 150, // Groups ring
    sections: 280, // Sections/folders ring
    entries1: 400, // First entries ring
    entries2: 500, // Second entries ring
  };

  // Calculate group positions on the groups ring
  const groupPositions = useMemo(() => {
    return sortedGroups.map((group, index) => {
      const angle = (index / sortedGroups.length) * 2 * Math.PI - Math.PI / 2;
      return {
        group,
        x: centerX + rings.groups * Math.cos(angle),
        y: centerY + rings.groups * Math.sin(angle),
        angle,
      };
    });
  }, [sortedGroups, centerX, centerY]);

  // Calculate section positions on the sections ring
  const sectionPositions = useMemo(() => {
    const allSections: { folder: NoteFolder; x: number; y: number }[] = [];
    let sectionIndex = 0;

    folders.forEach((folder) => {
      const angle = (sectionIndex / Math.max(folders.length, 6)) * 2 * Math.PI - Math.PI / 3;
      allSections.push({
        folder,
        x: centerX + rings.sections * Math.cos(angle),
        y: centerY + rings.sections * Math.sin(angle),
      });
      sectionIndex++;
    });

    return allSections;
  }, [folders, centerX, centerY]);

  // Calculate entry positions on outer rings
  const entryPositions = useMemo(() => {
    const entries: { note: Note; x: number; y: number; ring: number }[] = [];

    notes.forEach((note, index) => {
      // Alternate between two outer rings
      const ring = index % 2 === 0 ? rings.entries1 : rings.entries2;
      const angleOffset = index % 2 === 0 ? 0 : Math.PI / notes.length;
      const angle = (index / notes.length) * 2 * Math.PI + angleOffset - Math.PI / 4;

      entries.push({
        note,
        x: centerX + ring * Math.cos(angle),
        y: centerY + ring * Math.sin(angle),
        ring: index % 2,
      });
    });

    return entries;
  }, [notes, centerX, centerY]);

  // Pan and zoom handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.min(Math.max(prev * delta, 0.3), 2));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-280px)] min-h-[500px] overflow-hidden bg-background/50 cursor-grab active:cursor-grabbing"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Scrollable/Zoomable canvas */}
      <div
        className="absolute"
        style={{
          width: canvasSize,
          height: canvasSize,
          left: `calc(50% - ${canvasSize / 2}px + ${position.x}px)`,
          top: `calc(50% - ${canvasSize / 2}px + ${position.y}px)`,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {/* Concentric rings SVG */}
        <svg width={canvasSize} height={canvasSize} className="absolute inset-0">
          {/* Ring 1 - Groups ring */}
          <circle
            cx={centerX}
            cy={centerY}
            r={rings.groups}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-border"
          />

          {/* Ring 2 - Sections ring */}
          <circle
            cx={centerX}
            cy={centerY}
            r={rings.sections}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-border"
          />

          {/* Ring 3 - Entries ring 1 */}
          <circle
            cx={centerX}
            cy={centerY}
            r={rings.entries1}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-border/70"
          />

          {/* Ring 4 - Entries ring 2 */}
          <circle
            cx={centerX}
            cy={centerY}
            r={rings.entries2}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-border/50"
          />
        </svg>

        {/* Center - "Notes" label */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            left: centerX - rings.center,
            top: centerY - rings.center,
            width: rings.center * 2,
            height: rings.center * 2,
          }}
        >
          <span className="text-2xl font-semibold text-foreground">Notes</span>
        </div>

        {/* Groups - Plain text labels on groups ring */}
        {groupPositions.map(({ group, x, y }) => (
          <div
            key={group.id}
            className="absolute cursor-pointer hover:text-primary transition-colors duration-200"
            style={{
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
            }}
            onClick={() => onAddNote(group.id, null)}
          >
            <span className="text-lg font-medium text-foreground whitespace-nowrap">{group.name}</span>
          </div>
        ))}

        {/* Sections/Folders - In rounded boxes on sections ring */}
        {sectionPositions.map(({ folder, x, y }) => (
          <div
            key={folder.id}
            className="absolute cursor-pointer"
            style={{
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors duration-200 shadow-sm">
              <span className="text-sm font-medium text-foreground whitespace-nowrap">{folder.name}</span>
            </div>
          </div>
        ))}

        {/* Entries - Plain text on outer rings */}
        {entryPositions.map(({ note, x, y }) => (
          <div
            key={note.id}
            className={cn(
              "absolute cursor-pointer transition-all duration-200",
              selectedNoteId === note.id ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground",
            )}
            style={{
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
            }}
            onClick={() => onNoteClick(note)}
          >
            <span className="text-sm whitespace-nowrap">{note.title || "Untitled"}</span>
          </div>
        ))}
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-card/90 backdrop-blur-sm rounded-lg border border-border/50 px-4 py-2 shadow-sm">
        <span className="text-xs text-muted-foreground">Scroll to zoom • Drag to pan</span>
      </div>

      {/* Zoom controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setScale((prev) => Math.min(prev * 1.2, 2))}
          className="w-8 h-8 rounded-lg border border-border bg-card hover:bg-muted flex items-center justify-center text-foreground"
        >
          +
        </button>
        <button
          onClick={() => setScale((prev) => Math.max(prev * 0.8, 0.3))}
          className="w-8 h-8 rounded-lg border border-border bg-card hover:bg-muted flex items-center justify-center text-foreground"
        >
          −
        </button>
        <button
          onClick={() => {
            setScale(1);
            setPosition({ x: 0, y: 0 });
          }}
          className="w-8 h-8 rounded-lg border border-border bg-card hover:bg-muted flex items-center justify-center text-xs text-muted-foreground"
        >
          ⟲
        </button>
      </div>
    </div>
  );
}
