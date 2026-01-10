import { format } from "date-fns";
import { FileText, Clock, Trash2, MoreHorizontal, ArrowRight, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { NotesActivityDot } from "./NotesActivityDot";
import type { Note, NoteGroup } from "@/pages/Notes";

interface NotesNoteRowProps {
  note: Note;
  group?: NoteGroup;
  allGroups?: NoteGroup[];
  isIndented?: boolean;
  isSelected?: boolean;
  onClick: () => void;
  onDelete?: (noteId: string) => void;
  onUpdateNote?: (note: Note) => void;
  showActivityDot?: boolean;
}

export function NotesNoteRow({
  note,
  group,
  allGroups = [],
  isIndented = false,
  isSelected = false,
  onClick,
  onDelete,
  onUpdateNote,
  showActivityDot = false,
}: NotesNoteRowProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return format(date, "h:mm a");
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return format(date, "EEEE");
    } else {
      return format(date, "MMM d");
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm("Delete this note?")) {
      onDelete(note.id);
    }
  };

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateNote) {
      onUpdateNote({ ...note, isPinned: !note.isPinned });
    }
  };

  const otherGroups = allGroups.filter((g) => g.id !== note.groupId);

  return (
    <div
      onClick={onClick}
      className={`
        group flex items-start gap-2.5 py-2 px-2 rounded cursor-pointer transition-all duration-150
        hover:bg-muted/30 
        ${isIndented ? "ml-2" : ""}
        ${isSelected ? "bg-primary/5" : ""}
        ${note.isPinned ? "border-l-2 border-primary/50 pl-2" : ""}
      `}
    >
      {/* Pin indicator */}
      {note.isPinned && <Pin className="h-3 w-3 text-primary/70 shrink-0 mt-1" />}

      <FileText className="h-3.5 w-3.5 mt-0.5 text-muted-foreground/40 shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className="text-sm text-foreground/90 truncate">{note.title || "Untitled Note"}</h4>
          {showActivityDot && <NotesActivityDot updatedAt={note.updatedAt} size="sm" className="opacity-60" />}
        </div>
        {note.plainText && <p className="text-xs text-muted-foreground/50 line-clamp-1 mt-0.5">{note.plainText}</p>}
      </div>

      {/* Always visible date/time */}
      <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5 shrink-0">
        <Clock className="h-2.5 w-2.5" />
        {formatDate(note.updatedAt)}
      </span>

      {/* Tags on hover */}
      {note.tags.length > 0 && (
        <div className="hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {note.tags.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] px-1.5 py-0 bg-muted/50 text-muted-foreground/70 border-0"
            >
              {tag}
            </Badge>
          ))}
          {note.tags.length > 2 && (
            <span className="text-[10px] text-muted-foreground/50">+{note.tags.length - 2}</span>
          )}
        </div>
      )}

      {/* Three-dot menu with options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-opacity"
            onClick={(e) => e.stopPropagation()}
            title="More options"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded">
          <DropdownMenuLabel>Note Options</DropdownMenuLabel>

          {/* Pin/Unpin option */}
          {onUpdateNote && (
            <DropdownMenuItem onClick={handleTogglePin} className="rounded cursor-pointer">
              <Pin className={`h-3 w-3 mr-2 ${note.isPinned ? "text-primary" : ""}`} />
              {note.isPinned ? "Unpin Note" : "Pin Note"}
            </DropdownMenuItem>
          )}

          {/* Change Group submenu */}
          {onUpdateNote && otherGroups.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ArrowRight className="h-3 w-3 mr-2" />
                Change Group
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="rounded">
                {otherGroups.map((g) => (
                  <DropdownMenuItem
                    key={g.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateNote({ ...note, groupId: g.id, folderId: null });
                    }}
                    className="rounded"
                  >
                    <span className="w-2 h-2 rounded-full mr-2" style={{ background: g.color }} />
                    {g.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this note?")) {
                    onDelete(note.id);
                  }
                }}
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
