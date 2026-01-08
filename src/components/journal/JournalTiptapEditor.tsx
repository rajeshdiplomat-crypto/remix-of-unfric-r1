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
import { useEffect, forwardRef, useImperativeHandle, useState, useRef } from "react";
import { cn } from "@/lib/utils";
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

// Extended fonts
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

export const JournalTiptapEditor = forwardRef<TiptapEditorRef, Props>(({ content, onChange, skinStyles }, ref) => {
  const [font, setFont] = useState("inter");
  const [size, setSize] = useState("16");
  const [editorBg, setEditorBg] = useState("transparent");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: ({ node }) => (node.type.name === "heading" ? "" : "Start writing...") }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false }),
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
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageDialogOpen(false);
    setImageUrl("");
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      editor
        .chain()
        .focus()
        .setImage({ src: ev.target?.result as string })
        .run();
    reader.readAsDataURL(file);
    setImageDialogOpen(false);
  };

  const ToolBtn = ({ onClick, active, disabled, children, title }: any) => (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-8 w-8 flex items-center justify-center rounded-lg transition-all duration-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none",
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
    <div className="rounded-xl border overflow-hidden bg-white shadow-sm" style={{ borderColor: "hsl(var(--border))" }}>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {/* TOOLBAR */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm relative z-50">
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
              <button className="h-8 px-2 flex items-center gap-1 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all">
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
                  className="h-6 w-6 rounded-full border-2 border-slate-200 bg-white hover:scale-110 transition text-xs"
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
                  className="h-6 w-6 rounded border border-slate-200 bg-white hover:scale-110 transition text-xs"
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

      {/* Editor Content */}
      <div
        style={{ ...bgStyle, color: skinStyles?.text || "#1e293b", wordBreak: "break-word", overflowWrap: "anywhere" }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Link Dialog */}
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

      {/* Image Dialog */}
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
        .ProseMirror p.is-editor-empty:first-child::before { color: ${skinStyles?.mutedText || "#94a3b8"}; content: attr(data-placeholder); float: left; height: 0; pointer-events: none; }
        .ProseMirror h1 { font-size: 1.875rem; font-weight: 700; margin: 1.5rem 0 0.75rem; }
        .ProseMirror h2 { font-size: 1.5rem; font-weight: 600; margin: 1.25rem 0 0.5rem; }
        .ProseMirror h3 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; }
        .ProseMirror p { margin: 0.5rem 0; line-height: 1.75; }
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
        .ProseMirror img { max-width: 100%; border-radius: 0.5rem; margin: 1rem 0; }
        .ProseMirror a { color: #3b82f6; text-decoration: underline; }
      `}</style>
    </div>
  );
});

JournalTiptapEditor.displayName = "JournalTiptapEditor";
