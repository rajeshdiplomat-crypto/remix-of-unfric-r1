import { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown, Plus, FolderPlus, Pin, Camera, ImageIcon, Upload, RotateCcw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { NotesFolderSection } from "./NotesFolderSection";
import { NotesNoteRow } from "./NotesNoteRow";
import { NotesActivityDot, getMostRecentUpdate } from "./NotesActivityDot";
import { getPresetImage, getAllPresetImages } from "@/lib/presetImages";
import type { Note, NoteGroup, NoteFolder } from "@/pages/Notes";

interface NotesGroupSectionProps {
  group: NoteGroup;
  folders: NoteFolder[];
  notes: Note[];
  allGroups?: NoteGroup[];
  selectedNoteId?: string;
  onNoteClick: (note: Note) => void;
  onDeleteNote?: (noteId: string) => void;
  onUpdateNote?: (note: Note) => void;
  onAddNote: (groupId: string, folderId: string | null) => void;
  onAddFolder: (groupId: string, folderName: string) => void;
  onUpdateGroup?: (group: NoteGroup) => void;
  isInFocusMode?: boolean;
  isFocusedGroup?: boolean;
}

export function NotesGroupSection({
  group,
  folders,
  notes,
  allGroups = [],
  selectedNoteId,
  onNoteClick,
  onDeleteNote,
  onUpdateNote,
  onAddNote,
  onAddFolder,
  onUpdateGroup,
  isInFocusMode = false,
  isFocusedGroup = false,
}: NotesGroupSectionProps) {
  const [isExpanded, setIsExpanded] = useState(isFocusedGroup);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const folderInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFocusedGroup) setIsExpanded(true);
  }, [isFocusedGroup]);

  const groupFolders = folders.filter((f) => f.groupId === group.id);
  const directNotes = notes.filter((n) => n.groupId === group.id && !n.folderId);
  const allGroupNotes = notes.filter((n) => n.groupId === group.id);
  const mostRecentUpdate = getMostRecentUpdate(allGroupNotes);
  const pinnedCount = allGroupNotes.filter((n) => n.isPinned).length;

  // Get preview from most recent note
  const mostRecentNote =
    allGroupNotes.length > 0
      ? allGroupNotes.reduce((a, b) => (new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b))
      : null;

  useEffect(() => {
    if (isAddingFolder && folderInputRef.current) folderInputRef.current.focus();
  }, [isAddingFolder]);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    onAddFolder(group.id, newFolderName.trim());
    setNewFolderName("");
    setIsAddingFolder(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateGroup) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onUpdateGroup({ ...group, coverImage: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetSelect = (url: string) => {
    if (onUpdateGroup) {
      onUpdateGroup({ ...group, coverImage: url });
    }
  };

  const handleResetImage = () => {
    if (onUpdateGroup) {
      onUpdateGroup({ ...group, coverImage: undefined });
    }
  };

  const focusModeClasses = isInFocusMode && !isFocusedGroup ? "opacity-50 pointer-events-none" : "";
  const presetImages = getAllPresetImages("notes");
  const currentImage = group.coverImage || getPresetImage("notes", group.id);

  return (
    <div className={focusModeClasses}>
      <div className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
        <div className="flex">
          {/* Left: Wide Cover Image with change option */}
          <div className="w-32 shrink-0 overflow-hidden rounded-l-xl self-start relative group/image">
            <img src={currentImage} alt="" className="w-full h-auto object-cover min-h-[100px] max-h-[120px]" />
            {/* Bottom fade to white/card */}
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card to-transparent" />

            {/* Image change overlay */}
            {onUpdateGroup && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/image:bg-black/40 transition-all cursor-pointer">
                    <div className="opacity-0 group-hover/image:opacity-100 transition-opacity flex flex-col items-center gap-1">
                      <Camera className="h-5 w-5 text-white drop-shadow-lg" />
                      <span className="text-[10px] text-white font-medium drop-shadow-lg">Change</span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 rounded-xl p-2">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Change Cover Image</DropdownMenuLabel>

                  {/* Upload option */}
                  <DropdownMenuItem
                    className="rounded-lg cursor-pointer"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </DropdownMenuItem>

                  {/* Reset to default */}
                  {group.coverImage && (
                    <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={handleResetImage}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset to Default
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Preset Images</DropdownMenuLabel>

                  {/* Preset images grid */}
                  <div className="grid grid-cols-4 gap-1.5 p-1">
                    {presetImages.map((preset) => (
                      <button
                        key={preset.category}
                        onClick={() => handlePresetSelect(preset.url)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                          currentImage === preset.url
                            ? "border-primary shadow-md"
                            : "border-transparent hover:border-border"
                        }`}
                        title={preset.category}
                      >
                        <img src={preset.url} alt={preset.category} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Hidden file input */}
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          {/* Right: Header & Content */}
          <div className="flex-1">
            {/* Compact Card Header */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full px-4 py-3 text-left hover:bg-muted/5 transition-colors group"
            >
              <div className="flex items-center gap-4">
                {/* Group info - left side */}
                <div className="min-w-0 w-36 shrink-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-medium text-foreground truncate">{group.name}</h2>
                    <span className="text-xs text-muted-foreground/60">({allGroupNotes.length})</span>
                  </div>
                  {/* Last edited */}
                  {mostRecentNote && (
                    <p className="mt-0.5 text-xs text-muted-foreground/50 truncate">
                      {formatDistanceToNow(new Date(mostRecentNote.updatedAt), { addSuffix: true })}
                    </p>
                  )}
                </div>

                {/* Recent notes preview - fills the center space */}
                <div className="flex-1 flex items-center gap-2 overflow-hidden">
                  {allGroupNotes.slice(0, 3).map((note, idx) => (
                    <div
                      key={note.id}
                      className="flex items-center gap-2 px-2.5 py-1.5 bg-muted/50 hover:bg-muted/70 rounded-md text-xs max-w-[180px] transition-colors border border-border/50"
                      style={{ opacity: 1 - idx * 0.2 }}
                    >
                      {note.isPinned && <Pin className="h-2.5 w-2.5 text-primary/70 shrink-0" />}
                      <span className="truncate text-muted-foreground">{note.title || "Untitled"}</span>
                    </div>
                  ))}
                  {allGroupNotes.length > 3 && (
                    <span className="text-xs text-muted-foreground/40 shrink-0">+{allGroupNotes.length - 3} more</span>
                  )}
                  {allGroupNotes.length === 0 && (
                    <span className="text-xs text-muted-foreground/40 italic">No notes yet</span>
                  )}
                </div>

                {/* Right side - activity dot and chevron */}
                <div className="flex items-center gap-2 shrink-0">
                  {pinnedCount > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground/50">
                      <Pin className="h-2.5 w-2.5" />
                      {pinnedCount}
                    </span>
                  )}
                  {mostRecentUpdate && <NotesActivityDot updatedAt={mostRecentUpdate} size="sm" />}

                  {/* Quick add button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onAddNote(group.id, null);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>

                  <div className="h-6 w-6 flex items-center justify-center rounded-lg">
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                    )}
                  </div>
                </div>
              </div>
            </button>

            {/* Expanded Body */}
            {isExpanded && (
              <div className="px-4 pb-5 pt-3">
                {/* Empty */}
                {allGroupNotes.length === 0 && groupFolders.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-muted/60 to-muted/20 flex items-center justify-center">
                      <Plus className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground/60 mb-3">Start adding notes</p>
                    <Button
                      size="sm"
                      className="h-9 rounded-full px-5 text-xs bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm"
                      onClick={() => onAddNote(group.id, null)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-2" />
                      New Note
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Sections */}
                    {groupFolders.length > 0 && (
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-500">
                            Sections
                          </span>
                          <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/30 via-cyan-500/10 to-transparent" />
                        </div>
                        <div className="grid gap-2">
                          {groupFolders.map((folder) => (
                            <NotesFolderSection
                              key={folder.id}
                              folder={folder}
                              notes={notes}
                              group={group}
                              allGroups={allGroups}
                              selectedNoteId={selectedNoteId}
                              onNoteClick={onNoteClick}
                              onDeleteNote={onDeleteNote}
                              onUpdateNote={onUpdateNote}
                              onAddNote={(folderId) => onAddNote(group.id, folderId)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Direct Notes */}
                    {directNotes.length > 0 && (
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                            {groupFolders.length > 0 ? "Quick Notes" : "All Notes"}
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground/40 bg-muted/40 px-2 py-0.5 rounded-full">
                            {directNotes.length}
                          </span>
                          <div className="flex-1 h-px bg-gradient-to-r from-border/40 to-transparent" />
                        </div>

                        <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
                          {directNotes.map((note, idx) => (
                            <div key={note.id} className={idx > 0 ? "border-t border-border" : ""}>
                              <NotesNoteRow
                                note={note}
                                group={group}
                                allGroups={allGroups}
                                isSelected={selectedNoteId === note.id}
                                onClick={() => onNoteClick(note)}
                                onDelete={onDeleteNote}
                                onUpdateNote={onUpdateNote}
                                showActivityDot
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-3">
                      {!isAddingFolder ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-full px-4 text-xs border-dashed hover:border-solid"
                          onClick={() => onAddNote(group.id, null)}
                        >
                          <Plus className="h-3.5 w-3.5 mr-2" />
                          Add note
                        </Button>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            ref={folderInputRef}
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Section name…"
                            className="h-9 w-44 rounded-xl bg-background text-xs"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCreateFolder();
                              if (e.key === "Escape") {
                                setIsAddingFolder(false);
                                setNewFolderName("");
                              }
                            }}
                          />
                          <Button size="sm" className="h-9 rounded-xl text-xs" onClick={handleCreateFolder}>
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 rounded-xl text-xs"
                            onClick={() => {
                              setIsAddingFolder(false);
                              setNewFolderName("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
