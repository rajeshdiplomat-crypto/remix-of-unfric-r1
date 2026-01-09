// COMPLETE NotesRichEditor.tsx - Copy this entire file to Lovable
// Features: 12 themes, 5 line styles, background upload, real diary book view

import { useState, useEffect, useRef, useCallback } from "react";
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
  BookOpen,
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
];

const SIZES = ["12", "14", "16", "18", "20", "24", "28", "32"];
const TEXT_COLORS = ["#1a1a1a", "#dc2626", "#ea580c", "#16a34a", "#2563eb", "#7c3aed", "#db2777"];
const HIGHLIGHT_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#fed7aa", "#e9d5ff"];
const SCRIBBLE_COLORS = ["#1a1a1a", "#dc2626", "#2563eb", "#16a34a", "#7c3aed", "#ea580c"];

const PEN_TYPES = [
  { id: "pen", label: "Pen", icon: Pen, opacity: 1 },
  { id: "pencil", label: "Pencil", icon: Pencil, opacity: 0.7 },
];

// PAGE THEMES
const PAGE_THEMES = [
  { id: "white", label: "White", value: "#ffffff", lineColor: "#d1d5db", textColor: "#1f2937" },
  { id: "cream", label: "Cream", value: "#fefce8", lineColor: "#d4c89d", textColor: "#44403c" },
  { id: "aged", label: "Aged", value: "#f5f0e1", lineColor: "#c9b896", textColor: "#5c4f3a" },
  { id: "kraft", label: "Kraft", value: "#d9c7a7", lineColor: "#b8a47e", textColor: "#3d3326" },
  { id: "night", label: "Night", value: "#1e1e2e", lineColor: "#45475a", textColor: "#cdd6f4" },
  { id: "rose", label: "Rose", value: "#fff1f2", lineColor: "#fda4af", textColor: "#881337" },
  { id: "sky", label: "Sky", value: "#f0f9ff", lineColor: "#7dd3fc", textColor: "#0c4a6e" },
  { id: "mint", label: "Mint", value: "#f0fdf4", lineColor: "#86efac", textColor: "#14532d" },
  { id: "lavender", label: "Lavender", value: "#faf5ff", lineColor: "#d8b4fe", textColor: "#581c87" },
];

// LINE STYLES
const LINE_STYLES = [
  { id: "none", label: "Blank", preview: "⬜" },
  { id: "ruled", label: "Ruled", preview: "📝" },
  { id: "grid", label: "Grid", preview: "📐" },
  { id: "dotted", label: "Dots", preview: "⚫" },
  { id: "college", label: "College", preview: "📕" },
];

