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
import { Extension } from "@tiptap/core";
import { useEffect, forwardRef, useImperativeHandle, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Heading2,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
} from "lucide-react";

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
  { value: "inter", label: "Inter", css: "Inter, sans-serif" },
  { value: "georgia", label: "Georgia", css: "Georgia, serif" },
  { value: "times", label: "Times", css: '"Times New Roman", serif' },
  { value: "arial", label: "Arial", css: "Arial, sans-serif" },
  { value: "verdana", label: "Verdana", css: "Verdana, sans-serif" },
  { value: "lora", label: "Lora", css: "Lora, serif" },
  { value: "playfair", label: "Playfair", css: '"Playfair Display", serif' },
  { value: "mono", label: "Mono", css: "monospace" },
];
const SIZES = ["12", "14", "16", "18", "20", "24", "28", "32"];

export const JournalTiptapEditor = forwardRef<TiptapEditorRef, Props>(({ content, onChange, skinStyles }, ref) => {
  const [font, setFont] = useState("inter");
  const [size, setSize] = useState("16");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, strike: false }),
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
    ],
    content: content ? JSON.parse(content) : undefined,
    onUpdate: ({ editor }) => onChange(JSON.stringify(editor.getJSON())),
    editorProps: { attributes: { class: "prose prose-sm max-w-none focus:outline-none min-h-[350px] px-4 py-4" } },
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
        "h-8 w-8 flex items-center justify-center rounded-md transition-all hover:bg-accent disabled:opacity-40",
        active && "bg-primary/10 text-primary",
      )}
    >
      {children}
    </button>
  );

  if (!editor) return null;

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        backgroundColor: skinStyles?.editorPaperBg || "hsl(var(--card))",
        color: skinStyles?.text || "hsl(var(--foreground))",
        borderColor: "hsl(var(--border))",
      }}
    >
      {/* Integrated Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b bg-muted/50 overflow-x-auto">
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo2 className="h-4 w-4" />
        </ToolBtn>
        <div className="w-px h-5 bg-border mx-1" />
        <Select value={font} onValueChange={handleFontChange}>
          <SelectTrigger className="w-24 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONTS.map((f) => (
              <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.css }}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={size} onValueChange={handleSizeChange}>
          <SelectTrigger className="w-14 h-7 text-xs">
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
        <div className="w-px h-5 bg-border mx-1" />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading"
        >
          <Heading2 className="h-4 w-4" />
        </ToolBtn>
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
        <div className="w-px h-5 bg-border mx-1" />
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
        <div className="w-px h-5 bg-border mx-1" />
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
        <div className="w-px h-5 bg-border mx-1" />
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
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => alert("AI coming soon!")}>
          <Sparkles className="h-3 w-3" /> AI
        </Button>
      </div>
      <EditorContent editor={editor} />
      <style>{`.ProseMirror { min-height: 350px; } .ProseMirror p.is-editor-empty:first-child::before { color: ${skinStyles?.mutedText || "hsl(var(--muted-foreground))"}; content: attr(data-placeholder); float: left; height: 0; pointer-events: none; } .ProseMirror h2 { font-size: 1.4em; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem; } .ProseMirror strong { font-weight: 700; } .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; } .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; } .ProseMirror ul[data-type="taskList"] input { accent-color: hsl(var(--primary)); }`}</style>
    </div>
  );
});

JournalTiptapEditor.displayName = "JournalTiptapEditor";
