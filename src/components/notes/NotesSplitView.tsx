import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, X, Trash2, ChevronRight, FileText, Folder, FolderOpen, ChevronDown, Maximize2, Check, PanelLeftClose, PanelLeft } from "lucide-react";
import { NotesRichEditor } from "./NotesRichEditor";
import { NotesActivityDot, getMostRecentUpdate } from "./NotesActivityDot";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Note, NoteGroup, NoteFolder } from "@/pages/Notes";

interface NotesSplitViewProps {
  notes: Note[];
  groups: NoteGroup[];
  folders: NoteFolder[];
  selectedNote: Note | null;
  onSelectNote: (note: Note | null) => void;
  onSaveNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onBack: () => void;
  onCreateNote: () => void;
  className?: string;
}

export function NotesSplitView({
  notes,
  groups,
  folders,
  selectedNote,
  onSelectNote,
  onSaveNote,
  onDeleteNote,
  onBack,
  onCreateNote,
  className,
}: NotesSplitViewProps) {
  const { toast } = useToast();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isFullPage, setIsFullPage] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  
  // Focus mode state - track which groups/folders were expanded before editing
  const [preEditExpandedState, setPreEditExpandedState] = useState<{
    groups: Set<string>;
    folders: Set<string>;
  } | null>(null);
  
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  // Track if note was just created (for confirmation message)
  const [isNewNote, setIsNewNote] = useState(false);
  const prevNoteId = useRef<string | null>(null);

  // Enter focus mode when a note is selected
  useEffect(() => {
    if (selectedNote) {
      // Save current expansion state before entering focus mode
      if (!preEditExpandedState) {
        setPreEditExpandedState({
          groups: new Set(expandedGroups),
          folders: new Set(expandedFolders),
        });
      }
      
      // Focus mode: only show current note's group expanded
      setExpandedGroups(new Set([selectedNote.groupId]));
      if (selectedNote.folderId) {
        setExpandedFolders(new Set([selectedNote.folderId]));
      } else {
        setExpandedFolders(new Set());
      }
      
      // Check if this is a new note (different ID, empty title)
      if (prevNoteId.current !== selectedNote.id && !selectedNote.title) {
        setIsNewNote(true);
      } else {
        setIsNewNote(false);
      }
      prevNoteId.current = selectedNote.id;
    }
  }, [selectedNote?.id]);

  // Show creation confirmation toast
  useEffect(() => {
    if (isNewNote && selectedNote) {
      const groupName = groups.find(g => g.id === selectedNote.groupId)?.name || "Unknown";
      const folderName = selectedNote.folderId 
        ? folders.find(f => f.id === selectedNote.folderId)?.name 
        : null;
      
      const location = folderName ? `${groupName} › ${folderName}` : groupName;
      
      toast({
        title: `Note created in ${location}`,
        duration: 3000,
      });
      setIsNewNote(false);
    }
  }, [isNewNote, selectedNote]);

  const getGroupColor = (groupId: string) => {
    return groups.find((g) => g.id === groupId)?.color || "hsl(215, 20%, 65%)";
  };

  const handleSave = (note: Note) => {
    onSaveNote(note);
    setLastSaved(new Date());
  };

  const handleBack = () => {
    // Restore pre-edit expansion state
    if (preEditExpandedState) {
      setExpandedGroups(preEditExpandedState.groups);
      setExpandedFolders(preEditExpandedState.folders);
      setPreEditExpandedState(null);
    }
    onBack();
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Sort groups by sortOrder
  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);

  // Determine if we're in focus mode
  const isInFocusMode = !!selectedNote;

  // Escape key to exit full page mode
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullPage) setIsFullPage(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isFullPage]);

  // Full page mode
  if (isFullPage && selectedNote) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-background isolate overflow-hidden">
        {/* Minimal header */}
        <div className="flex items-center justify-between px-8 py-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              style={{
                backgroundColor: `${getGroupColor(selectedNote.groupId)}20`,
                color: getGroupColor(selectedNote.groupId),
              }}
            >
              {groups.find((g) => g.id === selectedNote.groupId)?.name}
            </Badge>
            <span className="text-sm font-light tracking-wide">
              {selectedNote.title || "Untitled"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              {lastSaved ? (
                <>
                  <Check className="h-3 w-3" /> Saved
                </>
              ) : (
                "Not saved yet"
              )}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullPage(false)}
              className="rounded-lg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Centered editor */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto w-full px-8 py-6">
            <NotesRichEditor
              note={selectedNote}
              groups={groups}
              folders={folders}
              onSave={handleSave}
              onBack={() => setIsFullPage(false)}
              lastSaved={lastSaved}
              showBreadcrumb={false}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full border border-border rounded-lg overflow-hidden bg-card", className)}>
      {/* Left Panel - Notes List with Focus Mode (Collapsible) */}
      <div 
        className={cn(
          "border-r border-border flex flex-col min-h-0 transition-[width] duration-200 overflow-hidden",
          leftCollapsed ? "w-14" : "w-72"
        )}
      >
        <div className="p-3 border-b border-border flex items-center justify-between shrink-0">
          {!leftCollapsed && (
            <h2 className="font-semibold text-sm text-foreground">
              {isInFocusMode ? "Context" : "Notes"}
            </h2>
          )}
          <div className={cn("flex items-center gap-1", leftCollapsed && "mx-auto")}>
            {!leftCollapsed && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCreateNote}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={() => setLeftCollapsed(!leftCollapsed)}
              title={leftCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {leftCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-2 space-y-1">
            {sortedGroups.map((group) => {
              const groupNotes = notes.filter((note) => note.groupId === group.id);
              const groupFolders = folders.filter((f) => f.groupId === group.id);
              const isGroupExpanded = expandedGroups.has(group.id);
              const isFocusedGroup = selectedNote?.groupId === group.id;
              const mostRecentUpdate = getMostRecentUpdate(groupNotes);

              // In focus mode, dim non-focused groups
              const focusModeClass = isInFocusMode && !isFocusedGroup 
                ? "opacity-40" 
                : "";

              // Collapsed mode - show only group headers
              if (leftCollapsed) {
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      setLeftCollapsed(false);
                      setExpandedGroups(new Set([group.id]));
                    }}
                    className={cn(
                      "w-full p-2 flex items-center justify-center rounded transition-colors hover:bg-muted/30",
                      focusModeClass
                    )}
                    title={group.name}
                  >
                    <span 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: group.color }} 
                    />
                  </button>
                );
              }

              return (
                <div key={group.id} className={focusModeClass}>
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 hover:bg-muted/20 rounded transition-colors border-l-2"
                    style={{ borderLeftColor: group.color }}
                  >
                    {isGroupExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    <span className="flex-1 text-left">{group.name}</span>
                    {mostRecentUpdate && (
                      <NotesActivityDot updatedAt={mostRecentUpdate} size="sm" />
                    )}
                    <span className="text-muted-foreground/50">{groupNotes.length}</span>
                  </button>
                  
                  {/* Expanded Group Content */}
                  {isGroupExpanded && (
                    <div className="space-y-0.5 ml-4">
                      {/* Folders in this group */}
                      {groupFolders.map((folder) => {
                        const folderNotes = groupNotes.filter((n) => n.folderId === folder.id);
                        const isFolderExpanded = expandedFolders.has(folder.id);
                        const isFocusedFolder = selectedNote?.folderId === folder.id;
                        const folderMostRecent = getMostRecentUpdate(folderNotes);

                        // In focus mode with a folder selected, dim other folders
                        const folderFocusClass = isInFocusMode && selectedNote?.folderId && !isFocusedFolder
                          ? "opacity-50"
                          : "";

                        return (
                          <div key={folder.id} className={folderFocusClass}>
                            <button
                              onClick={() => toggleFolder(folder.id)}
                              className="w-full flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground hover:bg-muted/20 rounded transition-colors"
                            >
                              {isFolderExpanded ? (
                                <ChevronDown className="h-2.5 w-2.5" />
                              ) : (
                                <ChevronRight className="h-2.5 w-2.5" />
                              )}
                              {isFolderExpanded ? (
                                <FolderOpen className="h-3 w-3" />
                              ) : (
                                <Folder className="h-3 w-3" />
                              )}
                              <span className="flex-1 text-left">{folder.name}</span>
                              {folderMostRecent && (
                                <NotesActivityDot updatedAt={folderMostRecent} size="sm" />
                              )}
                              <span className="text-muted-foreground/40">{folderNotes.length}</span>
                            </button>

                            {isFolderExpanded && (
                              <div className="ml-5 space-y-0.5">
                                {folderNotes.map((note) => (
                                  <div
                                    key={note.id}
                                    className={`p-2 rounded cursor-pointer transition-colors flex items-start gap-2 ${
                                      selectedNote?.id === note.id
                                        ? "bg-primary/10 border border-primary/30"
                                        : "hover:bg-muted/30"
                                    }`}
                                    onClick={() => onSelectNote(note)}
                                  >
                                    <FileText className="h-3 w-3 mt-0.5 text-muted-foreground/50 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-sm text-foreground line-clamp-1">
                                        {note.title || "Untitled"}
                                      </h3>
                                    </div>
                                    <NotesActivityDot updatedAt={note.updatedAt} size="sm" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Notes directly in group (no folder) */}
                      {groupNotes
                        .filter((n) => !n.folderId)
                        .map((note) => (
                          <div
                            key={note.id}
                            className={`p-2 rounded cursor-pointer transition-colors flex items-start gap-2 ${
                              selectedNote?.id === note.id
                                ? "bg-primary/10 border border-primary/30"
                                : "hover:bg-muted/30"
                            }`}
                            onClick={() => onSelectNote(note)}
                          >
                            <FileText className="h-3 w-3 mt-0.5 text-muted-foreground/50 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm text-foreground line-clamp-1">
                                {note.title || "Untitled"}
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {note.plainText || "No content"}
                              </p>
                            </div>
                            <NotesActivityDot updatedAt={note.updatedAt} size="sm" />
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Editor */}
      <div className="flex-1 flex flex-col min-h-0">
        {selectedNote ? (
          <>
            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 shrink-0">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: `${getGroupColor(selectedNote.groupId)}20`,
                    color: getGroupColor(selectedNote.groupId),
                  }}
                >
                  {groups.find((g) => g.id === selectedNote.groupId)?.name}
                </Badge>
                {selectedNote.folderId && (
                  <>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                    <span className="text-xs text-muted-foreground">
                      {folders.find(f => f.id === selectedNote.folderId)?.name}
                    </span>
                  </>
                )}
                <span className="text-xs text-muted-foreground ml-2">
                  Last edited {format(new Date(selectedNote.updatedAt), "MMM d 'at' h:mm a")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsFullPage(true)}
                  title="Full page mode"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => onDeleteNote(selectedNote.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Note
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBack}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 flex flex-col min-h-0">
              <NotesRichEditor
                note={selectedNote}
                groups={groups}
                folders={folders}
                onSave={handleSave}
                onBack={handleBack}
                lastSaved={lastSaved}
                showBreadcrumb={true}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="mb-2">Select a note to view</p>
              <Button onClick={onCreateNote} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create new note
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