const LINE_HEIGHT = 28; // Must sync with text

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  penType: string;
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
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [diaryMode, setDiaryMode] = useState(true);

  // Scribble States
  const [scribbleMode, setScribbleMode] = useState(false);
  const [scribbleColor, setScribbleColor] = useState("#1a1a1a");
  const [penWidth, setPenWidth] = useState(2);
  const [penType, setPenType] = useState("pen");
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
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
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  const currentTheme = PAGE_THEMES.find((t) => t.id === pageTheme) || PAGE_THEMES[0];
  const isDark = ["night"].includes(pageTheme);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Start writing..." }),
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
    editorProps: { attributes: { class: "focus:outline-none min-h-[300px]" } },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html !== lastSavedContent.current) {
        setSaveStatus("unsaved");
        if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        autosaveTimer.current = setTimeout(() => handleSave(), 4000);
      }
    },
  });

  // Line Style CSS - synced with text
  const getLineStyleCSS = (): React.CSSProperties => {
    const lineColor = currentTheme.lineColor;
    switch (lineStyle) {
      case "ruled":
        return {
          backgroundImage: `linear-gradient(transparent ${LINE_HEIGHT - 1}px, ${lineColor} ${LINE_HEIGHT}px)`,
          backgroundSize: `100% ${LINE_HEIGHT}px`,
        };
      case "grid":
        return {
          backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`,
          backgroundSize: `${LINE_HEIGHT}px ${LINE_HEIGHT}px`,
        };
      case "dotted":
        return {
          backgroundImage: `radial-gradient(circle, ${lineColor} 1px, transparent 1px)`,
          backgroundSize: `${LINE_HEIGHT}px ${LINE_HEIGHT}px`,
        };
      case "college":
        return {
          backgroundImage: `linear-gradient(transparent ${LINE_HEIGHT - 1}px, ${lineColor} ${LINE_HEIGHT}px)`,
          backgroundSize: `100% ${LINE_HEIGHT}px`,
        };
      default:
        return {};
    }
  };

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setCustomBgImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

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
      ctx.globalAlpha = stroke.penType === "pencil" ? 0.7 : 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }, [strokes]);

  useEffect(() => {
    if (scribbleMode && canvasRef.current && containerRef.current) {
      canvasRef.current.width = containerRef.current.offsetWidth;
      canvasRef.current.height = Math.max(containerRef.current.offsetHeight, 600);
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
    if (note.scribbleStrokes)
      try {
        setStrokes(JSON.parse(note.scribbleStrokes));
      } catch {}
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
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e: React.MouseEvent) => {
    if (!scribbleMode) return;
    const pos = getCanvasPos(e);
    lastPos.current = pos;
    setIsDrawing(true);
    if (tool === "pen") setCurrentStroke({ points: [pos], color: scribbleColor, width: penWidth, penType });
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !scribbleMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getCanvasPos(e);
    if (tool === "pen" && currentStroke) {
      setCurrentStroke((prev) => (prev ? { ...prev, points: [...prev.points, pos] } : null));
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = scribbleColor;
      ctx.lineWidth = penWidth;
      ctx.lineCap = "round";
      ctx.globalAlpha = penType === "pencil" ? 0.7 : 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }
    lastPos.current = pos;
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (tool === "pen" && currentStroke && currentStroke.points.length > 1) {
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
  };

  const clearScribble = () => {
    setUndoStack((prev) => [...prev, [...strokes]]);
    setStrokes([]);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
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
        "h-8 w-8 flex items-center justify-center rounded-md transition-colors hover:bg-slate-100 disabled:opacity-30",
        active && "bg-slate-100 text-primary",
      )}
    >
      {children}
    </button>
  );

  return (
    <div
      className={cn("flex flex-col h-full w-full overflow-hidden", isFullscreen && "fixed inset-0 z-[9999]")}
      style={{ backgroundColor: "#e8e4e0" }}
    >
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <input ref={bgImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgImageUpload} />

      {/* TOOLBAR */}
      <div className="shrink-0 bg-white border-b border-slate-200 z-[100]">
        <div className="flex items-center h-11 px-2 gap-0.5 overflow-x-auto">
          <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
            <Undo2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            <Redo2 className="h-4 w-4" />
          </ToolBtn>
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
          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Theme */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 px-2 flex items-center gap-1.5 rounded-md text-xs hover:bg-slate-100">
                <div className="w-4 h-4 rounded border" style={{ backgroundColor: currentTheme.value }} />
                <span>Theme</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-[99999]">
              {PAGE_THEMES.map((theme) => (
                <DropdownMenuItem key={theme.id} onClick={() => setPageTheme(theme.id)} className="gap-2">
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: theme.value }} />
                  <span>{theme.label}</span>
                  {pageTheme === theme.id && <Check className="h-3 w-3 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Lines */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 px-2 flex items-center gap-1.5 rounded-md text-xs hover:bg-slate-100">
                <span>{LINE_STYLES.find((l) => l.id === lineStyle)?.preview}</span>
                <span>Lines</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-[99999]">
              {LINE_STYLES.map((style) => (
                <DropdownMenuItem key={style.id} onClick={() => setLineStyle(style.id)} className="gap-2">
                  <span>{style.preview}</span>
                  <span>{style.label}</span>
                  {lineStyle === style.id && <Check className="h-3 w-3 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Background */}
          <button
            onClick={() => bgImageInputRef.current?.click()}
            className="h-8 px-2 flex items-center gap-1.5 rounded-md text-xs hover:bg-slate-100"
          >
            <ImagePlus className="h-4 w-4" />
            <span>BG</span>
          </button>
          {customBgImage && (
            <button
              onClick={() => setCustomBgImage(null)}
              className="h-8 w-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="w-px h-5 bg-slate-200 mx-1" />
          <ToolBtn onClick={() => setScribbleMode(!scribbleMode)} active={scribbleMode} title="Scribble">
            <PenTool className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => setLinkDialogOpen(true)} title="Link">
            <Link2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => setImageDialogOpen(true)} title="Image">
            <ImageIcon className="h-4 w-4" />
          </ToolBtn>

          <div className="flex-1" />

          <span
            className={cn(
              "text-xs px-2 py-1 rounded-full font-medium",
              saveStatus === "saved" && "bg-emerald-100 text-emerald-700",
              saveStatus === "saving" && "bg-amber-100 text-amber-700",
              saveStatus === "unsaved" && "bg-slate-100 text-slate-500",
            )}
          >
            {saveStatus === "saved" && (
              <>
                <Check className="h-3 w-3 inline mr-1" />
                Saved
              </>
            )}
            {saveStatus === "saving" && (
              <>
                <Loader2 className="h-3 w-3 inline mr-1 animate-spin" />
                Saving
              </>
            )}
            {saveStatus === "unsaved" && "Unsaved"}
          </span>
          <Button size="sm" onClick={handleSave} className="h-8 gap-1.5 bg-emerald-500 text-white">
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
          <ToolBtn onClick={() => setIsFullscreen(!isFullscreen)} title="Fullscreen">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </ToolBtn>
        </div>
      </div>

      {/* Scribble Toolbar */}
      {scribbleMode && (
        <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-3 py-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-amber-700">✏️ Scribble</span>
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="p-1.5 rounded hover:bg-amber-100 disabled:opacity-30"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <div className="flex gap-1">
            {SCRIBBLE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setScribbleColor(c);
                  setTool("pen");
                }}
                className={cn(
                  "w-5 h-5 rounded-full border-2",
                  scribbleColor === c && tool === "pen" ? "border-amber-700 scale-110" : "border-white shadow",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            onClick={() => setTool("eraser")}
            className={cn("p-1.5 rounded", tool === "eraser" ? "bg-amber-200" : "hover:bg-amber-100")}
          >
            <Eraser className="h-4 w-4" />
          </button>
          <div className="flex-1" />
          <button
            onClick={clearScribble}
            className="px-2 py-1 text-xs rounded bg-red-100 text-red-600 hover:bg-red-200"
          >
            <Trash2 className="h-3 w-3 inline mr-1" />
            Clear
          </button>
          <button
            onClick={() => setScribbleMode(false)}
            className="px-3 py-1 text-xs font-medium rounded bg-amber-500 text-white hover:bg-amber-600"
          >
            Done
          </button>
        </div>
      )}

      {/* DIARY BOOK VIEW */}
      <div
        className="flex-1 flex items-center justify-center p-4 overflow-hidden"
        style={{ backgroundColor: "#d4cfc9" }}
      >
        <div style={{ perspective: "1500px" }}>
          {/* Book Container */}
          <div className="flex" style={{ transformStyle: "preserve-3d" }}>
            {/* Left Page */}
            <div
              className="relative hidden md:block"
              style={{
                width: "350px",
                height: "500px",
                backgroundColor: currentTheme.value,
                borderRadius: "2px 0 0 2px",
                boxShadow: "-3px 3px 15px rgba(0,0,0,0.25)",
                transform: "rotateY(8deg)",
                transformOrigin: "right center",
                ...getLineStyleCSS(),
              }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/15 to-transparent" />
              {lineStyle === "college" && <div className="absolute left-[50px] top-0 bottom-0 w-[2px] bg-red-400" />}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs opacity-40">◀</div>
              <div
                className="p-4 h-full"
                style={{ color: currentTheme.textColor, paddingLeft: lineStyle === "college" ? "60px" : "24px" }}
              >
                <p className="text-sm italic opacity-50">Previous page...</p>
              </div>
            </div>

            {/* Right Page - Active */}
            <div
              ref={containerRef}
              className="relative"
              style={{
                width: "350px",
                height: "500px",
                backgroundColor: customBgImage ? "transparent" : currentTheme.value,
                backgroundImage: customBgImage ? `url(${customBgImage})` : undefined,
                backgroundSize: "cover",
                borderRadius: "0 2px 2px 0",
                boxShadow: "3px 3px 15px rgba(0,0,0,0.25)",
                transform: "rotateY(-8deg)",
                transformOrigin: "left center",
                ...(!customBgImage ? getLineStyleCSS() : {}),
              }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-black/15 to-transparent" />
              {["aged", "kraft"].includes(pageTheme) && !customBgImage && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.04]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                  }}
                />
              )}
              {lineStyle === "college" && (
                <div className="absolute left-[50px] top-0 bottom-0 w-[2px] bg-red-400 z-10" />
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs opacity-40">▶</div>

              <div
                className="p-4 h-full overflow-y-auto"
                style={{ color: currentTheme.textColor, paddingLeft: lineStyle === "college" ? "60px" : "16px" }}
              >
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Untitled"
                  className="text-lg font-semibold border-none bg-transparent px-0 h-auto focus-visible:ring-0 mb-2"
                  style={{ color: currentTheme.textColor, lineHeight: `${LINE_HEIGHT}px` }}
                />
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  {group && <Badge className="bg-primary/10 text-primary border-0 text-xs">{group.name}</Badge>}
                  {tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                  <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-5 text-xs opacity-50">
                        +Tag
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-2 z-[99999]">
                      <div className="flex gap-1">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Tag"
                          className="h-7 text-xs"
                          onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                        />
                        <Button size="sm" className="h-7 text-xs" onClick={handleAddTag}>
                          Add
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <EditorContent editor={editor} />
              </div>

              {scribbleMode && (
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="absolute inset-0 w-full h-full z-20"
                  style={{ cursor: tool === "pen" ? "crosshair" : "cell" }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-xs z-[999999]">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
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
        </DialogContent>
      </Dialog>

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-xs z-[999999]">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL..." />
          <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
            <ImageIcon className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleInsertImage} disabled={!imageUrl}>
              Insert
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        .ProseMirror { line-height: ${LINE_HEIGHT}px !important; }
        .ProseMirror p { margin: 0; line-height: ${LINE_HEIGHT}px !important; min-height: ${LINE_HEIGHT}px; }
        .ProseMirror h1 { font-size: 1.5rem; font-weight: 700; line-height: ${LINE_HEIGHT * 2}px; margin: 0; }
        .ProseMirror h2 { font-size: 1.25rem; font-weight: 600; line-height: ${LINE_HEIGHT * 1.5}px; margin: 0; }
        .ProseMirror h3 { font-size: 1.1rem; font-weight: 600; line-height: ${LINE_HEIGHT}px; margin: 0; }
        .ProseMirror ul, .ProseMirror ol { line-height: ${LINE_HEIGHT}px; margin: 0; padding-left: 1.25rem; }
        .ProseMirror li { min-height: ${LINE_HEIGHT}px; }
        .ProseMirror a { color: #3b82f6; text-decoration: underline; }
        .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; }
        .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; }
      `}</style>
    </div>
  );
}
