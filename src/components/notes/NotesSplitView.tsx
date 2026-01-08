import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, X, Trash2, ChevronRight, ChevronLeft, FileText, Folder, FolderOpen, ChevronDown, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotesRichEditor } from "./NotesRichEditor";
import { NotesActivityDot, getMostRecentUpdate } from "./NotesActivityDot";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
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
}: NotesSplitViewProps) {
  const { toast } = useToast();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showCreationToast, setShowCreationToast] = useState(false);
  const [isFullPage, setIsFullPage] = useState(false);
  
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
  
  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return format(date, "h:mm a");
    } else if (diffDays === 1) {
      return "Yesterday";
    } else {
      return format(date, "MMM d");
    }
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

  // Full page mode - use portal to escape any parent layouts (NO HEADER - immersive)
  if (isFullPage && selectedNote) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex flex-col bg-background">
        {/* Single clean editor - no duplicate headers */}
        <NotesRichEditor
          note={selectedNote}
          groups={groups}
          folders={folders}
          onSave={handleSave}
          onBack={() => setIsFullPage(false)}
          lastSaved={lastSaved}
          showBreadcrumb={true}
        />
      </div>,
      document.body
    );
  }


  return (
    <div className="flex h-[calc(100vh-80px)] border border-border rounded-lg overflow-hidden bg-card">
      {/* Left Panel - Notes List with Focus Mode */}
      <div className={cn(
        "border-r border-border flex flex-col transition-all duration-300",
        isSidebarCollapsed ? "w-12" : "w-72"
      )}>
        <div className="p-3 border-b border-border flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          {!isSidebarCollapsed && (
            <>
              <h2 className="font-semibold text-sm text-foreground flex-1 ml-2">
                {isInFocusMode ? "Context" : "Notes"}
              </h2>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCreateNote}>
                <Plus className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        {!isSidebarCollapsed && (
        <ScrollArea className="flex-1">
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
                                    className={`p-2 rounded cursor-pointer transition-colors flex items-start gap-2 group ${
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
                                    <div className="flex items-center gap-1">
                                      <NotesActivityDot updatedAt={note.updatedAt} size="sm" />
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <MoreHorizontal className="h-3 w-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onDeleteNote(note.id);
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
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
                            className={`p-2 rounded cursor-pointer transition-colors flex items-start gap-2 group ${
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
                            <div className="flex items-center gap-1">
                              <NotesActivityDot updatedAt={note.updatedAt} size="sm" />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteNote(note.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
        )}
      </div>

      {/* Right Panel - Editor */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
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
            <div className="flex-1 overflow-auto">
              <NotesRichEditor
                note={selectedNote}
                groups={groups}
                folders={folders}
                onSave={handleSave}
                onBack={handleBack}
                lastSaved={lastSaved}
                showBreadcrumb={false}
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
