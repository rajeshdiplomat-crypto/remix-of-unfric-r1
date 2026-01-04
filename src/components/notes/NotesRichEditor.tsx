import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowLeft, Tag, Undo2, Redo2, Bold, Italic, Underline, AlignLeft, AlignCenter, 
  AlignRight, List, ListOrdered, CheckSquare, Link2, Image, Pencil, X, ChevronRight,
  Palette, Highlighter, RemoveFormatting
} from "lucide-react";
import type { Note, NoteGroup, NoteFolder } from "@/pages/Notes";
import { NotesScribbleCanvas } from "./NotesScribbleCanvas";
import { cn } from "@/lib/utils";

interface NotesRichEditorProps {
  note: Note;
  groups: NoteGroup[];
  folders?: NoteFolder[];
  onSave: (note: Note) => void;
  onBack: () => void;
  lastSaved?: Date | null;
  showBreadcrumb?: boolean;
}

const FONTS = [
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Courier New', monospace", label: "Mono" },
  { value: "'Playfair Display', serif", label: "Playfair" },
];

const FONT_SIZES = ["12", "14", "16", "18", "20", "24", "28", "32"];

const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Red", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Yellow", value: "#eab308" },
  { label: "Green", value: "#22c55e" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Purple", value: "#a855f7" },
  { label: "Pink", value: "#ec4899" },
  { label: "Gray", value: "#6b7280" },
];

const HIGHLIGHT_COLORS = [
  { label: "None", value: "" },
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Pink", value: "#fbcfe8" },
  { label: "Purple", value: "#e9d5ff" },
  { label: "Orange", value: "#fed7aa" },
];

