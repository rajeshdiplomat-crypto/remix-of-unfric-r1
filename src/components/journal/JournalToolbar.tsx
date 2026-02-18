import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { Extension } from "@tiptap/core";
import ImageResize from "tiptap-extension-resize-image";
import React, { useEffect, forwardRef, useImperativeHandle, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  CheckSquare,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  Type,
  ChevronDown,
  MoreHorizontal,
  Palette,
  Highlighter,
  Quote,
  Code,
  Minus,
  Strikethrough,
  ImagePlus,
  PenTool,
  Eraser,
  Trash2,
  Pen,
  Pencil,
  Brush,
  Circle,
  Check,
  Rows,
} from "lucide-react";

// Font size extension
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
        (size: string) =>
        ({ chain }: any) =>
          chain().setMark("textStyle", { fontSize: size }).run(),
    };
  },
});

// Extension to protect h2 headings from deletion
const ProtectedHeading = Extension.create({
  name: "protectedHeading",
  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;

        // Check if we're at the start of a node after a heading
        if ($from.parentOffset === 0) {
          const nodeBefore = $from.nodeBefore;
          const nodeBeforeParent = $from.depth > 0 ? $from.node($from.depth - 1) : null;

          // If previous node is a heading, prevent deletion
          if (nodeBefore?.type.name === "heading") {
            return true; // Prevent default behavior
          }

          // Check if we're in a paragraph right after a heading
          const resolvedPos = editor.state.doc.resolve($from.pos - 1);
          if (resolvedPos.parent?.type.name === "heading") {
            return true;
          }
        }

        // Check if current selection is inside a heading
        if ($from.parent.type.name === "heading") {
          // Allow editing text inside heading, but prevent deleting the heading itself
          if (selection.empty && $from.parentOffset === 0) {
            return true; // Prevent deleting at start of heading
          }
        }

        return false; // Allow default behavior
      },
      Delete: ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;

        // Prevent deleting headings
        if ($from.parent.type.name === "heading") {
          const nodeAfter = $from.nodeAfter;
          if (!nodeAfter && $from.parentOffset === $from.parent.content.size) {
            return true; // Prevent deleting at end of heading
          }
        }

        return false;
      },
    };
  },
});

interface Props {
  content: string;
  onChange: (content: string) => void;
  skinStyles?: { editorPaperBg?: string; text?: string; mutedText?: string };
  scribbleStrokes?: string | null;
  onScribbleChange?: (data: string | null) => void;
}
export interface TiptapEditorRef {
  editor: ReturnType<typeof useEditor> | null;
}

const FONTS = [
  { value: "inter", label: "Inter", css: "Inter, system-ui, sans-serif" },
  { value: "arial", label: "Arial", css: "Arial, Helvetica, sans-serif" },
  { value: "georgia", label: "Georgia", css: "Georgia, Cambria, serif" },
  { value: "times", label: "Times New Roman", css: '"Times New Roman", Times, serif' },
  { value: "verdana", label: "Verdana", css: "Verdana, Geneva, sans-serif" },
  { value: "helvetica", label: "Helvetica", css: "Helvetica Neue, Helvetica, sans-serif" },
  { value: "garamond", label: "Garamond", css: "Garamond, Baskerville, serif" },
  { value: "courier", label: "Courier New", css: '"Courier New", Courier, monospace' },
  { value: "trebuchet", label: "Trebuchet MS", css: '"Trebuchet MS", sans-serif' },
  { value: "palatino", label: "Palatino", css: '"Palatino Linotype", Palatino, serif' },
  { value: "tahoma", label: "Tahoma", css: "Tahoma, Geneva, sans-serif" },
  { value: "mono", label: "Monospace", css: '"SF Mono", "Fira Code", monospace' },
];

const SIZES = ["10", "12", "14", "16", "18", "20", "24", "28", "32", "40"];
const TEXT_COLORS = ["#1a1a1a", "#dc2626", "#ea580c", "#16a34a", "#2563eb", "#7c3aed", "#db2777", "#0891b2"];
const HIGHLIGHT_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#fed7aa", "#e9d5ff", "#fecaca"];
const SCRIBBLE_COLORS = [
  "#1a1a1a",
  "#dc2626",
  "#2563eb",
  "#16a34a",
  "#7c3aed",
  "#ea580c",
  "#db2777",
  "#0891b2",
  "#f59e0b",
];

