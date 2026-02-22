import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, MoreHorizontal, Trash2, Pin, PinOff, FolderInput } from "lucide-react";
import { NotesRichEditor } from "./NotesRichEditor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Note, NoteGroup, NoteFolder } from "@/pages/Notes";
import { createPortal } from "react-dom";

interface MobileNoteEditorProps {
  note: Note;
  groups: NoteGroup[];
  folders: NoteFolder[];
  onSave: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onBack: () => void;
}

export function MobileNoteEditor({ note, groups, folders, onSave, onDelete, onBack }: MobileNoteEditorProps) {
  const [, setIsEditorFullscreen] = useState(false);
  const getGroupColor = (groupId: string) => groups.find((g) => g.id === groupId)?.color || "hsl(215, 20%, 65%)";
  const groupName = groups.find((g) => g.id === note.groupId)?.name || "Inbox";
  const folderName = note.folderId ? folders.find((f) => f.id === note.folderId)?.name : null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex flex-col bg-card" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Redesigned mobile editor header */}
      <div className="shrink-0 border-b border-border/50 bg-card/95 backdrop-blur-md">
        {/* Top row: Back + location breadcrumb + actions */}
        <div className="flex items-center gap-1 px-2 py-1.5">
          {/* Back button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onBack}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Location breadcrumb */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Badge
              variant="outline"
              className="shrink-0 text-[10px] font-medium border-0 px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: `${getGroupColor(note.groupId)}15`,
                color: getGroupColor(note.groupId),
              }}
            >
              {groupName}
            </Badge>
            {folderName && (
              <>
                <span className="text-[10px] text-muted-foreground/40">/</span>
                <span className="text-[10px] text-muted-foreground/60 truncate">{folderName}</span>
              </>
            )}
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[999999] w-48 rounded-lg">
              <DropdownMenuItem
                onClick={() => onSave({ ...note, isPinned: !note.isPinned })}
                className="cursor-pointer"
              >
                {note.isPinned ? (
                  <><PinOff className="h-4 w-4 mr-2" /> Unpin</>
                ) : (
                  <><Pin className="h-4 w-4 mr-2" /> Pin Note</>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => { onDelete(note.id); onBack(); }}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-hidden">
        <NotesRichEditor
          note={note}
          groups={groups}
          folders={folders}
          onSave={onSave}
          onBack={onBack}
          onFullscreenChange={setIsEditorFullscreen}
        />
      </div>
    </div>,
    document.body
  );
}
