import { useState, useMemo, useRef, useEffect } from "react";
import { FolderOpen, Sparkles, ChevronUp, ChevronDown, MoreHorizontal, Plus, Pencil, Trash2 } from "lucide-react";
import type { Note, NoteGroup, NoteFolder } from "@/pages/Notes";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  onDeleteFolder?: (folderId: string) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
}

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
  onAddFolder,
  onDeleteNote,
  onDeleteFolder,
  onRenameFolder,
}: NotesMindMapViewProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });

  // Scroll offsets for each arc
  const [arc1Scroll, setArc1Scroll] = useState(0);
  const [arc2Scroll, setArc2Scroll] = useState(0);
  const [arc3Scroll, setArc3Scroll] = useState(0);

  // Track which arc is focused for scrolling (requires click first)
  const [focusedArc, setFocusedArc] = useState<1 | 2 | 3 | null>(null);

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

  // Reset scroll when selection changes
  useEffect(() => {
    setArc2Scroll(0);
  }, [selectedGroup]);

  useEffect(() => {
    setArc3Scroll(0);
  }, [selectedFolder]);

  // Arc center (left side of screen)
  const arcCenterX = 100;
  const arcCenterY = dimensions.height / 2;

  // Arc radii for semi-circles - use full width
  const arc1Radius = Math.min(250, dimensions.height * 0.4);
  const arc2Radius = Math.min(550, dimensions.height * 0.75);
  const arc3Radius = Math.min(850, dimensions.height * 1.1);

  // Max visible items per arc - outer arcs can show more
  const arc1MaxItems = 8;
  const arc2MaxItems = 10;
  const arc3MaxItems = 12;

  // Calculate safe angle spread based on container height - add padding from edges
  const edgePadding = 60; // pixels from top/bottom
  const safeHeight = dimensions.height - edgePadding * 2;
  // Calculate max angle that keeps items within bounds for each arc
  const getSafeMaxAngle = (radius: number) => {
    const maxY = safeHeight / 2;
    const safeAngle = Math.asin(Math.min(maxY / radius, 1)) * (180 / Math.PI);
    return Math.min(75, safeAngle); // cap at 75 degrees
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

  // Prevent page scroll and handle arc scrolling when focused - uses native listener for passive:false
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (focusedArc === null) return;

      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY > 0 ? 1 : -1;

      if (focusedArc === 1) {
        setArc1Scroll((prev) => {
          const max = Math.max(0, sortedGroups.length - arc1MaxItems);
          return Math.max(0, Math.min(max, prev + delta));
        });
      } else if (focusedArc === 2) {
        setArc2Scroll((prev) => {
          const max = Math.max(0, arc2Items.length - arc2MaxItems);
          return Math.max(0, Math.min(max, prev + delta));
        });
      } else if (focusedArc === 3) {
        setArc3Scroll((prev) => {
          const max = Math.max(0, selectedFolderNotes.length - arc3MaxItems);
          return Math.max(0, Math.min(max, prev + delta));
        });
      }
    };

    // Add with passive: false to allow preventDefault
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [
    focusedArc,
    sortedGroups.length,
    arc2Items.length,
    selectedFolderNotes.length,
    arc1MaxItems,
    arc2MaxItems,
    arc3MaxItems,
  ]);

  // Get visible items with scroll
  const getVisibleItems = <T,>(items: T[], scrollOffset: number, maxVisible: number): T[] => {
    const start = scrollOffset;
    const end = Math.min(start + maxVisible, items.length);
    return items.slice(start, end);
  };

  // Visible items for each arc
  const visibleGroups = getVisibleItems(sortedGroups, arc1Scroll, arc1MaxItems);
  const visibleArc2Items = getVisibleItems(arc2Items, arc2Scroll, arc2MaxItems);
  const visibleFolderNotes = getVisibleItems(selectedFolderNotes, arc3Scroll, arc3MaxItems);

  // Calculate position on semi-circle
  const getSemiCirclePosition = (index: number, total: number, radius: number) => {
    // Calculate safe max angle for this radius
    const safeMaxAngle = getSafeMaxAngle(radius);

    // Reduce angle spread for small item counts to keep them visible
    const maxSpread = safeMaxAngle; // use safe angle based on container
    const minSpread = 20; // degrees for single/few items
    const spreadDegrees = total <= 2 ? minSpread : Math.min(maxSpread, minSpread + (total - 1) * 7);

    const startAngle = -spreadDegrees * (Math.PI / 180);
    const endAngle = spreadDegrees * (Math.PI / 180);
    const angleRange = endAngle - startAngle;

    // For single item, center it
    const angle = total === 1 ? 0 : startAngle + (index / Math.max(total - 1, 1)) * angleRange;

    return {
      x: arcCenterX + radius * Math.cos(angle),
      y: arcCenterY + radius * Math.sin(angle),
    };
  };

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
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
  };

  // Use safe angles for arc paths
  const safeArc1Angle = (getSafeMaxAngle(arc1Radius) * Math.PI) / 180;
  const safeArc2Angle = (getSafeMaxAngle(arc2Radius) * Math.PI) / 180;
  const safeArc3Angle = (getSafeMaxAngle(arc3Radius) * Math.PI) / 180;

  const arc1Path = createArcPath(arc1Radius, -safeArc1Angle, safeArc1Angle);
  const arc2Path = createArcPath(arc2Radius, -safeArc2Angle, safeArc2Angle);
  const arc3Path = createArcPath(arc3Radius, -safeArc3Angle, safeArc3Angle);

  // Handler to prevent page scroll when any arc is focused
  const handleContainerWheel = (e: React.WheelEvent) => {
    if (focusedArc !== null) {
      e.preventDefault();
    }
  };

  // Scroll controls component
  const ScrollControls = ({
    onScrollUp,
    onScrollDown,
    canScrollUp,
    canScrollDown,
    posX,
    radius,
  }: {
    onScrollUp: () => void;
    onScrollDown: () => void;
    canScrollUp: boolean;
    canScrollDown: boolean;
    posX: number;
    radius: number;
  }) => {
    const topPos = getSemiCirclePosition(0, 1, radius);
    const bottomPos = getSemiCirclePosition(1, 2, radius);

    return (
      <>
        {canScrollUp && (
          <button
            onClick={onScrollUp}
            className="absolute z-30 p-1.5 rounded-full bg-card/90 border border-border shadow-md hover:bg-muted hover:scale-110 transition-all"
            style={{
              left: posX,
              top: arcCenterY - radius - 30,
              transform: "translate(-50%, 0)",
            }}
          >
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
        {canScrollDown && (
          <button
            onClick={onScrollDown}
            className="absolute z-30 p-1.5 rounded-full bg-card/90 border border-border shadow-md hover:bg-muted hover:scale-110 transition-all"
            style={{
              left: posX,
              top: arcCenterY + radius + 10,
              transform: "translate(-50%, 0)",
            }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-180px)] min-h-[700px] overflow-hidden"
      onWheel={handleContainerWheel}
    >
      {/* SVG for visual arcs - low z-index (behind items) */}
      <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
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

        {/* Arc 1 - visible stroke */}
        <path d={arc1Path} fill="none" stroke="currentColor" strokeWidth="3" className="text-border" />
        <path d={arc1Path} fill="none" stroke="url(#arcGrad1)" strokeWidth="8" opacity="0.5" />

        {/* Arc 2 - visible stroke */}
        {selectedGroup && (
          <path
            d={arc2Path}
            fill="none"
            stroke="url(#arcGrad2)"
            strokeWidth="4"
            className="animate-in fade-in duration-500"
          />
        )}

        {/* Arc 3 - visible stroke */}
        {selectedFolder && (
          <path
            d={arc3Path}
            fill="none"
            stroke="url(#arcGrad3)"
            strokeWidth="3"
            className="animate-in fade-in duration-500"
          />
        )}
      </svg>

      {/* SVG for clickable arc zones - high z-index but pointer-events only on paths */}
      <svg className="absolute inset-0 w-full h-full z-30 pointer-events-none">
        {/* Arc 1 - clickable zone */}
        <path
          d={arc1Path}
          fill="none"
          stroke={focusedArc === 1 ? "rgba(59, 130, 246, 0.25)" : "transparent"}
          strokeWidth="40"
          className="cursor-pointer hover:stroke-primary/15 transition-all duration-200"
          style={{
            pointerEvents: "auto",
            filter: focusedArc === 1 ? "drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))" : "none",
          }}
          onClick={() => setFocusedArc(focusedArc === 1 ? null : 1)}
        />

        {/* Arc 2 - clickable zone */}
        {selectedGroup && (
          <path
            d={arc2Path}
            fill="none"
            stroke={focusedArc === 2 ? "rgba(59, 130, 246, 0.25)" : "transparent"}
            strokeWidth="40"
            className="cursor-pointer hover:stroke-primary/15 transition-all duration-200"
            style={{
              pointerEvents: "auto",
              filter: focusedArc === 2 ? "drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))" : "none",
            }}
            onClick={() => setFocusedArc(focusedArc === 2 ? null : 2)}
          />
        )}

        {/* Arc 3 - clickable zone */}
        {selectedFolder && (
          <path
            d={arc3Path}
            fill="none"
            stroke={focusedArc === 3 ? "rgba(6, 182, 212, 0.25)" : "transparent"}
            strokeWidth="40"
            className="cursor-pointer hover:stroke-cyan-500/15 transition-all duration-200"
            style={{
              pointerEvents: "auto",
              filter: focusedArc === 3 ? "drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))" : "none",
            }}
            onClick={() => setFocusedArc(focusedArc === 3 ? null : 3)}
          />
        )}
      </svg>

      {/* NOTES Hub with Quick Add */}
      <div
        className="absolute group cursor-pointer z-20"
        style={{ left: arcCenterX, top: arcCenterY, transform: "translate(-50%, -50%)" }}
      >
        <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative px-6 py-4 rounded-full bg-card border-2 border-primary/40 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <span className="text-lg font-bold text-foreground uppercase tracking-wider">Notes</span>
        </div>
      </div>

      {/* Quick Add Note Panel - shows groups and sections when group selected */}
      <div
        className="absolute z-50 flex flex-col gap-2 p-3 bg-card/95 backdrop-blur-sm rounded-xl border border-border shadow-lg max-w-[280px]"
        style={{ right: 20, top: 20 }}
      >
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick Add to Group</span>
        <div className="flex flex-wrap gap-1.5">
          {sortedGroups.slice(0, 6).map((group) => {
            const color = GROUP_COLORS[group.id] || "#64748b";
            const isActive = selectedGroup === group.id;
            return (
              <button
                key={group.id}
                onClick={() => onAddNote(group.id, null)}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors border",
                  isActive
                    ? "bg-primary/10 border-primary/30"
                    : "bg-muted/50 hover:bg-muted border-transparent hover:border-border",
                )}
                style={{ color }}
                title={`Add note to ${group.name}`}
              >
                <Plus className="h-3 w-3" />
                {group.name}
              </button>
            );
          })}
        </div>

        {/* Show sections when a group is selected */}
        {selectedGroup && selectedGroupData.folders.length > 0 && (
          <>
            <div className="border-t border-border/50 pt-2 mt-1">
              <span className="text-xs font-medium text-cyan-500 uppercase tracking-wide">
                Sections in {activeGroup?.name}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedGroupData.folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => onAddNote(selectedGroup, folder.id)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors border border-cyan-400/30 hover:border-cyan-400/60 text-cyan-600"
                  title={`Add note to ${folder.name}`}
                >
                  <Plus className="h-3 w-3" />
                  {folder.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Arc 1 - Groups (Scrollable) */}
      <ScrollControls
        onScrollUp={() => setArc1Scroll(Math.max(0, arc1Scroll - 1))}
        onScrollDown={() => setArc1Scroll(Math.min(sortedGroups.length - arc1MaxItems, arc1Scroll + 1))}
        canScrollUp={arc1Scroll > 0}
        canScrollDown={arc1Scroll < sortedGroups.length - arc1MaxItems}
        posX={arcCenterX + arc1Radius * 0.7}
        radius={arc1Radius * 0.85}
      />

      {visibleGroups.map((group, index) => {
        const pos = getSemiCirclePosition(index, Math.min(visibleGroups.length, arc1MaxItems), arc1Radius);
        const isSelected = selectedGroup === group.id;
        const isHovered = hoveredItem === `group-${group.id}`;
        const color = GROUP_COLORS[group.id] || "#64748b";

        return (
          <div
            key={group.id}
            className="absolute z-40 transition-all duration-300 ease-out"
            style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -50%)" }}
          >
            <div className="flex items-center gap-1">
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
                    "relative text-sm font-semibold",
                    isSelected || isHovered ? "text-foreground" : "text-muted-foreground",
                  )}
                  style={{ color: isSelected ? color : undefined }}
                >
                  {group.name}
                </span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 rounded hover:bg-muted transition-colors">
                    <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-36">
                  <DropdownMenuItem onClick={() => onAddNote(group.id, null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const folderName = window.prompt("New folder name:");
                      if (folderName) onAddFolder(group.id, folderName);
                    }}
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Add Folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}

      {/* Arc 2 - Entries (Scrollable) */}
      {selectedGroup && (
        <ScrollControls
          onScrollUp={() => setArc2Scroll(Math.max(0, arc2Scroll - 1))}
          onScrollDown={() => setArc2Scroll(Math.min(arc2Items.length - arc2MaxItems, arc2Scroll + 1))}
          canScrollUp={arc2Scroll > 0}
          canScrollDown={arc2Scroll < arc2Items.length - arc2MaxItems}
          posX={arcCenterX + arc2Radius * 0.7}
          radius={arc2Radius * 0.85}
        />
      )}

      {selectedGroup &&
        visibleArc2Items.map((entry, index) => {
          const pos = getSemiCirclePosition(index, Math.min(visibleArc2Items.length, arc2MaxItems), arc2Radius);
          const isFolder = entry.type === "folder";
          const isSelected = isFolder && selectedFolder === entry.id;

          if (isFolder) {
            const folder = entry.data as NoteFolder;
            const folderNotes = notes.filter((n) => n.folderId === folder.id);
            return (
              <div
                key={entry.id}
                className="absolute z-40 transition-all duration-300 ease-out animate-in fade-in"
                style={{ left: pos.x, top: pos.y, transform: "translate(0, -50%)" }}
              >
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFolder(isSelected ? null : folder.id);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300",
                      isSelected
                        ? "bg-cyan-500/20 border-2 border-cyan-400 shadow-lg"
                        : "bg-card/90 hover:bg-card hover:shadow-md border border-border/50",
                    )}
                  >
                    <FolderOpen className={cn("h-4 w-4", isSelected ? "text-cyan-500" : "text-cyan-400")} />
                    <span className="text-sm font-medium text-foreground text-left">{folder.name}</span>
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                      {folderNotes.length}
                    </span>
                  </button>
                  {/* Quick add to section */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddNote(folder.groupId, folder.id);
                    }}
                    className="p-1.5 rounded-md bg-card/80 hover:bg-cyan-500/20 border border-border/50 hover:border-cyan-400 transition-all"
                    title={`Add note to ${folder.name}`}
                  >
                    <Plus className="h-3 w-3 text-cyan-500" />
                  </button>
                  {/* Section menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded hover:bg-muted transition-colors">
                        <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-40">
                      <DropdownMenuItem onClick={() => onAddNote(folder.groupId, folder.id)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Note
                      </DropdownMenuItem>
                      {onRenameFolder && (
                        <DropdownMenuItem
                          onClick={() => {
                            const newName = window.prompt("Rename section:", folder.name);
                            if (newName && newName !== folder.name) onRenameFolder(folder.id, newName);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                      )}
                      {onDeleteFolder && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              if (window.confirm(`Delete section "${folder.name}"? Notes inside will be moved out.`)) {
                                onDeleteFolder(folder.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          }

          const note = entry.data as Note;
          // Check if note was created today (new note indicator)
          const today = new Date().toDateString();
          const isNew = note.createdAt && new Date(note.createdAt).toDateString() === today;
          // Format date/time
          const noteDate = note.updatedAt ? new Date(note.updatedAt) : new Date();
          const dateStr = noteDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const timeStr = noteDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
          // Get group info
          const noteGroup = groups.find((g) => g.id === note.groupId);
          const groupColor = noteGroup ? GROUP_COLORS[noteGroup.id] || "#64748b" : "#64748b";
          return (
            <div
              key={entry.id}
              className="absolute z-40 transition-all duration-300 ease-out animate-in fade-in"
              style={{ left: pos.x, top: pos.y, transform: "translate(0, -50%)" }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNoteClick(note);
                }}
                className={cn(
                  "flex flex-col items-start gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-300 bg-card/90 hover:bg-card hover:shadow-md border border-border/50 text-left",
                  selectedNoteId === note.id && "bg-primary/15 border-primary",
                )}
              >
                <div className="flex items-center gap-2">
                  {isNew && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="New" />}
                  <span className="text-sm text-foreground">{note.title || "Untitled"}</span>
                </div>
                <div className="flex items-center gap-2">
                  {noteGroup && (
                    <span className="text-[10px] font-medium" style={{ color: groupColor }}>
                      {noteGroup.name}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {dateStr} • {timeStr}
                  </span>
                </div>
              </button>
            </div>
          );
        })}

      {/* Arc 3 - Folder Notes (Scrollable) */}
      {selectedFolder && (
        <ScrollControls
          onScrollUp={() => setArc3Scroll(Math.max(0, arc3Scroll - 1))}
          onScrollDown={() => setArc3Scroll(Math.min(selectedFolderNotes.length - arc3MaxItems, arc3Scroll + 1))}
          canScrollUp={arc3Scroll > 0}
          canScrollDown={arc3Scroll < selectedFolderNotes.length - arc3MaxItems}
          posX={arcCenterX + arc3Radius * 0.7}
          radius={arc3Radius * 0.8}
        />
      )}

      {selectedFolder &&
        visibleFolderNotes.map((note, index) => {
          const pos = getSemiCirclePosition(index, Math.min(visibleFolderNotes.length, arc3MaxItems), arc3Radius);
          // Check if note was created today (new note indicator)
          const today = new Date().toDateString();
          const isNew = note.createdAt && new Date(note.createdAt).toDateString() === today;
          // Format date/time
          const noteDate = note.updatedAt ? new Date(note.updatedAt) : new Date();
          const dateStr = noteDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const timeStr = noteDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
          // Get folder info
          const noteFolder = folders.find((f) => f.id === note.folderId);
          return (
            <div
              key={note.id}
              className="absolute z-40 transition-all duration-300 ease-out animate-in fade-in"
              style={{ left: pos.x, top: pos.y, transform: "translate(0, -50%)" }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNoteClick(note);
                }}
                className={cn(
                  "flex flex-col items-start gap-0.5 px-3 py-1.5 rounded-md transition-all duration-300 bg-card/90 hover:bg-card hover:shadow-md border border-cyan-300/50 text-left",
                  selectedNoteId === note.id && "bg-cyan-500/20 border-cyan-400",
                )}
              >
                <div className="flex items-center gap-2">
                  {isNew && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="New" />}
                  <span className="text-xs text-foreground">{note.title || "Untitled"}</span>
                </div>
                <div className="flex items-center gap-2">
                  {noteFolder && <span className="text-[10px] font-medium text-cyan-500">{noteFolder.name}</span>}
                  <span className="text-[10px] text-muted-foreground">
                    {dateStr} • {timeStr}
                  </span>
                </div>
              </button>
            </div>
          );
        })}

      {/* Empty states */}
      {selectedGroup && arc2Items.length === 0 && (
        <div
          className="absolute flex flex-col items-center gap-2 text-muted-foreground animate-in fade-in z-40"
          style={{ left: arcCenterX + arc2Radius, top: arcCenterY, transform: "translate(-50%, -50%)" }}
        >
          <Sparkles className="h-4 w-4 opacity-50" />
          <span className="text-xs italic">No entries</span>
        </div>
      )}

      {/* Bottom hint with scroll status */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-muted-foreground bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50 shadow-sm z-40">
        <Sparkles className="h-3 w-3 text-primary animate-pulse" />
        {focusedArc ? (
          <span className="text-primary font-medium">
            Arc {focusedArc} focused • Scroll with mouse wheel • Click arc again to unfocus
          </span>
        ) : (
          <span>Click groups • Click folders • Click arc lines to enable scrolling</span>
        )}
      </div>
    </div>
  );
}
