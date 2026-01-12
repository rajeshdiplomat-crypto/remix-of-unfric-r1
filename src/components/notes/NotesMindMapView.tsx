import { useState, useMemo, useRef, useEffect } from "react";
import { FolderOpen, Sparkles, ChevronRight } from "lucide-react";
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
  const [containerHeight, setContainerHeight] = useState(600);

  const sortedGroups = useMemo(() => [...groups].sort((a, b) => a.sortOrder - b.sortOrder), [groups]);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Arc configuration
  const centerY = containerHeight / 2;
  const arcRadius1 = 180; // Groups arc
  const arcRadius2 = 340; // Entries arc
  const arcRadius3 = 500; // Folder notes arc
  const arcSpread = Math.PI * 0.6; // How much of the arc to use (0.6 = 108 degrees)

  // Calculate positions along an arc
  const getArcPosition = (index: number, total: number, radius: number, startX: number) => {
    const angleRange = arcSpread;
    const startAngle = -angleRange / 2;
    const angle = startAngle + (index / Math.max(total - 1, 1)) * angleRange;

    return {
      x: startX + radius * (1 - Math.cos(angle)),
      y: centerY + radius * Math.sin(angle),
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
  const activeFolder = folders.find((f) => f.id === selectedFolder);
  const activeColor = activeGroup ? GROUP_COLORS[activeGroup.id] || "#64748b" : "#3b82f6";

  // Combined entries for second arc
  const secondArcItems = useMemo(() => {
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
    <div ref={containerRef} className="relative w-full h-[calc(100vh-180px)] min-h-[500px] overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Animated floating particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary/30"
            style={{
              left: `${15 + i * 10}%`,
              top: `${20 + (i % 4) * 20}%`,
              animation: `pulse ${2 + i * 0.3}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* SVG Arcs */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="arc1Grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={activeColor} stopOpacity="0.1" />
            <stop offset="50%" stopColor={activeColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={activeColor} stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="arc2Grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={activeColor} stopOpacity="0" />
            <stop offset="30%" stopColor={activeColor} stopOpacity="0.3" />
            <stop offset="50%" stopColor={activeColor} stopOpacity="0.5" />
            <stop offset="70%" stopColor={activeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={activeColor} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="arc3Grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="30%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Arc 1 - Groups */}
        <path
          d={`M 100,${centerY - arcRadius1 * Math.sin(arcSpread / 2)} 
              Q ${100 + arcRadius1},${centerY} 
              100,${centerY + arcRadius1 * Math.sin(arcSpread / 2)}`}
          fill="none"
          stroke="url(#arc1Grad)"
          strokeWidth="6"
          strokeLinecap="round"
          className="transition-all duration-500"
        />

        {/* Arc 2 - Entries */}
        {selectedGroup && (
          <path
            d={`M 260,${centerY - arcRadius2 * 0.5} 
                Q ${260 + arcRadius2 * 0.6},${centerY} 
                260,${centerY + arcRadius2 * 0.5}`}
            fill="none"
            stroke="url(#arc2Grad)"
            strokeWidth="4"
            strokeLinecap="round"
            className="animate-in fade-in duration-700"
          />
        )}

        {/* Arc 3 - Folder notes */}
        {selectedFolder && (
          <path
            d={`M 480,${centerY - arcRadius3 * 0.4} 
                Q ${480 + arcRadius3 * 0.5},${centerY} 
                480,${centerY + arcRadius3 * 0.4}`}
            fill="none"
            stroke="url(#arc3Grad)"
            strokeWidth="3"
            strokeLinecap="round"
            className="animate-in fade-in duration-500"
          />
        )}

        {/* Connection line from selected group */}
        {selectedGroup && activeGroup && (
          <line
            x1="250"
            y1={centerY}
            x2="280"
            y2={centerY}
            stroke={activeColor}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
            className="animate-in fade-in duration-300"
          />
        )}
      </svg>

      {/* NOTES Hub */}
      <div className="absolute left-8 group cursor-pointer" style={{ top: centerY, transform: "translateY(-50%)" }}>
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative px-7 py-4 rounded-full bg-card border-2 border-primary/40 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <span className="text-lg font-bold text-foreground uppercase tracking-widest">Notes</span>
        </div>
      </div>

      {/* Groups - Arc 1 */}
      {sortedGroups.map((group, index) => {
        const pos = getArcPosition(index, sortedGroups.length, arcRadius1, 120);
        const isSelected = selectedGroup === group.id;
        const isHovered = hoveredItem === `group-${group.id}`;
        const color = GROUP_COLORS[group.id] || "#64748b";

        return (
          <div
            key={group.id}
            className="absolute transition-all duration-500 ease-out"
            style={{
              left: pos.x,
              top: pos.y,
              transform: "translate(-50%, -50%)",
              zIndex: isSelected ? 20 : 10,
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
                "relative px-5 py-2.5 rounded-full transition-all duration-300 whitespace-nowrap",
                isSelected ? "bg-card border-2 shadow-lg scale-110" : "hover:bg-muted/60 hover:scale-105",
              )}
              style={{ borderColor: isSelected ? color : "transparent" }}
            >
              {isSelected && (
                <div
                  className="absolute inset-0 rounded-full blur-lg opacity-40 animate-pulse"
                  style={{ background: color }}
                />
              )}
              <span
                className={cn(
                  "relative text-base font-semibold transition-colors",
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

      {/* Entries - Arc 2 (Folders + Direct Notes) */}
      {selectedGroup &&
        secondArcItems.map((entry, index) => {
          const total = secondArcItems.length;
          const pos = getArcPosition(index, Math.max(total, 3), arcRadius2 * 0.5, 280);
          const isFolder = entry.type === "folder";
          const isSelected = isFolder && selectedFolder === entry.id;
          const isHovered = hoveredItem === `entry-${entry.id}`;
          const opacity = 1 - (Math.abs(index - (total - 1) / 2) / Math.max(total, 1)) * 0.4;

          if (isFolder) {
            const folder = entry.data as NoteFolder;
            const folderNotes = notes.filter((n) => n.folderId === folder.id);

            return (
              <div
                key={entry.id}
                className="absolute transition-all duration-500 ease-out animate-in fade-in slide-in-from-left-4"
                style={{
                  left: pos.x,
                  top: pos.y,
                  transform: "translate(-50%, -50%)",
                  opacity,
                  animationDelay: `${index * 80}ms`,
                  zIndex: isSelected ? 20 : 10,
                }}
              >
                <button
                  onClick={() => setSelectedFolder(isSelected ? null : folder.id)}
                  onMouseEnter={() => setHoveredItem(`entry-${entry.id}`)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 whitespace-nowrap",
                    isSelected
                      ? "bg-cyan-500/20 border-2 border-cyan-500/50 shadow-lg scale-105"
                      : "bg-muted/50 hover:bg-muted/80 hover:shadow-md hover:scale-102 border border-transparent",
                  )}
                >
                  <FolderOpen
                    className={cn("h-4 w-4 transition-colors", isSelected ? "text-cyan-500" : "text-cyan-400")}
                  />
                  <span className="text-sm font-medium text-foreground">{folder.name}</span>
                  <span className="text-xs text-muted-foreground">{folderNotes.length}</span>
                  <ChevronRight
                    className={cn("h-3 w-3 text-muted-foreground transition-transform", isSelected && "rotate-90")}
                  />
                </button>
              </div>
            );
          }

          const note = entry.data as Note;
          return (
            <div
              key={entry.id}
              className="absolute transition-all duration-500 ease-out animate-in fade-in slide-in-from-left-4"
              style={{
                left: pos.x,
                top: pos.y,
                transform: "translate(-50%, -50%)",
                opacity,
                animationDelay: `${index * 80}ms`,
              }}
            >
              <button
                onClick={() => onNoteClick(note)}
                onMouseEnter={() => setHoveredItem(`entry-${entry.id}`)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  "px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap",
                  "hover:bg-muted/60 hover:shadow-md hover:scale-105",
                  selectedNoteId === note.id && "bg-primary/10 border-l-2 border-primary",
                )}
              >
                <span className="text-sm text-foreground">{note.title || "Untitled"}</span>
              </button>
            </div>
          );
        })}

      {/* Folder Notes - Arc 3 */}
      {selectedFolder &&
        selectedFolderNotes.map((note, index) => {
          const total = selectedFolderNotes.length;
          const pos = getArcPosition(index, Math.max(total, 3), arcRadius3 * 0.35, 500);
          const opacity = 1 - (Math.abs(index - (total - 1) / 2) / Math.max(total, 1)) * 0.5;

          return (
            <div
              key={note.id}
              className="absolute transition-all duration-500 ease-out animate-in fade-in slide-in-from-left-4"
              style={{
                left: pos.x,
                top: pos.y,
                transform: "translate(-50%, -50%)",
                opacity,
                animationDelay: `${index * 60}ms`,
              }}
            >
              <button
                onClick={() => onNoteClick(note)}
                onMouseEnter={() => setHoveredItem(`note-${note.id}`)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  "px-3 py-1.5 rounded-md transition-all duration-300 whitespace-nowrap",
                  "hover:bg-cyan-500/20 hover:shadow-md hover:scale-105",
                  selectedNoteId === note.id && "bg-cyan-500/20 border-l-2 border-cyan-500",
                )}
              >
                <span className="text-xs text-foreground">{note.title || "Untitled"}</span>
              </button>
            </div>
          );
        })}

      {/* Empty state for selected folder */}
      {selectedFolder && selectedFolderNotes.length === 0 && (
        <div
          className="absolute text-sm text-muted-foreground italic animate-in fade-in"
          style={{ left: 520, top: centerY, transform: "translateY(-50%)" }}
        >
          Empty folder
        </div>
      )}

      {/* Empty state for selected group */}
      {selectedGroup && secondArcItems.length === 0 && (
        <div
          className="absolute flex flex-col items-center gap-2 text-muted-foreground animate-in fade-in"
          style={{ left: 350, top: centerY, transform: "translateY(-50%)" }}
        >
          <Sparkles className="h-5 w-5 opacity-50" />
          <span className="text-sm italic">No entries yet</span>
        </div>
      )}

      {/* Bottom hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50 shadow-sm">
        <Sparkles className="h-3 w-3 text-primary animate-pulse" />
        <span>Click a category to explore • Click folders to see notes</span>
      </div>
    </div>
  );
}