export function NotesRichEditor({ 
  note, 
  groups, 
  folders = [], 
  onSave, 
  onBack, 
  lastSaved, 
  showBreadcrumb = true 
}: NotesRichEditorProps) {
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
  const [resizingImage, setResizingImage] = useState<HTMLImageElement | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [currentFont, setCurrentFont] = useState(FONTS[0].value);
  const [currentSize, setCurrentSize] = useState("16");
  
  // Track formatting state
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isBulletList, setIsBulletList] = useState(false);
  const [isNumberedList, setIsNumberedList] = useState(false);

  // Undo/Redo history
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedo = useRef(false);

  // Enable styleWithCSS for better formatting
  useEffect(() => {
    document.execCommand("styleWithCSS", false, "true");
  }, []);

  // Auto-focus title for new notes
  useEffect(() => {
    if (!note.title && titleRef.current) {
      titleRef.current.focus();
    }
  }, [note.id]);

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

  // Save/restore selection helpers
  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      // Only save if selection is inside editor
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  }, []);

  const restoreSelection = useCallback(() => {
    if (savedRangeRef.current && editorRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRangeRef.current);
      }
    }
  }, []);

  // Save to history on content change
  const saveToHistory = useCallback(() => {
    if (!editorRef.current || isUndoRedo.current) return;
    const content = editorRef.current.innerHTML;
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      // Only add if different from last
      if (newHistory[newHistory.length - 1] !== content) {
        newHistory.push(content);
      }
      return newHistory.slice(-50);
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Update formatting state on selection change
  const updateFormattingState = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        setIsBold(document.queryCommandState("bold"));
        setIsItalic(document.queryCommandState("italic"));
        setIsUnderline(document.queryCommandState("underline"));
        setIsBulletList(document.queryCommandState("insertUnorderedList"));
        setIsNumberedList(document.queryCommandState("insertOrderedList"));
      }
    }
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      updateFormattingState();
      saveSelection();
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [updateFormattingState, saveSelection]);

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
    restoreSelection();
    editorRef.current?.focus({ preventScroll: true });
    restoreSelection();
    document.execCommand(command, false, value);
    updateFormattingState();
    saveToHistory();
    saveSelection();
  };

  const handleUndo = () => {
    if (historyIndex > 0 && editorRef.current) {
      isUndoRedo.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      editorRef.current.innerHTML = history[newIndex];
      isUndoRedo.current = false;
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1 && editorRef.current) {
      isUndoRedo.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      editorRef.current.innerHTML = history[newIndex];
      isUndoRedo.current = false;
    }
  };

  const handleFontChange = (font: string) => {
    setCurrentFont(font);
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      restoreSelection();
      execCommand("fontName", font);
    }
  };

  const handleSizeChange = (size: string) => {
    setCurrentSize(size);
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      restoreSelection();
      editorRef.current?.focus({ preventScroll: true });
      restoreSelection();
      const range = selection.getRangeAt(0);
      const span = document.createElement("span");
      span.style.fontSize = `${size}px`;
      try {
        range.surroundContents(span);
        saveToHistory();
        saveSelection();
      } catch {
        // Partial selection - fallback
        execCommand("fontSize", "7");
      }
    }
  };

  const handleTextColor = (color: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      if (color) {
        execCommand("foreColor", color);
      } else {
        execCommand("removeFormat");
      }
    }
  };

  const handleHighlight = (color: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      if (color) {
        execCommand("hiliteColor", color);
      } else {
        execCommand("hiliteColor", "transparent");
      }
    }
  };

  const handleClearFormatting = () => {
    execCommand("removeFormat");
  };

  // Handle bullet list with proper Enter/Backspace behavior
  const handleBulletList = () => {
    execCommand("insertUnorderedList");
  };

  // Handle numbered list with proper Enter/Backspace behavior
  const handleNumberedList = () => {
    execCommand("insertOrderedList");
  };

  // Handle Tab for list nesting
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (isBulletList || isNumberedList) {
        if (e.shiftKey) {
          execCommand("outdent");
        } else {
          execCommand("indent");
        }
      }
    }
    
    // Handle Backspace on empty list item
    if (e.key === "Backspace") {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const li = range.startContainer.parentElement?.closest("li");
        if (li && li.textContent === "") {
          e.preventDefault();
          if (isBulletList) {
            execCommand("insertUnorderedList");
          } else if (isNumberedList) {
            execCommand("insertOrderedList");
          }
        }
      }
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
    restoreSelection();
    execCommand("insertHTML", `<a href="${linkUrl}" target="_blank" class="text-primary underline">${text}</a>`);
    setLinkDialogOpen(false);
    setLinkUrl("");
    setLinkText("");
  };

  const handleInsertImage = () => {
    if (!imageUrl) return;
    insertImageWithResize(imageUrl);
    setImageDialogOpen(false);
    setImageUrl("");
  };

  const insertImageWithResize = (src: string) => {
    const imgHtml = `<div class="note-image-wrapper" contenteditable="false" style="position: relative; display: inline-block; max-width: 100%;">
      <img src="${src}" alt="Image" class="note-image" style="max-width: 100%; height: auto; display: block; cursor: pointer;" />
      <button class="image-delete-btn" style="position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; background: hsl(var(--destructive)); color: white; border: none; border-radius: 50%; cursor: pointer; opacity: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; line-height: 1;" title="Delete image">×</button>
      <div class="resize-handle" style="position: absolute; right: 0; bottom: 0; width: 12px; height: 12px; background: hsl(var(--primary)); cursor: se-resize; border-radius: 2px; opacity: 0;" />
    </div><br/>`;
    execCommand("insertHTML", imgHtml);
    setupImageResizing();
  };

  const setupImageResizing = () => {
    setTimeout(() => {
      if (!editorRef.current) return;
      const wrappers = editorRef.current.querySelectorAll(".note-image-wrapper");
      wrappers.forEach((wrapper) => {
        const img = wrapper.querySelector("img") as HTMLImageElement;
        const handle = wrapper.querySelector(".resize-handle") as HTMLDivElement;
        const deleteBtn = wrapper.querySelector(".image-delete-btn") as HTMLButtonElement;
        
        if (!img || !handle) return;
        
        // Show handle and delete button on hover
        wrapper.addEventListener("mouseenter", () => {
          handle.style.opacity = "1";
          if (deleteBtn) deleteBtn.style.opacity = "1";
        });
        wrapper.addEventListener("mouseleave", () => {
          if (!resizingImage) {
            handle.style.opacity = "0";
            if (deleteBtn) deleteBtn.style.opacity = "0";
          }
        });

        // Handle delete button click
        if (deleteBtn) {
          deleteBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            wrapper.remove();
            saveToHistory();
          });
        }
        
        // Handle resize
        handle.addEventListener("mousedown", (e) => {
          e.preventDefault();
          setResizingImage(img);
          const startX = e.clientX;
          const startWidth = img.offsetWidth;
          
          const onMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = Math.min(
              Math.max(100, startWidth + (moveEvent.clientX - startX)),
              editorRef.current?.offsetWidth || 800
            );
            img.style.width = `${newWidth}px`;
            img.style.height = "auto";
          };
          
          const onMouseUp = () => {
            setResizingImage(null);
            handle.style.opacity = "0";
            saveToHistory();
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
          };
          
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        });
      });
    }, 100);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      insertImageWithResize(dataUrl);
    };
    reader.readAsDataURL(file);
    setImageDialogOpen(false);
  };

  const handleSaveScribble = (dataUrl: string) => {
    setScribbleData(dataUrl);
    insertImageWithResize(dataUrl);
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
  const folder = folders.find((f) => f.id === note.folderId);

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
    setupImageResizing();
  };

  const handleEditorMouseUp = () => {
    saveSelection();
  };

  const handleEditorKeyUp = () => {
    saveSelection();
  };

  // Prevent toolbar from stealing focus
  const preventFocusLoss = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Top Bar with Breadcrumb */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/30 shrink-0">
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
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-border/30 shrink-0">
        <div className="flex items-center gap-1 flex-wrap">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={handleUndo}
            onMouseDown={preventFocusLoss}
            disabled={historyIndex <= 0}
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={handleRedo}
            onMouseDown={preventFocusLoss}
            disabled={historyIndex >= history.length - 1}
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          
          <Select value={currentFont} onValueChange={handleFontChange}>
            <SelectTrigger className="w-24 h-8" onMouseDown={preventFocusLoss}>
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
            <SelectTrigger className="w-16 h-8" onMouseDown={preventFocusLoss}>
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
            onMouseDown={preventFocusLoss}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            variant={isItalic ? "secondary" : "ghost"} 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => execCommand("italic")}
            onMouseDown={preventFocusLoss}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button 
            variant={isUnderline ? "secondary" : "ghost"} 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => execCommand("underline")}
            onMouseDown={preventFocusLoss}
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />

          {/* Text Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Text Color" onMouseDown={preventFocusLoss}>
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="flex flex-wrap gap-1 max-w-[180px]">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color.value || 'default'}
                    onClick={() => handleTextColor(color.value)}
                    onMouseDown={preventFocusLoss}
                    className={cn(
                      "h-6 w-6 rounded border border-border/50 hover:scale-110 transition-transform",
                      !color.value && "bg-foreground"
                    )}
                    style={{ backgroundColor: color.value || undefined }}
                    title={color.label}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Highlight Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Highlight" onMouseDown={preventFocusLoss}>
                <Highlighter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="flex flex-wrap gap-1 max-w-[180px]">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color.value || 'none'}
                    onClick={() => handleHighlight(color.value)}
                    onMouseDown={preventFocusLoss}
                    className={cn(
                      "h-6 w-6 rounded border border-border/50 hover:scale-110 transition-transform",
                      !color.value && "bg-background relative after:absolute after:inset-0 after:bg-[linear-gradient(45deg,transparent_45%,hsl(var(--destructive))_45%,hsl(var(--destructive))_55%,transparent_55%)]"
                    )}
                    style={{ backgroundColor: color.value || undefined }}
                    title={color.label}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Clear Formatting */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={handleClearFormatting}
            onMouseDown={preventFocusLoss}
            title="Clear Formatting"
          >
            <RemoveFormatting className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("justifyLeft")} onMouseDown={preventFocusLoss} title="Align Left">
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("justifyCenter")} onMouseDown={preventFocusLoss} title="Align Center">
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("justifyRight")} onMouseDown={preventFocusLoss} title="Align Right">
            <AlignRight className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Button 
            variant={isBulletList ? "secondary" : "ghost"} 
            size="icon" 
            className="h-8 w-8" 
            onClick={handleBulletList}
            onMouseDown={preventFocusLoss}
            title="Bullet List (Tab to nest, Shift+Tab to outdent)"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button 
            variant={isNumberedList ? "secondary" : "ghost"} 
            size="icon" 
            className="h-8 w-8" 
            onClick={handleNumberedList}
            onMouseDown={preventFocusLoss}
            title="Numbered List (Tab to nest, Shift+Tab to outdent)"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={insertChecklist} onMouseDown={preventFocusLoss} title="Checklist">
            <CheckSquare className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setImageDialogOpen(true)} onMouseDown={preventFocusLoss} title="Insert Image">
            <Image className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLinkDialogOpen(true)} onMouseDown={preventFocusLoss} title="Insert Link">
            <Link2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScribbleOpen(true)} onMouseDown={preventFocusLoss} title="Draw">
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 pb-24">
          {/* Tags Display */}
          {tags.length > 0 && (
            <div className="flex gap-1 mb-4">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Title */}
          <Input
            ref={titleRef}
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
            onKeyDown={handleKeyDown}
            onMouseUp={handleEditorMouseUp}
            onKeyUp={handleEditorKeyUp}
            className="min-h-[400px] outline-none text-foreground leading-relaxed focus:outline-none [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:my-1 [&_ul_ul]:list-circle [&_ol_ol]:list-lower-alpha"
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
