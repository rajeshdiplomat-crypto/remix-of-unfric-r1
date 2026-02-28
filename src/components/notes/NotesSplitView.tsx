import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, X, Trash2, ChevronRight, FileText, Folder, FolderOpen, ChevronDown } from "lucide-react";
import { NotesRichEditor } from "./NotesRichEditor";
import { NotesActivityDot, getMostRecentUpdate } from "./NotesActivityDot";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const isMobile = useIsMobile();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [preEditExpandedState, setPreEditExpandedState] = useState<{
    groups: Set<string>;
    folders: Set<string>;
  } | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isNewNote, setIsNewNote] = useState(false);
  const prevNoteId = useRef<string | null>(null);

  useEffect(() => {
    if (selectedNote) {
      if (!preEditExpandedState) {
        setPreEditExpandedState({ groups: new Set(expandedGroups), folders: new Set(expandedFolders) });
      }
      setExpandedGroups(new Set([selectedNote.groupId]));
      if (selectedNote.folderId) {
        setExpandedFolders(new Set([selectedNote.folderId]));
      } else {
        setExpandedFolders(new Set());
      }
      if (prevNoteId.current !== selectedNote.id && !selectedNote.title) {
        setIsNewNote(true);
      } else {
        setIsNewNote(false);
      }
      prevNoteId.current = selectedNote.id;
    }
  }, [selectedNote?.id]);

  useEffect(() => {
    if (isNewNote && selectedNote) {
      const groupName = groups.find((g) => g.id === selectedNote.groupId)?.name || "Unknown";
      const folderName = selectedNote.folderId ? folders.find((f) => f.id === selectedNote.folderId)?.name : null;
      const location = folderName ? `${groupName} › ${folderName}` : groupName;
      toast({ title: `Note created in ${location}`, duration: 3000 });
      setIsNewNote(false);
    }
  }, [isNewNote, selectedNote]);

  const getGroupColor = (groupId: string) => groups.find((g) => g.id === groupId)?.color || "hsl(215, 20%, 65%)";

  // Creative gradient presets for dots
  const CATEGORY_GRADIENTS: Record<string, string> = {
    inbox: "linear-gradient(135deg, #94a3b8 0%, #64748b 50%, #475569 100%)",
    work: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #1d4ed8 100%)",
    personal: "linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)",
    wellness: "linear-gradient(135deg, #c084fc 0%, #a855f7 50%, #7c3aed 100%)",
    hobby: "linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)",
  };

  const handleSave = (note: Note) => {
    onSaveNote(note);
    setLastSaved(new Date());
  };

  const handleBack = () => {
    if (preEditExpandedState) {
      setExpandedGroups(preEditExpandedState.groups);
      setExpandedFolders(preEditExpandedState.folders);
      setPreEditExpandedState(null);
    }
    onBack();
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
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
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);
  const isInFocusMode = !!selectedNote;
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);

  // Mobile: full-screen editor when note is selected
  if (isMobile && selectedNote) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col bg-card">
        {/* Mobile editor header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card shrink-0 safe-area-top">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs gap-1"
              onClick={handleBack}
            >
              <X className="h-4 w-4" />
              Back
            </Button>
            <Badge
              className="shrink-0 text-[10px]"
              style={{
                backgroundColor: `${getGroupColor(selectedNote.groupId)}20`,
                color: getGroupColor(selectedNote.groupId),
                border: "none",
              }}
            >
              {groups.find((g) => g.id === selectedNote.groupId)?.name}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[99999]">
              <DropdownMenuItem className="text-red-600" onClick={() => onDeleteNote(selectedNote.id)}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex-1 overflow-hidden">
          <NotesRichEditor
            note={selectedNote}
            groups={groups}
            folders={folders}
            onSave={handleSave}
            onBack={handleBack}
            onFullscreenChange={setIsEditorFullscreen}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-80px)] p-4">
      <div className="flex h-full rounded-[12px] overflow-hidden bg-white/[0.03] backdrop-blur-xl border border-white/[0.1] shadow-sm">
        {/* Left Sidebar */}
        <div className="w-56 shrink-0 border-r border-white/[0.05] flex flex-col bg-white/[0.02] overflow-hidden relative z-[200]">
          <div className="p-3 border-b border-white/[0.05] flex items-center justify-between shrink-0">
            <span className="text-[11px] font-light tracking-[0.3em] text-muted-foreground/50">
              {isInFocusMode ? "Context" : "Notes"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
              onClick={onCreateNote}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {sortedGroups.map((group) => {
                const groupNotes = notes.filter((note) => note.groupId === group.id);
                const groupFolders = folders.filter((f) => f.groupId === group.id);
                const isGroupExpanded = expandedGroups.has(group.id);
                const isFocusedGroup = selectedNote?.groupId === group.id;
                const mostRecentUpdate = getMostRecentUpdate(groupNotes);
                const focusModeClass = isInFocusMode && !isFocusedGroup ? "opacity-40" : "";

                return (
                  <div key={group.id} className={focusModeClass}>
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="w-full px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 hover:bg-muted/60 rounded-lg transition-colors"
                    >
                      {isGroupExpanded ? (
                        <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                      <span className="flex-1 text-left truncate">{group.name}</span>
                      {mostRecentUpdate && <NotesActivityDot updatedAt={mostRecentUpdate} size="sm" />}
                      <span className="text-muted-foreground text-[10px] shrink-0">{groupNotes.length}</span>
                    </button>

                    {isGroupExpanded && (
                      <div className="space-y-0.5 ml-2 border-l border-border pl-2">
                        {groupFolders.map((folder) => {
                          const folderNotes = groupNotes.filter((n) => n.folderId === folder.id);
                          const isFolderExpanded = expandedFolders.has(folder.id);
                          const isFocusedFolder = selectedNote?.folderId === folder.id;
                          const folderMostRecent = getMostRecentUpdate(folderNotes);
                          const folderFocusClass =
                            isInFocusMode && selectedNote?.folderId && !isFocusedFolder ? "opacity-50" : "";

                          return (
                            <div key={folder.id} className={folderFocusClass}>
                              <button
                                onClick={() => toggleFolder(folder.id)}
                                className="w-full flex items-center gap-1.5 px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors"
                              >
                                {isFolderExpanded ? (
                                  <ChevronDown className="h-2.5 w-2.5 shrink-0" />
                                ) : (
                                  <ChevronRight className="h-2.5 w-2.5 shrink-0" />
                                )}
                                {isFolderExpanded ? (
                                  <FolderOpen className="h-3 w-3 text-amber-500 shrink-0" />
                                ) : (
                                  <Folder className="h-3 w-3 text-amber-500/70 shrink-0" />
                                )}
                                <span className="flex-1 text-left truncate">{folder.name}</span>
                                {folderMostRecent && <NotesActivityDot updatedAt={folderMostRecent} size="sm" />}
                                <span className="text-muted-foreground text-[10px] shrink-0">{folderNotes.length}</span>
                              </button>

                              {isFolderExpanded && (
                                <div className="ml-3 space-y-0.5">
                                  {folderNotes.map((note) => (
                                    <div
                                      key={note.id}
                                      className={`p-1.5 rounded-lg cursor-pointer transition-all flex items-start gap-1.5 ${
                                        selectedNote?.id === note.id
                                          ? "bg-primary/10 ring-1 ring-primary/20"
                                          : "hover:bg-muted/50"
                                      }`}
                                      onClick={() => onSelectNote(note)}
                                    >
                                      <FileText className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                                      <span className="text-xs text-foreground truncate">
                                        {note.title || "Untitled"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {groupNotes
                          .filter((n) => !n.folderId)
                          .map((note) => (
                            <div
                              key={note.id}
                              className={`p-1.5 rounded-lg cursor-pointer transition-all flex items-start gap-1.5 ${
                                selectedNote?.id === note.id
                                  ? "bg-primary/10 ring-1 ring-primary/20"
                                  : "hover:bg-muted/50"
                              }`}
                              onClick={() => onSelectNote(note)}
                            >
                              <FileText className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="text-xs text-foreground truncate block">
                                  {note.title || "Untitled"}
                                </span>
                                <span className="text-[10px] text-muted-foreground truncate block">
                                  {note.plainText && note.plainText !== "undefined"
                                    ? note.plainText.slice(0, 30)
                                    : "No content"}
                                </span>
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
        </div>

        {/* Right Panel - Editor */}
        <div
          className={`flex-1 flex flex-col min-w-0 overflow-hidden relative ${isEditorFullscreen ? "z-[10000]" : "z-10"}`}
        >
          {selectedNote ? (
            <>
              <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card shrink-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Badge
                    className="shrink-0 text-[10px]"
                    style={{
                      backgroundColor: `${getGroupColor(selectedNote.groupId)}20`,
                      color: getGroupColor(selectedNote.groupId),
                      border: "none",
                    }}
                  >
                    {groups.find((g) => g.id === selectedNote.groupId)?.name}
                  </Badge>
                  {selectedNote.folderId && (
                    <>
                      <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[10px] text-muted-foreground truncate">
                        {folders.find((f) => f.id === selectedNote.folderId)?.name}
                      </span>
                    </>
                  )}
                  <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                    Edited {format(new Date(selectedNote.updatedAt), "MMM d, h:mm a")}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-[9999]">
                      <DropdownMenuItem className="text-red-600" onClick={() => onDeleteNote(selectedNote.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={handleBack}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <NotesRichEditor
                  note={selectedNote}
                  groups={groups}
                  folders={folders}
                  onSave={handleSave}
                  onBack={handleBack}
                  onFullscreenChange={setIsEditorFullscreen}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white/[0.01]">
              <div className="text-center">
                <div className="w-14 h-14 rounded-[12px] bg-white/[0.03] border border-white/[0.1] flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="text-muted-foreground/50 text-sm font-light mb-3">Select a note to view</p>
                <Button
                  onClick={onCreateNote}
                  size="sm"
                  className="gap-2 rounded-[6px] bg-[hsl(215,15%,40%)] hover:bg-[hsl(215,15%,35%)] text-white shadow-sm"
                >
                  <Plus className="h-4 w-4" /> New Note
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
