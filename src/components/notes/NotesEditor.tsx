import { useState, useEffect, useRef } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Tag,
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
  X,
  Loader2,
  Check,
  Trash2,
  Heading1,
  Heading2,
  Heading3,
  Save,
} from "lucide-react";
import type { Note, NoteGroup } from "@/pages/Notes";

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
            parseHTML: (element) => element.style.fontSize?.replace(/['"px]+/g, ""),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}px` };
            },
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
      unsetFontSize:
        () =>
        ({ chain }: any) =>
          chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

interface NotesEditorProps {
  note: Note;
  groups: NoteGroup[];
  onSave: (note: Note) => void;
  onBack: () => void;
  lastSaved?: Date | null;
}

const FONT_FAMILIES = [
  { value: "sans", label: "Sans", fontFamily: "Inter, system-ui, sans-serif" },
  { value: "serif", label: "Serif", fontFamily: "Georgia, serif" },
  { value: "mono", label: "Mono", fontFamily: "monospace" },
];

const FONT_SIZES = ["12", "14", "16", "18", "20", "24", "32"];

const TEXT_COLORS = [
  { value: "", label: "Default" },
  { value: "#000000", label: "Black" },
  { value: "#dc2626", label: "Red" },
  { value: "#ea580c", label: "Orange" },
  { value: "#16a34a", label: "Green" },
  { value: "#2563eb", label: "Blue" },
  { value: "#7c3aed", label: "Purple" },
];

const HIGHLIGHT_COLORS = [
  { value: "", label: "None" },
  { value: "#fef08a", label: "Yellow" },
  { value: "#bbf7d0", label: "Green" },
  { value: "#bfdbfe", label: "Blue" },
  { value: "#fbcfe8", label: "Pink" },
];

const ToolBtn = ({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={cn(
      "h-8 w-8 flex items-center justify-center rounded-md transition-all",
      "hover:bg-accent active:bg-accent/80",
      "disabled:opacity-40 disabled:cursor-not-allowed",
      active && "bg-primary/10 text-primary",
    )}
  >
    {children}
  </button>
);

export function NotesEditor({ note, groups, onSave, onBack, lastSaved }: NotesEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [tags, setTags] = useState<string[]>(note.tags);
  const [newTag, setNewTag] = useState("");
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imageWidth, setImageWidth] = useState(300);
  const [imagePos, setImagePos] = useState({ top: 0, left: 0 });

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const lastSavedContent = useRef(note.contentRich || "");

  // Initialize editor with the saved rich content
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Start writing your note..." }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline cursor-pointer", target: "_blank" },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: { class: "max-w-full h-auto rounded-lg cursor-pointer my-4 border" },
      }),
      TaskList.configure({ HTMLAttributes: { class: "space-y-2 my-3" } }),
      TaskItem.configure({ nested: true }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      FontSize,
    ],
    content: note.contentRich || "", // LOAD RICH CONTENT HERE!
    editorProps: {
      attributes: {
        class: cn(
          "focus:outline-none min-h-[300px] px-0 py-4 text-foreground",
          "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6",
          "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5",
          "[&_h3]:text-xl [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:mt-4",
          "[&_p]:my-2 [&_p]:leading-relaxed",
          "[&_strong]:font-bold",
          "[&_em]:italic",
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2",
          "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2",
          '[&_ul[data-type="taskList"]]:list-none [&_ul[data-type="taskList"]]:pl-0',
          '[&_ul[data-type="taskList"]_li]:flex [&_ul[data-type="taskList"]_li]:items-start [&_ul[data-type="taskList"]_li]:gap-2',
          '[&_ul[data-type="taskList"]_input]:mt-1 [&_ul[data-type="taskList"]_input]:accent-primary',
          '[&_li[data-checked="true"]]:text-muted-foreground [&_li[data-checked="true"]]:line-through',
          "[&_a]:text-primary [&_a]:underline",
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html !== lastSavedContent.current) {
        setSaveStatus("unsaved");
        // Auto-save after 2 seconds of inactivity
        if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        autosaveTimer.current = setTimeout(() => {
          handleSave();
        }, 2000);
      }
    },
  });

  // Update editor content when note changes (e.g., switching notes)
  useEffect(() => {
    if (editor && note.contentRich !== editor.getHTML()) {
      editor.commands.setContent(note.contentRich || "");
      lastSavedContent.current = note.contentRich || "";
    }
    setTitle(note.title);
    setTags(note.tags);
    setSaveStatus("saved");
  }, [note.id, editor]);

  // Image click handler
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" && editorWrapperRef.current) {
        const img = target as HTMLImageElement;
        const wrapperRect = editorWrapperRef.current.getBoundingClientRect();
        const imgRect = img.getBoundingClientRect();
        setSelectedImage(img);
        setImageWidth(img.offsetWidth || 300);
        setImagePos({ top: imgRect.top - wrapperRect.top - 50, left: imgRect.left - wrapperRect.left });
      } else if (!target.closest(".image-controls")) {
        setSelectedImage(null);
      }
    };
    const wrapper = editorWrapperRef.current;
    wrapper?.addEventListener("click", handleClick);
    return () => wrapper?.removeEventListener("click", handleClick);
  }, []);

  const handleSave = () => {
    if (!editor) return;
    setSaveStatus("saving");
    const html = editor.getHTML();
    const text = editor.getText();

    onSave({
      ...note,
      title,
      contentRich: html, // SAVE RICH HTML HERE!
      plainText: text, // Also save plain text for search
      tags,
      updatedAt: new Date().toISOString(),
    });

    lastSavedContent.current = html;
    setTimeout(() => setSaveStatus("saved"), 400);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
      setSaveStatus("unsaved");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    setSaveStatus("unsaved");
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setSaveStatus("unsaved");
  };

  const handleImageResize = (width: number) => {
    if (selectedImage) {
      selectedImage.style.width = `${width}px`;
      setImageWidth(width);
      setSaveStatus("unsaved");
    }
  };

  const deleteImage = () => {
    if (selectedImage) {
      selectedImage.remove();
      setSelectedImage(null);
      setSaveStatus("unsaved");
    }
  };

  const handleInsertLink = () => {
    if (!linkUrl || !editor) return;
    const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${url}" target="_blank">${url}</a>`).run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
    setLinkDialogOpen(false);
    setLinkUrl("");
  };

  const handleInsertImage = () => {
    if (!imageUrl || !editor) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageDialogOpen(false);
    setImageUrl("");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    // Upload to Supabase Storage instead of using base64
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (userId) {
        const fileExt = file.name.split(".").pop() || "jpg";
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const { error } = await supabase.storage.from("entry-covers").upload(fileName, file);
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from("entry-covers").getPublicUrl(fileName);
          editor.chain().focus().setImage({ src: publicUrl }).run();
          setImageDialogOpen(false);
          return;
        }
        console.error("Upload error, falling back to base64:", error);
      }

      // Show error if upload fails — do NOT fall back to base64 (causes localStorage bloat & data loss)
      console.error("Image upload failed — user not authenticated");
      const { toast: showToast } = await import("@/hooks/use-toast").then(m => ({ toast: m.toast }));
      showToast({ title: "Please log in to upload images", variant: "destructive" });
    } catch (err) {
      console.error("Image upload error:", err);
      const { toast: showToast } = await import("@/hooks/use-toast").then(m => ({ toast: m.toast }));
      showToast({ title: "Image upload failed", description: "Please try again.", variant: "destructive" });
    }
    setImageDialogOpen(false);
  };

  const group = groups.find((g) => g.id === note.groupId);

  const formatLastSaved = () => {
    if (!lastSaved) return "Not saved yet";
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    if (diff < 60000) return "Saved just now";
    if (diff < 3600000) return `Saved ${Math.floor(diff / 60000)}m ago`;
    return `Saved at ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Done
        </button>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "text-xs px-2 py-1 rounded-full",
              saveStatus === "saving" && "bg-amber-100 text-amber-700",
              saveStatus === "saved" && "bg-green-100 text-green-700",
              saveStatus === "unsaved" && "bg-gray-100 text-gray-500",
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
                {formatLastSaved()}
              </>
            )}
            {saveStatus === "unsaved" && "Unsaved"}
          </span>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            SAVE
          </Button>
          <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Tag className="h-4 w-4" />
                TAGS
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  />
                  <Button size="sm" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-0 z-40 bg-muted/50 backdrop-blur border-b overflow-x-auto">
        <div className="flex items-center gap-0.5 px-4 py-2 min-w-max">
          <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
            <Undo2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            <Redo2 className="h-4 w-4" />
          </ToolBtn>
          <div className="w-px h-5 bg-border mx-1" />
          <ToolBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive("heading", { level: 1 })}
            title="H1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="H2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="H3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolBtn>
          <div className="w-px h-5 bg-border mx-1" />
          <Select
            value={
              FONT_FAMILIES.find((f) => editor.getAttributes("textStyle").fontFamily?.includes(f.value))?.value ||
              "sans"
            }
            onValueChange={(v) => {
              const font = FONT_FAMILIES.find((f) => f.value === v);
              if (font) editor.chain().focus().setFontFamily(font.fontFamily).run();
            }}
          >
            <SelectTrigger className="w-20 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={editor.getAttributes("textStyle").fontSize?.replace("px", "") || "16"}
            onValueChange={(v) => (editor.chain().focus() as any).setFontSize(v).run()}
          >
            <SelectTrigger className="w-14 h-8 text-xs">
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
          <div className="w-px h-5 bg-border mx-1" />
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
            title="Strike"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolBtn>
          <div className="w-px h-5 bg-border mx-1" />
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent"
                title="Text Color"
              >
                <Palette className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="flex flex-wrap gap-1">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.value || "default"}
                    onClick={() =>
                      c.value
                        ? editor.chain().focus().setColor(c.value).run()
                        : editor.chain().focus().unsetColor().run()
                    }
                    className="h-6 w-6 rounded border hover:scale-110"
                    style={{ backgroundColor: c.value || "#fff" }}
                    title={c.label}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent" title="Highlight">
                <Highlighter className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="flex flex-wrap gap-1">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.value || "none"}
                    onClick={() =>
                      c.value
                        ? editor.chain().focus().setHighlight({ color: c.value }).run()
                        : editor.chain().focus().unsetHighlight().run()
                    }
                    className="h-6 w-6 rounded border hover:scale-110"
                    style={{ backgroundColor: c.value || "transparent" }}
                    title={c.label}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <div className="w-px h-5 bg-border mx-1" />
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
          <ToolBtn onClick={() => setLinkDialogOpen(true)} active={editor.isActive("link")} title="Link">
            <Link2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => setImageDialogOpen(true)} title="Image">
            <ImageIcon className="h-4 w-4" />
          </ToolBtn>
          <div className="w-px h-5 bg-border mx-1" />
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs bg-violet-50 border-violet-200 text-violet-700"
            onClick={() => alert("AI Edit coming soon!")}
          >
            <Sparkles className="h-3 w-3" />
            AI Edit
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div ref={editorWrapperRef} className="flex-1 overflow-auto relative">
        <div className="max-w-3xl mx-auto px-6 py-6">
          {/* Group Badge */}
          {group && (
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" style={{ backgroundColor: `${group.color}20`, color: group.color }}>
                {group.name}
              </Badge>
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Title */}
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled Note"
            className="text-3xl font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0 text-foreground mb-4"
          />

          {/* Rich Text Editor */}
          <EditorContent editor={editor} />

          {/* Image Resize Controls */}
          {selectedImage && (
            <div
              className="image-controls absolute z-50 bg-background border rounded-lg shadow-lg p-3 space-y-2"
              style={{ top: Math.max(10, imagePos.top), left: Math.max(10, imagePos.left), minWidth: 200 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Resize</span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={deleteImage}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Slider
                  value={[imageWidth]}
                  onValueChange={([v]) => handleImageResize(v)}
                  min={100}
                  max={700}
                  step={10}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12">{imageWidth}px</span>
              </div>
            </div>
          )}
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
              placeholder="https://..."
              onKeyDown={(e) => e.key === "Enter" && handleInsertLink()}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleInsertLink} disabled={!linkUrl}>
                Insert
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
            <div className="text-center text-sm text-muted-foreground">or</div>
            <Input type="file" accept="image/*" onChange={handleImageUpload} />
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
