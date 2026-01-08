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
import { useEffect, useRef, forwardRef, useImperativeHandle, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
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
  Trash2,
} from "lucide-react";
import type { Editor } from "@tiptap/react";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface EditorProps {
  initialContent?: string;
  onSave?: (content: { html: string; text: string }) => void;
  onContentChange?: (content: { html: string; text: string }) => void;
  placeholder?: string;
  autosaveMs?: number;
  className?: string;
}

export interface EditorRef {
  editor: Editor | null;
  getHTML: () => string;
  getText: () => string;
}

const FONT_FAMILIES = [
  { value: "sans", label: "Sans Serif", fontFamily: "ui-sans-serif, system-ui, sans-serif" },
  { value: "serif", label: "Serif", fontFamily: "ui-serif, Georgia, serif" },
  { value: "mono", label: "Monospace", fontFamily: "ui-monospace, monospace" },
];

const FONT_SIZES = ["12", "14", "16", "18", "20", "24", "28", "32"];

const TEXT_COLORS = [
  { value: "", label: "Default" },
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#6b7280", label: "Gray" },
];

const HIGHLIGHT_COLORS = [
  { value: "", label: "None" },
  { value: "#fef08a", label: "Yellow" },
  { value: "#bbf7d0", label: "Green" },
  { value: "#bfdbfe", label: "Blue" },
  { value: "#fbcfe8", label: "Pink" },
  { value: "#fed7aa", label: "Orange" },
];

// ============================================================================
// FONT SIZE EXTENSION
// ============================================================================

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
            parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, ""),
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
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run();
        },
    };
  },
});

// ============================================================================
// MAIN EDITOR COMPONENT
// ============================================================================

