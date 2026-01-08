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
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
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
  Heading1,
  Heading2,
  Heading3,
  Save,
  MoreHorizontal,
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
  lastSaved?: Date | null;
  showBreadcrumb?: boolean;
}

const FONT_FAMILIES = [
  { value: "inter", label: "Inter", css: "Inter, system-ui, sans-serif" },
  { value: "georgia", label: "Georgia", css: "Georgia, serif" },
  { value: "times", label: "Times New Roman", css: '"Times New Roman", Times, serif' },
  { value: "arial", label: "Arial", css: "Arial, Helvetica, sans-serif" },
  { value: "verdana", label: "Verdana", css: "Verdana, Geneva, sans-serif" },
  { value: "lora", label: "Lora", css: "Lora, serif" },
  { value: "playfair", label: "Playfair Display", css: '"Playfair Display", serif' },
  { value: "mono", label: "Monospace", css: '"SF Mono", "Fira Code", monospace' },
];

const FONT_SIZES = ["12", "14", "16", "18", "20", "24", "28", "32", "40"];

const TEXT_COLORS = [
  { value: "", label: "Default", color: "currentColor" },
  { value: "#1a1a1a", label: "Black", color: "#1a1a1a" },
  { value: "#dc2626", label: "Red", color: "#dc2626" },
  { value: "#ea580c", label: "Orange", color: "#ea580c" },
  { value: "#16a34a", label: "Green", color: "#16a34a" },
  { value: "#2563eb", label: "Blue", color: "#2563eb" },
  { value: "#7c3aed", label: "Purple", color: "#7c3aed" },
  { value: "#db2777", label: "Pink", color: "#db2777" },
];

