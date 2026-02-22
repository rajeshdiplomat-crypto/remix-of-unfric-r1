import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, MoreHorizontal, Trash2 } from "lucide-react";
import { NotesRichEditor } from "./NotesRichEditor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

  // Use portal to render at document.body level, bypassing any stacking context issues
  return createPortal(
    <div className="fixed inset-0 z-[99999] flex flex-col bg-card" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Mobile editor header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs gap-1"
            onClick={onBack}
          >
            <X className="h-4 w-4" />
            Back
          </Button>
          <Badge
            className="shrink-0 text-[10px]"
            style={{
              backgroundColor: `${getGroupColor(note.groupId)}20`,
              color: getGroupColor(note.groupId),
              border: "none",
            }}
          >
            {groups.find((g) => g.id === note.groupId)?.name}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[999999]">
            <DropdownMenuItem className="text-red-600" onClick={() => { onDelete(note.id); onBack(); }}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
