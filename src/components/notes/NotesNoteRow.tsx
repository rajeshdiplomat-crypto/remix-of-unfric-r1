import { format } from "date-fns";
import { FileText, Trash2, MoreHorizontal, ArrowRight, Pin } from "lucide-react";
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
        group relative flex items-center gap-2 py-1 px-2.5 cursor-pointer transition-all duration-200
        hover:bg-muted/30
        ${isIndented ? "ml-4" : ""}
        ${isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""}
        ${note.isPinned ? "bg-amber-50/30 dark:bg-amber-950/10" : ""}
      `}
    >
      {/* Icon */}
      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-muted/40">
        {note.isPinned ? (
          <Pin className="h-3 w-3 text-amber-600 dark:text-amber-400" />
        ) : (
          <FileText className="h-3 w-3 text-muted-foreground/50" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className="text-[12px] font-medium text-foreground/90 truncate">
            {note.title || "Untitled Note"}
          </h4>
          {showActivityDot && <NotesActivityDot updatedAt={note.updatedAt} size="sm" className="opacity-60 !w-1.5 !h-1.5" />}
        </div>
        {note.plainText && <p className="text-[10px] text-muted-foreground/40 line-clamp-1">{note.plainText}</p>}
      </div>

      {/* Timestamp - always visible, tiny */}
      <span className="text-[9px] text-muted-foreground/40 shrink-0">{formatDate(note.updatedAt)}</span>

      {/* Tags on hover */}
      {note.tags.length > 0 && (
        <div className="hidden sm:flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {note.tags.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] px-2 py-0.5 bg-primary/5 text-primary/70 border-0 rounded-full"
            >
              {tag}
            </Badge>
          ))}
          {note.tags.length > 2 && (
            <span className="text-[10px] text-muted-foreground/50">+{note.tags.length - 2}</span>
          )}
        </div>
      )}

      {/* Action menu - modern floating style */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-all rounded-lg"
            onClick={(e) => e.stopPropagation()}
            title="More options"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border border-border">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Actions</DropdownMenuLabel>

          {/* Pin/Unpin option */}
          {onUpdateNote && (
            <DropdownMenuItem onClick={handleTogglePin} className="rounded-lg cursor-pointer">
              <Pin className={`h-3.5 w-3.5 mr-2 ${note.isPinned ? "text-amber-500" : ""}`} />
              {note.isPinned ? "Unpin Note" : "Pin Note"}
            </DropdownMenuItem>
          )}

          {/* Change Group submenu */}
          {onUpdateNote && otherGroups.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="rounded-lg">
                <ArrowRight className="h-3.5 w-3.5 mr-2" />
                Move to Group
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="rounded-xl">
                {otherGroups.map((g) => (
                  <DropdownMenuItem
                    key={g.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateNote({ ...note, groupId: g.id, folderId: null });
                    }}
                    className="rounded-lg"
                  >
                    <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ background: g.color }} />
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
                className="text-destructive focus:text-destructive rounded-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this note?")) {
                    onDelete(note.id);
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
