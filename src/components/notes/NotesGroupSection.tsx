import { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown, Plus, FolderPlus, MoreHorizontal, Pin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotesFolderSection } from "./NotesFolderSection";
import { NotesNoteRow } from "./NotesNoteRow";
import { NotesActivityDot, getMostRecentUpdate } from "./NotesActivityDot";
import { getPresetImage } from "@/lib/presetImages";
import type { Note, NoteGroup, NoteFolder } from "@/pages/Notes";
interface NotesGroupSectionProps {
  group: NoteGroup;
  folders: NoteFolder[];
  notes: Note[];
  selectedNoteId?: string;
  onNoteClick: (note: Note) => void;
  onDeleteNote?: (noteId: string) => void;
  onAddNote: (groupId: string, folderId: string | null) => void;
  onAddFolder: (groupId: string, folderName: string) => void;
  isInFocusMode?: boolean;
  isFocusedGroup?: boolean;
}
export function NotesGroupSection({
  group,
  folders,
  notes,
  selectedNoteId,
  onNoteClick,
  onDeleteNote,
  onAddNote,
  onAddFolder,
  isInFocusMode = false,
  isFocusedGroup = false
}: NotesGroupSectionProps) {
  const [isExpanded, setIsExpanded] = useState(isFocusedGroup);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const folderInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isFocusedGroup) setIsExpanded(true);
  }, [isFocusedGroup]);
  const groupFolders = folders.filter(f => f.groupId === group.id);
  const directNotes = notes.filter(n => n.groupId === group.id && !n.folderId);
  const allGroupNotes = notes.filter(n => n.groupId === group.id);
  const mostRecentUpdate = getMostRecentUpdate(allGroupNotes);
  const pinnedCount = allGroupNotes.filter(n => n.isPinned).length;

  // Get preview from most recent note
  const mostRecentNote = allGroupNotes.length > 0 ? allGroupNotes.reduce((a, b) => new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b) : null;
  useEffect(() => {
    if (isAddingFolder && folderInputRef.current) folderInputRef.current.focus();
  }, [isAddingFolder]);
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    onAddFolder(group.id, newFolderName.trim());
    setNewFolderName("");
    setIsAddingFolder(false);
  };
  const focusModeClasses = isInFocusMode && !isFocusedGroup ? "opacity-50 pointer-events-none" : "";
  return <div className={focusModeClasses}>
      <div className="rounded-xl border border-border/40 bg-card shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
        <div className="flex">
          {/* Left: Wide Cover Image */}
          <div className="w-32 shrink-0 overflow-hidden rounded-l-xl">
            <img src={getPresetImage("notes", group.id)} alt="" className="w-full h-full min-h-[100px] object-scale-down" />
          </div>

          {/* Right: Header & Content */}
          <div className="flex-1">
            {/* Compact Card Header */}
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full px-4 py-3 text-left hover:bg-muted/5 transition-colors">
              <div className="flex items-center gap-3">
                {/* Main content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-medium text-foreground truncate">{group.name}</h2>
                    <span className="text-xs text-muted-foreground/60">({allGroupNotes.length})</span>
                    {pinnedCount > 0 && <span className="flex items-center gap-0.5 text-xs text-muted-foreground/50">
                        <Pin className="h-2.5 w-2.5" />
                        {pinnedCount}
                      </span>}
                    {mostRecentUpdate && <NotesActivityDot updatedAt={mostRecentUpdate} size="sm" />}
                  </div>

                  {/* Last edited + preview */}
                  {mostRecentNote && <p className="mt-0.5 text-xs text-muted-foreground/50 truncate">
                      {formatDistanceToNow(new Date(mostRecentNote.updatedAt), {
                    addSuffix: true
                  })}
                      {mostRecentNote.title && ` · ${mostRecentNote.title}`}
                    </p>}
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddNote(group.id, null);
                }}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>

                  <div className="h-6 w-6 flex items-center justify-center rounded-lg">
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />}
                  </div>
                </div>
              </div>
            </button>

        {/* Expanded Body */}
        {isExpanded && <div className="px-4 pb-4 pt-1 border-t border-border/30">
            <div className="rounded-lg bg-background/50 p-3">
              {/* Empty */}
              {allGroupNotes.length === 0 && groupFolders.length === 0 ? <div className="py-4 text-center">
                  <p className="text-xs text-muted-foreground">No notes yet</p>
                  <div className="mt-3 flex justify-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={() => onAddNote(group.id, null)}>
                      <Plus className="h-3 w-3 mr-1.5" />
                      Add note
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={() => setIsAddingFolder(true)}>
                      <FolderPlus className="h-3 w-3 mr-1.5" />
                      Add section
                    </Button>
                  </div>
                </div> : <div className="space-y-2">
                  {/* Folders */}
                  {groupFolders.map(folder => <NotesFolderSection key={folder.id} folder={folder} notes={notes} group={group} selectedNoteId={selectedNoteId} onNoteClick={onNoteClick} onDeleteNote={onDeleteNote} onAddNote={folderId => onAddNote(group.id, folderId)} />)}

                  {/* Direct Notes */}
                  {directNotes.length > 0 && <div className="space-y-0.5">
                      {groupFolders.length > 0 && <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider pt-2 pb-1">Ungrouped</p>}
                      <div className="rounded-lg border border-border/30 bg-background/60 p-1.5">
                        {directNotes.map(note => <NotesNoteRow key={note.id} note={note} group={group} isSelected={selectedNoteId === note.id} onClick={() => onNoteClick(note)} onDelete={onDeleteNote} showActivityDot />)}
                      </div>
                    </div>}

                  {/* Actions */}
                  <div className="pt-2">
                    {!isAddingFolder ? <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={() => onAddNote(group.id, null)}>
                          <Plus className="h-3 w-3 mr-1.5" />
                          Add note
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={() => setIsAddingFolder(true)}>
                          <FolderPlus className="h-3 w-3 mr-1.5" />
                          Add section
                        </Button>
                      </div> : <div className="flex flex-wrap items-center gap-2">
                        <Input ref={folderInputRef} value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Section name…" className="h-8 w-40 rounded-lg bg-background text-xs" onKeyDown={e => {
                      if (e.key === "Enter") handleCreateFolder();
                      if (e.key === "Escape") {
                        setIsAddingFolder(false);
                        setNewFolderName("");
                      }
                    }} />
                        <Button size="sm" className="h-8 rounded-lg text-xs" onClick={handleCreateFolder}>
                          Add
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs" onClick={() => {
                      setIsAddingFolder(false);
                      setNewFolderName("");
                    }}>
                          Cancel
                        </Button>
                      </div>}
                  </div>
                </div>}
            </div>
          </div>}
          </div>
        </div>
      </div>
    </div>;
}