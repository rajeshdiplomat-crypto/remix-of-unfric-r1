import { useState, useMemo, useRef } from "react";
import { FolderOpen, ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export function NotesMindMapView({ groups, folders, notes, selectedNoteId, onNoteClick }: NotesMindMapViewProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);

  const sortedGroups = useMemo(() => [...groups].sort((a, b) => a.sortOrder - b.sortOrder), [groups]);

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
  const activeColor = activeGroup ? GROUP_COLORS[activeGroup.id] || "#64748b" : "#64748b";

  // Combined entries for second arc (folders + direct notes)
  const secondArcItems = useMemo(() => {
    const items: { type: "folder" | "note"; data: NoteFolder | Note }[] = [];
    selectedGroupData.folders.forEach((folder) => {
      items.push({ type: "folder", data: folder });
    });
    selectedGroupData.notes.forEach((note) => {
      items.push({ type: "note", data: note });
    });
    return items;
  }, [selectedGroupData]);

  return (
    <div className="relative w-full h-[calc(100vh-200px)] min-h-[600px] flex items-center overflow-hidden px-8">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/20 animate-pulse"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Main container - spread across full width */}
      <div className="relative flex items-center w-full justify-start gap-4">
        {/* ===== ARC 1: NOTES pill ===== */}
        <div className="relative flex items-center shrink-0">
          {/* NOTES pill with glow */}
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
            <div className="relative z-10 px-8 py-5 rounded-full bg-card border-2 border-primary/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
              <span className="text-xl font-bold text-foreground uppercase tracking-widest">Notes</span>
            </div>
          </div>

          {/* First arc SVG */}
          <svg
            width="200"
            height="500"
            viewBox="0 0 200 500"
            className="absolute left-full -ml-6"
            style={{ marginTop: -30 }}
          >
            <defs>
              <linearGradient id="arc1Gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.1" />
                <stop offset="50%" stopColor={activeColor} stopOpacity="0.6" />
                <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path
              d="M 10 30 Q 180 250 10 470"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-border"
              strokeLinecap="round"
            />
            <path
              d="M 10 30 Q 180 250 10 470"
              fill="none"
              stroke="url(#arc1Gradient)"
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.5"
              className="transition-all duration-500"
            />
          </svg>
        </div>

        {/* ===== ARC 2: Groups ===== */}
        <div className="relative flex flex-col gap-4 -ml-4 z-20 shrink-0">
          {sortedGroups.map((group, index) => {
            const isSelected = selectedGroup === group.id;
            const isHovered = hoveredGroup === group.id;
            const color = GROUP_COLORS[group.id] || "#64748b";

            const totalGroups = sortedGroups.length;
            const middleIndex = (totalGroups - 1) / 2;
            const distanceFromMiddle = Math.abs(index - middleIndex);
            const xOffset = -distanceFromMiddle * 12;

            return (
              <div
                key={group.id}
                className="relative animate-in fade-in slide-in-from-left-4"
                style={{
                  marginLeft: 60 + xOffset,
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <button
                  onClick={() => {
                    setSelectedGroup(isSelected ? null : group.id);
                    setSelectedFolder(null);
                  }}
                  onMouseEnter={() => setHoveredGroup(group.id)}
                  onMouseLeave={() => setHoveredGroup(null)}
                  className={cn(
                    "relative px-6 py-3 rounded-full transition-all duration-500 text-left",
                    isSelected ? "bg-card border-2 shadow-xl scale-110" : "hover:bg-muted/50 hover:scale-105",
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
                      "relative text-lg font-semibold transition-all duration-300",
                      isSelected ? "text-foreground" : "text-muted-foreground",
                      isHovered && !isSelected && "text-foreground",
                    )}
                    style={{ color: isSelected ? color : undefined }}
                  >
                    {group.name}
                  </span>
                </button>

                {isSelected && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 flex items-center">
                    <div
                      className="w-20 h-1 rounded-full animate-in fade-in slide-in-from-left-4 duration-500"
                      style={{ background: `linear-gradient(to right, ${color}, transparent)` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Second arc SVG */}
        {selectedGroup && (
          <svg
            width="150"
            height="500"
            viewBox="0 0 150 500"
            className="relative -ml-6 shrink-0 animate-in fade-in slide-in-from-left-8 duration-700"
            style={{ marginTop: -30 }}
          >
            <defs>
              <linearGradient id="arc2Gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={activeColor} stopOpacity="0" />
                <stop offset="30%" stopColor={activeColor} stopOpacity="0.4" />
                <stop offset="50%" stopColor={activeColor} stopOpacity="0.6" />
                <stop offset="70%" stopColor={activeColor} stopOpacity="0.4" />
                <stop offset="100%" stopColor={activeColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M 10 20 Q 130 250 10 480"
              fill="none"
              stroke="url(#arc2Gradient)"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* ===== ARC 3: Folders & Direct Notes ===== */}
        <div
          className={cn(
            "relative -ml-8 z-20 shrink-0 transition-all duration-700",
            selectedGroup ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12 pointer-events-none",
          )}
        >
          <div className="relative h-[450px] overflow-hidden">
            {/* Fade gradients */}
            <div className="absolute top-0 left-0 right-0 h-20 z-10 pointer-events-none bg-gradient-to-b from-background to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-20 z-10 pointer-events-none bg-gradient-to-t from-background to-transparent" />

            <ScrollArea className="h-full px-2">
              <div className="py-16 space-y-2">
                {secondArcItems.map((entry, index) => {
                  const totalEntries = secondArcItems.length;
                  const middleIndex = (totalEntries - 1) / 2;
                  const distanceFromMiddle = Math.abs(index - middleIndex);
                  const xOffset = -distanceFromMiddle * 8;
                  const opacity = 1 - (distanceFromMiddle / Math.max(totalEntries, 1)) * 0.4;

                  if (entry.type === "folder") {
                    const folder = entry.data as NoteFolder;
                    const folderNotes = notes.filter((n) => n.folderId === folder.id);
                    const isFolderSelected = selectedFolder === folder.id;
                    const isFolderHovered = hoveredFolder === folder.id;

                    return (
                      <button
                        key={folder.id}
                        onClick={() => setSelectedFolder(isFolderSelected ? null : folder.id)}
                        onMouseEnter={() => setHoveredFolder(folder.id)}
                        onMouseLeave={() => setHoveredFolder(null)}
                        className={cn(
                          "flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300 w-full text-left",
                          isFolderSelected
                            ? "bg-cyan-500/20 border-2 border-cyan-500/50 shadow-lg scale-105"
                            : "bg-muted/40 hover:bg-muted/60 hover:scale-102 border-2 border-transparent",
                          isFolderHovered && !isFolderSelected && "shadow-md",
                        )}
                        style={{
                          marginLeft: 50 + xOffset,
                          opacity,
                          animationDelay: `${index * 50}ms`,
                        }}
                      >
                        <FolderOpen
                          className={cn(
                            "h-5 w-5 shrink-0 transition-colors duration-300",
                            isFolderSelected ? "text-cyan-500" : "text-cyan-400",
                          )}
                        />
                        <span
                          className={cn(
                            "text-base font-medium transition-colors duration-300",
                            isFolderSelected ? "text-foreground" : "text-foreground/80",
                          )}
                        >
                          {folder.name}
                        </span>
                        <span className="text-sm text-muted-foreground ml-auto">{folderNotes.length}</span>
                      </button>
                    );
                  }

                  const note = entry.data as Note;
                  return (
                    <button
                      key={note.id}
                      onClick={() => onNoteClick(note)}
                      className={cn(
                        "flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 text-left w-full",
                        "hover:bg-muted/50 hover:translate-x-2 hover:shadow-md",
                        selectedNoteId === note.id && "bg-primary/10 border-l-4 border-primary",
                      )}
                      style={{
                        marginLeft: 50 + xOffset,
                        opacity,
                      }}
                    >
                      <span className="text-base text-foreground">{note.title || "Untitled"}</span>
                    </button>
                  );
                })}

                {secondArcItems.length === 0 && (
                  <div className="text-base text-muted-foreground italic py-12 text-center" style={{ marginLeft: 50 }}>
                    <Sparkles className="h-6 w-6 mx-auto mb-2 opacity-40" />
                    No entries yet
                  </div>
                )}
              </div>
            </ScrollArea>

            {secondArcItems.length > 5 && (
              <>
                <ChevronUp className="absolute -top-1 left-1/2 -translate-x-1/2 h-5 w-5 text-muted-foreground/50 animate-bounce" />
                <ChevronDown className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-5 w-5 text-muted-foreground/50 animate-bounce" />
              </>
            )}
          </div>
        </div>

        {/* Third arc SVG - for folder notes */}
        {selectedFolder && (
          <svg
            width="120"
            height="400"
            viewBox="0 0 120 400"
            className="relative -ml-6 shrink-0 animate-in fade-in slide-in-from-left-8 duration-500"
            style={{ marginTop: -10 }}
          >
            <defs>
              <linearGradient id="arc3Gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
                <stop offset="30%" stopColor="#06b6d4" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.6" />
                <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M 10 20 Q 100 200 10 380"
              fill="none"
              stroke="url(#arc3Gradient)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* ===== ARC 4: Folder Notes ===== */}
        <div
          className={cn(
            "relative -ml-6 z-20 shrink-0 transition-all duration-500",
            selectedFolder ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8 pointer-events-none",
          )}
        >
          <div className="relative h-[380px] overflow-hidden min-w-[200px]">
            <div className="absolute top-0 left-0 right-0 h-16 z-10 pointer-events-none bg-gradient-to-b from-background to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-16 z-10 pointer-events-none bg-gradient-to-t from-background to-transparent" />

            <ScrollArea className="h-full px-2">
              <div className="py-12 space-y-2">
                {activeFolder && (
                  <div className="text-sm font-semibold text-cyan-500 uppercase tracking-wider mb-4 ml-8">
                    {activeFolder.name}
                  </div>
                )}

                {selectedFolderNotes.map((note, index) => {
                  const totalNotes = selectedFolderNotes.length;
                  const middleIndex = (totalNotes - 1) / 2;
                  const distanceFromMiddle = Math.abs(index - middleIndex);
                  const xOffset = -distanceFromMiddle * 6;
                  const opacity = 1 - (distanceFromMiddle / Math.max(totalNotes, 1)) * 0.3;

                  return (
                    <button
                      key={note.id}
                      onClick={() => onNoteClick(note)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 text-left w-full",
                        "hover:bg-cyan-500/10 hover:translate-x-2",
                        selectedNoteId === note.id && "bg-cyan-500/20 border-l-4 border-cyan-500",
                      )}
                      style={{
                        marginLeft: 30 + xOffset,
                        opacity,
                      }}
                    >
                      <span className="text-sm text-foreground">{note.title || "Untitled"}</span>
                    </button>
                  );
                })}

                {selectedFolderNotes.length === 0 && (
                  <div className="text-sm text-muted-foreground italic py-8 text-center ml-8">Empty folder</div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-sm text-muted-foreground bg-card/80 backdrop-blur-sm px-5 py-2.5 rounded-full border border-border/50 shadow-lg">
        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
        <span>Click categories & folders to explore • Scroll to see more</span>
      </div>
    </div>
  );
}
