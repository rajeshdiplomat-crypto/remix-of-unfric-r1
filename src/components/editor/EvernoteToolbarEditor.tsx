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
import { useEffect, useRef, forwardRef, useImperativeHandle, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Heading1,
  Heading2,
  Heading3,
  Save,
} from "lucide-react";
import type { Editor } from "@tiptap/react";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface EditorProps {
  initialContent?: string;
  initialTitle?: string;
  onSave?: (content: { html: string; text: string; title: string }) => void;
  onContentChange?: (content: { html: string; text: string }) => void;
  onTitleChange?: (title: string) => void;
  placeholder?: string;
  autosaveMs?: number;
  className?: string;
}

export interface EditorRef {
  editor: Editor | null;
  getHTML: () => string;
  getText: () => string;
  getTitle: () => string;
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
  { value: "#db2777", label: "Pink" },
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
        ({ chain }: any) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }: any) => {
          return chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run();
        },
    };
  },
});

// ============================================================================
// TOOLBAR BUTTON
// ============================================================================

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
      "hover:bg-gray-100 active:bg-gray-200",
      "disabled:opacity-40 disabled:cursor-not-allowed",
      active && "bg-violet-100 text-violet-700",
    )}
  >
    {children}
  </button>
);

// ============================================================================
// MAIN EDITOR COMPONENT
// ============================================================================

