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

  // Center of the circular layout
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;

  // Ring radii - concentric circles
  const ring1Radius = 120; // Groups ring
  const ring2Radius = 220; // Sections/Folders ring
  const ring3Radius = 320; // Entries ring

  // Calculate position on a circle
  const getCirclePosition = (index: number, total: number, radius: number, startAngle: number = -Math.PI / 2) => {
    const angle = startAngle + (index / total) * 2 * Math.PI;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      angle: angle * (180 / Math.PI),
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

  // Combine folders and direct notes for ring 2
  const ring2Items = useMemo(() => {
    const items: { type: "folder" | "note"; data: NoteFolder | Note; id: string }[] = [];
    selectedGroupData.folders.forEach((folder) => {
      items.push({ type: "folder", data: folder, id: folder.id });
    });
    selectedGroupData.notes.forEach((note) => {
      items.push({ type: "note", data: note, id: note.id });
    });
    return items;
  }, [selectedGroupData]);

  return (
    <div ref={containerRef} className="relative w-full h-[calc(100vh-180px)] min-h-[500px] overflow-auto">
      {/* SVG for concentric rings */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="ringGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={activeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={activeColor} stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="ringGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Ring 1 - Groups */}
        <circle
          cx={centerX}
          cy={centerY}
          r={ring1Radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-border"
          strokeDasharray="4 4"
        />

        {/* Ring 2 - Sections/Folders (only when group selected) */}
        {selectedGroup && (
          <circle
            cx={centerX}
            cy={centerY}
            r={ring2Radius}
            fill="none"
            stroke="url(#ringGrad1)"
            strokeWidth="2"
            className="animate-in fade-in duration-500"
          />
        )}

        {/* Ring 3 - Entries (only when folder selected) */}
        {selectedFolder && (
          <circle
            cx={centerX}
            cy={centerY}
            r={ring3Radius}
            fill="none"
            stroke="url(#ringGrad2)"
            strokeWidth="2"
            className="animate-in fade-in duration-500"
          />
        )}

        {/* Connection lines from center to selected group */}
        {selectedGroup &&
          sortedGroups.map((group, index) => {
            const pos = getCirclePosition(index, sortedGroups.length, ring1Radius);
            const isSelected = selectedGroup === group.id;
            if (!isSelected) return null;

            return (
              <line
                key={group.id}
                x1={centerX}
                y1={centerY}
                x2={pos.x}
                y2={pos.y}
                stroke={GROUP_COLORS[group.id] || "#64748b"}
                strokeWidth="2"
                strokeDasharray="4 2"
                opacity="0.5"
                className="animate-in fade-in duration-300"
              />
            );
          })}
      </svg>

      {/* Center Hub - NOTES */}
      <div
        className="absolute group cursor-pointer z-20"
        style={{
          left: centerX,
          top: centerY,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative w-24 h-24 rounded-full bg-card border-2 border-primary/40 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center">
          <span className="text-lg font-bold text-foreground uppercase tracking-wider">Notes</span>
        </div>
      </div>

      {/* Ring 1 - Groups */}
      {sortedGroups.map((group, index) => {
        const pos = getCirclePosition(index, sortedGroups.length, ring1Radius);
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
                  : "bg-card/80 hover:bg-card hover:shadow-md hover:scale-105 border border-border/50",
              )}
              style={{ borderColor: isSelected ? color : undefined }}
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

      {/* Ring 2 - Sections/Folders + Direct Notes */}
      {selectedGroup &&
        ring2Items.map((entry, index) => {
          const pos = getCirclePosition(index, ring2Items.length, ring2Radius);
          const isFolder = entry.type === "folder";
          const isSelected = isFolder && selectedFolder === entry.id;
          const isHovered = hoveredItem === `entry-${entry.id}`;

          if (isFolder) {
            const folder = entry.data as NoteFolder;
            const folderNotes = notes.filter((n) => n.folderId === folder.id);

            return (
              <div
                key={entry.id}
                className="absolute z-10 transition-all duration-400 ease-out animate-in fade-in zoom-in-95"
                style={{
                  left: pos.x,
                  top: pos.y,
                  transform: "translate(-50%, -50%)",
                  animationDelay: `${index * 50}ms`,
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
              className="absolute z-10 transition-all duration-400 ease-out animate-in fade-in zoom-in-95"
              style={{
                left: pos.x,
                top: pos.y,
                transform: "translate(-50%, -50%)",
                animationDelay: `${index * 50}ms`,
              }}
            >
              <button
                onClick={() => onNoteClick(note)}
                onMouseEnter={() => setHoveredItem(`entry-${entry.id}`)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  "px-3 py-1.5 rounded-md transition-all duration-300 whitespace-nowrap",
                  "bg-card/80 hover:bg-card hover:shadow-md hover:scale-105 border border-border/50",
                  selectedNoteId === note.id && "bg-primary/15 border-primary",
                )}
              >
                <span className="text-sm text-foreground">{note.title || "Untitled"}</span>
              </button>
            </div>
          );
        })}

      {/* Ring 3 - Folder Notes */}
      {selectedFolder &&
        selectedFolderNotes.map((note, index) => {
          const pos = getCirclePosition(index, selectedFolderNotes.length, ring3Radius);

          return (
            <div
              key={note.id}
              className="absolute z-10 transition-all duration-400 ease-out animate-in fade-in zoom-in-95"
              style={{
                left: pos.x,
                top: pos.y,
                transform: "translate(-50%, -50%)",
                animationDelay: `${index * 40}ms`,
              }}
            >
              <button
                onClick={() => onNoteClick(note)}
                onMouseEnter={() => setHoveredItem(`note-${note.id}`)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  "px-3 py-1.5 rounded-md transition-all duration-300 whitespace-nowrap",
                  "bg-card/80 hover:bg-card hover:shadow-md hover:scale-105 border border-cyan-300/50",
                  selectedNoteId === note.id && "bg-cyan-500/20 border-cyan-400",
                )}
              >
                <span className="text-xs text-foreground">{note.title || "Untitled"}</span>
              </button>
            </div>
          );
        })}

      {/* Empty states */}
      {selectedGroup && ring2Items.length === 0 && (
        <div
          className="absolute flex flex-col items-center gap-2 text-muted-foreground animate-in fade-in z-10"
          style={{
            left: centerX,
            top: centerY - ring2Radius,
            transform: "translate(-50%, -50%)",
          }}
        >
          <Sparkles className="h-4 w-4 opacity-50" />
          <span className="text-xs italic">No entries</span>
        </div>
      )}

      {selectedFolder && selectedFolderNotes.length === 0 && (
        <div
          className="absolute text-xs text-muted-foreground italic animate-in fade-in z-10"
          style={{
            left: centerX,
            top: centerY - ring3Radius,
            transform: "translate(-50%, -50%)",
          }}
        >
          Empty folder
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
