import { format } from "date-fns";
import { FileText, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Note, NoteGroup } from "@/pages/Notes";

interface NotesNoteRowProps {
  note: Note;
  group?: NoteGroup;
  isIndented?: boolean;
  isSelected?: boolean;
  onClick: () => void;
}

export function NotesNoteRow({
  note,
  group,
  isIndented = false,
  isSelected = false,
  onClick,
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

  return (
    <div
      onClick={onClick}
      className={`
        group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200
        hover:bg-muted/50 
        ${isIndented ? "ml-6" : ""}
        ${isSelected ? "bg-primary/10 ring-1 ring-primary/30" : ""}
      `}
    >
      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-foreground truncate">
          {note.title || "Untitled Note"}
        </h4>
        {note.plainText && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {note.plainText}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {note.tags.length > 0 && (
          <div className="hidden sm:flex gap-1">
            {note.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {note.tags.length > 2 && (
              <span className="text-xs text-muted-foreground">+{note.tags.length - 2}</span>
            )}
          </div>
        )}
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDate(note.updatedAt)}
        </span>
      </div>
    </div>
  );
}
