import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import { Extension } from "@tiptap/core";
import ImageResize from "tiptap-extension-resize-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  CheckSquare,
  Link2,
  Image as ImageIcon,
  Highlighter,
  Sparkles,
  Loader2,
  Check,
  Save,
  ChevronDown,
  Type,
  MoreHorizontal,
  Quote,
  Code,
  Minus,
  Strikethrough,
  Palette,
  ImagePlus,
  Maximize2,
  Minimize2,
  X,
  PenTool,
  Eraser,
  Trash2,
  Pen,
  Pencil,
  Brush,
  Circle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Note, NoteGroup, NoteFolder } from "@/pages/Notes";

// Font Size Extension
const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => el.style.fontSize?.replace(/['"px]+/g, ""),
            renderHTML: (attrs) => (attrs.fontSize ? { style: `font-size: ${attrs.fontSize}px` } : {}),
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }: any) =>
          chain().setMark("textStyle", { fontSize }).run(),
    };
  },
});

interface NotesRichEditorProps {
  note: Note;
  groups: NoteGroup[];
  folders?: NoteFolder[];
  onSave: (note: Note) => void;
  onBack: () => void;
}

const FONTS = [
  { value: "inter", label: "Inter", css: "Inter, system-ui, sans-serif" },
  { value: "georgia", label: "Georgia", css: "Georgia, Cambria, serif" },
  { value: "times", label: "Times", css: '"Times New Roman", Times, serif' },
  { value: "courier", label: "Courier", css: '"Courier New", Courier, monospace' },
  { value: "arial", label: "Arial", css: "Arial, Helvetica, sans-serif" },
];

const SIZES = ["12", "14", "16", "18", "20", "24", "28", "32"];
const TEXT_COLORS = ["#1a1a1a", "#dc2626", "#ea580c", "#16a34a", "#2563eb", "#7c3aed", "#db2777"];
const HIGHLIGHT_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#fed7aa", "#e9d5ff"];

// Diary Themes
const PAGE_THEMES = [
  { id: "white", label: "White", value: "#ffffff", lineColor: "#e5e7eb", textColor: "#1a1a1a" },
  { id: "cream", label: "Cream", value: "#fefce8", lineColor: "#d4c89d", textColor: "#44403c" },
  { id: "aged", label: "Antique", value: "#f5f0e1", lineColor: "#c9b896", textColor: "#5c4f3a" },
  { id: "night", label: "Night", value: "#1e1e2e", lineColor: "#404060", textColor: "#cdd6f4" },
  { id: "rose", label: "Rose", value: "#fff1f2", lineColor: "#fda4af", textColor: "#881337" },
  { id: "lavender", label: "Lavender", value: "#faf5ff", lineColor: "#d8b4fe", textColor: "#581c87" },
];

const LINE_STYLES = [
  { id: "none", label: "Blank", preview: "⬜" },
  { id: "ruled", label: "Ruled", preview: "📝" },
  { id: "grid", label: "Grid", preview: "📐" },
  { id: "dotted", label: "Dots", preview: "⚫" },
  { id: "college", label: "College", preview: "📕" },
];

