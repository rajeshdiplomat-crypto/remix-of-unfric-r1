import { useState, useMemo, useRef, useEffect } from "react";
import { FolderOpen, Sparkles } from "lucide-react";
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

const GROUP_COLORS: Record<string, string> = {
  inbox: "#64748b",
  work: "#3b82f6",
  personal: "#10b981",
  wellness: "#a855f7",
  hobby: "#f97316",
};

export function NotesMindMapView({ groups, folders, notes, selectedNoteId, onNoteClick }: NotesMindMapViewProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });

  const sortedGroups = useMemo(() => [...groups].sort((a, b) => a.sortOrder - b.sortOrder), [groups]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Arc center (left side of screen)
  const arcCenterX = 100;
  const arcCenterY = dimensions.height / 2;

  // Arc radii for semi-circles
  const arc1Radius = 160; // Groups arc
  const arc2Radius = 340; // Entries arc
  const arc3Radius = 500; // Folder notes arc

  // Calculate position on semi-circle (right side only: -90° to +90°)
  const getSemiCirclePosition = (index: number, total: number, radius: number) => {
    // Spread items from -80° to +80° (top to bottom on right side)
    const startAngle = -80 * (Math.PI / 180);
    const endAngle = 80 * (Math.PI / 180);
    const angleRange = endAngle - startAngle;
    const angle = startAngle + (index / Math.max(total - 1, 1)) * angleRange;

    return {
      x: arcCenterX + radius * Math.cos(angle),
      y: arcCenterY + radius * Math.sin(angle),
    };
  };

  // Get data for selected group
  const selectedGroupData = useMemo(() => {
    if (!selectedGroup) return { notes: [], folders: [] };
    return {
      notes: notes.filter((n) => n.groupId === selectedGroup && !n.folderId),
      folders: folders.filter((f) => f.groupId === selectedGroup),
    };
  }, [selectedGroup, notes, folders]);

  // Get notes for selected folder
  const selectedFolderNotes = useMemo(() => {
    if (!selectedFolder) return [];
    return notes.filter((n) => n.folderId === selectedFolder);
  }, [selectedFolder, notes]);

  const activeGroup = sortedGroups.find((g) => g.id === selectedGroup);
  const activeColor = activeGroup ? GROUP_COLORS[activeGroup.id] || "#64748b" : "#3b82f6";

  // Combine folders and direct notes for arc 2
  const arc2Items = useMemo(() => {
    const items: { type: "folder" | "note"; data: NoteFolder | Note; id: string }[] = [];
    selectedGroupData.folders.forEach((folder) => {
      items.push({ type: "folder", data: folder, id: folder.id });
    });
    selectedGroupData.notes.forEach((note) => {
      items.push({ type: "note", data: note, id: note.id });
    });
    return items;
  }, [selectedGroupData]);

  // SVG arc path for semi-circle
  const createArcPath = (radius: number, startAngle: number, endAngle: number) => {
    const start = {
      x: arcCenterX + radius * Math.cos(startAngle),
      y: arcCenterY + radius * Math.sin(startAngle),
    };
    const end = {
      x: arcCenterX + radius * Math.cos(endAngle),
      y: arcCenterY + radius * Math.sin(endAngle),
    };
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const arc1Path = createArcPath(arc1Radius, (-80 * Math.PI) / 180, (80 * Math.PI) / 180);
  const arc2Path = createArcPath(arc2Radius, (-70 * Math.PI) / 180, (70 * Math.PI) / 180);
  const arc3Path = createArcPath(arc3Radius, (-60 * Math.PI) / 180, (60 * Math.PI) / 180);

  return (
    <div ref={containerRef} className="relative w-full h-[calc(100vh-180px)] min-h-[500px] overflow-auto">
      {/* SVG for semi-circle arcs */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="arcGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={activeColor} stopOpacity="0.1" />
            <stop offset="50%" stopColor={activeColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={activeColor} stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="arcGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={activeColor} stopOpacity="0" />
            <stop offset="50%" stopColor={activeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={activeColor} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="arcGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Arc 1 - Groups */}
        <path d={arc1Path} fill="none" stroke="currentColor" strokeWidth="3" className="text-border" />
        <path d={arc1Path} fill="none" stroke="url(#arcGrad1)" strokeWidth="8" opacity="0.5" />

        {/* Arc 2 - Entries (when group selected) */}
        {selectedGroup && (
          <>
            <path
              d={arc2Path}
              fill="none"
              stroke="url(#arcGrad2)"
              strokeWidth="4"
              className="animate-in fade-in duration-500"
            />
          </>
        )}

        {/* Arc 3 - Folder notes (when folder selected) */}
        {selectedFolder && (
          <path
            d={arc3Path}
            fill="none"
            stroke="url(#arcGrad3)"
            strokeWidth="3"
            className="animate-in fade-in duration-500"
          />
        )}

        {/* Connection line from NOTES to selected group */}
        {selectedGroup &&
          (() => {
            const selectedIndex = sortedGroups.findIndex((g) => g.id === selectedGroup);
            if (selectedIndex === -1) return null;
            const pos = getSemiCirclePosition(selectedIndex, sortedGroups.length, arc1Radius);
            return (
              <line
                x1={arcCenterX + 60}
                y1={arcCenterY}
                x2={pos.x - 40}
                y2={pos.y}
                stroke={activeColor}
                strokeWidth="2"
                opacity="0.5"
                className="animate-in fade-in duration-300"
              />
            );
          })()}
      </svg>

      {/* NOTES Hub - Left side */}
      <div
        className="absolute group cursor-pointer z-20"
        style={{
          left: arcCenterX,
          top: arcCenterY,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative px-6 py-4 rounded-full bg-card border-2 border-primary/40 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <span className="text-lg font-bold text-foreground uppercase tracking-wider">Notes</span>
        </div>
      </div>

      {/* Arc 1 - Groups along semi-circle */}
      {sortedGroups.map((group, index) => {
        const pos = getSemiCirclePosition(index, sortedGroups.length, arc1Radius);
        const isSelected = selectedGroup === group.id;
        const isHovered = hoveredItem === `group-${group.id}`;
        const color = GROUP_COLORS[group.id] || "#64748b";

        return (
          <div
            key={group.id}
            className="absolute z-10 transition-all duration-400 ease-out"
            style={{
              left: pos.x,
              top: pos.y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <button
              onClick={() => {
                setSelectedGroup(isSelected ? null : group.id);
                setSelectedFolder(null);
              }}
              onMouseEnter={() => setHoveredItem(`group-${group.id}`)}
              onMouseLeave={() => setHoveredItem(null)}
              className={cn(
                "relative px-4 py-2 rounded-full transition-all duration-300 whitespace-nowrap",
                isSelected
                  ? "bg-card border-2 shadow-lg scale-110"
                  : "hover:bg-muted/80 hover:shadow-md hover:scale-105",
              )}
              style={{ borderColor: isSelected ? color : "transparent" }}
            >
              {isSelected && (
                <div className="absolute inset-0 rounded-full blur-md opacity-40" style={{ background: color }} />
              )}
              <span
                className={cn(
                  "relative text-sm font-semibold transition-colors",
                  isSelected || isHovered ? "text-foreground" : "text-muted-foreground",
                )}
                style={{ color: isSelected ? color : undefined }}
              >
                {group.name}
              </span>
            </button>
          </div>
        );
      })}

      {/* Arc 2 - Entries (Folders + Direct Notes) */}
      {selectedGroup &&
        arc2Items.map((entry, index) => {
          const pos = getSemiCirclePosition(index, Math.max(arc2Items.length, 2), arc2Radius);
          const isFolder = entry.type === "folder";
          const isSelected = isFolder && selectedFolder === entry.id;
          const isHovered = hoveredItem === `entry-${entry.id}`;

          if (isFolder) {
            const folder = entry.data as NoteFolder;
            const folderNotes = notes.filter((n) => n.folderId === folder.id);

            return (
              <div
                key={entry.id}
                className="absolute z-10 transition-all duration-400 ease-out animate-in fade-in slide-in-from-left-4"
                style={{
                  left: pos.x,
                  top: pos.y,
                  transform: "translate(-50%, -50%)",
                  animationDelay: `${index * 60}ms`,
                }}
              >
                <button
                  onClick={() => setSelectedFolder(isSelected ? null : folder.id)}
                  onMouseEnter={() => setHoveredItem(`entry-${entry.id}`)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 whitespace-nowrap",
                    isSelected
                      ? "bg-cyan-500/20 border-2 border-cyan-400 shadow-lg scale-105"
                      : "bg-card/90 hover:bg-card hover:shadow-md hover:scale-105 border border-border/50",
                  )}
                >
                  <FolderOpen className={cn("h-4 w-4", isSelected ? "text-cyan-500" : "text-cyan-400")} />
                  <span className="text-sm font-medium text-foreground">{folder.name}</span>
                  <span className="text-xs text-muted-foreground">{folderNotes.length}</span>
                </button>
              </div>
            );
          }

          const note = entry.data as Note;
          return (
            <div
              key={entry.id}
              className="absolute z-10 transition-all duration-400 ease-out animate-in fade-in slide-in-from-left-4"
              style={{
                left: pos.x,
                top: pos.y,
                transform: "translate(-50%, -50%)",
                animationDelay: `${index * 60}ms`,
              }}
            >
              <button
                onClick={() => onNoteClick(note)}
                onMouseEnter={() => setHoveredItem(`entry-${entry.id}`)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all duration-300 whitespace-nowrap",
                  "bg-card/90 hover:bg-card hover:shadow-md hover:scale-105 border border-border/50",
                  selectedNoteId === note.id && "bg-primary/15 border-primary",
                )}
              >
                <span className="text-sm text-foreground">{note.title || "Untitled"}</span>
              </button>
            </div>
          );
        })}

      {/* Arc 3 - Folder Notes */}
      {selectedFolder &&
        selectedFolderNotes.map((note, index) => {
          const pos = getSemiCirclePosition(index, Math.max(selectedFolderNotes.length, 2), arc3Radius);

          return (
            <div
              key={note.id}
              className="absolute z-10 transition-all duration-400 ease-out animate-in fade-in slide-in-from-left-4"
              style={{
                left: pos.x,
                top: pos.y,
                transform: "translate(-50%, -50%)",
                animationDelay: `${index * 50}ms`,
              }}
            >
              <button
                onClick={() => onNoteClick(note)}
                onMouseEnter={() => setHoveredItem(`note-${note.id}`)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  "px-3 py-1.5 rounded-md transition-all duration-300 whitespace-nowrap",
                  "bg-card/90 hover:bg-card hover:shadow-md hover:scale-105 border border-cyan-300/50",
                  selectedNoteId === note.id && "bg-cyan-500/20 border-cyan-400",
                )}
              >
                <span className="text-xs text-foreground">{note.title || "Untitled"}</span>
              </button>
            </div>
          );
        })}

      {/* Empty states */}
      {selectedGroup && arc2Items.length === 0 && (
        <div
          className="absolute flex flex-col items-center gap-2 text-muted-foreground animate-in fade-in z-10"
          style={{ left: arcCenterX + arc2Radius, top: arcCenterY, transform: "translate(-50%, -50%)" }}
        >
          <Sparkles className="h-4 w-4 opacity-50" />
          <span className="text-xs italic">No entries</span>
        </div>
      )}

      {/* Bottom hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-muted-foreground bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50 shadow-sm z-20">
        <Sparkles className="h-3 w-3 text-primary animate-pulse" />
        <span>Click groups to see entries • Click folders for notes</span>
      </div>
    </div>
  );
}
