import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowLeft, Tag, Undo2, Redo2, Bold, Italic, Underline, AlignLeft, AlignCenter, 
  AlignRight, List, ListOrdered, CheckSquare, Link2, Image, Pencil, X 
} from "lucide-react";
import type { Note, NoteGroup } from "@/pages/Notes";
import { NotesScribbleCanvas } from "./NotesScribbleCanvas";

interface NotesRichEditorProps {
  note: Note;
  groups: NoteGroup[];
  onSave: (note: Note) => void;
  onBack: () => void;
  lastSaved?: Date | null;
}

const FONTS = [
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Courier New', monospace", label: "Mono" },
  { value: "'Playfair Display', serif", label: "Playfair" },
];

const FONT_SIZES = ["12", "14", "16", "18", "20", "24", "28", "32"];

export function NotesRichEditor({ note, groups, onSave, onBack, lastSaved }: NotesRichEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [tags, setTags] = useState<string[]>(note.tags);
  const [newTag, setNewTag] = useState("");
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [scribbleOpen, setScribbleOpen] = useState(false);
  const [scribbleData, setScribbleData] = useState<string | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  
  const editorRef = useRef<HTMLDivElement>(null);
  const [currentFont, setCurrentFont] = useState(FONTS[0].value);
  const [currentSize, setCurrentSize] = useState("16");
  
  // Track formatting state
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  // Undo/Redo history
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    setTitle(note.title);
    setTags(note.tags);
    if (editorRef.current) {
      editorRef.current.innerHTML = note.contentRich || note.plainText || "";
      // Initialize history
      setHistory([note.contentRich || note.plainText || ""]);
      setHistoryIndex(0);
    }
  }, [note.id]);

  // Save to history on content change
  const saveToHistory = useCallback(() => {
    if (!editorRef.current) return;
    const content = editorRef.current.innerHTML;
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(content);
      return newHistory.slice(-50); // Keep last 50 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Update formatting state on selection change
  const updateFormattingState = useCallback(() => {
    setIsBold(document.queryCommandState("bold"));
    setIsItalic(document.queryCommandState("italic"));
    setIsUnderline(document.queryCommandState("underline"));
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", updateFormattingState);
    return () => document.removeEventListener("selectionchange", updateFormattingState);
  }, [updateFormattingState]);

  // Auto-save effect
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSave();
    }, 2000);
    return () => clearTimeout(timer);
  }, [title, tags]);

  const handleSave = () => {
    if (!editorRef.current) return;
    const contentRich = editorRef.current.innerHTML;
    const plainText = editorRef.current.textContent || "";
    onSave({
      ...note,
      title,
      contentRich,
      plainText,
      tags,
    });
  };

  const execCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    updateFormattingState();
    saveToHistory();
  };

  const handleUndo = () => {
    if (historyIndex > 0 && editorRef.current) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      editorRef.current.innerHTML = history[newIndex];
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1 && editorRef.current) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      editorRef.current.innerHTML = history[newIndex];
    }
  };

  const handleFontChange = (font: string) => {
    setCurrentFont(font);
    execCommand("fontName", font);
  };

  const handleSizeChange = (size: string) => {
    setCurrentSize(size);
    // Use fontSize command (1-7) or wrap in span with style
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement("span");
      span.style.fontSize = `${size}px`;
      range.surroundContents(span);
      saveToHistory();
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleInsertLink = () => {
    if (!linkUrl) return;
    const text = linkText || linkUrl;
    execCommand("insertHTML", `<a href="${linkUrl}" target="_blank" class="text-primary underline">${text}</a>`);
    setLinkDialogOpen(false);
    setLinkUrl("");
    setLinkText("");
  };

  const handleInsertImage = () => {
    if (!imageUrl) return;
    execCommand("insertHTML", `<img src="${imageUrl}" alt="Image" class="max-w-full h-auto rounded-lg my-2" />`);
    setImageDialogOpen(false);
    setImageUrl("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      execCommand("insertHTML", `<img src="${dataUrl}" alt="Image" class="max-w-full h-auto rounded-lg my-2" />`);
    };
    reader.readAsDataURL(file);
    setImageDialogOpen(false);
  };

  const handleSaveScribble = (dataUrl: string) => {
    setScribbleData(dataUrl);
    execCommand("insertHTML", `<img src="${dataUrl}" alt="Scribble" class="max-w-full h-auto rounded-lg my-2 border border-border" />`);
    setScribbleOpen(false);
  };

  const insertChecklist = () => {
    execCommand("insertHTML", `
      <div class="flex items-start gap-2 my-1">
        <input type="checkbox" class="mt-1 h-4 w-4 rounded border-border" />
        <span contenteditable="true">Checklist item</span>
      </div>
    `);
  };

  const group = groups.find((g) => g.id === note.groupId);

  const formatLastSaved = () => {
    if (!lastSaved) return "Not saved";
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    if (diff < 60000) return "Last edited just now";
    if (diff < 3600000) return `Last edited ${Math.floor(diff / 60000)} min ago`;
    return `Last edited at ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  const handleContentInput = () => {
    saveToHistory();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/30">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Notes
        </button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{formatLastSaved()}</span>
          <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Tag className="h-4 w-4" />
                Add tags
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
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleSave}>
            Done
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-border/30">
        <div className="flex items-center gap-1 flex-wrap">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          
          <Select value={currentFont} onValueChange={handleFontChange}>
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((font) => (
                <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={currentSize} onValueChange={handleSizeChange}>
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((size) => (
                <SelectItem key={size} value={size}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Button 
            variant={isBold ? "secondary" : "ghost"} 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => execCommand("bold")}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            variant={isItalic ? "secondary" : "ghost"} 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => execCommand("italic")}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button 
            variant={isUnderline ? "secondary" : "ghost"} 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => execCommand("underline")}
          >
            <Underline className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("justifyLeft")}>
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("justifyCenter")}>
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("justifyRight")}>
            <AlignRight className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("insertUnorderedList")}>
            <List className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("insertOrderedList")}>
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={insertChecklist}>
            <CheckSquare className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setImageDialogOpen(true)}>
            <Image className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLinkDialogOpen(true)}>
            <Link2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScribbleOpen(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Group Badge */}
          {group && (
            <div className="flex items-center gap-2 mb-4">
              <Badge
                variant="secondary"
                style={{ backgroundColor: `${group.color}20`, color: group.color }}
              >
                {group.name}
              </Badge>
              {tags.length > 0 && (
                <div className="flex gap-1">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Note"
            className="text-3xl font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0 text-foreground mb-4"
          />

          {/* Rich Text Content */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleContentInput}
            onBlur={handleSave}
            className="min-h-[400px] outline-none text-foreground leading-relaxed prose prose-sm max-w-none focus:outline-none empty:before:content-['Start_typing_here...'] empty:before:text-muted-foreground"
            style={{ fontFamily: currentFont, fontSize: `${currentSize}px` }}
            data-placeholder="Start typing here..."
          />
        </div>
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">URL</label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Display Text (optional)</label>
              <Input
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Link text"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleInsertLink} disabled={!linkUrl}>
                Insert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Image URL</label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="text-center text-sm text-muted-foreground">or</div>
            <div>
              <label className="text-sm font-medium mb-2 block">Upload Image</label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setImageDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleInsertImage} disabled={!imageUrl}>
                Insert URL
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scribble Dialog */}
      <NotesScribbleCanvas
        open={scribbleOpen}
        onOpenChange={setScribbleOpen}
        onSave={handleSaveScribble}
        initialData={scribbleData}
      />
    </div>
  );
}