export const EvernoteToolbarEditor = forwardRef<EditorRef, EditorProps>(
  (
    { initialContent = "", onSave, onContentChange, placeholder = "Start typing...", autosaveMs = 2000, className },
    ref,
  ) => {
    const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
    const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
    const [imageWidth, setImageWidth] = useState(300);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [imageUrl, setImageUrl] = useState("");

    const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSavedContent = useRef(initialContent);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        Placeholder.configure({ placeholder }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { class: "text-primary underline cursor-pointer", target: "_blank" },
        }),
        Image.configure({
          inline: true,
          allowBase64: true,
          HTMLAttributes: { class: "max-w-full h-auto rounded cursor-pointer" },
        }),
        TaskList,
        TaskItem.configure({ nested: true }),
        TextStyle,
        Color,
        Highlight.configure({ multicolor: true }),
        FontFamily,
        FontSize,
        Subscript,
        Superscript,
      ],
      content: initialContent,
      editorProps: {
        attributes: {
          class: cn(
            "prose prose-sm max-w-none focus:outline-none min-h-[400px] text-foreground px-4 py-4",
            "[&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6",
            "[&_p]:my-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-medium",
          ),
        },
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        const text = editor.getText();
        onContentChange?.({ html, text });

        if (html !== lastSavedContent.current) {
          setSaveStatus("unsaved");
          if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
          autosaveTimer.current = setTimeout(() => {
            setSaveStatus("saving");
            onSave?.({ html, text });
            lastSavedContent.current = html;
            setTimeout(() => setSaveStatus("saved"), 300);
          }, autosaveMs);
        }
      },
    });

    useImperativeHandle(ref, () => ({
      editor,
      getHTML: () => editor?.getHTML() || "",
      getText: () => editor?.getText() || "",
    }));

    useEffect(() => {
      if (editor && initialContent !== editor.getHTML()) {
        editor.commands.setContent(initialContent);
        lastSavedContent.current = initialContent;
      }
    }, [initialContent, editor]);

    useEffect(() => {
      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === "IMG") {
          setSelectedImage(target as HTMLImageElement);
          setImageWidth(target.offsetWidth);
        } else if (!target.closest(".image-controls")) {
          setSelectedImage(null);
        }
      };
      containerRef.current?.addEventListener("click", handleClick);
      return () => containerRef.current?.removeEventListener("click", handleClick);
    }, []);

    const handleImageResize = useCallback(
      (width: number) => {
        if (selectedImage) {
          selectedImage.style.width = `${width}px`;
          setImageWidth(width);
          if (editor) {
            const html = editor.getHTML();
            onContentChange?.({ html, text: editor.getText() });
            setSaveStatus("unsaved");
          }
        }
      },
      [selectedImage, editor, onContentChange],
    );

    const deleteImage = useCallback(() => {
      if (selectedImage && editor) {
        selectedImage.remove();
        setSelectedImage(null);
        const html = editor.getHTML();
        onContentChange?.({ html, text: editor.getText() });
      }
    }, [selectedImage, editor, onContentChange]);

    const handleInsertLink = () => {
      if (!linkUrl || !editor) return;
      if (editor.state.selection.empty) {
        editor.chain().focus().insertContent(`<a href="${linkUrl}" target="_blank">${linkUrl}</a>`).run();
      } else {
        editor.chain().focus().setLink({ href: linkUrl }).run();
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        editor
          .chain()
          .focus()
          .setImage({ src: ev.target?.result as string })
          .run();
      };
      reader.readAsDataURL(file);
      setImageDialogOpen(false);
    };

    const handleManualSave = () => {
      if (!editor) return;
      setSaveStatus("saving");
      const html = editor.getHTML();
      onSave?.({ html, text: editor.getText() });
      lastSavedContent.current = html;
      setTimeout(() => setSaveStatus("saved"), 300);
    };

    if (!editor) return null;

    const ToolBtn = ({
      onClick,
      active,
      children,
      title,
    }: {
      onClick: () => void;
      active?: boolean;
      children: React.ReactNode;
      title: string;
    }) => (
      <button
        type="button"
        title={title}
        onMouseDown={(e) => {
          e.preventDefault();
          onClick();
        }}
        className={cn(
          "h-8 w-8 flex items-center justify-center rounded-md transition-colors",
          "hover:bg-accent",
          active && "bg-accent text-accent-foreground",
        )}
      >
        {children}
      </button>
    );

    return (
      <div className={cn("flex flex-col h-full bg-background", className)}>
        {/* Toolbar */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-2">
          <div className="flex items-center gap-1 flex-wrap">
            <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
              <Undo2 className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
              <Redo2 className="h-4 w-4" />
            </ToolBtn>

            <div className="w-px h-6 bg-border mx-1" />

            <Select
              value={
                FONT_FAMILIES.find((f) => f.fontFamily === editor.getAttributes("textStyle").fontFamily)?.value ||
                "sans"
              }
              onValueChange={(v) => {
                const font = FONT_FAMILIES.find((f) => f.value === v);
                if (font) editor.chain().focus().setFontFamily(font.fontFamily).run();
              }}
            >
              <SelectTrigger className="w-24 h-8 text-xs border-none bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map((f) => (
                  <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.fontFamily }}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={editor.getAttributes("textStyle").fontSize || "16"}
              onValueChange={(v) => editor.chain().focus().setFontSize(v).run()}
            >
              <SelectTrigger className="w-16 h-8 text-xs border-none bg-transparent">
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

            <div className="w-px h-6 bg-border mx-1" />

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

            <div className="w-px h-6 bg-border mx-1" />

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
                <div className="flex flex-wrap gap-1 max-w-[180px]">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c.value || "default"}
                      onClick={() =>
                        c.value
                          ? editor.chain().focus().setColor(c.value).run()
                          : editor.chain().focus().unsetColor().run()
                      }
                      className="h-6 w-6 rounded border"
                      style={{ backgroundColor: c.value || "var(--foreground)" }}
                      title={c.label}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent"
                  title="Highlight"
                >
                  <Highlighter className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="flex flex-wrap gap-1 max-w-[180px]">
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c.value || "none"}
                      onClick={() =>
                        c.value
                          ? editor.chain().focus().setHighlight({ color: c.value }).run()
                          : editor.chain().focus().unsetHighlight().run()
                      }
                      className="h-6 w-6 rounded border"
                      style={{ backgroundColor: c.value || "transparent" }}
                      title={c.label}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <div className="w-px h-6 bg-border mx-1" />

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

            <div className="w-px h-6 bg-border mx-1" />

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

            <div className="w-px h-6 bg-border mx-1" />

            <ToolBtn onClick={() => setLinkDialogOpen(true)} active={editor.isActive("link")} title="Insert Link">
              <Link2 className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn onClick={() => setImageDialogOpen(true)} title="Insert Image">
              <ImageIcon className="h-4 w-4" />
            </ToolBtn>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => alert("AI Edit coming soon!")}
            >
              <Sparkles className="h-3 w-3" />
              AI Edit
            </Button>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {saveStatus === "saving" && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                  </>
                )}
                {saveStatus === "saved" && (
                  <>
                    <Check className="h-3 w-3" /> Saved
                  </>
                )}
                {saveStatus === "unsaved" && "Unsaved"}
              </span>
              <Button size="sm" variant="outline" className="h-8" onClick={handleManualSave}>
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div ref={containerRef} className="flex-1 overflow-auto relative">
          <EditorContent editor={editor} className="max-w-4xl mx-auto" />

          {selectedImage && (
            <div
              className="image-controls absolute bg-background/95 backdrop-blur border rounded-lg shadow-lg p-3 space-y-3"
              style={{
                top: selectedImage.offsetTop - 60,
                left: selectedImage.offsetLeft,
                minWidth: 200,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Resize Image</span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={deleteImage}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Slider
                  value={[imageWidth]}
                  onValueChange={([v]) => handleImageResize(v)}
                  min={100}
                  max={800}
                  step={10}
                  className="flex-1"
                />
                <span className="text-xs w-12">{imageWidth}px</span>
              </div>
            </div>
          )}
        </div>

        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Insert Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
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

        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Insert Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL..." />
              <div className="text-center text-sm text-muted-foreground">or</div>
              <Input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} />
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
  },
);

EvernoteToolbarEditor.displayName = "EvernoteToolbarEditor";

export default EvernoteToolbarEditor;
