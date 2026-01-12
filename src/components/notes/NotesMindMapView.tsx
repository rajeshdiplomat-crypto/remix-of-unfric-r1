import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { FileText, Plus, FolderOpen, ChevronDown, MoreHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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

// Futuristic color palette
const RING_COLORS = [
  { glow: "rgba(139, 92, 246, 0.3)", stroke: "#8b5cf6" }, // Violet
  { glow: "rgba(59, 130, 246, 0.3)", stroke: "#3b82f6" }, // Blue
  { glow: "rgba(20, 184, 166, 0.3)", stroke: "#14b8a6" }, // Teal
  { glow: "rgba(249, 115, 22, 0.3)", stroke: "#f97316" }, // Orange
];

const GROUP_GRADIENT_COLORS: Record<string, { from: string; to: string; glow: string }> = {
  inbox: { from: "#475569", to: "#64748b", glow: "rgba(100, 116, 139, 0.5)" },
  work: { from: "#3b82f6", to: "#60a5fa", glow: "rgba(59, 130, 246, 0.5)" },
  personal: { from: "#10b981", to: "#34d399", glow: "rgba(16, 185, 129, 0.5)" },
  wellness: { from: "#a855f7", to: "#c084fc", glow: "rgba(168, 85, 247, 0.5)" },
  hobby: { from: "#f97316", to: "#fb923c", glow: "rgba(249, 115, 22, 0.5)" },
};

export function NotesMindMapView({
  groups,
  folders,
  notes,
  selectedNoteId,
  onNoteClick,
  onAddNote,
  onAddFolder,
  onUpdateNote,
  onDeleteNote,
}: NotesMindMapViewProps) {
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const sortedGroups = useMemo(() => [...groups].sort((a, b) => a.sortOrder - b.sortOrder), [groups]);

  // Animation loop for pulsing effects
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Calculate positions for groups around center
  const groupPositions = useMemo(() => {
    const centerX = 50;
    const centerY = 50;
    const radius = 28;

    return sortedGroups.map((group, index) => {
      const angle = (index / sortedGroups.length) * 2 * Math.PI - Math.PI / 2;
      return {
        group,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        angle: (angle * 180) / Math.PI,
      };
    });
  }, [sortedGroups]);

  // Get notes and folders for a group
  const getGroupData = (groupId: string) => {
    const groupNotes = notes.filter((n) => n.groupId === groupId);
    const groupFolders = folders.filter((f) => f.groupId === groupId);
    return { notes: groupNotes, folders: groupFolders };
  };

  const getGroupColors = (groupId: string) => {
    return GROUP_GRADIENT_COLORS[groupId] || GROUP_GRADIENT_COLORS.inbox;
  };

  return (
    <div ref={containerRef} className="relative w-full h-[calc(100vh-280px)] min-h-[500px] overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-primary/30"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Main SVG canvas for the mind map */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Glow filters */}
          <filter id="glow-violet" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glow-strong" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradient for center */}
          <radialGradient id="center-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.8)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.4)" />
          </radialGradient>

          {/* Animated gradient for rings */}
          <linearGradient id="ring-gradient" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8b5cf6">
              <animate
                attributeName="stop-color"
                values="#8b5cf6;#3b82f6;#14b8a6;#8b5cf6"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#3b82f6">
              <animate
                attributeName="stop-color"
                values="#3b82f6;#14b8a6;#8b5cf6;#3b82f6"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        </defs>

        {/* Concentric rings with animation */}
        {[40, 32, 24, 16].map((radius, index) => (
          <g key={`ring-${index}`}>
            {/* Outer glow ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={RING_COLORS[index % RING_COLORS.length].glow}
              strokeWidth="2"
              opacity={0.3 + Math.sin(((animationPhase + index * 90) * Math.PI) / 180) * 0.2}
            />
            {/* Main ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={RING_COLORS[index % RING_COLORS.length].stroke}
              strokeWidth="0.3"
              strokeDasharray={index === 0 ? "2,2" : "1,3"}
              opacity={0.6}
              style={{
                transform: `rotate(${animationPhase * (index % 2 === 0 ? 0.2 : -0.2)}deg)`,
                transformOrigin: "50% 50%",
              }}
            />
          </g>
        ))}

        {/* Connection lines from center to groups */}
        {groupPositions.map(({ group, x, y }) => {
          const colors = getGroupColors(group.id);
          const isHovered = hoveredGroup === group.id;

          return (
            <g key={`connection-${group.id}`}>
              {/* Animated connection line */}
              <line
                x1="50"
                y1="50"
                x2={x}
                y2={y}
                stroke={`url(#ring-gradient)`}
                strokeWidth={isHovered ? "0.4" : "0.2"}
                opacity={isHovered ? 0.8 : 0.4}
                filter={isHovered ? "url(#glow-violet)" : undefined}
                className="transition-all duration-300"
              />

              {/* Traveling particle effect */}
              <circle r="0.5" fill={colors.from} opacity="0.8">
                <animateMotion
                  dur={`${3 + Math.random() * 2}s`}
                  repeatCount="indefinite"
                  path={`M 50,50 L ${x},${y}`}
                />
              </circle>
            </g>
          );
        })}

        {/* Center hub - "NOTES" */}
        <g filter="url(#glow-strong)" className="cursor-pointer">
          <circle
            cx="50"
            cy="50"
            r="8"
            fill="url(#center-gradient)"
            className="transition-transform duration-300 hover:scale-110"
            style={{ transformOrigin: "50% 50%" }}
          />
          <circle cx="50" cy="50" r="8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3" />
          {/* Inner glow pulse */}
          <circle
            cx="50"
            cy="50"
            r="6"
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="0.2"
            opacity={0.5 + Math.sin((animationPhase * Math.PI) / 45) * 0.3}
          />
        </g>

        {/* Text "NOTES" in center */}
        <text
          x="50"
          y="50.5"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-white font-bold text-[2.5px] uppercase tracking-widest pointer-events-none"
        >
          Notes
        </text>
      </svg>

      {/* Group nodes (as HTML for better interactivity) */}
      <div className="absolute inset-0 pointer-events-none">
        {groupPositions.map(({ group, x, y, angle }) => {
          const colors = getGroupColors(group.id);
          const isHovered = hoveredGroup === group.id;
          const isExpanded = expandedGroup === group.id;
          const { notes: groupNotes, folders: groupFolders } = getGroupData(group.id);
          const totalItems = groupNotes.length + groupFolders.length;

          return (
            <div
              key={group.id}
              className="absolute pointer-events-auto"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* Group node */}
              <div
                className={cn(
                  "relative cursor-pointer transition-all duration-500 ease-out",
                  isHovered && "scale-110",
                  isExpanded && "scale-110",
                )}
                onMouseEnter={() => setHoveredGroup(group.id)}
                onMouseLeave={() => !isExpanded && setHoveredGroup(null)}
                onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
              >
                {/* Outer glow ring */}
                <div
                  className={cn(
                    "absolute -inset-2 rounded-full blur-md transition-opacity duration-300",
                    isHovered || isExpanded ? "opacity-60" : "opacity-0",
                  )}
                  style={{ background: colors.glow }}
                />

                {/* Main group bubble */}
                <div
                  className={cn(
                    "relative px-4 py-2 rounded-xl border backdrop-blur-sm transition-all duration-300",
                    "shadow-lg hover:shadow-xl",
                    isExpanded ? "bg-card/95" : "bg-card/80",
                  )}
                  style={{
                    borderColor: colors.from,
                    boxShadow: isHovered ? `0 0 20px ${colors.glow}` : undefined,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
                    />
                    <span className="text-sm font-medium text-foreground whitespace-nowrap">{group.name}</span>
                    <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
                      {totalItems}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 text-muted-foreground transition-transform duration-300",
                        isExpanded && "rotate-180",
                      )}
                    />
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 z-50 animate-in fade-in slide-in-from-top-2 duration-300"
                    onMouseLeave={() => {
                      setExpandedGroup(null);
                      setHoveredGroup(null);
                    }}
                  >
                    <div
                      className="rounded-xl border bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden"
                      style={{ borderColor: colors.from }}
                    >
                      {/* Header with gradient */}
                      <div
                        className="px-4 py-3 border-b border-border/30"
                        style={{ background: `linear-gradient(135deg, ${colors.from}20, ${colors.to}10)` }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">{group.name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddNote(group.id, null);
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Folders */}
                      {groupFolders.length > 0 && (
                        <div className="border-b border-border/20">
                          {groupFolders.map((folder) => {
                            const folderNotes = notes.filter((n) => n.folderId === folder.id);
                            return (
                              <div key={folder.id} className="px-3 py-2 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-2 text-xs">
                                  <FolderOpen className="h-3.5 w-3.5 text-cyan-500" />
                                  <span className="font-medium">{folder.name}</span>
                                  <span className="text-muted-foreground ml-auto">{folderNotes.length}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Notes */}
                      <div className="max-h-48 overflow-y-auto">
                        {groupNotes
                          .filter((n) => !n.folderId)
                          .slice(0, 8)
                          .map((note) => (
                            <div
                              key={note.id}
                              className={cn(
                                "px-3 py-2 cursor-pointer transition-all duration-200",
                                "hover:bg-muted/40 border-l-2 border-transparent hover:border-primary/50",
                                selectedNoteId === note.id && "bg-primary/10 border-l-primary",
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                onNoteClick(note);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-xs text-foreground truncate">{note.title || "Untitled"}</span>
                              </div>
                            </div>
                          ))}
                        {groupNotes.filter((n) => !n.folderId).length > 8 && (
                          <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                            +{groupNotes.filter((n) => !n.folderId).length - 8} more notes
                          </div>
                        )}
                        {groupNotes.length === 0 && groupFolders.length === 0 && (
                          <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                            <Sparkles className="h-4 w-4 mx-auto mb-1 opacity-50" />
                            No notes yet
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating action buttons */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-card/90 backdrop-blur-md rounded-full border border-border/50 px-4 py-2 shadow-lg">
        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
        <span className="text-xs text-muted-foreground">Click a category to explore</span>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-primary/20 rounded-tl-xl" />
      <div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-primary/20 rounded-tr-xl" />
      <div className="absolute bottom-16 left-4 w-16 h-16 border-l-2 border-b-2 border-primary/20 rounded-bl-xl" />
      <div className="absolute bottom-16 right-4 w-16 h-16 border-r-2 border-b-2 border-primary/20 rounded-br-xl" />
    </div>
  );
}
