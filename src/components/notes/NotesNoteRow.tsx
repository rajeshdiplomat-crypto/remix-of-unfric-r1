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
        group relative flex items-center gap-3 py-3 px-4 cursor-pointer transition-all duration-200
        hover:bg-gradient-to-r hover:from-muted/40 hover:to-transparent
        ${isIndented ? "ml-4" : ""}
        ${isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""}
        ${note.isPinned ? "bg-amber-50/30 dark:bg-amber-950/10" : ""}
      `}
    >
      {/* Left accent line on hover */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-primary rounded-full transition-all group-hover:h-8 opacity-0 group-hover:opacity-100" />

      {/* Icon with gradient background */}
      <div
        className={`
        w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all
        ${
          note.isPinned
            ? "bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-950/20"
            : "bg-gradient-to-br from-muted/80 to-muted/30 group-hover:from-primary/10 group-hover:to-primary/5"
        }
      `}
      >
        {note.isPinned ? (
          <Pin className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        ) : (
          <FileText className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary/70 transition-colors" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-foreground/90 truncate group-hover:text-foreground transition-colors">
            {note.title || "Untitled Note"}
          </h4>
          {note.isPinned && (
            <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
              Pinned
            </span>
          )}
          {showActivityDot && <NotesActivityDot updatedAt={note.updatedAt} size="sm" className="opacity-60" />}
        </div>
        {note.plainText && <p className="text-xs text-muted-foreground/50 line-clamp-1 mt-0.5">{note.plainText}</p>}
      </div>

      {/* Time - sleek pill */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] text-muted-foreground/50 bg-muted/50 px-2 py-1 rounded-full flex items-center gap-1 border border-border/50">
          <Clock className="h-2.5 w-2.5" />
          {formatDate(note.updatedAt)}
        </span>
      </div>

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
