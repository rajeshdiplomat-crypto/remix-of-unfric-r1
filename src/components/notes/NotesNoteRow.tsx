import { format } from "date-fns";
import { FileText, Clock, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NotesActivityDot } from "./NotesActivityDot";
import type { Note, NoteGroup } from "@/pages/Notes";

interface NotesNoteRowProps {
  note: Note;
  group?: NoteGroup;
  isIndented?: boolean;
  isSelected?: boolean;
  onClick: () => void;
  onDelete?: (noteId: string) => void;
  showActivityDot?: boolean;
}

export function NotesNoteRow({
  note,
  group,
  isIndented = false,
  isSelected = false,
  onClick,
  onDelete,
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

  return (
    <div
      onClick={onClick}
      className={`
        group flex items-start gap-2.5 py-2 px-2 rounded cursor-pointer transition-all duration-150
        hover:bg-muted/30 
        ${isIndented ? "ml-2" : ""}
        ${isSelected ? "bg-primary/5" : ""}
      `}
    >
      <FileText className="h-3.5 w-3.5 mt-0.5 text-muted-foreground/40 shrink-0" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className="text-sm text-foreground/90 truncate">
            {note.title || "Untitled Note"}
          </h4>
          {showActivityDot && (
            <NotesActivityDot updatedAt={note.updatedAt} size="sm" className="opacity-60" />
          )}
        </div>
        {note.plainText && (
          <p className="text-xs text-muted-foreground/50 line-clamp-1 mt-0.5">
            {note.plainText}
          </p>
        )}
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
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 bg-muted/50 text-muted-foreground/70 border-0">
              {tag}
            </Badge>
          ))}
          {note.tags.length > 2 && (
            <span className="text-[10px] text-muted-foreground/50">+{note.tags.length - 2}</span>
          )}
        </div>
      )}

      {/* Delete icon - always visible */}
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          title="Delete note"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
