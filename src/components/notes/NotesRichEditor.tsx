import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Tag, X, ChevronRight, Trash2, Save, Check, Loader2 } from "lucide-react";
import type { Note, NoteGroup, NoteFolder } from "@/pages/Notes";
import { EvernoteToolbarEditor, type EvernoteToolbarEditorRef } from "@/components/editor/EvernoteToolbarEditor";
import type { SaveStatus } from "@/components/editor/types";

interface NotesRichEditorProps {
  note: Note;
  groups: NoteGroup[];
  folders?: NoteFolder[];
  onSave: (note: Note) => void;
  onBack: () => void;
  onDelete?: () => void;
  lastSaved?: Date | null;
  showBreadcrumb?: boolean;
}

export function NotesRichEditor({ 
  note, 
  groups, 
  folders = [], 
  onSave, 
  onBack,
  onDelete, 
  lastSaved, 
  showBreadcrumb = true 
}: NotesRichEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [tags, setTags] = useState<string[]>(note.tags);
  const [newTag, setNewTag] = useState("");
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [contentRich, setContentRich] = useState(note.contentRich || note.plainText || '');
  const [plainText, setPlainText] = useState(note.plainText || '');
  
  const titleRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<EvernoteToolbarEditorRef>(null);

  // Auto-focus title for new notes
  useEffect(() => {
    if (!note.title && titleRef.current) {
      titleRef.current.focus();
    }
  }, [note.id]);

  // Sync state when note changes
  useEffect(() => {
    setTitle(note.title);
    setTags(note.tags);
    setContentRich(note.contentRich || note.plainText || '');
    setPlainText(note.plainText || '');
    setSaveStatus('saved');
  }, [note.id]);

  const handleSave = useCallback(() => {
    const currentContent = editorRef.current?.getHTML() || contentRich;
    const currentText = editorRef.current?.getText() || plainText;
    
    onSave({
      ...note,
      title,
      contentRich: currentContent,
      plainText: currentText,
      tags,
    });
  }, [note, title, tags, contentRich, plainText, onSave]);

  const handleContentChange = useCallback(({ contentRich: newRich, plainText: newPlain }: { contentRich: string; plainText: string }) => {
    setContentRich(newRich);
    setPlainText(newPlain);
  }, []);

  const handleEditorSave = useCallback(({ contentRich: newRich, plainText: newPlain }: { contentRich: string; plainText: string }) => {
    onSave({
      ...note,
      title,
      contentRich: newRich,
      plainText: newPlain,
      tags,
    });
  }, [note, title, tags, onSave]);

  // Autosave title and tags changes
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSave();
    }, 1500);
    return () => clearTimeout(timer);
  }, [title, tags]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const group = groups.find((g) => g.id === note.groupId);
  const folder = folders.find((f) => f.id === note.folderId);

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    return lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getSaveStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </span>
        );
      case 'unsaved':
        return <span className="text-muted-foreground">Unsaved</span>;
      case 'saved':
      default:
        return (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Check className="h-3 w-3" />
            {formatLastSaved() ? `Saved ${formatLastSaved()}` : 'Saved'}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar with Breadcrumb */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              handleSave();
              onBack();
            }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Done
          </button>
          
          {/* Persistent Breadcrumb */}
          {showBreadcrumb && group && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground/70 ml-4">
              <span style={{ color: group.color }}>{group.name}</span>
              {folder && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span>{folder.name}</span>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Save status */}
          <span className="text-xs hidden sm:flex items-center">
            {getSaveStatusDisplay()}
          </span>
          
          {/* Save button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={handleSave}
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
          
          {/* Tags popover */}
          <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Tag className="h-4 w-4" />
                <span className="hidden sm:inline">Tags</span>
                {tags.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                    {tags.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button size="sm" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Delete button */}
          {onDelete && (
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                if (confirm("Delete this note?")) {
                  onDelete();
                }
              }}
              title="Delete note"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Tags Display */}
        {tags.length > 0 && (
          <div className="flex gap-1 px-6 pt-4 max-w-4xl mx-auto w-full">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <div className="px-6 pt-4 max-w-4xl mx-auto w-full">
          <Input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Note"
            className="text-3xl font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0 text-foreground"
          />
        </div>

        {/* Tiptap Editor - Full width toolbar, constrained content */}
        <div className="flex-1 overflow-hidden">
          <EvernoteToolbarEditor
            ref={editorRef}
            initialContentRich={note.contentRich || note.plainText || ''}
            onContentChange={handleContentChange}
            onSave={handleEditorSave}
            onSaveStatusChange={setSaveStatus}
            autosaveDebounce={1500}
            placeholder="Start typing here..."
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
