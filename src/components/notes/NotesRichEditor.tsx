import { useState, useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Extension } from "@tiptap/core";
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Link2,
  Image as ImageIcon,
  Palette,
  Highlighter,
  Sparkles,
  Loader2,
  Check,
  Save,
  ChevronDown,
  Plus,
  Smile,
  Type,
  Subscript as SubIcon,
  Superscript as SuperIcon,
  MoreHorizontal,
  Quote,
  Code,
  Minus,
  Table,
  FileText,
} from "lucide-react";
import type { Note, NoteGroup, NoteFolder } from "@/pages/Notes";

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
  { value: "sans", label: "Sans Serif", css: "Inter, -apple-system, sans-serif" },
  { value: "serif", label: "Serif", css: "Georgia, Cambria, serif" },
  { value: "mono", label: "Monospace", css: '"SF Mono", "Fira Code", monospace' },
  { value: "arial", label: "Arial", css: "Arial, Helvetica, sans-serif" },
  { value: "times", label: "Times New Roman", css: '"Times New Roman", Times, serif' },
  { value: "georgia", label: "Georgia", css: "Georgia, serif" },
  { value: "verdana", label: "Verdana", css: "Verdana, Geneva, sans-serif" },
  { value: "courier", label: "Courier New", css: '"Courier New", Courier, monospace' },
];

const SIZES = ["10", "11", "12", "13", "14", "15", "16", "18", "20", "24", "28", "32", "36", "48", "72"];

const TEXT_COLORS = [
  { value: "", label: "Default" },
  { value: "#000000", label: "Black" },
  { value: "#374151", label: "Gray" },
  { value: "#dc2626", label: "Red" },
  { value: "#ea580c", label: "Orange" },
  { value: "#ca8a04", label: "Yellow" },
  { value: "#16a34a", label: "Green" },
  { value: "#0891b2", label: "Cyan" },
  { value: "#2563eb", label: "Blue" },
  { value: "#7c3aed", label: "Purple" },
  { value: "#db2777", label: "Pink" },
  { value: "#84cc16", label: "Lime" },
];

const HIGHLIGHT_COLORS = [
  { value: "", label: "None" },
  { value: "#fef08a", label: "Yellow" },
  { value: "#bbf7d0", label: "Green" },
  { value: "#bfdbfe", label: "Blue" },
  { value: "#fbcfe8", label: "Pink" },
  { value: "#fed7aa", label: "Orange" },
  { value: "#e9d5ff", label: "Purple" },
  { value: "#fecaca", label: "Red" },
  { value: "#d1d5db", label: "Gray" },
];

const EMOJIS = ["😀", "😊", "🎉", "❤️", "👍", "🔥", "✨", "💡", "📝", "✅", "⭐", "🚀", "💪", "🎯", "📌", "🔔"];

