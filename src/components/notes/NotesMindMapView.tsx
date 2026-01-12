import { useState, useMemo } from "react";
import { FileText, ChevronRight, FolderOpen } from "lucide-react";
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

// Group accent colors
const GROUP_COLORS: Record<string, string> = {
  inbox: "#64748b",
  work: "#3b82f6",
  personal: "#10b981",
  wellness: "#a855f7",
  hobby: "#f97316",
};

export function NotesMindMapView({
  groups,
  folders,
  notes,
  selectedNoteId,
  onNoteClick,
  onAddNote,
}: NotesMindMapViewProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  const sortedGroups = useMemo(() => [...groups].sort((a, b) => a.sortOrder - b.sortOrder), [groups]);

  // Get notes and folders for selected group
  const selectedGroupData = useMemo(() => {
    if (!selectedGroup) return { notes: [], folders: [] };
    return {
      notes: notes.filter((n) => n.groupId === selectedGroup),
      folders: folders.filter((f) => f.groupId === selectedGroup),
    };
  }, [selectedGroup, notes, folders]);

  const activeGroup = sortedGroups.find((g) => g.id === selectedGroup);

  return (
    <div className="relative w-full h-[calc(100vh-280px)] min-h-[500px] flex items-center justify-center overflow-hidden">
      {/* Main container with arc layout */}
      <div className="relative flex items-center gap-8">
        {/* Left side - NOTES pill with arc */}
        <div className="relative flex items-center">
          {/* NOTES pill */}
          <div className="relative z-10 px-6 py-4 rounded-full bg-card border-2 border-primary/30 shadow-lg">
            <span className="text-lg font-bold text-foreground uppercase tracking-wider">Notes</span>
          </div>

          {/* Arc SVG */}
          <svg
            width="180"
            height="400"
            viewBox="0 0 180 400"
            className="absolute left-full -ml-4"
            style={{ marginTop: -20 }}
          >
            {/* Main arc line */}
            <path
              d="M 10 40 Q 160 200 10 360"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-border"
              strokeLinecap="round"
            />

            {/* Gradient overlay on arc */}
            <defs>
              <linearGradient id="arcGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <path
              d="M 10 40 Q 160 200 10 360"
              fill="none"
              stroke="url(#arcGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.4"
            />
          </svg>
        </div>

        {/* Center - Group names along the arc */}
        <div className="relative flex flex-col gap-3 -ml-8 z-20">
          {sortedGroups.map((group, index) => {
            const isSelected = selectedGroup === group.id;
            const isHovered = hoveredGroup === group.id;
            const color = GROUP_COLORS[group.id] || "#64748b";

            // Calculate offset for arc effect
            const totalGroups = sortedGroups.length;
            const middleIndex = (totalGroups - 1) / 2;
            const distanceFromMiddle = Math.abs(index - middleIndex);
            const xOffset = -distanceFromMiddle * 8;

            return (
              <div key={group.id} className="relative" style={{ marginLeft: 40 + xOffset }}>
                <button
                  onClick={() => setSelectedGroup(isSelected ? null : group.id)}
                  onMouseEnter={() => setHoveredGroup(group.id)}
                  onMouseLeave={() => setHoveredGroup(null)}
                  className={cn(
                    "relative px-5 py-2.5 rounded-full transition-all duration-300 text-left",
                    isSelected ? "bg-card border-2 shadow-lg" : "hover:bg-muted/50",
                    isSelected && "scale-105",
                  )}
                  style={{
                    borderColor: isSelected ? color : "transparent",
                  }}
                >
                  {/* Glow effect for selected */}
                  {isSelected && (
                    <div className="absolute inset-0 rounded-full blur-md opacity-30" style={{ background: color }} />
                  )}

                  <span
                    className={cn(
                      "relative text-base font-medium transition-colors duration-200",
                      isSelected ? "text-foreground" : "text-muted-foreground",
                      isHovered && !isSelected && "text-foreground",
                    )}
                    style={{
                      color: isSelected ? color : undefined,
                    }}
                  >
                    {group.name}
                  </span>
                </button>

                {/* Connection line to entries */}
                {isSelected && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 flex items-center">
                    <div
                      className="w-16 h-0.5 rounded-full"
                      style={{ background: `linear-gradient(to right, ${color}, transparent)` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right side - Entries for selected group */}
        <div
          className={cn(
            "relative flex flex-col gap-2 ml-12 min-w-[200px] transition-all duration-300",
            selectedGroup ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none",
          )}
        >
          {/* Group title */}
          {activeGroup && (
            <div className="mb-2">
              <h3
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: GROUP_COLORS[activeGroup.id] || "#64748b" }}
              >
                {activeGroup.name} Entries
              </h3>
            </div>
          )}

          {/* Folders */}
          {selectedGroupData.folders.map((folder) => (
            <div
              key={folder.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <FolderOpen className="h-4 w-4 text-cyan-500" />
              <span className="text-sm font-medium text-foreground">{folder.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {notes.filter((n) => n.folderId === folder.id).length}
              </span>
            </div>
          ))}

          {/* Notes */}
          {selectedGroupData.notes
            .filter((n) => !n.folderId)
            .slice(0, 10)
            .map((note) => (
              <button
                key={note.id}
                onClick={() => onNoteClick(note)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-left",
                  "hover:bg-muted/50 hover:translate-x-1",
                  selectedNoteId === note.id && "bg-primary/10 border-l-2 border-primary",
                )}
              >
                <span className="text-sm text-foreground">{note.title || "Untitled"}</span>
              </button>
            ))}

          {/* Empty state */}
          {selectedGroupData.notes.length === 0 && selectedGroupData.folders.length === 0 && (
            <div className="text-sm text-muted-foreground italic py-4">No entries yet</div>
          )}

          {/* More notes indicator */}
          {selectedGroupData.notes.filter((n) => !n.folderId).length > 10 && (
            <div className="text-xs text-muted-foreground">
              +{selectedGroupData.notes.filter((n) => !n.folderId).length - 10} more
            </div>
          )}
        </div>
      </div>

      {/* Hint text */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
        Click a category to view its entries
      </div>
    </div>
  );
}
