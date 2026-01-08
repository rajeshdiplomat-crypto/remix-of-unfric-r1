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
import { useEffect, forwardRef, useImperativeHandle, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

interface Props {
  content: string;
  onChange: (content: string) => void;
  skinStyles?: { editorPaperBg?: string; text?: string; mutedText?: string };
}
export interface TiptapEditorRef {
  editor: ReturnType<typeof useEditor> | null;
}

const FONTS = [
  { value: "sans", label: "Sans Serif", css: "Inter, system-ui, sans-serif" },
  { value: "serif", label: "Serif", css: "Georgia, Cambria, serif" },
  { value: "mono", label: "Mono", css: '"SF Mono", monospace' },
];

const SIZES = ["12", "14", "16", "18", "20", "24", "32"];

const TEXT_COLORS = ["#1a1a1a", "#dc2626", "#ea580c", "#16a34a", "#2563eb", "#7c3aed", "#db2777"];
const HIGHLIGHT_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#fed7aa", "#e9d5ff"];

export const JournalTiptapEditor = forwardRef<TiptapEditorRef, Props>(({ content, onChange, skinStyles }, ref) => {
  const [font, setFont] = useState("sans");
  const [size, setSize] = useState("16");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: ({ node }) => (node.type.name === "heading" ? "" : "Start writing...") }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: true }),
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: content ? JSON.parse(content) : undefined,
    onUpdate: ({ editor }) => onChange(JSON.stringify(editor.getJSON())),
    editorProps: { attributes: { class: "focus:outline-none min-h-[300px] px-6 py-4" } },
  });

  useImperativeHandle(ref, () => ({ editor }));

  useEffect(() => {
    if (editor && content) {
      const cur = JSON.stringify(editor.getJSON());
      if (cur !== content) editor.commands.setContent(JSON.parse(content));
    }
  }, [content, editor]);

  const handleFontChange = (v: string) => {
    setFont(v);
    const f = FONTS.find((x) => x.value === v);
    if (f && editor) editor.chain().focus().setFontFamily(f.css).run();
  };
  const handleSizeChange = (v: string) => {
    setSize(v);
    if (editor) (editor.chain().focus() as any).setFontSize(v).run();
  };

  const ToolBtn = ({ onClick, active, disabled, children, title }: any) => (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "h-8 w-8 flex items-center justify-center rounded-lg transition-all duration-200",
        "text-slate-600 hover:text-slate-900 hover:bg-white/80 hover:shadow-sm",
        "disabled:opacity-30 disabled:pointer-events-none",
        active && "bg-white shadow-sm text-primary ring-1 ring-primary/20",
      )}
    >
      {children}
    </button>
  );

  if (!editor) return null;

  return (
    <div className="rounded-xl border overflow-hidden bg-white shadow-sm" style={{ borderColor: "hsl(var(--border))" }}>
      {/* MODERN TOOLBAR */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-200/60">
        <div className="flex items-center h-12 px-3 gap-1 overflow-x-auto">
          {/* Undo/Redo */}
          <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
            <Undo2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            <Redo2 className="h-4 w-4" />
          </ToolBtn>
          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Heading */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 px-2 flex items-center gap-1 rounded-lg text-sm font-medium text-slate-700 hover:bg-white/80 hover:shadow-sm transition-all">
                <Type className="h-4 w-4" /> Aa <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[120px]">
              <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>Normal</DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                <span className="font-bold">Heading 1</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <span className="font-semibold">Heading 2</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                <span className="font-medium">Heading 3</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Font */}
          <Select value={font} onValueChange={handleFontChange}>
            <SelectTrigger className="h-8 w-24 text-xs border-0 bg-white/60 hover:bg-white shadow-sm rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Size */}
          <Select value={size} onValueChange={handleSizeChange}>
            <SelectTrigger className="h-8 w-16 text-xs border-0 bg-white/60 hover:bg-white shadow-sm rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIZES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Colors */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/80 hover:shadow-sm">
                <Palette className="h-4 w-4 text-slate-600" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <p className="text-xs text-slate-500 mb-2">Text Color</p>
              <div className="flex gap-1">
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

          {/* Format */}
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

          {/* Highlight */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/80 hover:shadow-sm">
                <Highlighter className="h-4 w-4 text-slate-600" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <p className="text-xs text-slate-500 mb-2">Highlight</p>
              <div className="flex gap-1">
                <button
                  onClick={() => editor.chain().focus().unsetHighlight().run()}
                  className="h-6 w-6 rounded border border-slate-200 bg-white hover:scale-110 transition text-xs"
                >
                  ✕
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

          {/* Lists */}
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
            title="Checklist"
          >
            <CheckSquare className="h-4 w-4" />
          </ToolBtn>
          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Alignment */}
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

          {/* Link & Image */}
          <ToolBtn
            onClick={() => {
              const url = prompt("Image URL");
              if (url) editor.chain().focus().setImage({ src: url }).run();
            }}
            title="Image"
          >
            <ImageIcon className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => {
              const url = prompt("Link URL");
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }}
            active={editor.isActive("link")}
            title="Link"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolBtn>
          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* More */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 px-2 flex items-center gap-1 rounded-lg text-sm text-slate-600 hover:bg-white/80 hover:shadow-sm transition-all">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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

          <div className="flex-1" />

          {/* AI */}
          <button
            onClick={() => alert("AI coming soon!")}
            className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-sm hover:shadow-md transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" /> AI
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div
        style={{
          backgroundColor: skinStyles?.editorPaperBg || "#fff",
          color: skinStyles?.text || "#1e293b",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
        }}
      >
        <EditorContent editor={editor} />
      </div>

      <style>{`
        .ProseMirror { min-height: 300px; word-break: break-word; overflow-wrap: anywhere; }
        .ProseMirror p.is-editor-empty:first-child::before { color: ${skinStyles?.mutedText || "#94a3b8"}; content: attr(data-placeholder); float: left; height: 0; pointer-events: none; }
        .ProseMirror h1 { font-size: 1.875rem; font-weight: 700; margin: 1.5rem 0 0.75rem; }
        .ProseMirror h2 { font-size: 1.5rem; font-weight: 600; margin: 1.25rem 0 0.5rem; }
        .ProseMirror h3 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; }
        .ProseMirror p { margin: 0.5rem 0; line-height: 1.75; }
        .ProseMirror strong { font-weight: 700; }
        .ProseMirror ul { list-style: disc; padding-left: 1.5rem; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; }
        .ProseMirror blockquote { border-left: 3px solid #e2e8f0; padding-left: 1rem; color: #64748b; font-style: italic; }
        .ProseMirror pre { background: #f1f5f9; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
        .ProseMirror code { background: #f1f5f9; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-family: monospace; }
        .ProseMirror hr { border: none; border-top: 2px solid #e2e8f0; margin: 1.5rem 0; }
        .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; }
        .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; }
        .ProseMirror ul[data-type="taskList"] input { accent-color: #10b981; }
        .ProseMirror li[data-checked="true"] > div { text-decoration: line-through; color: #94a3b8; }
        .ProseMirror img { max-width: 100%; border-radius: 0.5rem; }
        .ProseMirror a { color: #3b82f6; text-decoration: underline; }
      `}</style>
    </div>
  );
});

JournalTiptapEditor.displayName = "JournalTiptapEditor";
