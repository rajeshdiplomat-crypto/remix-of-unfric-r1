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

  const centerY = dimensions.height / 2;

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

  // Layout columns
  const col1 = 80; // NOTES
  const col2 = 220; // Groups
  const col3 = 420; // Entries
  const col4 = 620; // Folder notes

  // Calculate vertical positions - evenly distributed
  const getVerticalPositions = (count: number, totalHeight: number, padding: number = 80) => {
    const availableHeight = totalHeight - padding * 2;
    const spacing = availableHeight / Math.max(count - 1, 1);
    return Array.from({ length: count }, (_, i) => padding + i * spacing);
  };

  const groupYPositions = getVerticalPositions(sortedGroups.length, dimensions.height, 60);
  const entryYPositions = getVerticalPositions(secondArcItems.length, dimensions.height, 80);
  const folderNoteYPositions = getVerticalPositions(selectedFolderNotes.length, dimensions.height, 100);

  return (
    <div ref={containerRef} className="relative w-full h-[calc(100vh-180px)] min-h-[500px] overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary/20"
            style={{
              left: `${20 + i * 15}%`,
              top: `${15 + (i % 3) * 30}%`,
              animation: `pulse ${2 + i * 0.3}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
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
            <stop offset="50%" stopColor={activeColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={activeColor} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="arc3Grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Arc 1 - From NOTES to Groups */}
        <path
          d={`M ${col1 + 60},${centerY} 
              Q ${col1 + 90},${centerY - 100} ${col2 - 20},${groupYPositions[0] || centerY - 100}
              M ${col1 + 60},${centerY} 
              Q ${col1 + 90},${centerY + 100} ${col2 - 20},${groupYPositions[groupYPositions.length - 1] || centerY + 100}`}
          fill="none"
          stroke="url(#arc1Grad)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Arc 2 - From Groups to Entries */}
        {selectedGroup && (
          <path
            d={`M ${col2 + 80},${centerY} 
                Q ${col2 + 120},${centerY - 80} ${col3 - 30},${entryYPositions[0] || centerY - 80}
                M ${col2 + 80},${centerY} 
                Q ${col2 + 120},${centerY + 80} ${col3 - 30},${entryYPositions[entryYPositions.length - 1] || centerY + 80}`}
            fill="none"
            stroke="url(#arc2Grad)"
            strokeWidth="3"
            strokeLinecap="round"
            className="animate-in fade-in duration-500"
          />
        )}

        {/* Arc 3 - From Folder to Notes */}
        {selectedFolder && (
          <path
            d={`M ${col3 + 100},${centerY} 
                Q ${col3 + 130},${centerY - 60} ${col4 - 20},${folderNoteYPositions[0] || centerY - 60}
                M ${col3 + 100},${centerY} 
                Q ${col3 + 130},${centerY + 60} ${col4 - 20},${folderNoteYPositions[folderNoteYPositions.length - 1] || centerY + 60}`}
            fill="none"
            stroke="url(#arc3Grad)"
            strokeWidth="2"
            strokeLinecap="round"
            className="animate-in fade-in duration-500"
          />
        )}
      </svg>

      {/* ===== Column 1: NOTES Hub ===== */}
      <div
        className="absolute group cursor-pointer"
        style={{ left: col1, top: centerY, transform: "translate(-50%, -50%)" }}
      >
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative px-6 py-3 rounded-full bg-card border-2 border-primary/40 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <span className="text-base font-bold text-foreground uppercase tracking-widest">Notes</span>
        </div>
      </div>

      {/* ===== Column 2: Groups ===== */}
      {sortedGroups.map((group, index) => {
        const isSelected = selectedGroup === group.id;
        const isHovered = hoveredItem === `group-${group.id}`;
        const color = GROUP_COLORS[group.id] || "#64748b";
        const yPos = groupYPositions[index];

        return (
          <div
            key={group.id}
            className="absolute transition-all duration-400 ease-out"
            style={{
              left: col2,
              top: yPos,
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
                "relative px-4 py-2 rounded-full transition-all duration-300 whitespace-nowrap",
                isSelected ? "bg-card border-2 shadow-lg scale-110" : "hover:bg-muted/60 hover:scale-105",
              )}
              style={{ borderColor: isSelected ? color : "transparent" }}
            >
              {isSelected && (
                <div className="absolute inset-0 rounded-full blur-lg opacity-30" style={{ background: color }} />
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

      {/* ===== Column 3: Entries (Folders + Direct Notes) ===== */}
      {selectedGroup &&
        secondArcItems.map((entry, index) => {
          const yPos = entryYPositions[index];
          const isFolder = entry.type === "folder";
          const isSelected = isFolder && selectedFolder === entry.id;
          const isHovered = hoveredItem === `entry-${entry.id}`;

          if (isFolder) {
            const folder = entry.data as NoteFolder;
            const folderNotes = notes.filter((n) => n.folderId === folder.id);

            return (
              <div
                key={entry.id}
                className="absolute transition-all duration-400 ease-out animate-in fade-in slide-in-from-left-4"
                style={{
                  left: col3,
                  top: yPos,
                  transform: "translate(-50%, -50%)",
                  animationDelay: `${index * 60}ms`,
                  zIndex: isSelected ? 20 : 10,
                }}
              >
                <button
                  onClick={() => setSelectedFolder(isSelected ? null : folder.id)}
                  onMouseEnter={() => setHoveredItem(`entry-${entry.id}`)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap",
                    isSelected
                      ? "bg-cyan-500/20 border-2 border-cyan-400 shadow-lg scale-105"
                      : "bg-muted/60 hover:bg-muted/80 hover:shadow-md hover:scale-102 border border-transparent",
                  )}
                >
                  <FolderOpen
                    className={cn("h-4 w-4 transition-colors", isSelected ? "text-cyan-500" : "text-cyan-400")}
                  />
                  <span className="text-sm font-medium text-foreground">{folder.name}</span>
                  <span className="text-xs text-muted-foreground">{folderNotes.length}</span>
                  {isSelected && <ChevronRight className="h-3 w-3 text-cyan-500" />}
                </button>
              </div>
            );
          }

          const note = entry.data as Note;
          return (
            <div
              key={entry.id}
              className="absolute transition-all duration-400 ease-out animate-in fade-in slide-in-from-left-4"
              style={{
                left: col3,
                top: yPos,
                transform: "translate(-50%, -50%)",
                animationDelay: `${index * 60}ms`,
              }}
            >
              <button
                onClick={() => onNoteClick(note)}
                onMouseEnter={() => setHoveredItem(`entry-${entry.id}`)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  "px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap",
                  "hover:bg-muted/60 hover:shadow-md hover:scale-105",
                  selectedNoteId === note.id && "bg-primary/15 border-l-2 border-primary",
                )}
              >
                <span className="text-sm text-foreground">{note.title || "Untitled"}</span>
              </button>
            </div>
          );
        })}

      {/* ===== Column 4: Folder Notes ===== */}
      {selectedFolder &&
        selectedFolderNotes.map((note, index) => {
          const yPos = folderNoteYPositions[index];

          return (
            <div
              key={note.id}
              className="absolute transition-all duration-400 ease-out animate-in fade-in slide-in-from-left-4"
              style={{
                left: col4,
                top: yPos,
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
                  "hover:bg-cyan-500/15 hover:shadow-md hover:scale-105",
                  selectedNoteId === note.id && "bg-cyan-500/20 border-l-2 border-cyan-500",
                )}
              >
                <span className="text-xs text-foreground">{note.title || "Untitled"}</span>
              </button>
            </div>
          );
        })}

      {/* Empty states */}
      {selectedGroup && secondArcItems.length === 0 && (
        <div
          className="absolute flex flex-col items-center gap-2 text-muted-foreground animate-in fade-in"
          style={{ left: col3, top: centerY, transform: "translate(-50%, -50%)" }}
        >
          <Sparkles className="h-5 w-5 opacity-50" />
          <span className="text-sm italic">No entries</span>
        </div>
      )}

      {selectedFolder && selectedFolderNotes.length === 0 && (
        <div
          className="absolute text-sm text-muted-foreground italic animate-in fade-in"
          style={{ left: col4, top: centerY, transform: "translate(-50%, -50%)" }}
        >
          Empty folder
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