// Page dimensions
const LINE_HEIGHT = 26;
const LINES_PER_PAGE = 16; // Lines that fit on one diary page
const CHARS_PER_LINE = 45; // Approximate chars per line

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export function NotesRichEditor({ note, groups, onSave, onBack }: NotesRichEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [tags, setTags] = useState<string[]>(note.tags);
  const [newTag, setNewTag] = useState("");
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [currentFont, setCurrentFont] = useState("inter");
  const [currentSize, setCurrentSize] = useState("16");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Diary States
  const [pageTheme, setPageTheme] = useState("cream");
  const [lineStyle, setLineStyle] = useState("ruled");
  const [diaryMode, setDiaryMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Scribble states
  const [scribbleMode, setScribbleMode] = useState(false);
  const [scribbleColor, setScribbleColor] = useState("#1a1a1a");
  const [penWidth, setPenWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContent = useRef(note.contentRich || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTheme = PAGE_THEMES.find((t) => t.id === pageTheme) || PAGE_THEMES[1];

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Start writing your thoughts..." }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      Link.configure({ openOnClick: false }),
      ImageResize,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      FontSize,
    ],
    content: note.contentRich || "",
    editorProps: { attributes: { class: "diary-editor focus:outline-none min-h-[200px]" } },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html !== lastSavedContent.current) {
        setSaveStatus("unsaved");
        if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        autosaveTimer.current = setTimeout(() => handleSave(), 4000);
      }
    },
  });

  // Split content into pages for diary mode
  const paginatedContent = useMemo(() => {
    if (!editor) return [];
    const text = editor.getText();
    const lines = text.split("\n");
    const pages: string[][] = [];
    let currentPageLines: string[] = [];

    for (const line of lines) {
      // Calculate how many visual lines this text line takes
      const wrappedLines = Math.ceil(Math.max(1, line.length) / CHARS_PER_LINE);

      if (currentPageLines.length + wrappedLines > LINES_PER_PAGE) {
        if (currentPageLines.length > 0) {
          pages.push([...currentPageLines]);
        }
        currentPageLines = [line];
      } else {
        currentPageLines.push(line);
      }
    }

    if (currentPageLines.length > 0) {
      pages.push(currentPageLines);
    }

    return pages.length > 0 ? pages : [[""]];
  }, [editor?.getText()]);

  const totalPages = paginatedContent.length;

  // Get line style CSS
  const getLineStyleCSS = (): React.CSSProperties => {
    const lc = currentTheme.lineColor;
    switch (lineStyle) {
      case "ruled":
        return {
          backgroundImage: `repeating-linear-gradient(transparent 0px, transparent ${LINE_HEIGHT - 1}px, ${lc} ${LINE_HEIGHT - 1}px, ${lc} ${LINE_HEIGHT}px)`,
        };
      case "grid":
        return {
          backgroundImage: `linear-gradient(${lc} 1px, transparent 1px), linear-gradient(90deg, ${lc} 1px, transparent 1px)`,
          backgroundSize: `${LINE_HEIGHT}px ${LINE_HEIGHT}px`,
        };
      case "dotted":
        return {
          backgroundImage: `radial-gradient(circle, ${lc} 1px, transparent 1px)`,
          backgroundSize: `${LINE_HEIGHT}px ${LINE_HEIGHT}px`,
        };
      case "college":
        return {
          backgroundImage: `repeating-linear-gradient(transparent 0px, transparent ${LINE_HEIGHT - 1}px, ${lc} ${LINE_HEIGHT - 1}px, ${lc} ${LINE_HEIGHT}px)`,
        };
      default:
        return {};
    }
  };

  // Scribble functions
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.stroke();
    });
  }, [strokes]);

  useEffect(() => {
    if (scribbleMode && canvasRef.current && containerRef.current) {
      canvasRef.current.width = containerRef.current.offsetWidth;
      canvasRef.current.height = Math.max(containerRef.current.offsetHeight, 500);
      redrawCanvas();
    }
  }, [scribbleMode, redrawCanvas]);

  useEffect(() => {
    if (scribbleMode) redrawCanvas();
  }, [strokes, scribbleMode, redrawCanvas]);

  useEffect(() => {
    if (editor && note.contentRich !== editor.getHTML()) {
      editor.commands.setContent(note.contentRich || "");
      lastSavedContent.current = note.contentRich || "";
    }
    setTitle(note.title);
    setTags(note.tags);
    setSaveStatus("saved");
    if (note.scribbleStrokes) {
      try {
        setStrokes(JSON.parse(note.scribbleStrokes));
      } catch {}
    }
  }, [note.id, editor]);

  const handleSave = useCallback(() => {
    if (!editor) return;
    setSaveStatus("saving");
    const html = editor.getHTML();
    const noteData: any = {
      ...note,
      title,
      contentRich: html,
      plainText: editor.getText(),
      tags,
      updatedAt: new Date().toISOString(),
    };
    if (strokes.length > 0) noteData.scribbleStrokes = JSON.stringify(strokes);
    onSave(noteData);
    lastSavedContent.current = html;
    setTimeout(() => setSaveStatus("saved"), 500);
  }, [editor, note, title, tags, strokes, onSave]);

  const getCanvasPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent) => {
    if (!scribbleMode) return;
    const pos = getCanvasPos(e);
    lastPos.current = pos;
    setIsDrawing(true);
    setCurrentStroke({ points: [pos], color: scribbleColor, width: penWidth });
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !scribbleMode || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const pos = getCanvasPos(e);
    if (currentStroke) setCurrentStroke((prev) => (prev ? { ...prev, points: [...prev.points, pos] } : null));
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = scribbleColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = "round";
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke && currentStroke.points.length > 1) {
      setUndoStack((prev) => [...prev, [...strokes]]);
      setStrokes((prev) => [...prev, currentStroke]);
      setCurrentStroke(null);
      setSaveStatus("unsaved");
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    setStrokes(undoStack[undoStack.length - 1]);
    setUndoStack((prev) => prev.slice(0, -1));
    setSaveStatus("unsaved");
  };

  const clearScribble = () => {
    setUndoStack((prev) => [...prev, [...strokes]]);
    setStrokes([]);
    setSaveStatus("unsaved");
  };

  const handleFontChange = (v: string) => {
    setCurrentFont(v);
    const f = FONTS.find((x) => x.value === v);
    if (f && editor) editor.chain().focus().setFontFamily(f.css).run();
  };
  const handleSizeChange = (v: string) => {
    setCurrentSize(v);
    if (editor) (editor.chain().focus() as any).setFontSize(v).run();
  };
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
      setSaveStatus("unsaved");
    }
  };
  const handleTitleChange = (v: string) => {
    setTitle(v);
    setSaveStatus("unsaved");
  };
  const handleInsertLink = () => {
    if (!linkUrl || !editor) return;
    const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
    editor.state.selection.empty
      ? editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run()
      : editor.chain().focus().setLink({ href: url }).run();
    setLinkDialogOpen(false);
    setLinkUrl("");
  };
  const handleInsertImage = () => {
    if (!imageUrl || !editor) return;
    (editor.commands as any).setResizableImage({ src: imageUrl });
    setImageDialogOpen(false);
    setImageUrl("");
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = (ev) => (editor.commands as any).setResizableImage({ src: ev.target?.result as string });
    reader.readAsDataURL(file);
    setImageDialogOpen(false);
  };

  const group = groups.find((g) => g.id === note.groupId);
  if (!editor) return null;

  const ToolBtn = ({ onClick, active, disabled, children, title: t }: any) => (
    <button
      type="button"
      title={t}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-8 w-8 flex items-center justify-center rounded-md transition-colors text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30",
        active && "bg-slate-200 text-primary",
      )}
    >
      {children}
    </button>
  );

  return (
    <div
      className={
        isFullscreen ? "fixed inset-0 z-[9999] flex flex-col bg-white" : "flex flex-col h-full w-full overflow-hidden"
      }
    >
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {/* TOOLBAR */}
      <div className="shrink-0 bg-white border-b border-slate-200 relative z-[100]">
        <div className="flex items-center h-11 px-2 gap-0.5 overflow-x-auto">
          <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
            <Undo2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            <Redo2 className="h-4 w-4" />
          </ToolBtn>
          <div className="w-px h-5 bg-slate-200 mx-1" />

          <Select value={currentFont} onValueChange={handleFontChange}>
            <SelectTrigger className="h-8 w-24 text-xs border-0 bg-slate-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[99999]">
              {FONTS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={currentSize} onValueChange={handleSizeChange}>
            <SelectTrigger className="h-8 w-14 text-xs border-0 bg-slate-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[99999]">
              {SIZES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="w-px h-5 bg-slate-200 mx-1" />

          <ToolBtn
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolBtn>
          <div className="w-px h-5 bg-slate-200 mx-1" />

          <ToolBtn
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullets"
          >
            <List className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Numbers"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            active={editor.isActive("taskList")}
            title="Todo"
          >
            <CheckSquare className="h-4 w-4" />
          </ToolBtn>
          <div className="w-px h-5 bg-slate-200 mx-1" />

          <ToolBtn onClick={() => setLinkDialogOpen(true)} title="Link">
            <Link2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => setImageDialogOpen(true)} title="Image">
            <ImageIcon className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => setScribbleMode(!scribbleMode)} active={scribbleMode} title="Scribble">
            <PenTool className="h-4 w-4" />
          </ToolBtn>
          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Theme Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 px-2 flex items-center gap-1 rounded-md hover:bg-slate-100" title="Theme">
                <div className="w-4 h-4 rounded border" style={{ backgroundColor: currentTheme.value }} />
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-[99999]">
              {PAGE_THEMES.map((t) => (
                <DropdownMenuItem key={t.id} onClick={() => setPageTheme(t.id)} className="gap-2">
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: t.value }} />
                  <span>{t.label}</span>
                  {pageTheme === t.id && <Check className="h-3 w-3 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Line Style */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 px-2 flex items-center gap-1 rounded-md hover:bg-slate-100" title="Lines">
                <span>{LINE_STYLES.find((l) => l.id === lineStyle)?.preview}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-[99999]">
              {LINE_STYLES.map((l) => (
                <DropdownMenuItem key={l.id} onClick={() => setLineStyle(l.id)} className="gap-2">
                  <span>{l.preview}</span>
                  <span>{l.label}</span>
                  {lineStyle === l.id && <Check className="h-3 w-3 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Diary Mode Toggle */}
          <button
            onClick={() => {
              setDiaryMode(!diaryMode);
              setCurrentPage(0);
            }}
            className={cn(
              "h-8 px-3 rounded-md text-xs font-medium flex items-center gap-1",
              diaryMode ? "bg-amber-100 text-amber-700" : "hover:bg-slate-100",
            )}
            title="Diary Mode"
          >
            📖 Diary
          </button>

          <div className="flex-1" />

          <span
            className={cn(
              "text-xs px-2 py-1 rounded-full",
              saveStatus === "saving" && "bg-amber-100 text-amber-700",
              saveStatus === "saved" && "bg-emerald-100 text-emerald-700",
              saveStatus === "unsaved" && "bg-slate-100 text-slate-500",
            )}
          >
            {saveStatus === "saving" && (
              <>
                <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                Saving
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check className="h-3 w-3 inline mr-1" />
                Saved
              </>
            )}
            {saveStatus === "unsaved" && "Unsaved"}
          </span>
          <Button size="sm" onClick={handleSave} className="h-8 gap-1 bg-emerald-500 text-white">
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
          <ToolBtn onClick={() => setIsFullscreen(!isFullscreen)} title="Fullscreen">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </ToolBtn>
        </div>
      </div>

      {/* SCRIBBLE TOOLBAR */}
      {scribbleMode && (
        <div className="shrink-0 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-3 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-amber-700">✏️ Scribble</span>
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="p-1.5 rounded-lg hover:bg-amber-100 disabled:opacity-30"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <div className="w-px h-5 bg-amber-300" />
            <div className="flex gap-1">
              {["#1a1a1a", "#dc2626", "#2563eb", "#16a34a", "#7c3aed"].map((c) => (
                <button
                  key={c}
                  onClick={() => setScribbleColor(c)}
                  className={cn(
                    "w-5 h-5 rounded-full border-2",
                    scribbleColor === c ? "border-amber-700 ring-2 ring-amber-300" : "border-white shadow",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <select
              value={penWidth}
              onChange={(e) => setPenWidth(Number(e.target.value))}
              className="h-7 text-xs border border-amber-300 rounded px-1 bg-white"
            >
              <option value="1">Fine</option>
              <option value="2">Medium</option>
              <option value="4">Thick</option>
            </select>
            <div className="flex-1" />
            <button
              onClick={clearScribble}
              className="px-2 py-1 text-xs rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" /> Clear
            </button>
            <button
              onClick={() => setScribbleMode(false)}
              className="px-3 py-1 text-xs font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* CONTENT AREA */}
      {diaryMode ? (
        /* PAGINATED DIARY MODE - Text flows to next page */
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4 overflow-hidden">
          <div className="relative flex items-center gap-6">
            {/* Prev Page */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 transition-all hover:scale-105"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Book Spread */}
            <div className="flex shadow-2xl rounded-lg overflow-hidden" style={{ perspective: "1500px" }}>
              {/* Left Page */}
              <div
                className="w-[320px] h-[450px] overflow-hidden border-r-2 border-amber-300/50 relative"
                style={{
                  backgroundColor: currentTheme.value,
                  ...getLineStyleCSS(),
                  transform: "rotateY(-2deg)",
                  transformOrigin: "right",
                }}
              >
                {lineStyle === "college" && <div className="absolute left-10 top-0 bottom-0 w-[1px] bg-red-400/60" />}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-muted-foreground/40">
                  {currentPage * 2 > 0 ? currentPage * 2 : ""}
                </div>
                <div
                  className="h-full p-5 overflow-hidden"
                  style={{
                    color: currentTheme.textColor,
                    paddingLeft: lineStyle === "college" ? "50px" : "20px",
                    lineHeight: `${LINE_HEIGHT}px`,
                  }}
                >
                  {currentPage === 0 ? (
                    <div className="flex items-center justify-center h-full text-4xl opacity-20">📖</div>
                  ) : (
                    <div style={{ whiteSpace: "pre-wrap" }}>
                      {paginatedContent[currentPage * 2 - 1]?.join("\n") || ""}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Page - Shows paginated content */}
              <div
                className="w-[320px] h-[450px] overflow-hidden relative"
                style={{
                  backgroundColor: currentTheme.value,
                  ...getLineStyleCSS(),
                  transform: "rotateY(2deg)",
                  transformOrigin: "left",
                }}
              >
                {lineStyle === "college" && (
                  <div className="absolute left-10 top-0 bottom-0 w-[1px] bg-red-400/60 z-10" />
                )}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-muted-foreground/40">
                  {currentPage * 2 + 1}
                </div>

                <div
                  className="h-full p-5 overflow-hidden"
                  style={{
                    color: currentTheme.textColor,
                    paddingLeft: lineStyle === "college" ? "50px" : "20px",
                    lineHeight: `${LINE_HEIGHT}px`,
                  }}
                >
                  {currentPage === 0 ? (
                    <>
                      <Input
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Untitled"
                        className="text-lg font-semibold border-none bg-transparent px-0 h-auto focus-visible:ring-0 mb-2"
                        style={{ color: currentTheme.textColor, lineHeight: `${LINE_HEIGHT}px` }}
                      />
                      <div className="flex gap-1 mb-2 flex-wrap">
                        {group && <Badge className="bg-primary/10 text-primary border-0 text-xs">{group.name}</Badge>}
                        {tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      <div
                        style={{
                          whiteSpace: "pre-wrap",
                          maxHeight: `${(LINES_PER_PAGE - 4) * LINE_HEIGHT}px`,
                          overflow: "hidden",
                        }}
                      >
                        {paginatedContent[0]?.join("\n") || ""}
                      </div>
                    </>
                  ) : (
                    <div style={{ whiteSpace: "pre-wrap" }}>{paginatedContent[currentPage * 2]?.join("\n") || ""}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(Math.ceil(totalPages / 2), p + 1))}
              disabled={currentPage >= Math.ceil(totalPages / 2)}
              className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 transition-all hover:scale-105"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Page indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-amber-700 bg-white/80 px-3 py-1 rounded-full shadow">
            Pages {currentPage * 2 + 1}-{Math.min(currentPage * 2 + 2, totalPages)} of {totalPages}
          </div>
        </div>
      ) : (
        /* NORMAL MODE with themed lines */
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto relative"
          style={{ backgroundColor: currentTheme.value, color: currentTheme.textColor, ...getLineStyleCSS() }}
        >
          {lineStyle === "college" && (
            <div
              className="absolute left-14 top-0 bottom-0 w-[1px] pointer-events-none z-10"
              style={{ backgroundColor: "#ef4444" }}
            />
          )}

          <div
            className="min-h-full p-6"
            style={{ paddingLeft: lineStyle === "college" ? "70px" : "24px", lineHeight: `${LINE_HEIGHT}px` }}
          >
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled Note"
              className="text-2xl font-semibold border-none bg-transparent px-0 h-auto focus-visible:ring-0 mb-2"
              style={{ color: currentTheme.textColor, lineHeight: `${LINE_HEIGHT}px` }}
            />
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {group && <Badge className="bg-primary/10 text-primary border-0">{group.name}</Badge>}
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-slate-400">
                    + Tag
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2 z-[99999]">
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Tag"
                      className="h-8"
                      onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                    />
                    <Button size="sm" className="h-8" onClick={handleAddTag}>
                      Add
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <EditorContent editor={editor} />
          </div>

          {/* Scribble Canvas */}
          {scribbleMode && (
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="absolute inset-0 w-full h-full"
              style={{ touchAction: "none", cursor: "crosshair" }}
            />
          )}
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-sm z-[999999]">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              onKeyDown={(e) => e.key === "Enter" && handleInsertLink()}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleInsertLink}>
                Insert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-sm z-[999999]">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL..." />
            <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon className="h-4 w-4 mr-2" /> Upload
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setImageDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleInsertImage} disabled={!imageUrl}>
                Insert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        .diary-editor { line-height: ${LINE_HEIGHT}px !important; }
        .diary-editor p { margin: 0 !important; padding: 0 !important; line-height: ${LINE_HEIGHT}px !important; min-height: ${LINE_HEIGHT}px !important; }
        .diary-editor h1, .diary-editor h2, .diary-editor h3 { margin: 0 !important; line-height: ${LINE_HEIGHT}px !important; }
        .diary-editor ul, .diary-editor ol { margin: 0 !important; line-height: ${LINE_HEIGHT}px !important; }
        .diary-editor li { line-height: ${LINE_HEIGHT}px !important; min-height: ${LINE_HEIGHT}px !important; }
        .diary-editor blockquote { margin: 0 !important; line-height: ${LINE_HEIGHT}px !important; }
        .diary-editor a { color: #3b82f6; text-decoration: underline; }
      `}</style>
    </div>
  );
}