const PEN_TYPES = [
  { id: "pen", label: "Pen", icon: Pen, opacity: 1, shadow: false },
  { id: "pencil", label: "Pencil", icon: Pencil, opacity: 0.7, shadow: false },
  { id: "marker", label: "Marker", icon: PenTool, opacity: 0.5, shadow: true },
  { id: "brush", label: "Brush", icon: Brush, opacity: 0.8, shadow: false },
];

const PEN_WIDTHS = [
  { value: 1, label: "Extra Fine" },
  { value: 2, label: "Fine" },
  { value: 4, label: "Medium" },
  { value: 6, label: "Thick" },
  { value: 10, label: "Extra Thick" },
];

const ERASER_SIZES = [
  { value: 10, label: "Small" },
  { value: 20, label: "Medium" },
  { value: 40, label: "Large" },
  { value: 60, label: "Extra Large" },
];

const BG_PRESETS = [
  { id: "none", label: "None", value: "transparent" },
  { id: "white", label: "White", value: "#ffffff" },
  { id: "cream", label: "Cream", value: "#fffbeb" },
  { id: "mint", label: "Mint", value: "#ecfdf5" },
  { id: "lavender", label: "Lavender", value: "#f5f3ff" },
  { id: "sky", label: "Sky", value: "#f0f9ff" },
  { id: "rose", label: "Rose", value: "#fff1f2" },
  { id: "warm", label: "Warm", value: "#fef7ef" },
];

const LINE_STYLES = [
  { id: "none", label: "No Lines", preview: "☐" },
  { id: "ruled", label: "Ruled", preview: "≡" },
  { id: "grid", label: "Grid", preview: "▦" },
  { id: "dotted", label: "Dotted", preview: "⋯" },
  { id: "college", label: "College", preview: "║" },
];

const LINE_HEIGHT = 26;

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  penType: string;
}

