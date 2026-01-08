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
  { value: "inter", label: "Inter", css: "Inter, system-ui, sans-serif" },
  { value: "arial", label: "Arial", css: "Arial, Helvetica, sans-serif" },
  { value: "georgia", label: "Georgia", css: "Georgia, Cambria, serif" },
  { value: "times", label: "Times", css: '"Times New Roman", Times, serif' },
  { value: "verdana", label: "Verdana", css: "Verdana, Geneva, sans-serif" },
  { value: "helvetica", label: "Helvetica", css: "Helvetica Neue, Helvetica, sans-serif" },
  { value: "garamond", label: "Garamond", css: "Garamond, Baskerville, serif" },
  { value: "courier", label: "Courier", css: '"Courier New", Courier, monospace' },
  { value: "trebuchet", label: "Trebuchet", css: '"Trebuchet MS", sans-serif' },
  { value: "palatino", label: "Palatino", css: '"Palatino Linotype", Palatino, serif' },
  { value: "tahoma", label: "Tahoma", css: "Tahoma, Geneva, sans-serif" },
  { value: "mono", label: "Mono", css: '"SF Mono", "Fira Code", monospace' },
];

const SIZES = ["10", "12", "14", "16", "18", "20", "24", "28", "32", "40", "48"];
const TEXT_COLORS = ["#1a1a1a", "#dc2626", "#ea580c", "#16a34a", "#2563eb", "#7c3aed", "#db2777", "#0891b2"];
const HIGHLIGHT_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#fed7aa", "#e9d5ff", "#fecaca"];

const BG_PRESETS = [
  { id: "none", label: "None", value: "#ffffff" },
  { id: "cream", label: "Cream", value: "#fffbeb" },
  { id: "mint", label: "Mint", value: "#ecfdf5" },
  { id: "lavender", label: "Lavender", value: "#f5f3ff" },
  { id: "sky", label: "Sky", value: "#f0f9ff" },
  { id: "rose", label: "Rose", value: "#fff1f2" },
  { id: "slate", label: "Slate", value: "#f8fafc" },
  { id: "warm", label: "Warm", value: "#fef7ef" },
];

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
  const [editorBg, setEditorBg] = useState("#ffffff");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContent = useRef(note.contentRich || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Start writing..." }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
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
    ? "fixed inset-0 z-[9999] flex flex-col bg-white"
    : "flex flex-col h-full w-full overflow-hidden";

  return (
    <div className={containerClass} style={{ backgroundColor: editorBg }}>
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

          {/* Heading */}
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

          {/* Font */}
          <Select value={currentFont} onValueChange={handleFontChange}>
            <SelectTrigger className="h-8 w-24 text-xs border-0 bg-slate-50 hover:bg-slate-100 rounded-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[99999] max-h-72">
              {FONTS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Size */}
          <Select value={currentSize} onValueChange={handleSizeChange}>
            <SelectTrigger className="h-8 w-14 text-xs border-0 bg-slate-50 hover:bg-slate-100 rounded-md">
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

          {/* Color */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-slate-100">
                <Palette className="h-4 w-4 text-slate-500" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2 z-[99999]" align="start">
              <div className="flex gap-1 flex-wrap max-w-32">
                <button
                  onClick={() => editor.chain().focus().unsetColor().run()}
                  className="h-6 w-6 rounded-full border border-slate-200 bg-white text-xs"
                >
                  ×
                </button>
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => editor.chain().focus().setColor(c).run()}
                    className="h-6 w-6 rounded-full border border-slate-200"
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

          {/* Highlight */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-slate-100">
                <Highlighter className="h-4 w-4 text-slate-500" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2 z-[99999]" align="start">
              <div className="flex gap-1 flex-wrap max-w-32">
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
                    className="h-6 w-6 rounded border border-slate-200"
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
            <Link2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => setImageDialogOpen(true)} title="Image">
            <ImageIcon className="h-4 w-4" />
          </ToolBtn>

          {/* Background */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-slate-100"
                title="Background"
              >
                <ImagePlus className="h-4 w-4 text-slate-500" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3 z-[99999]" align="start">
              <p className="text-xs text-slate-500 mb-2">Background</p>
              <div className="grid grid-cols-4 gap-2">
                {BG_PRESETS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => setEditorBg(bg.value)}
                    title={bg.label}
                    className={cn(
                      "h-8 w-8 rounded-md border-2",
                      editorBg === bg.value ? "border-primary" : "border-slate-200",
                    )}
                    style={{ backgroundColor: bg.value }}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* More */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-slate-100">
                <MoreHorizontal className="h-4 w-4 text-slate-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[99999]">
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

          {/* AI */}
          <button
            onClick={() => alert("AI coming soon!")}
            className="h-8 px-3 flex items-center gap-1.5 rounded-md text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow hover:shadow-md"
          >
            <Sparkles className="h-3.5 w-3.5" /> AI
          </button>

          <div className="flex-1 min-w-4" />

          {/* Status & Actions */}
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

      {/* Content - NO MAX WIDTH, FULL WIDTH */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="px-4 py-3" style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled Note"
            className="text-2xl font-semibold border-none bg-transparent px-0 h-auto focus-visible:ring-0 mb-3"
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
      </div>

      {/* Link Dialog */}
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

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-sm z-[999999]">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL..." />
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
        .ProseMirror { word-break: break-word; overflow-wrap: anywhere; }
        .ProseMirror h1 { font-size: 1.875rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .ProseMirror h2 { font-size: 1.5rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
        .ProseMirror h3 { font-size: 1.25rem; font-weight: 600; margin: 0.5rem 0 0.5rem; }
        .ProseMirror p { margin: 0.375rem 0; line-height: 1.6; }
        .ProseMirror strong { font-weight: 700; }
        .ProseMirror ul { list-style: disc; padding-left: 1.5rem; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; }
        .ProseMirror blockquote { border-left: 3px solid #e2e8f0; padding-left: 1rem; color: #64748b; font-style: italic; }
        .ProseMirror pre { background: #f1f5f9; padding: 0.75rem; border-radius: 0.375rem; overflow-x: auto; }
        .ProseMirror code { background: #f1f5f9; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-family: monospace; }
        .ProseMirror hr { border: none; border-top: 1px solid #e2e8f0; margin: 1rem 0; }
        .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; }
        .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; }
        .ProseMirror ul[data-type="taskList"] input { accent-color: #10b981; }
        .ProseMirror li[data-checked="true"] > div { text-decoration: line-through; color: #94a3b8; }
        .ProseMirror img { max-width: 100%; border-radius: 0.5rem; margin: 0.5rem 0; }
        .ProseMirror a { color: #3b82f6; text-decoration: underline; }
      `}</style>
    </div>
  );
}
