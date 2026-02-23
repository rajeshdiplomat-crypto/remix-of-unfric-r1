import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Trash2, Save, Loader2, Check, Maximize2, Minimize2 } from "lucide-react";
import { NotesRichEditor } from "./NotesRichEditor";
import { cn } from "@/lib/utils";
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
  const [editorControls, setEditorControls] = useState<{
    triggerSave: () => void;
    saveStatus: "saved" | "saving" | "unsaved";
    toggleFullscreen: () => void;
    isFullscreen: boolean;
  } | null>(null);

  const getGroupColor = (groupId: string) => groups.find((g) => g.id === groupId)?.color || "hsl(215, 20%, 65%)";
  const groupName = groups.find((g) => g.id === note.groupId)?.name || "Inbox";
  const folderName = note.folderId ? folders.find((f) => f.id === note.folderId)?.name : null;

  const saveStatus = editorControls?.saveStatus || "saved";

  const handleEditorReady = useCallback((controls: any) => {
    setEditorControls(controls);
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex flex-col bg-card" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Top row: Back + breadcrumb + save + fullscreen + delete */}
      <div className="shrink-0 border-b border-border/50 bg-card/95 backdrop-blur-md">
        <div className="flex items-center gap-1 px-2 py-1.5">
          {/* Back */}
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

          {/* Save button */}
          <Button
            size="sm"
            onClick={() => editorControls?.triggerSave()}
            className={cn(
              "h-7 px-2 gap-1 text-xs shrink-0 transition-all duration-300 rounded-lg",
              saveStatus === "saved"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : saveStatus === "saving"
                ? "bg-muted text-muted-foreground pointer-events-none"
                : "bg-primary hover:bg-primary/90 text-primary-foreground animate-pulse"
            )}
          >
            {saveStatus === "saving" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : saveStatus === "saved" ? (
              <Check className="h-3 w-3" />
            ) : (
              <Save className="h-3 w-3" />
            )}
          </Button>

          {/* Fullscreen toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => editorControls?.toggleFullscreen()}
          >
            {editorControls?.isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>

          {/* Delete */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg shrink-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
            onClick={() => { onDelete(note.id); onBack(); }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Editor — toolbar becomes row 2 */}
      <div className="flex-1 overflow-hidden">
        <NotesRichEditor
          note={note}
          groups={groups}
          folders={folders}
          onSave={onSave}
          onBack={onBack}
          onFullscreenChange={setIsEditorFullscreen}
          onEditorReady={handleEditorReady}
          hideTopActions
        />
      </div>
    </div>,
    document.body
  );
}
