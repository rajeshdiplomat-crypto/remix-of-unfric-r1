import { useState } from "react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Share2, MoreHorizontal, X, Clock } from "lucide-react";
import { NotesEditor } from "./NotesEditor";
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
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const getNotesByGroup = (groupId: string) => {
    return notes.filter((note) => note.groupId === groupId);
  };

  const getGroupColor = (groupId: string) => {
    return groups.find((g) => g.id === groupId)?.color || "hsl(215, 20%, 65%)";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return format(date, "h:mm a");
    } else if (diffDays === 1) {
      return "Yesterday";
    } else {
      return format(date, "MMM d");
    }
  };

  const handleSave = (note: Note) => {
    onSaveNote(note);
    setLastSaved(new Date());
  };

  return (
    <div className="flex h-[calc(100vh-120px)] border border-border rounded-lg overflow-hidden bg-card">
      {/* Left Panel - Notes List */}
      <div className="w-72 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm text-foreground">Notes</h2>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCreateNote}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-4">
            {groups.map((group) => {
              const groupNotes = getNotesByGroup(group.id);
              if (groupNotes.length === 0) return null;

              return (
                <div key={group.id}>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {group.name}
                  </div>
                  <div className="space-y-1">
                    {groupNotes.map((note) => (
                      <div
                        key={note.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedNote?.id === note.id
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => onSelectNote(note)}
                      >
                        <h3 className="font-medium text-sm text-foreground line-clamp-1 mb-1">
                          {note.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {note.plainText || "No content"}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDate(note.updatedAt)}
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-xs px-1.5 py-0"
                            style={{ backgroundColor: `${group.color}20`, color: group.color }}
                          >
                            {group.name}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Editor */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: `${getGroupColor(selectedNote.groupId)}20`,
                    color: getGroupColor(selectedNote.groupId),
                  }}
                >
                  {groups.find((g) => g.id === selectedNote.groupId)?.name}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Last edited {format(new Date(selectedNote.updatedAt), "MMM d 'at' h:mm a")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-auto p-6">
              <NotesEditor
                note={selectedNote}
                groups={groups}
                onSave={handleSave}
                onBack={onBack}
                lastSaved={lastSaved}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="mb-2">Select a note to view</p>
              <Button onClick={onCreateNote} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create new note
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