export const JournalTiptapEditor = forwardRef<TiptapEditorRef, Props>(
  ({ content, onChange, skinStyles, scribbleStrokes: initialStrokes, onScribbleChange }, ref) => {
    const [font, setFont] = useState("inter");
    const [size, setSize] = useState("16");
    const [editorBg, setEditorBg] = useState("transparent");
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Line Style State
    const [lineStyle, setLineStyle] = useState("none");
    const showLines = lineStyle !== "none";

    // Advanced Scribble State
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

    const editor = useEditor({
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        Placeholder.configure({
          placeholder: ({ node }) => {
            if (node.type.name === "heading") {
              if (node.attrs.level === 1) return "Title";
              return "";
            }
            return "Start writing, drag files or start from a template";
          },
          showOnlyWhenEditable: true,
          showOnlyCurrent: false,
        }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Underline,
        TaskList,
        TaskItem.configure({ nested: true }),
        Link.configure({ openOnClick: false }),
        Image.configure({
          inline: true,
          allowBase64: true,
        }),
        ImageResize,
        TextStyle,
        FontFamily,
        FontSize,
        Color,
        Highlight.configure({ multicolor: true }),
        ProtectedHeading,
      ],
      content: content ? JSON.parse(content) : undefined,
      onUpdate: ({ editor }) => onChange(JSON.stringify(editor.getJSON())),
      editorProps: {
        attributes: { class: "focus:outline-none min-h-[800px] pl-8 pr-6 pt-4 pb-4 text-[14px]" },
        handleDrop: (view, event, _slice, moved) => {
          if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
            const file = event.dataTransfer.files[0];
            if (file.type.startsWith("image/")) {
              handleImageUpload({ target: { files: [file] } } as any);
              return true;
            }
          }
          return false;
        },
        handlePaste: (view, event) => {
          const items = Array.from(event.clipboardData?.items || []);
          for (const item of items) {
            if (item.type.startsWith("image/")) {
              const file = item.getAsFile();
              if (file) {
                handleImageUpload({ target: { files: [file] } } as any);
                return true;
              }
            }
          }
          return false;
        },
      },
    });

    useImperativeHandle(ref, () => ({ editor }));

    useEffect(() => {
      if (editor && content) {
        const cur = JSON.stringify(editor.getJSON());
        if (cur !== content) editor.commands.setContent(JSON.parse(content));
      }
    }, [content, editor]);

    useEffect(() => {
      if (initialStrokes) {
        try {
          setStrokes(JSON.parse(initialStrokes));
        } catch (e) {
          setStrokes([]);
        }
      } else {
        // Clear strokes when no scribble data
        setStrokes([]);
        setUndoStack([]);
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    }, [initialStrokes]);

    // Redraw all strokes
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
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
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

    useEffect(() => {
      if (scribbleMode && canvasRef.current && containerRef.current) {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        canvas.width = container.offsetWidth;
        canvas.height = Math.max(container.offsetHeight, 400);
        redrawCanvas();
      }
    }, [scribbleMode, redrawCanvas]);

    // Redraw canvas whenever strokes change - with direct drawing to avoid stale closure
    useEffect(() => {
      if (strokes.length > 0 && canvasRef.current && containerRef.current) {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        canvas.width = container.offsetWidth;
        canvas.height = Math.max(container.offsetHeight, 400);

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          strokes.forEach((stroke) => {
            if (stroke.points.length < 2) return;
            const pt = PEN_TYPES.find((p) => p.id === stroke.penType) || PEN_TYPES[0];
            ctx.beginPath();
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
              ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
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
        const stroke = strokes[i];
        for (const point of stroke.points) {
          const dist = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
          if (dist < stroke.width + 5) return i;
        }
      }
      return -1;
    };

    const startDrawing = (e: React.MouseEvent) => {
      if (!scribbleMode) return;
      const pos = getCanvasPos(e);
      lastPos.current = pos;
      setIsDrawing(true);

      if (tool === "pen") {
        setCurrentStroke({ points: [pos], color: scribbleColor, width: penWidth, penType });
      }
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
        ctx.lineJoin = "round";
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
        const strokeIndex = findStrokeAtPoint(pos.x, pos.y);
        if (strokeIndex >= 0) {
          setUndoStack((prev) => [...prev, [...strokes]]);
          const newStrokes = strokes.filter((_, i) => i !== strokeIndex);
          setStrokes(newStrokes);
          onScribbleChange?.(newStrokes.length > 0 ? JSON.stringify(newStrokes) : null);
        }
      }

      lastPos.current = pos;
    };

    const startDrawingTouch = (e: React.TouchEvent) => {
      if (!scribbleMode) return;
      e.preventDefault();
      const pos = getTouchPos(e);
      lastPos.current = pos;
      setIsDrawing(true);
      if (tool === "pen") {
        setCurrentStroke({ points: [pos], color: scribbleColor, width: penWidth, penType });
      }
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
        ctx.lineJoin = "round";
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
        const strokeIndex = findStrokeAtPoint(pos.x, pos.y);
        if (strokeIndex >= 0) {
          setUndoStack((prev) => [...prev, [...strokes]]);
          const newStrokes = strokes.filter((_, i) => i !== strokeIndex);
          setStrokes(newStrokes);
          onScribbleChange?.(newStrokes.length > 0 ? JSON.stringify(newStrokes) : null);
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
        onScribbleChange?.(JSON.stringify(newStrokes));
      }
    };

    const handleUndo = () => {
      if (undoStack.length === 0) return;
      const previousState = undoStack[undoStack.length - 1];
      setUndoStack((prev) => prev.slice(0, -1));
      setStrokes(previousState);
      onScribbleChange?.(JSON.stringify(previousState));
    };

    const clearScribble = () => {
      setUndoStack((prev) => [...prev, [...strokes]]);
      setStrokes([]);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      onScribbleChange?.(null);
    };

    const handleFontChange = (v: string) => {
      setFont(v);
      const f = FONTS.find((x) => x.value === v);
      if (f && editor) editor.chain().focus().setFontFamily(f.css).run();
    };
    const handleSizeChange = (v: string) => {
      setSize(v);
      if (editor) (editor.chain().focus() as any).setFontSize(v).run();
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
        // Try setResizableImage first, then setImage, then fallback to raw HTML
        if ((editor.commands as any).setResizableImage) {
          (editor.commands as any).setResizableImage({ src: imageUrl });
        } else if ((editor.commands as any).setImage) {
          (editor.commands as any).setImage({ src: imageUrl });
        } else {
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

      // Get user ID for storage path
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("User not authenticated");
        return;
      }

      // Upload to storage instead of base64
      const { uploadJournalImage } = await import("@/lib/journalImageUpload");
      const result = await uploadJournalImage(file, user.id);

      if (!result.success || !result.url) {
        console.error("Image upload failed:", result.error);
        return;
      }

      try {
        if ((editor.commands as any).setResizableImage) {
          (editor.commands as any).setResizableImage({ src: result.url });
        } else if ((editor.commands as any).setImage) {
          (editor.commands as any).setImage({ src: result.url });
        } else {
          editor.chain().focus().insertContent(`<img src="${result.url}" />`).run();
        }
      } catch (err) {
        console.error("Image insert error:", err);
        editor.chain().focus().insertContent(`<img src="${result.url}" />`).run();
      }
      setImageDialogOpen(false);
      if (e.target) e.target.value = "";
    };

    const getLineStyleCSS = (): React.CSSProperties => {
      if (lineStyle === "ruled")
        return {
          backgroundImage: `repeating-linear-gradient(transparent, transparent ${LINE_HEIGHT - 1}px, #e5e7eb ${LINE_HEIGHT - 1}px, #e5e7eb ${LINE_HEIGHT}px)`,
          backgroundSize: `100% ${LINE_HEIGHT}px`,
        };
      if (lineStyle === "grid")
        return {
          backgroundImage: `linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)`,
          backgroundSize: `${LINE_HEIGHT}px ${LINE_HEIGHT}px`,
        };
      if (lineStyle === "dotted")
        return {
          backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
          backgroundSize: `${LINE_HEIGHT}px ${LINE_HEIGHT}px`,
        };
      if (lineStyle === "college")
        return {
          backgroundImage: `repeating-linear-gradient(transparent, transparent ${LINE_HEIGHT - 1}px, #bfdbfe ${LINE_HEIGHT - 1}px, #bfdbfe ${LINE_HEIGHT}px)`,
          backgroundSize: `100% ${LINE_HEIGHT}px`,
        };
      return {};
    };

    const ToolBtn = ({ onClick, active, disabled, children, title }: any) => (
      <button
        type="button"
        title={title}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "h-8 w-8 flex items-center justify-center rounded-lg transition-all duration-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30",
          active && "bg-slate-100 text-primary shadow-sm",
        )}
      >
        {children}
      </button>
    );

    if (!editor) return null;

    const bgStyle =
      editorBg === "transparent"
        ? { backgroundColor: skinStyles?.editorPaperBg || "#fff" }
        : { backgroundColor: editorBg };

    return (
      <div
        className="rounded-2xl overflow-hidden min-h-[800px] flex flex-col"
        style={{
          backgroundColor: skinStyles?.editorPaperBg || "#ffffff",
          border: `1.5px solid ${skinStyles?.mutedText}30` || "1.5px solid rgba(99, 149, 241, 0.4)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

        {/* MAIN TOOLBAR */}
        <div
          className="backdrop-blur-xl border-b relative z-50"
          style={{
            backgroundColor: skinStyles?.editorPaperBg ? `${skinStyles.editorPaperBg}f0` : "rgba(255,255,255,0.98)",
            borderColor: skinStyles?.mutedText ? `${skinStyles.mutedText}20` : "rgba(148, 163, 184, 0.15)",
          }}
        >
          <div className="flex items-center h-11 px-4 gap-0.5 overflow-x-auto">
            <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
              <Undo2 className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
              <Redo2 className="h-4 w-4" />
            </ToolBtn>
            <div className="w-px h-5 bg-slate-200 mx-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 px-2 flex items-center gap-1 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
                  <Type className="h-4 w-4" />
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="z-[9999]">
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

            <Select value={font} onValueChange={handleFontChange}>
              <SelectTrigger className="h-8 w-28 text-xs border-0 bg-slate-50 hover:bg-slate-100 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[9999] max-h-72">
                {FONTS.map((f) => (
                  <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.css }}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={size} onValueChange={handleSizeChange}>
              <SelectTrigger className="h-8 w-14 text-xs border-0 bg-slate-50 hover:bg-slate-100 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[9999]">
                {SIZES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="w-px h-5 bg-slate-200 mx-1" />

            <Popover>
              <PopoverTrigger asChild>
                <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
                  <Palette className="h-4 w-4 text-slate-500" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 z-[9999]" align="start">
                <p className="text-xs text-slate-400 mb-2">Text Color</p>
                <div className="flex gap-1.5 flex-wrap max-w-32">
                  <button
                    onClick={() => editor.chain().focus().unsetColor().run()}
                    className="h-6 w-6 rounded-full border-2 border-slate-200 bg-white text-xs"
                  >
                    ×
                  </button>
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => editor.chain().focus().setColor(c).run()}
                      className="h-6 w-6 rounded-full border border-slate-200 hover:scale-110 transition"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

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

            <Popover>
              <PopoverTrigger asChild>
                <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
                  <Highlighter className="h-4 w-4 text-slate-500" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 z-[9999]" align="start">
                <p className="text-xs text-slate-400 mb-2">Highlight</p>
                <div className="flex gap-1.5 flex-wrap max-w-32">
                  <button
                    onClick={() => editor.chain().focus().unsetHighlight().run()}
                    className="h-6 w-6 rounded border border-slate-200 bg-white text-xs"
                  >
                    ×
                  </button>
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => editor.chain().focus().setHighlight({ color: c }).run()}
                      className="h-6 w-6 rounded border border-slate-200 hover:scale-110 transition"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
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

            <ToolBtn
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              active={editor.isActive({ textAlign: "left" })}
              title="Left"
            >
              <AlignLeft className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              active={editor.isActive({ textAlign: "center" })}
              title="Center"
            >
              <AlignCenter className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              active={editor.isActive({ textAlign: "right" })}
              title="Right"
            >
              <AlignRight className="h-4 w-4" />
            </ToolBtn>
            <div className="w-px h-5 bg-slate-200 mx-1" />

            <ToolBtn onClick={() => setLinkDialogOpen(true)} active={editor.isActive("link")} title="Link">
              <LinkIcon className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn onClick={() => setImageDialogOpen(true)} title="Image">
              <ImageIcon className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn onClick={() => setScribbleMode(!scribbleMode)} active={scribbleMode} title="Scribble Mode">
              <PenTool className="h-4 w-4" />
            </ToolBtn>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
                  title="Background"
                >
                  <ImagePlus className="h-4 w-4 text-slate-500" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-3 z-[9999]" align="start">
                <p className="text-xs font-medium text-slate-500 mb-2">Background</p>
                <div className="grid grid-cols-4 gap-2">
                  {BG_PRESETS.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setEditorBg(bg.value)}
                      title={bg.label}
                      className={cn(
                        "h-8 w-8 rounded-lg border-2 hover:scale-105 transition",
                        editorBg === bg.value ? "border-primary ring-2 ring-primary/20" : "border-slate-200",
                      )}
                      style={{ backgroundColor: bg.value === "transparent" ? "#fff" : bg.value }}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Line Style Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="h-8 px-2 flex items-center gap-1 rounded-lg text-slate-500 hover:bg-slate-100"
                  title="Line Style"
                >
                  <Rows className="h-4 w-4" />
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="z-[9999]">
                {LINE_STYLES.map((l) => (
                  <DropdownMenuItem key={l.id} onClick={() => setLineStyle(l.id)} className="gap-2">
                    <span>{l.preview}</span>
                    <span>{l.label}</span>
                    {lineStyle === l.id && <Check className="h-3 w-3 ml-auto" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="w-px h-5 bg-slate-200 mx-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 px-2 flex items-center rounded-lg text-slate-500 hover:bg-slate-100">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[9999]">
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
                <DropdownMenuItem onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
                  Clear Formatting
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1 min-w-4" />

            <button
              onClick={() => alert("AI coming soon!")}
              className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow hover:shadow-md transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" /> AI
            </button>
          </div>
        </div>

        {/* SCRIBBLE TOOLBAR */}
        {scribbleMode && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-3 py-2">
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
                className={cn(
                  "p-1.5 rounded-lg flex items-center gap-1",
                  tool === "eraser" ? "bg-amber-200" : "hover:bg-amber-100",
                )}
                title="Simple Eraser"
              >
                <Eraser className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTool("stroke-eraser")}
                className={cn(
                  "p-1.5 rounded-lg flex items-center gap-1 text-xs",
                  tool === "stroke-eraser" ? "bg-amber-200" : "hover:bg-amber-100",
                )}
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

        {/* Editor Content with Scribble Overlay */}
        <div
          ref={containerRef}
          className="relative flex-1 min-h-full"
          style={{
            ...bgStyle,
            ...getLineStyleCSS(),
            color: skinStyles?.text || "#1e293b",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            lineHeight: showLines ? `${LINE_HEIGHT}px` : undefined,
          }}
        >
          {lineStyle === "college" && (
            <div
              className="absolute left-16 top-0 bottom-0 w-[1px] pointer-events-none z-10"
              style={{ backgroundColor: "#ef4444" }}
            />
          )}
          <div
            className="h-full [&_.ProseMirror]:h-full [&_h2]:mt-6 [&_h2]:mb-2"
            style={{ paddingLeft: lineStyle === "college" ? "80px" : undefined }}
          >
            <EditorContent editor={editor} />
          </div>

          {/* Scribble Canvas - always visible when strokes exist */}
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
              cursor: scribbleMode
                ? tool === "pen"
                  ? "crosshair"
                  : tool === "eraser"
                    ? "cell"
                    : "pointer"
                : "default",
              pointerEvents: scribbleMode ? "auto" : "none",
              display: strokes.length > 0 || scribbleMode ? "block" : "none",
              mixBlendMode: skinStyles?.editorPaperBg === "#fff" ? "multiply" : "normal",
            }}
          />
        </div>

        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent className="max-w-sm z-[99999]">
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
          <DialogContent className="max-w-sm z-[99999]">
            <DialogHeader>
              <DialogTitle>Insert Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Paste image URL..." />
              <div className="text-center text-sm text-slate-400">— or —</div>
              <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="h-4 w-4 mr-2" /> Upload from Computer
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
        .ProseMirror { min-height: 300px; word-break: break-word; overflow-wrap: anywhere; }
        
        .ProseMirror .is-empty::before,
        .ProseMirror .is-node-empty::before {
          color: ${skinStyles?.mutedText || "#94a3b8"};
          content: attr(data-placeholder);
          position: absolute;
          pointer-events: none;
        }

        .ProseMirror h1 {
          font-size: 1.875rem;
          font-weight: 700;
          line-height: 2.25rem;
          min-height: 2.25rem;
          margin: 0 0 0.25rem 0;
          padding: 0;
          position: relative;
        }

        .ProseMirror p {
          margin: 0;
          padding: 0.0625rem 0;
          line-height: 1.75;
          min-height: 1.75em;
          position: relative;
        }

        .ProseMirror h2 { font-size: 1.5rem; font-weight: 600; margin: 1.25rem 0 0.5rem; position: relative; }
        .ProseMirror h3 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; position: relative; }

        .ProseMirror strong { font-weight: 700; }
        .ProseMirror ul { list-style: disc; padding-left: 1.5rem; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; }
        .ProseMirror blockquote { border-left: 3px solid #e2e8f0; padding-left: 1rem; color: #64748b; font-style: italic; }
        .ProseMirror pre { background: #f1f5f9; padding: 1rem; border-radius: 0.5rem; }
        .ProseMirror code { background: #f1f5f9; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-family: monospace; }
        .ProseMirror hr { border: none; border-top: 2px solid #e2e8f0; margin: 1.5rem 0; }
        .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; }
        .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; }
        .ProseMirror ul[data-type="taskList"] input { accent-color: #10b981; }
        .ProseMirror li[data-checked="true"] > div { text-decoration: line-through; color: #94a3b8; }
        .ProseMirror a { color: #3b82f6; text-decoration: underline; }
        .ProseMirror img { max-width: 100%; height: auto; border-radius: 0.5rem; display: block; }
        .ProseMirror div[style*="display: flex"] { margin: 0.5rem 0; }
        .ProseMirror div[style*="cursor: pointer"] { max-width: 100%; overflow: hidden; }
        .ProseMirror div[style*="cursor: pointer"] img { max-width: 100%; height: auto; object-fit: contain; }
      `}</style>
      </div>
    );
  },
);

JournalTiptapEditor.displayName = "JournalTiptapEditor";

// Memoized version to prevent unnecessary re-renders
export const MemoizedJournalTiptapEditor = React.memo(JournalTiptapEditor, (prevProps, nextProps) => {
  // Re-render when content, skinStyles, or handlers change
  return (
    prevProps.content === nextProps.content &&
    prevProps.skinStyles?.editorPaperBg === nextProps.skinStyles?.editorPaperBg &&
    prevProps.skinStyles?.text === nextProps.skinStyles?.text &&
    prevProps.skinStyles?.mutedText === nextProps.skinStyles?.mutedText &&
    prevProps.onChange === nextProps.onChange &&
    prevProps.onScribbleChange === nextProps.onScribbleChange
  );
});
