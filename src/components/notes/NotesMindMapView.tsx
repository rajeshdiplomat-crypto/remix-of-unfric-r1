import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  FileText,
  Search,
  Plus,
  FolderOpen,
  ChevronRight,
  ChevronLeft,
  X,
  MoreHorizontal,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import type { Note, NoteGroup, NoteFolder } from "@/pages/Notes";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

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

// Color presets for groups
const GROUP_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  inbox: {
    bg: "bg-slate-100 dark:bg-slate-800",
    border: "border-slate-300 dark:border-slate-600",
    text: "text-slate-700 dark:text-slate-300",
  },
  work: {
    bg: "bg-blue-50 dark:bg-blue-950",
    border: "border-blue-300 dark:border-blue-700",
    text: "text-blue-700 dark:text-blue-300",
  },
  personal: {
    bg: "bg-emerald-50 dark:bg-emerald-950",
    border: "border-emerald-300 dark:border-emerald-700",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  wellness: {
    bg: "bg-purple-50 dark:bg-purple-950",
    border: "border-purple-300 dark:border-purple-700",
    text: "text-purple-700 dark:text-purple-300",
  },
  hobby: {
    bg: "bg-orange-50 dark:bg-orange-950",
    border: "border-orange-300 dark:border-orange-700",
    text: "text-orange-700 dark:text-orange-300",
  },
};

const DEFAULT_COLORS = { bg: "bg-muted", border: "border-border", text: "text-foreground" };

