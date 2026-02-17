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
import { supabase } from "@/integrations/supabase/client";
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
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

const FONTS = [
  { value: "inter", label: "Inter", css: "Inter, system-ui, sans-serif" },
  { value: "arial", label: "Arial", css: "Arial, Helvetica, sans-serif" },
  { value: "georgia", label: "Georgia", css: "Georgia, Cambria, serif" },
  { value: "times", label: "Times", css: '"Times New Roman", Times, serif' },
  { value: "verdana", label: "Verdana", css: "Verdana, Geneva, sans-serif" },
  { value: "courier", label: "Courier", css: '"Courier New", Courier, monospace' },
  { value: "garamond", label: "Garamond", css: "Garamond, Baskerville, serif" },
  { value: "mono", label: "Mono", css: '"SF Mono", "Fira Code", monospace' },
];

const SIZES = ["12", "14", "16", "18", "20", "24", "28", "32", "40"];
const TEXT_COLORS = ["#1a1a1a", "#dc2626", "#ea580c", "#16a34a", "#2563eb", "#7c3aed", "#db2777"];
const HIGHLIGHT_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#fed7aa", "#e9d5ff"];
const SCRIBBLE_COLORS = ["#1a1a1a", "#dc2626", "#2563eb", "#16a34a", "#7c3aed", "#ea580c", "#db2777"];

const PEN_TYPES = [
  { id: "pen", label: "Pen", icon: Pen, opacity: 1, shadow: false },
  { id: "pencil", label: "Pencil", icon: Pencil, opacity: 0.7, shadow: false },
  { id: "marker", label: "Marker", icon: PenTool, opacity: 0.5, shadow: true },
  { id: "brush", label: "Brush", icon: Brush, opacity: 0.8, shadow: false },
];

const PEN_WIDTHS = [
  { value: 1, label: "Fine" },
  { value: 2, label: "Medium" },
  { value: 4, label: "Thick" },
  { value: 6, label: "Extra Thick" },
];

const ERASER_SIZES = [
  { value: 10, label: "Small" },
  { value: 20, label: "Medium" },
  { value: 40, label: "Large" },
];

// Diary Themes - work in BOTH modes
const PAGE_THEMES = [
  { id: "white", label: "White", value: "#ffffff", lineColor: "#e5e7eb", textColor: "#1a1a1a" },
  { id: "cream", label: "Cream", value: "#fefce8", lineColor: "#d4c89d", textColor: "#44403c" },
  { id: "aged", label: "Antique", value: "#f5f0e1", lineColor: "#c9b896", textColor: "#5c4f3a" },
  { id: "kraft", label: "Kraft", value: "#d9c7a7", lineColor: "#b8a47e", textColor: "#3d3326" },
  { id: "night", label: "Night", value: "#1e1e2e", lineColor: "#45475a", textColor: "#cdd6f4" },
  { id: "rose", label: "Rose", value: "#fff1f2", lineColor: "#fda4af", textColor: "#881337" },
  { id: "sky", label: "Sky", value: "#f0f9ff", lineColor: "#7dd3fc", textColor: "#0c4a6e" },
  { id: "mint", label: "Mint", value: "#f0fdf4", lineColor: "#86efac", textColor: "#14532d" },
  { id: "lavender", label: "Lavender", value: "#faf5ff", lineColor: "#d8b4fe", textColor: "#581c87" },
];

const LINE_STYLES = [
  { id: "none", label: "Blank", preview: "⬜" },
  { id: "ruled", label: "Ruled", preview: "📝" },
  { id: "grid", label: "Grid", preview: "📐" },
  { id: "dotted", label: "Dots", preview: "⚫" },
  { id: "college", label: "College", preview: "📕" },
];

const LINE_HEIGHT = 28;

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  penType: string;
}