export const EvernoteToolbarEditor = forwardRef<EditorRef, EditorProps>(
  (
    {
      initialContent = "",
      initialTitle = "",
      onSave,
      onContentChange,
      onTitleChange,
      placeholder = "Start writing...",
      autosaveMs = 2000,
      className,
    },
    ref,
  ) => {
    const [title, setTitle] = useState(initialTitle);
    const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
    const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
    const [imageWidth, setImageWidth] = useState(300);
    const [imagePos, setImagePos] = useState({ top: 0, left: 0 });
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [imageUrl, setImageUrl] = useState("");

    const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSavedContent = useRef(initialContent);
    const editorWrapperRef = useRef<HTMLDivElement>(null);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Placeholder.configure({ placeholder }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { class: "text-violet-600 underline cursor-pointer", target: "_blank" },
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
      content: initialContent,
      editorProps: {
        attributes: {
          class: cn(
            "focus:outline-none min-h-[300px] px-4 py-4 text-gray-800",
            // Headings
            "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-gray-900",
            "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-gray-900",
            "[&_h3]:text-xl [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-gray-900",
            // Paragraphs
            "[&_p]:my-2 [&_p]:leading-relaxed",
            // BOLD - Make it visually distinct!
            "[&_strong]:font-bold [&_strong]:text-gray-900",
            "[&_b]:font-bold [&_b]:text-gray-900",
            // Italic
            "[&_em]:italic",
            // Lists
            "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ul]:space-y-1",
            "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_ol]:space-y-1",
            // Task List
            '[&_ul[data-type="taskList"]]:list-none [&_ul[data-type="taskList"]]:pl-0',
            '[&_ul[data-type="taskList"]_li]:flex [&_ul[data-type="taskList"]_li]:items-start [&_ul[data-type="taskList"]_li]:gap-2',
            '[&_ul[data-type="taskList"]_input]:mt-1 [&_ul[data-type="taskList"]_input]:w-4 [&_ul[data-type="taskList"]_input]:h-4',
            '[&_ul[data-type="taskList"]_input]:accent-violet-600',
            '[&_li[data-checked="true"]]:text-gray-400 [&_li[data-checked="true"]]:line-through',
            // Links
            "[&_a]:text-violet-600 [&_a]:underline",
            // Placeholder
            "[&_.is-empty]:before:content-[attr(data-placeholder)] [&_.is-empty]:before:text-gray-400 [&_.is-empty]:before:float-left [&_.is-empty]:before:h-0 [&_.is-empty]:before:pointer-events-none",
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
            onSave?.({ html, text, title });
            lastSavedContent.current = html;
            setTimeout(() => setSaveStatus("saved"), 400);
          }, autosaveMs);
        }
      },
    });

    useImperativeHandle(ref, () => ({
      editor,
      getHTML: () => editor?.getHTML() || "",
      getText: () => editor?.getText() || "",
      getTitle: () => title,
    }));

    const handleTitleChange = (newTitle: string) => {
      setTitle(newTitle);
      onTitleChange?.(newTitle);
      setSaveStatus("unsaved");
    };

    useEffect(() => {
      if (editor && initialContent !== editor.getHTML()) {
        editor.commands.setContent(initialContent);
        lastSavedContent.current = initialContent;
      }
    }, [initialContent, editor]);

    useEffect(() => {
      setTitle(initialTitle);
    }, [initialTitle]);

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

    const handleImageResize = useCallback(
      (width: number) => {
        if (selectedImage) {
          selectedImage.style.width = `${width}px`;
          setImageWidth(width);
          setSaveStatus("unsaved");
        }
      },
      [selectedImage],
    );

    const deleteImage = useCallback(() => {
      if (selectedImage) {
        selectedImage.remove();
        setSelectedImage(null);
        setSaveStatus("unsaved");
      }
    }, [selectedImage]);

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
      onSave?.({ html: editor.getHTML(), text: editor.getText(), title });
      lastSavedContent.current = editor.getHTML();
      setTimeout(() => setSaveStatus("saved"), 400);
    };

    if (!editor) return null;

    return (
      <div
        className={cn(
          "flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden",
          className,
        )}
      >
        {/* Title */}
        <div className="px-4 pt-4 pb-2 border-b border-gray-100">
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled Note"
            className="text-xl font-semibold bg-transparent border-none px-0 h-auto text-gray-900 placeholder:text-gray-400 focus-visible:ring-0"
          />
        </div>

        {/* Toolbar - Scrollable */}
        <div className="sticky top-0 z-40 bg-gray-50/95 backdrop-blur border-b border-gray-200 overflow-x-auto">
          <div className="flex items-center gap-0.5 px-2 py-2 min-w-max">
            {/* History */}
            <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
              <Undo2 className="h-4 w-4 text-gray-600" />
            </ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
              <Redo2 className="h-4 w-4 text-gray-600" />
            </ToolBtn>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Headings */}
            <ToolBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor.isActive("heading", { level: 1 })}
              title="H1"
            >
              <Heading1 className="h-4 w-4 text-gray-600" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive("heading", { level: 2 })}
              title="H2"
            >
              <Heading2 className="h-4 w-4 text-gray-600" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive("heading", { level: 3 })}
              title="H3"
            >
              <Heading3 className="h-4 w-4 text-gray-600" />
            </ToolBtn>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Font */}
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
              <SelectTrigger className="w-20 h-8 text-xs border-gray-200 bg-white">
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
              value={editor.getAttributes("textStyle").fontSize?.replace("px", "") || "16"}
              onValueChange={(v) => (editor.chain().focus() as any).setFontSize(v).run()}
            >
              <SelectTrigger className="w-14 h-8 text-xs border-gray-200 bg-white">
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

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Formatting */}
            <ToolBtn
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive("bold")}
              title="Bold"
            >
              <Bold className="h-4 w-4 text-gray-600" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive("italic")}
              title="Italic"
            >
              <Italic className="h-4 w-4 text-gray-600" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive("underline")}
              title="Underline"
            >
              <UnderlineIcon className="h-4 w-4 text-gray-600" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive("strike")}
              title="Strike"
            >
              <Strikethrough className="h-4 w-4 text-gray-600" />
            </ToolBtn>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Colors */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100"
                  title="Text Color"
                >
                  <Palette className="h-4 w-4 text-gray-600" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="flex flex-wrap gap-1 max-w-[160px]">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c.value || "default"}
                      onClick={() =>
                        c.value
                          ? editor.chain().focus().setColor(c.value).run()
                          : editor.chain().focus().unsetColor().run()
                      }
                      className="h-6 w-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: c.value || "#fff" }}
                      title={c.label}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100"
                  title="Highlight"
                >
                  <Highlighter className="h-4 w-4 text-gray-600" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="flex flex-wrap gap-1 max-w-[160px]">
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c.value || "none"}
                      onClick={() =>
                        c.value
                          ? editor.chain().focus().setHighlight({ color: c.value }).run()
                          : editor.chain().focus().unsetHighlight().run()
                      }
                      className="h-6 w-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: c.value || "transparent" }}
                      title={c.label}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Lists */}
            <ToolBtn
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive("bulletList")}
              title="Bullet List"
            >
              <List className="h-4 w-4 text-gray-600" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive("orderedList")}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4 text-gray-600" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              active={editor.isActive("taskList")}
              title="Checklist"
            >
              <CheckSquare className="h-4 w-4 text-gray-600" />
            </ToolBtn>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Align */}
            <ToolBtn
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              active={editor.isActive({ textAlign: "left" })}
              title="Left"
            >
              <AlignLeft className="h-4 w-4 text-gray-600" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              active={editor.isActive({ textAlign: "center" })}
              title="Center"
            >
              <AlignCenter className="h-4 w-4 text-gray-600" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              active={editor.isActive({ textAlign: "right" })}
              title="Right"
            >
              <AlignRight className="h-4 w-4 text-gray-600" />
            </ToolBtn>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Media */}
            <ToolBtn onClick={() => setLinkDialogOpen(true)} active={editor.isActive("link")} title="Link">
              <Link2 className="h-4 w-4 text-gray-600" />
            </ToolBtn>
            <ToolBtn onClick={() => setImageDialogOpen(true)} title="Image">
              <ImageIcon className="h-4 w-4 text-gray-600" />
            </ToolBtn>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* AI */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100"
              onClick={() => alert("AI Edit coming soon!")}
            >
              <Sparkles className="h-3 w-3" />
              AI Edit
            </Button>

            <div className="flex-1 min-w-4" />

            {/* Save */}
            <span
              className={cn(
                "text-xs px-2 py-1 rounded-full mr-2",
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
                  Saved
                </>
              )}
              {saveStatus === "unsaved" && "Unsaved"}
            </span>
            <Button size="sm" className="h-8 gap-1 bg-violet-600 hover:bg-violet-700" onClick={handleManualSave}>
              <Save className="h-3 w-3" />
              Save
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div ref={editorWrapperRef} className="flex-1 overflow-auto relative bg-white">
          <EditorContent editor={editor} className="max-w-3xl mx-auto" />

          {selectedImage && (
            <div
              className="image-controls absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 space-y-2"
              style={{ top: Math.max(10, imagePos.top), left: Math.max(10, imagePos.left), minWidth: 200 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Resize</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                  onClick={deleteImage}
                >
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
                <span className="text-xs text-gray-500 w-12">{imageWidth}px</span>
              </div>
            </div>
          )}
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
              <div className="text-center text-sm text-gray-400">or</div>
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
  },
);

EvernoteToolbarEditor.displayName = "EvernoteToolbarEditor";

export default EvernoteToolbarEditor;