interface TreeNode {
  id: string;
  label: string;
  type: "root" | "group" | "folder" | "note";
  color?: string;
  children?: TreeNode[];
  data?: Note | NoteGroup | NoteFolder;
}

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
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["root"]));
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const sortedGroups = useMemo(() => [...groups].sort((a, b) => a.sortOrder - b.sortOrder), [groups]);

  // Build tree structure
  const treeData = useMemo((): TreeNode => {
    const root: TreeNode = {
      id: "root",
      label: "Notes",
      type: "root",
      children: sortedGroups.map((group) => {
        const groupNotes = notes.filter((n) => n.groupId === group.id);
        const groupFolders = folders.filter((f) => f.groupId === group.id);

        return {
          id: `group-${group.id}`,
          label: group.name,
          type: "group" as const,
          color: group.color,
          data: group,
          children: [
            // Folders with their notes
            ...groupFolders.map((folder) => ({
              id: `folder-${folder.id}`,
              label: folder.name,
              type: "folder" as const,
              data: folder,
              children: notes
                .filter((n) => n.folderId === folder.id)
                .map((note) => ({
                  id: `note-${note.id}`,
                  label: note.title || "Untitled",
                  type: "note" as const,
                  data: note,
                })),
            })),
            // Direct notes (no folder)
            ...groupNotes
              .filter((n) => !n.folderId)
              .map((note) => ({
                id: `note-${note.id}`,
                label: note.title || "Untitled",
                type: "note" as const,
                data: note,
              })),
          ],
        };
      }),
    };
    return root;
  }, [sortedGroups, folders, notes]);

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleNodeClick = useCallback(
    (node: TreeNode) => {
      setSelectedNode(node.id);
      if (node.type === "note" && node.data) {
        onNoteClick(node.data as Note);
      } else if (node.type === "group" || node.type === "folder" || node.type === "root") {
        toggleNode(node.id);
      }
    },
    [onNoteClick, toggleNode],
  );

  const getNodeColors = (node: TreeNode) => {
    if (node.type === "root") {
      return { bg: "bg-primary/10", border: "border-primary/30", text: "text-primary" };
    }
    if (node.type === "group" && node.data) {
      const groupId = (node.data as NoteGroup).id;
      return GROUP_COLORS[groupId] || DEFAULT_COLORS;
    }
    if (node.type === "folder") {
      return {
        bg: "bg-cyan-50 dark:bg-cyan-950",
        border: "border-cyan-300 dark:border-cyan-700",
        text: "text-cyan-700 dark:text-cyan-300",
      };
    }
    return { bg: "bg-card", border: "border-border/50", text: "text-foreground" };
  };

  const hasChildren = (node: TreeNode) => node.children && node.children.length > 0;
  const isExpanded = (nodeId: string) => expandedNodes.has(nodeId);

  // Render a single node with its children
  const renderNode = (node: TreeNode, level: number = 0, isLast: boolean = true, parentExpanded: boolean = true) => {
    const colors = getNodeColors(node);
    const expanded = isExpanded(node.id);
    const hasKids = hasChildren(node);
    const isSelected = selectedNode === node.id;
    const isHovered = hoveredNode === node.id;

    return (
      <div key={node.id} className={cn("relative", level > 0 && "ml-8")}>
        {/* Connection line from parent */}
        {level > 0 && (
          <div className="absolute left-[-32px] top-0 bottom-0 pointer-events-none">
            {/* Horizontal connector */}
            <div className="absolute left-0 top-5 w-8 h-px bg-border/60" />
            {/* Vertical line */}
            {!isLast && <div className="absolute left-0 top-5 bottom-0 w-px bg-border/60" />}
          </div>
        )}

        {/* Node itself */}
        <div
          className={cn(
            "relative inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all duration-300 group my-1.5",
            colors.bg,
            colors.border,
            isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
            isHovered && !isSelected && "shadow-md scale-[1.02]",
          )}
          onClick={() => handleNodeClick(node)}
          onMouseEnter={() => setHoveredNode(node.id)}
          onMouseLeave={() => setHoveredNode(null)}
        >
          {/* Expand/Collapse button */}
          {hasKids && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className={cn(
                "w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200",
                "bg-background/80 hover:bg-background border border-border/50",
                expanded ? "rotate-0" : "-rotate-90",
              )}
            >
              {expanded ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          )}

          {/* Icon based on type */}
          {node.type === "folder" && <FolderOpen className="h-4 w-4 text-muted-foreground" />}
          {node.type === "note" && <FileText className="h-4 w-4 text-muted-foreground" />}

          {/* Label */}
          <span className={cn("text-sm font-medium whitespace-nowrap max-w-[200px] truncate", colors.text)}>
            {node.label}
          </span>

          {/* Count badge for groups/folders */}
          {(node.type === "group" || node.type === "folder" || node.type === "root") && hasKids && (
            <span className="text-xs text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded-md ml-1">
              {node.children?.length}
            </span>
          )}

          {/* Note timestamp */}
          {node.type === "note" && node.data && (
            <span className="text-[10px] text-muted-foreground/70 ml-2">
              {formatDistanceToNow(new Date((node.data as Note).updatedAt), { addSuffix: true })}
            </span>
          )}

          {/* Three-dot menu for notes */}
          {node.type === "note" && node.data && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted/50 rounded-md transition-opacity ml-1">
                  <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuLabel>Note Options</DropdownMenuLabel>
                {onUpdateNote && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ArrowRight className="h-3 w-3 mr-2" />
                      Change Group
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="rounded-xl">
                      {sortedGroups
                        .filter((g) => g.id !== (node.data as Note).groupId)
                        .map((g) => (
                          <DropdownMenuItem
                            key={g.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateNote({ ...(node.data as Note), groupId: g.id, folderId: null });
                            }}
                            className="rounded-lg"
                          >
                            <span className="w-2 h-2 rounded-full mr-2" style={{ background: g.color }} />
                            {g.name}
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}
                <DropdownMenuSeparator />
                {onDeleteNote && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNote((node.data as Note).id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Add button for groups */}
          {node.type === "group" && node.data && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddNote((node.data as NoteGroup).id, null);
              }}
              className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md flex items-center justify-center bg-primary/10 hover:bg-primary/20 transition-opacity ml-1"
              title="Add note"
            >
              <Plus className="h-3 w-3 text-primary" />
            </button>
          )}
        </div>

        {/* Children with animation */}
        {hasKids && (
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-out",
              expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0",
            )}
          >
            <div className="pl-4 border-l border-border/40 ml-2">
              {node.children?.map((child, idx) =>
                renderNode(child, level + 1, idx === (node.children?.length ?? 0) - 1, expanded),
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full relative">
      {/* Dotted Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--muted-foreground) / 0.1) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Mind Map Content - Full page */}
      <div className="p-6 pb-24">
        {/* Title */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Mind Map View</h2>
            <p className="text-sm text-muted-foreground">Click nodes to expand or view notes</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary/50" /> Groups
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-cyan-500/50" /> Folders
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/50" /> Notes
            </span>
          </div>
        </div>

        {/* Tree Visualization */}
        <div className="inline-block min-w-max">{renderNode(treeData)}</div>
      </div>

      {/* Quick Actions Footer */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-card/90 backdrop-blur-md rounded-md border border-border/50 px-4 py-2 shadow-lg z-50">
        <span className="text-xs text-muted-foreground">
          {notes.length} notes across {groups.length} groups
        </span>
        <div className="w-px h-4 bg-border/50" />
        <Button
          size="sm"
          variant="ghost"
          className="h-7 rounded-md text-xs uppercase tracking-wide"
          onClick={() => setExpandedNodes(new Set(["root"]))}
        >
          Collapse All
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 rounded-md text-xs uppercase tracking-wide"
          onClick={() => {
            const allIds = new Set<string>(["root"]);
            const addNodeIds = (node: TreeNode) => {
              allIds.add(node.id);
              node.children?.forEach(addNodeIds);
            };
            addNodeIds(treeData);
            setExpandedNodes(allIds);
          }}
        >
          Expand All
        </Button>
      </div>
    </div>
  );
}