export function NotesRichEditor({ note, groups, folders = [], onSave, onBack }: NotesRichEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [tags, setTags] = useState<string[]>(note.tags);
  const [newTag, setNewTag] = useState("");
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [currentFont, setCurrentFont] = useState("sans");
  const [currentSize, setCurrentSize] = useState("15");
  const [currentColor, setCurrentColor] = useState("");
  const [currentHighlight, setCurrentHighlight] = useState("");

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContent = useRef(note.contentRich || "");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Start writing..." }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      Subscript,
      Superscript,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false, allowBase64: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      FontSize,
    ],
    content: note.contentRich || "",
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[280px] text-foreground [&_*]:break-words prose prose-sm max-w-none",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html !== lastSavedContent.current) {
        setSaveStatus("unsaved");
        if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        autosaveTimer.current = setTimeout(() => handleSave(), 4000);
      }
    },
  });

  useEffect(() => {
    if (editor && note.contentRich !== editor.getHTML()) {
      editor.commands.setContent(note.contentRich || "");
      lastSavedContent.current = note.contentRich || "";
    }
    setTitle(note.title);
    setTags(note.tags);
    setSaveStatus("saved");
  }, [note.id, editor]);

  const handleSave = useCallback(() => {
    if (!editor) return;
    setSaveStatus("saving");
    const html = editor.getHTML();
    onSave({
      ...note,
      title,
      contentRich: html,
      plainText: editor.getText(),
      tags,
      updatedAt: new Date().toISOString(),
    });
    lastSavedContent.current = html;
    setTimeout(() => setSaveStatus("saved"), 500);
  }, [editor, note, title, tags, onSave]);

  const handleFontChange = (v: string) => {
    setCurrentFont(v);
    const f = FONTS.find((x) => x.value === v);
    if (f && editor) editor.chain().focus().setFontFamily(f.css).run();
  };
  const handleSizeChange = (v: string) => {
    setCurrentSize(v);
    if (editor) (editor.chain().focus() as any).setFontSize(v).run();
  };
  const handleColorChange = (v: string) => {
    setCurrentColor(v);
    if (editor) v ? editor.chain().focus().setColor(v).run() : editor.chain().focus().unsetColor().run();
  };
  const handleHighlightChange = (v: string) => {
    setCurrentHighlight(v);
    if (editor)
      v ? editor.chain().focus().setHighlight({ color: v }).run() : editor.chain().focus().unsetHighlight().run();
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
  const insertEmoji = (emoji: string) => {
    if (editor) editor.chain().focus().insertContent(emoji).run();
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

  const group = groups.find((g) => g.id === note.groupId);
  if (!editor) return null;

  const ToolBtn = ({ onClick, active, disabled, children, title: t }: any) => (
    <button
      type="button"
      title={t}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "h-7 w-7 flex-shrink-0 flex items-center justify-center rounded transition-colors text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40",
        active && "bg-accent text-foreground",
      )}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />;

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
      {/* FULL TOOLBAR */}
      <div className="flex-shrink-0 border-b bg-muted/30 overflow-x-auto">
        <div className="flex items-center px-2 py-1 gap-0.5 min-w-max">
          {/* Insert Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" /> Insert <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setImageDialogOpen(true)}>
                <ImageIcon className="h-4 w-4 mr-2" /> Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLinkDialogOpen(true)}>
                <Link2 className="h-4 w-4 mr-2" /> Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                <Minus className="h-4 w-4 mr-2" /> Divider
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
                <Code className="h-4 w-4 mr-2" /> Code Block
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                <Quote className="h-4 w-4 mr-2" /> Quote
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Emoji */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-8 gap-1">
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => insertEmoji(e)} className="h-7 w-7 hover:bg-accent rounded text-lg">
                    {e}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Save */}
          <ToolBtn onClick={handleSave} title="Save">
            <Save className="h-4 w-4" />
          </ToolBtn>
          <Divider />

          {/* Undo / Redo */}
          <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
            <Undo2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            <Redo2 className="h-4 w-4" />
          </ToolBtn>
          <Divider />

          {/* AI Edit */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-violet-600">
                <Sparkles className="h-3.5 w-3.5" /> AI Edit <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => alert("Coming soon!")}>✨ Improve Writing</DropdownMenuItem>
              <DropdownMenuItem onClick={() => alert("Coming soon!")}>📝 Fix Grammar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => alert("Coming soon!")}>🎯 Make Concise</DropdownMenuItem>
              <DropdownMenuItem onClick={() => alert("Coming soon!")}>📖 Expand</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Divider />

          {/* Heading */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                <Type className="h-3.5 w-3.5" /> Aa <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>Normal</DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                <span className="text-xl font-bold">Heading 1</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <span className="text-lg font-semibold">Heading 2</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                <span className="text-base font-medium">Heading 3</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Font */}
          <Select value={currentFont} onValueChange={handleFontChange}>
            <SelectTrigger className="h-7 w-[100px] text-xs">
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

          {/* Size */}
          <Select value={currentSize} onValueChange={handleSizeChange}>
            <SelectTrigger className="h-7 w-[55px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {SIZES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Divider />

          {/* Color */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-7 px-1 flex items-center gap-0.5 rounded hover:bg-accent">
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: currentColor || "currentColor" }}
                />
                <ChevronDown className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-6 gap-1">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.value || "d"}
                    onClick={() => handleColorChange(c.value)}
                    className={cn("h-6 w-6 rounded-full border-2", currentColor === c.value && "ring-2 ring-primary")}
                    style={{ backgroundColor: c.value || "#666" }}
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
              <button className="h-7 px-1 flex items-center gap-0.5 rounded hover:bg-accent">
                <Highlighter className="h-4 w-4" style={{ color: currentHighlight || undefined }} />
                <ChevronDown className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-5 gap-1">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.value || "n"}
                    onClick={() => handleHighlightChange(c.value)}
                    className={cn("h-6 w-6 rounded border", currentHighlight === c.value && "ring-2 ring-primary")}
                    style={{ backgroundColor: c.value || "transparent" }}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <ToolBtn onClick={() => setLinkDialogOpen(true)} active={editor.isActive("link")} title="Link">
            <Link2 className="h-4 w-4" />
          </ToolBtn>
          <Divider />

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
          <Divider />

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
          <ToolBtn
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            active={editor.isActive({ textAlign: "justify" })}
            title="Justify"
          >
            <AlignJustify className="h-4 w-4" />
          </ToolBtn>
          <Divider />

          {/* Strike, Super, Sub */}
          <ToolBtn
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="Strike"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            active={editor.isActive("superscript")}
            title="Superscript"
          >
            <span className="text-xs font-bold">x²</span>
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            active={editor.isActive("subscript")}
            title="Subscript"
          >
            <span className="text-xs font-bold">x₂</span>
          </ToolBtn>

          {/* More */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                More <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
                <Code className="h-4 w-4 mr-2" /> Code Block
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                <Quote className="h-4 w-4 mr-2" /> Blockquote
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                <Minus className="h-4 w-4 mr-2" /> Horizontal Rule
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
                Clear Formatting
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1 min-w-4" />

          {/* Status */}
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded flex-shrink-0",
              saveStatus === "saving" && "text-amber-600 bg-amber-50",
              saveStatus === "saved" && "text-emerald-600 bg-emerald-50",
              saveStatus === "unsaved" && "text-muted-foreground bg-muted",
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
          <Button size="sm" className="h-7 gap-1 text-xs flex-shrink-0 ml-1" onClick={handleSave}>
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-4 w-full" style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled Note"
            className="text-xl font-semibold border-none bg-transparent px-0 h-auto focus-visible:ring-0 mb-3 w-full"
          />
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {group && <Badge variant="secondary">{group.name}</Badge>}
            {tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
            <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 text-xs">
                  + Tag
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-2">
                <div className="flex gap-1">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Tag"
                    className="h-7"
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  />
                  <Button size="sm" className="h-7 px-2" onClick={handleAddTag}>
                    +
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="w-full" style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
            <EditorContent editor={editor} className="w-full [&_.ProseMirror]:w-full [&_.ProseMirror]:break-words" />
          </div>
        </div>
      </div>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
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
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL..." />
            <p className="text-center text-xs text-muted-foreground">or</p>
            <Input type="file" accept="image/*" onChange={handleImageUpload} />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setImageDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleInsertImage}>
                Insert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`.ProseMirror { word-break: break-word; overflow-wrap: anywhere; } .ProseMirror h1 { font-size: 1.75rem; font-weight: 700; margin: 1rem 0 0.5rem; } .ProseMirror h2 { font-size: 1.375rem; font-weight: 600; margin: 0.75rem 0 0.5rem; } .ProseMirror h3 { font-size: 1.125rem; font-weight: 500; margin: 0.5rem 0; } .ProseMirror p { margin: 0.5rem 0; } .ProseMirror strong { font-weight: 700; } .ProseMirror ul { list-style: disc; padding-left: 1.25rem; } .ProseMirror ol { list-style: decimal; padding-left: 1.25rem; } .ProseMirror blockquote { border-left: 3px solid hsl(var(--border)); padding-left: 1rem; margin: 0.5rem 0; color: hsl(var(--muted-foreground)); } .ProseMirror pre { background: hsl(var(--muted)); padding: 0.75rem; border-radius: 0.375rem; overflow-x: auto; } .ProseMirror code { background: hsl(var(--muted)); padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-family: monospace; } .ProseMirror hr { border: none; border-top: 1px solid hsl(var(--border)); margin: 1rem 0; } .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; } .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; } .ProseMirror ul[data-type="taskList"] input { accent-color: hsl(var(--primary)); } .ProseMirror li[data-checked="true"] > div { text-decoration: line-through; color: hsl(var(--muted-foreground)); } .ProseMirror sup { vertical-align: super; font-size: 0.75em; } .ProseMirror sub { vertical-align: sub; font-size: 0.75em; } .ProseMirror img { max-width: 100%; border-radius: 0.5rem; margin: 0.5rem 0; }`}</style>
    </div>
  );
}