export function NotesRichEditor({ note, groups, onSave, onBack, onFullscreenChange }: NotesRichEditorProps) {
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

  useEffect(() => {
    onFullscreenChange?.(isFullscreen);
  }, [isFullscreen, onFullscreenChange]);

  // Theme & Line Style states
  const [pageTheme, setPageTheme] = useState(note.pageTheme || "white");
  const [lineStyle, setLineStyle] = useState(note.lineStyle || "none");

  // Scribble States
  const [scribbleMode, setScribbleMode] = useState(false);
  const [scribbleColor, setScribbleColor] = useState("#1a1a1a");
  const [penWidth, setPenWidth] = useState(2);
  const [penType, setPenType] = useState("pen");
  const [tool, setTool] = useState<"pen" | "eraser" | "stroke-eraser">("pen");
  const [eraserSize, setEraserSize] = useState(20);
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

  const currentTheme = PAGE_THEMES.find((t) => t.id === pageTheme) || PAGE_THEMES[0];

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

  // Get line style CSS - works for any mode
  const getLineStyleCSS = (): React.CSSProperties => {
    if (lineStyle === "none") return {};
    const lc = currentTheme.lineColor;
    switch (lineStyle) {
      case "ruled":
        return {
          backgroundImage: `repeating-linear-gradient(transparent 0px, transparent ${LINE_HEIGHT - 1}px, ${lc} ${LINE_HEIGHT - 1}px, ${lc} ${LINE_HEIGHT}px)`,
          backgroundSize: `100% ${LINE_HEIGHT}px`,
        };
      case "grid":
        return {
          backgroundImage: `linear-gradient(${lc} 1px, transparent 1px), linear-gradient(90deg, ${lc} 1px, transparent 1px)`,
          backgroundSize: `${LINE_HEIGHT}px ${LINE_HEIGHT}px`,
        };
      case "dotted":
        return {
          backgroundImage: `radial-gradient(circle, ${lc} 1.5px, transparent 1.5px)`,
          backgroundSize: `${LINE_HEIGHT}px ${LINE_HEIGHT}px`,
        };
      case "college":
        return {
          backgroundImage: `repeating-linear-gradient(transparent 0px, transparent ${LINE_HEIGHT - 1}px, ${lc} ${LINE_HEIGHT - 1}px, ${lc} ${LINE_HEIGHT}px)`,
          backgroundSize: `100% ${LINE_HEIGHT}px`,
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
      const pt = PEN_TYPES.find((p) => p.id === stroke.penType) || PEN_TYPES[0];
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = pt.opacity;
      if (pt.shadow) {
        ctx.shadowColor = stroke.color;
        ctx.shadowBlur = stroke.width;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    });
  }, [strokes]);

  // Resize and redraw canvas when strokes change - with direct drawing to avoid stale closure
  useEffect(() => {
    if (strokes.length > 0 && canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      canvas.width = container.offsetWidth;
      canvas.height = Math.max(container.scrollHeight, container.offsetHeight, 600);

      // Draw directly here instead of calling redrawCanvas to avoid stale closure
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        strokes.forEach((stroke) => {
          if (stroke.points.length < 2) return;
          const pt = PEN_TYPES.find((p) => p.id === stroke.penType) || PEN_TYPES[0];
          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.width;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.globalAlpha = pt.opacity;
          if (pt.shadow) {
            ctx.shadowColor = stroke.color;
            ctx.shadowBlur = stroke.width;
          } else {
            ctx.shadowBlur = 0;
          }
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        });
      }
    }
  }, [strokes]);

  // Also resize when entering scribble mode
  useEffect(() => {
    if (scribbleMode && canvasRef.current && containerRef.current) {
      canvasRef.current.width = containerRef.current.offsetWidth;
      canvasRef.current.height = Math.max(containerRef.current.scrollHeight, containerRef.current.offsetHeight, 600);
      redrawCanvas();
    }
  }, [scribbleMode, redrawCanvas]);

  useEffect(() => {
    if (editor && note.contentRich !== editor.getHTML()) {
      editor.commands.setContent(note.contentRich || "");
      lastSavedContent.current = note.contentRich || "";
    }
    setTitle(note.title);
    setTags(note.tags);
    setPageTheme(note.pageTheme || "white");
    setLineStyle(note.lineStyle || "none");
    setSaveStatus("saved");
    if (note.scribbleStrokes) {
      try {
        const loadedStrokes = JSON.parse(note.scribbleStrokes);
        setStrokes(loadedStrokes);
        // Note: the useEffect with [strokes] dependency will handle drawing
      } catch {
        setStrokes([]);
      }
    } else {
      // Clear strokes when switching to a note without scribble data
      setStrokes([]);
      setUndoStack([]);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    // Reset scribble mode when switching notes
    setScribbleMode(false);
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
      pageTheme,
      lineStyle,
    };
    noteData.scribbleStrokes = strokes.length > 0 ? JSON.stringify(strokes) : null;
    onSave(noteData);
    lastSavedContent.current = html;
    setTimeout(() => setSaveStatus("saved"), 500);
  }, [editor, note, title, tags, strokes, onSave, pageTheme, lineStyle]);

  const getCanvasPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  // Touch support for tablet/stylus
  const getTouchPos = (e: React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !e.touches[0]) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
  };

  const findStrokeAtPoint = (x: number, y: number): number => {
    for (let i = strokes.length - 1; i >= 0; i--) {
      for (const point of strokes[i].points) {
        if (Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2) < strokes[i].width + 5) return i;
      }
    }
    return -1;
  };

  const startDrawing = (e: React.MouseEvent) => {
    if (!scribbleMode) return;
    const pos = getCanvasPos(e);
    lastPos.current = pos;
    setIsDrawing(true);
    if (tool === "pen") setCurrentStroke({ points: [pos], color: scribbleColor, width: penWidth, penType });
  };

  const startDrawingTouch = (e: React.TouchEvent) => {
    if (!scribbleMode) return;
    e.preventDefault();
    const pos = getTouchPos(e);
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
      const pt = PEN_TYPES.find((p) => p.id === penType) || PEN_TYPES[0];
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = scribbleColor;
      ctx.lineWidth = penWidth;
      ctx.lineCap = "round";
      ctx.globalAlpha = pt.opacity;
      if (pt.shadow) {
        ctx.shadowColor = scribbleColor;
        ctx.shadowBlur = penWidth;
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    } else if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, eraserSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    } else if (tool === "stroke-eraser") {
      const idx = findStrokeAtPoint(pos.x, pos.y);
      if (idx >= 0) {
        setUndoStack((prev) => [...prev, [...strokes]]);
        setStrokes((prev) => prev.filter((_, i) => i !== idx));
        setSaveStatus("unsaved");
        if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        autosaveTimer.current = setTimeout(() => handleSave(), 2000);
      }
    }
    lastPos.current = pos;
  };

  const drawTouch = (e: React.TouchEvent) => {
    if (!isDrawing || !scribbleMode) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getTouchPos(e);

    if (tool === "pen" && currentStroke) {
      setCurrentStroke((prev) => (prev ? { ...prev, points: [...prev.points, pos] } : null));
      const pt = PEN_TYPES.find((p) => p.id === penType) || PEN_TYPES[0];
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = scribbleColor;
      ctx.lineWidth = penWidth;
      ctx.lineCap = "round";
      ctx.globalAlpha = pt.opacity;
      if (pt.shadow) {
        ctx.shadowColor = scribbleColor;
        ctx.shadowBlur = penWidth;
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    } else if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, eraserSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    } else if (tool === "stroke-eraser") {
      const idx = findStrokeAtPoint(pos.x, pos.y);
      if (idx >= 0) {
        setUndoStack((prev) => [...prev, [...strokes]]);
        setStrokes((prev) => prev.filter((_, i) => i !== idx));
        setSaveStatus("unsaved");
        if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        autosaveTimer.current = setTimeout(() => handleSave(), 2000);
      }
    }
    lastPos.current = pos;
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (tool === "pen" && currentStroke && currentStroke.points.length > 1) {
      setUndoStack((prev) => [...prev, [...strokes]]);
      const newStrokes = [...strokes, currentStroke];
      setStrokes(newStrokes);
      setCurrentStroke(null);
      // Trigger autosave for scribble changes
      setSaveStatus("unsaved");
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => handleSave(), 2000);
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    setStrokes(undoStack[undoStack.length - 1]);
    setUndoStack((prev) => prev.slice(0, -1));
    setSaveStatus("unsaved");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => handleSave(), 2000);
  };

  const clearScribble = () => {
    setUndoStack((prev) => [...prev, [...strokes]]);
    setStrokes([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSaveStatus("unsaved");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => handleSave(), 2000);
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
    try {
      // Try setResizableImage first, then setImage
      if ((editor.commands as any).setResizableImage) {
        (editor.commands as any).setResizableImage({ src: imageUrl });
      } else if ((editor.commands as any).setImage) {
        (editor.commands as any).setImage({ src: imageUrl });
      } else {
        // Fallback: insert as HTML
        editor.chain().focus().insertContent(`<img src="${imageUrl}" />`).run();
      }
    } catch (err) {
      console.error("Image insert error:", err);
      editor.chain().focus().insertContent(`<img src="${imageUrl}" />`).run();
    }
    setImageDialogOpen(false);
    setImageUrl("");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        console.error("User not authenticated");
        return;
      }

      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const { error } = await supabase.storage.from("entry-covers").upload(fileName, file);

      if (error) {
        console.error("Upload error:", error);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from("entry-covers").getPublicUrl(fileName);

      try {
        if ((editor.commands as any).setResizableImage) {
          (editor.commands as any).setResizableImage({ src: publicUrl });
        } else if ((editor.commands as any).setImage) {
          (editor.commands as any).setImage({ src: publicUrl });
        } else {
          editor.chain().focus().insertContent(`<img src="${publicUrl}" />`).run();
        }
      } catch (err) {
        console.error("Image insert error:", err);
        editor.chain().focus().insertContent(`<img src="${publicUrl}" />`).run();
      }
      setImageDialogOpen(false);
    } catch (err) {
      console.error("Image upload error:", err);
    }
    if (e.target) e.target.value = "";
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
        active && "bg-slate-100 text-primary",
      )}
    >
      {children}
    </button>
  );

  const containerClass = isFullscreen
    ? "fixed inset-0 z-[9999] flex flex-col"
    : "flex flex-col h-full w-full overflow-hidden";

  // Should show lines based on lineStyle selection
  const showLines = lineStyle !== "none";

  return (
    <div className={containerClass} style={{ backgroundColor: currentTheme.value }}>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {/* MAIN TOOLBAR */}
      <div className="shrink-0 bg-white border-b border-slate-200 relative z-[100]">
        <div className="flex items-center h-11 px-2 gap-0.5 overflow-x-auto">
          <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
            <Undo2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            <Redo2 className="h-4 w-4" />
          </ToolBtn>
          <div className="w-px h-5 bg-slate-200 mx-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 px-2 flex items-center gap-1 rounded-md text-sm text-slate-600 hover:bg-slate-100">
                <Type className="h-4 w-4" />
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-[99999]">
              <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>Normal</DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                Heading 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                Heading 2
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                Heading 3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Select value={currentFont} onValueChange={handleFontChange}>
            <SelectTrigger className="h-8 w-20 text-xs border-0 bg-slate-50 hover:bg-slate-100">
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
            <SelectTrigger className="h-8 w-14 text-xs border-0 bg-slate-50 hover:bg-slate-100">
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

          <ToolBtn onClick={() => setLinkDialogOpen(true)} active={editor.isActive("link")} title="Link">
            <Link2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => setImageDialogOpen(true)} title="Image">
            <ImageIcon className="h-4 w-4" />
          </ToolBtn>
          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Settings/More dropdown — contains alignment, scribble, theme, line style, etc. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-slate-100" title="More options">
                <MoreHorizontal className="h-4 w-4 text-slate-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[99999] w-56">
              {/* Alignment */}
              <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign("left").run()}>
                <AlignLeft className="h-4 w-4 mr-2" /> Align Left
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign("center").run()}>
                <AlignCenter className="h-4 w-4 mr-2" /> Align Center
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign("right").run()}>
                <AlignRight className="h-4 w-4 mr-2" /> Align Right
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Formatting */}
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleStrike().run()}>
                <Strikethrough className="h-4 w-4 mr-2" /> Strikethrough
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
                <Code className="h-4 w-4 mr-2" /> Code Block
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                <Quote className="h-4 w-4 mr-2" /> Quote
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                <Minus className="h-4 w-4 mr-2" /> Divider
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Scribble */}
              <DropdownMenuItem onClick={() => setScribbleMode(!scribbleMode)}>
                <PenTool className="h-4 w-4 mr-2" /> {scribbleMode ? "Exit Scribble" : "Scribble Mode"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Page Theme */}
              <div className="px-2 py-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Page Theme</span>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {PAGE_THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setPageTheme(t.id); setSaveStatus("unsaved"); }}
                      className={cn("w-5 h-5 rounded border transition-transform hover:scale-110", pageTheme === t.id && "ring-2 ring-primary ring-offset-1")}
                      style={{ backgroundColor: t.value }}
                      title={t.label}
                    />
                  ))}
                </div>
              </div>
              {/* Line Style */}
              <div className="px-2 py-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Line Style</span>
                <div className="flex gap-1 mt-1.5">
                  {LINE_STYLES.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => { setLineStyle(l.id); setSaveStatus("unsaved"); }}
                      className={cn("px-2 py-1 text-xs rounded border transition-colors", lineStyle === l.id ? "bg-primary/10 border-primary text-primary" : "hover:bg-slate-100")}
                      title={l.label}
                    >
                      {l.preview}
                    </button>
                  ))}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
                Clear Formatting
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={() => alert("AI coming soon!")}
            className="h-8 px-3 flex items-center gap-1.5 rounded-md text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow hover:shadow-md"
          >
            <Sparkles className="h-3.5 w-3.5" /> AI
          </button>

          <div className="flex-1 min-w-4" />

          <span
            className={cn(
              "text-xs px-2 py-1 rounded-full font-medium",
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
          <Button
            size="sm"
            onClick={handleSave}
            className="h-8 gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
          <ToolBtn
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </ToolBtn>
          {isFullscreen && (
            <ToolBtn
              onClick={() => {
                setIsFullscreen(false);
                onBack();
              }}
              title="Close"
            >
              <X className="h-4 w-4" />
            </ToolBtn>
          )}
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
              title="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <div className="w-px h-5 bg-amber-300" />
            <div className="flex gap-1">
              {SCRIBBLE_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setScribbleColor(c);
                    setTool("pen");
                  }}
                  className={cn(
                    "w-5 h-5 rounded-full border-2 transition-transform hover:scale-110",
                    scribbleColor === c && tool === "pen"
                      ? "border-amber-700 scale-110 ring-2 ring-amber-300"
                      : "border-white shadow",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="w-px h-5 bg-amber-300" />
            <div className="flex gap-0.5">
              {PEN_TYPES.map((pt) => (
                <button
                  key={pt.id}
                  onClick={() => {
                    setPenType(pt.id);
                    setTool("pen");
                  }}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    penType === pt.id && tool === "pen" ? "bg-amber-200 shadow-inner" : "hover:bg-amber-100",
                  )}
                  title={pt.label}
                >
                  <pt.icon className="h-4 w-4" />
                </button>
              ))}
            </div>
            <select
              value={penWidth}
              onChange={(e) => setPenWidth(Number(e.target.value))}
              className="h-7 text-xs border border-amber-300 rounded px-1 bg-white"
            >
              {PEN_WIDTHS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
            <div className="w-px h-5 bg-amber-300" />
            <button
              onClick={() => setTool("eraser")}
              className={cn("p-1.5 rounded-lg", tool === "eraser" ? "bg-amber-200" : "hover:bg-amber-100")}
              title="Eraser"
            >
              <Eraser className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTool("stroke-eraser")}
              className={cn("p-1.5 rounded-lg", tool === "stroke-eraser" ? "bg-amber-200" : "hover:bg-amber-100")}
              title="Stroke Eraser"
            >
              <Circle className="h-4 w-4" />
            </button>
            {tool === "eraser" && (
              <select
                value={eraserSize}
                onChange={(e) => setEraserSize(Number(e.target.value))}
                className="h-7 text-xs border border-amber-300 rounded px-1 bg-white"
              >
                {ERASER_SIZES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            )}
            <div className="flex-1" />
            <button
              onClick={clearScribble}
              className="px-2 py-1 text-xs rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" /> Clear All
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
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative"
        style={{
          backgroundColor: currentTheme.value,
          color: currentTheme.textColor,
          ...getLineStyleCSS(),
        }}
      >
        {lineStyle === "college" && (
          <div
            className="absolute left-16 top-0 bottom-0 w-[1px] pointer-events-none z-10"
            style={{ backgroundColor: "#ef4444" }}
          />
        )}

        <div
          className="min-h-full px-6 py-4"
          style={{
            paddingLeft: lineStyle === "college" ? "80px" : "24px",
            lineHeight: showLines ? `${LINE_HEIGHT}px` : undefined,
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}
        >
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled Note"
            className="text-2xl font-semibold border-none bg-transparent px-0 h-auto focus-visible:ring-0 mb-3"
            style={{ color: currentTheme.textColor, lineHeight: showLines ? `${LINE_HEIGHT}px` : undefined }}
          />
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {group && <Badge className="bg-primary/10 text-primary border-0">{group.name}</Badge>}
            {tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs" style={{ borderColor: currentTheme.lineColor }}>
                #{tag}
              </Badge>
            ))}
            <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  style={{ color: currentTheme.textColor, opacity: 0.5 }}
                >
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
        <canvas
          ref={canvasRef}
          onMouseDown={scribbleMode ? startDrawing : undefined}
          onMouseMove={scribbleMode ? draw : undefined}
          onMouseUp={scribbleMode ? stopDrawing : undefined}
          onMouseLeave={scribbleMode ? stopDrawing : undefined}
          onTouchStart={scribbleMode ? startDrawingTouch : undefined}
          onTouchMove={scribbleMode ? drawTouch : undefined}
          onTouchEnd={scribbleMode ? stopDrawing : undefined}
          className="absolute inset-0 w-full h-full"
          style={{
            touchAction: "none",
            cursor: scribbleMode ? (tool === "pen" ? "crosshair" : tool === "eraser" ? "cell" : "pointer") : "default",
            pointerEvents: scribbleMode ? "auto" : "none",
            display: strokes.length > 0 || scribbleMode ? "block" : "none",
          }}
        />
      </div>

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
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            <div className="text-center text-sm text-slate-400">— or —</div>
            <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon className="h-4 w-4 mr-2" /> Upload from Computer
            </Button>
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

      <style>{`
        .ProseMirror { word-break: break-word; overflow-wrap: anywhere; ${showLines ? `line-height: ${LINE_HEIGHT}px !important;` : "line-height: 1.6;"} }
        .ProseMirror h1 { font-size: 1.875rem; font-weight: 700; ${showLines ? `margin: 0; padding-top: 4px; line-height: ${LINE_HEIGHT}px;` : "margin: 1rem 0 0.5rem;"} }
        .ProseMirror h2 { font-size: 1.5rem; font-weight: 600; ${showLines ? `margin: 0; line-height: ${LINE_HEIGHT}px;` : "margin: 0.75rem 0 0.5rem;"} }
        .ProseMirror h3 { font-size: 1.25rem; font-weight: 600; ${showLines ? `margin: 0; line-height: ${LINE_HEIGHT}px;` : "margin: 0.5rem 0 0.5rem;"} }
        .ProseMirror p { ${showLines ? `margin: 0 !important; line-height: ${LINE_HEIGHT}px !important; min-height: ${LINE_HEIGHT}px;` : "margin: 0.375rem 0; line-height: 1.6;"} }
        .ProseMirror strong { font-weight: 700; }
        .ProseMirror ul { list-style: disc; padding-left: 1.5rem; ${showLines ? `line-height: ${LINE_HEIGHT}px; margin: 0;` : ""} }
        .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; ${showLines ? `line-height: ${LINE_HEIGHT}px; margin: 0;` : ""} }
        .ProseMirror li { ${showLines ? `line-height: ${LINE_HEIGHT}px; min-height: ${LINE_HEIGHT}px;` : ""} }
        .ProseMirror blockquote { border-left: 3px solid ${currentTheme.lineColor}; padding-left: 1rem; opacity: 0.8; font-style: italic; ${showLines ? `line-height: ${LINE_HEIGHT}px; margin: 0;` : ""} }
        .ProseMirror pre { background: rgba(0,0,0,0.05); padding: 0.75rem; border-radius: 0.375rem; overflow-x: auto; }
        .ProseMirror code { background: rgba(0,0,0,0.05); padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-family: monospace; }
        .ProseMirror hr { border: none; border-top: 1px solid ${currentTheme.lineColor}; margin: 1rem 0; }
        .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; }
        .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; ${showLines ? `line-height: ${LINE_HEIGHT}px;` : ""} }
        .ProseMirror ul[data-type="taskList"] input { accent-color: #10b981; }
        .ProseMirror li[data-checked="true"] > div { text-decoration: line-through; opacity: 0.5; }
        .ProseMirror a { color: #3b82f6; text-decoration: underline; }
        .ProseMirror img { max-width: 100%; height: auto; border-radius: 0.5rem; }
      `}</style>
    </div>
  );
}