const HIGHLIGHT_COLORS = [
  { value: "", label: "None", color: "transparent" },
  { value: "#fef08a", label: "Yellow", color: "#fef08a" },
  { value: "#bbf7d0", label: "Green", color: "#bbf7d0" },
  { value: "#bfdbfe", label: "Blue", color: "#bfdbfe" },
  { value: "#fbcfe8", label: "Pink", color: "#fbcfe8" },
  { value: "#fed7aa", label: "Orange", color: "#fed7aa" },
  { value: "#e9d5ff", label: "Purple", color: "#e9d5ff" },
];

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
  const [currentFont, setCurrentFont] = useState("inter");
  const [currentSize, setCurrentSize] = useState("16");

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContent = useRef(note.contentRich || "");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Start writing your note..." }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline hover:text-primary/80" } }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: { class: "max-w-full h-auto rounded-lg my-4 shadow-sm" },
      }),
      TaskList.configure({ HTMLAttributes: { class: "not-prose space-y-1" } }),
      TaskItem.configure({ nested: true, HTMLAttributes: { class: "flex items-start gap-2" } }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      FontSize,
    ],
    content: note.contentRich || "",
    editorProps: {
      attributes: {
        class: cn(
          "focus:outline-none min-h-[280px] text-foreground leading-relaxed",
          "prose prose-sm sm:prose-base max-w-none",
          "prose-headings:font-semibold prose-headings:text-foreground",
          "prose-h1:text-2xl prose-h1:mt-6 prose-h1:mb-3",
          "prose-h2:text-xl prose-h2:mt-5 prose-h2:mb-2",
          "prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2",
          "prose-p:my-2 prose-p:text-foreground",
          "prose-strong:font-bold prose-strong:text-foreground",
          "prose-ul:my-2 prose-ul:pl-5 prose-ol:my-2 prose-ol:pl-5",
          "prose-li:my-0.5",
          '[&_ul[data-type="taskList"]]:list-none [&_ul[data-type="taskList"]]:pl-0',
          '[&_ul[data-type="taskList"]_li]:flex [&_ul[data-type="taskList"]_li]:items-start [&_ul[data-type="taskList"]_li]:gap-2',
          '[&_ul[data-type="taskList"]_li_label]:flex [&_ul[data-type="taskList"]_li_label]:items-center [&_ul[data-type="taskList"]_li_label]:gap-2',
          '[&_ul[data-type="taskList"]_input[type="checkbox"]]:w-4 [&_ul[data-type="taskList"]_input[type="checkbox"]]:h-4 [&_ul[data-type="taskList"]_input[type="checkbox"]]:accent-primary [&_ul[data-type="taskList"]_input[type="checkbox"]]:rounded',
          '[&_li[data-checked="true"]_div]:line-through [&_li[data-checked="true"]_div]:text-muted-foreground',
        ),
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
    setTimeout(() => setSaveStatus("saved"), 600);
  }, [editor, note, title, tags, onSave]);

  const handleFontChange = (v: string) => {
    setCurrentFont(v);
    const font = FONT_FAMILIES.find((f) => f.value === v);
    if (font && editor) editor.chain().focus().setFontFamily(font.css).run();
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

  const ToolBtn = ({
    onClick,
    active,
    disabled,
    children,
    title: btnTitle,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      title={btnTitle}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "h-8 w-8 flex items-center justify-center rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-accent",
        "disabled:opacity-40 disabled:pointer-events-none",
        active && "bg-accent text-foreground",
      )}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-6 bg-border mx-0.5 shrink-0" />;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Premium Toolbar */}
      <div className="shrink-0 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex items-center px-2 py-1.5 gap-0.5 overflow-x-auto">
          {/* Undo/Redo */}
          <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
            <Undo2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            <Redo2 className="h-4 w-4" />
          </ToolBtn>
          <Divider />

          {/* Headings */}
          <ToolBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolBtn>
          <Divider />

          {/* Font & Size */}
          <Select value={currentFont} onValueChange={handleFontChange}>
            <SelectTrigger className="h-7 w-[90px] text-xs border-0 bg-muted/50 hover:bg-muted">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((f) => (
                <SelectItem key={f.value} value={f.value} className="text-sm" style={{ fontFamily: f.css }}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={currentSize} onValueChange={handleSizeChange}>
            <SelectTrigger className="h-7 w-[52px] text-xs border-0 bg-muted/50 hover:bg-muted">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Divider />

          {/* Text Formatting */}
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
          <ToolBtn
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolBtn>
          <Divider />

          {/* Colors */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Text Color"
              >
                <Palette className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <p className="text-xs font-medium mb-2 text-muted-foreground">Text Color</p>
              <div className="grid grid-cols-4 gap-1.5">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.value || "default"}
                    onClick={() =>
                      c.value
                        ? editor.chain().focus().setColor(c.value).run()
                        : editor.chain().focus().unsetColor().run()
                    }
                    className="h-7 w-7 rounded-md border border-border hover:scale-110 transition-transform shadow-sm"
                    style={{ backgroundColor: c.color }}
                    title={c.label}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Highlight"
              >
                <Highlighter className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <p className="text-xs font-medium mb-2 text-muted-foreground">Highlight</p>
              <div className="grid grid-cols-4 gap-1.5">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.value || "none"}
                    onClick={() =>
                      c.value
                        ? editor.chain().focus().setHighlight({ color: c.value }).run()
                        : editor.chain().focus().unsetHighlight().run()
                    }
                    className="h-7 w-7 rounded-md border border-border hover:scale-110 transition-transform shadow-sm"
                    style={{ backgroundColor: c.color }}
                    title={c.label}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Divider />

          {/* Lists */}
          <ToolBtn
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Numbered List"
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
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            active={editor.isActive({ textAlign: "center" })}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            active={editor.isActive({ textAlign: "right" })}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </ToolBtn>
          <Divider />

          {/* Media */}
          <ToolBtn onClick={() => setLinkDialogOpen(true)} active={editor.isActive("link")} title="Insert Link">
            <Link2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => setImageDialogOpen(true)} title="Insert Image">
            <ImageIcon className="h-4 w-4" />
          </ToolBtn>
          <Divider />

          {/* AI */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => alert("AI Edit coming soon!")}
          >
            <Sparkles className="h-3.5 w-3.5" /> AI
          </Button>

          {/* Spacer + Save */}
          <div className="flex-1 min-w-4" />
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded",
                saveStatus === "saving" && "text-amber-600 bg-amber-50",
                saveStatus === "saved" && "text-emerald-600 bg-emerald-50",
                saveStatus === "unsaved" && "text-muted-foreground bg-muted",
              )}
            >
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                  Saving...
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
            <Button size="sm" className="h-7 gap-1 text-xs" onClick={handleSave}>
              <Save className="h-3.5 w-3.5" /> Save
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          {/* Title */}
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled Note"
            className="text-xl sm:text-2xl font-semibold border-none bg-transparent px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50 mb-3"
          />

          {/* Tags */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {group && (
              <Badge variant="secondary" className="font-medium">
                {group.name}
              </Badge>
            )}
            {tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs font-normal">
                #{tag}
              </Badge>
            ))}
            <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground">
                  + Tag
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <div className="flex gap-1.5">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    className="h-8 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  />
                  <Button size="sm" className="h-8 px-2" onClick={handleAddTag}>
                    +
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Editor */}
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-sm">
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
              <Button className="flex-1" onClick={handleInsertLink} disabled={!linkUrl}>
                Insert Link
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
          <div className="space-y-4 pt-2">
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL..." />
            <div className="text-center text-sm text-muted-foreground">— or —</div>
            <Input type="file" accept="image/*" onChange={handleImageUpload} className="cursor-pointer" />
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
    </div>
  );
}
