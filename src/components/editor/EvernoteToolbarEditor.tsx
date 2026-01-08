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
  Trash2,
  Type,
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
  { value: "sans", label: "Sans Serif", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" },
  { value: "serif", label: "Serif", fontFamily: "Georgia, ui-serif, serif" },
  { value: "mono", label: "Monospace", fontFamily: "JetBrains Mono, ui-monospace, monospace" },
];

const FONT_SIZES = ["12", "14", "16", "18", "20", "24", "28", "32", "40", "48"];

const TEXT_COLORS = [
  { value: "", label: "Default", color: "currentColor" },
  { value: "#18181b", label: "Black", color: "#18181b" },
  { value: "#dc2626", label: "Red", color: "#dc2626" },
  { value: "#ea580c", label: "Orange", color: "#ea580c" },
  { value: "#ca8a04", label: "Yellow", color: "#ca8a04" },
  { value: "#16a34a", label: "Green", color: "#16a34a" },
  { value: "#2563eb", label: "Blue", color: "#2563eb" },
  { value: "#7c3aed", label: "Purple", color: "#7c3aed" },
  { value: "#db2777", label: "Pink", color: "#db2777" },
  { value: "#6b7280", label: "Gray", color: "#6b7280" },
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
// TOOLBAR BUTTON COMPONENT
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
      "h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-200",
      "hover:bg-white/10 hover:scale-105 active:scale-95",
      "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100",
      active && "bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-violet-300 shadow-inner",
    )}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-6 bg-white/10 mx-1" />;

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
      placeholder = "Start writing your thoughts...",
      autosaveMs = 2000,
      className,
    },
    ref,
  ) => {
    const [title, setTitle] = useState(initialTitle);
    const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
    const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
    const [imageWidth, setImageWidth] = useState(300);
    const [imagePosition, setImagePosition] = useState({ top: 0, left: 0 });
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [imageUrl, setImageUrl] = useState("");

    const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSavedContent = useRef(initialContent);
    const containerRef = useRef<HTMLDivElement>(null);
    const editorWrapperRef = useRef<HTMLDivElement>(null);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          bulletList: {
            HTMLAttributes: { class: "list-disc pl-6 space-y-1" },
          },
          orderedList: {
            HTMLAttributes: { class: "list-decimal pl-6 space-y-1" },
          },
        }),
        Placeholder.configure({
          placeholder,
          emptyEditorClass:
            "before:content-[attr(data-placeholder)] before:text-white/30 before:float-left before:h-0 before:pointer-events-none",
        }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class:
              "text-violet-400 underline decoration-violet-400/50 hover:decoration-violet-400 cursor-pointer transition-colors",
            target: "_blank",
          },
        }),
        Image.configure({
          inline: false,
          allowBase64: true,
          HTMLAttributes: {
            class:
              "max-w-full h-auto rounded-xl cursor-pointer my-4 shadow-lg ring-1 ring-white/10 hover:ring-violet-500/50 transition-all",
          },
        }),
        TaskList.configure({
          HTMLAttributes: { class: "space-y-2 my-4" },
        }),
        TaskItem.configure({
          nested: true,
          HTMLAttributes: {
            class: "flex items-start gap-3 group",
          },
        }),
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
            "prose prose-invert prose-sm max-w-none focus:outline-none min-h-[400px] px-6 py-6",
            "prose-headings:font-semibold prose-headings:text-white prose-headings:mb-4 prose-headings:mt-6",
            "prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl",
            "prose-p:text-white/80 prose-p:leading-relaxed prose-p:my-3",
            "prose-strong:text-white prose-strong:font-semibold",
            "prose-em:text-white/90",
            "prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline",
            '[&_ul[data-type="taskList"]]:list-none [&_ul[data-type="taskList"]]:pl-0',
            '[&_ul[data-type="taskList"]_li]:flex [&_ul[data-type="taskList"]_li]:items-start [&_ul[data-type="taskList"]_li]:gap-3',
            '[&_ul[data-type="taskList"]_li_label]:flex [&_ul[data-type="taskList"]_li_label]:items-center [&_ul[data-type="taskList"]_li_label]:gap-2',
            '[&_ul[data-type="taskList"]_li_input]:w-5 [&_ul[data-type="taskList"]_li_input]:h-5 [&_ul[data-type="taskList"]_li_input]:rounded',
            '[&_ul[data-type="taskList"]_li_input]:border-2 [&_ul[data-type="taskList"]_li_input]:border-white/30',
            '[&_ul[data-type="taskList"]_li_input:checked]:bg-gradient-to-br [&_ul[data-type="taskList"]_li_input:checked]:from-violet-500 [&_ul[data-type="taskList"]_li_input:checked]:to-fuchsia-500',
            '[&_ul[data-type="taskList"]_li_input:checked]:border-transparent',
            '[&_ul[data-type="taskList"]_li[data-checked="true"]_div]:line-through [&_ul[data-type="taskList"]_li[data-checked="true"]_div]:text-white/40',
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
            setTimeout(() => setSaveStatus("saved"), 500);
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

    // Handle title change
    const handleTitleChange = (newTitle: string) => {
      setTitle(newTitle);
      onTitleChange?.(newTitle);
      setSaveStatus("unsaved");
    };

    // Update content on prop change
    useEffect(() => {
      if (editor && initialContent !== editor.getHTML()) {
        editor.commands.setContent(initialContent);
        lastSavedContent.current = initialContent;
      }
    }, [initialContent, editor]);

    useEffect(() => {
      setTitle(initialTitle);
    }, [initialTitle]);

    // Image click handler with proper positioning
    useEffect(() => {
      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === "IMG" && editorWrapperRef.current) {
          const img = target as HTMLImageElement;
          const wrapperRect = editorWrapperRef.current.getBoundingClientRect();
          const imgRect = img.getBoundingClientRect();

          setSelectedImage(img);
          setImageWidth(img.offsetWidth || 300);
          setImagePosition({
            top: imgRect.top - wrapperRect.top - 50,
            left: imgRect.left - wrapperRect.left,
          });
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
          selectedImage.style.height = "auto";
          setImageWidth(width);
          if (editor) {
            setSaveStatus("unsaved");
          }
        }
      },
      [selectedImage, editor],
    );

    const deleteImage = useCallback(() => {
      if (selectedImage && editor) {
        selectedImage.remove();
        setSelectedImage(null);
        setSaveStatus("unsaved");
      }
    }, [selectedImage, editor]);

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
      const html = editor.getHTML();
      onSave?.({ html, text: editor.getText(), title });
      lastSavedContent.current = html;
      setTimeout(() => setSaveStatus("saved"), 500);
    };

    if (!editor) return null;

    return (
      <div
        ref={containerRef}
        className={cn(
          "flex flex-col h-full rounded-2xl overflow-hidden",
          "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800",
          "border border-white/10 shadow-2xl",
          className,
        )}
      >
        {/* Note Title Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5">
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled Note"
            className={cn(
              "text-2xl font-semibold bg-transparent border-none px-0 h-auto",
              "text-white placeholder:text-white/30 focus-visible:ring-0",
              "focus-visible:outline-none",
            )}
          />
        </div>

        {/* Luxury Toolbar */}
        <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-1 px-4 py-3 overflow-x-auto">
            {/* History */}
            <ToolBtn
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4 text-white/70" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4 text-white/70" />
            </ToolBtn>

            <Divider />

            {/* Headings */}
            <ToolBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor.isActive("heading", { level: 1 })}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4 text-white/70" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive("heading", { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4 text-white/70" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive("heading", { level: 3 })}
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4 text-white/70" />
            </ToolBtn>

            <Divider />

            {/* Font Family */}
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
              <SelectTrigger className="w-28 h-9 text-xs border-none bg-white/5 hover:bg-white/10 rounded-lg text-white/70">
                <Type className="h-3 w-3 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/10">
                {FONT_FAMILIES.map((f) => (
                  <SelectItem
                    key={f.value}
                    value={f.value}
                    className="text-white/80 focus:bg-white/10 focus:text-white"
                    style={{ fontFamily: f.fontFamily }}
                  >
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Font Size */}
            <Select
              value={editor.getAttributes("textStyle").fontSize?.replace("px", "") || "16"}
              onValueChange={(v) => (editor.chain().focus() as any).setFontSize(v).run()}
            >
              <SelectTrigger className="w-16 h-9 text-xs border-none bg-white/5 hover:bg-white/10 rounded-lg text-white/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/10">
                {FONT_SIZES.map((s) => (
                  <SelectItem key={s} value={s} className="text-white/80 focus:bg-white/10 focus:text-white">
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
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4 text-white/70" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive("italic")}
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4 text-white/70" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive("underline")}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="h-4 w-4 text-white/70" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive("strike")}
              title="Strikethrough"
            >
              <Strikethrough className="h-4 w-4 text-white/70" />
            </ToolBtn>

            <Divider />

            {/* Text Color */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all"
                  title="Text Color"
                >
                  <div className="flex flex-col items-center">
                    <Palette className="h-4 w-4 text-white/70" />
                    <div
                      className="h-0.5 w-4 mt-0.5 rounded-full"
                      style={{ backgroundColor: editor.getAttributes("textStyle").color || "#fff" }}
                    />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3 bg-slate-800 border-white/10">
                <p className="text-xs text-white/50 mb-2">Text Color</p>
                <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c.value || "default"}
                      onClick={() =>
                        c.value
                          ? editor.chain().focus().setColor(c.value).run()
                          : editor.chain().focus().unsetColor().run()
                      }
                      className={cn(
                        "h-7 w-7 rounded-lg border-2 transition-all hover:scale-110",
                        editor.getAttributes("textStyle").color === c.value
                          ? "border-violet-500 ring-2 ring-violet-500/30"
                          : "border-white/20 hover:border-white/40",
                      )}
                      style={{ backgroundColor: c.color }}
                      title={c.label}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Highlight */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all"
                  title="Highlight"
                >
                  <Highlighter className="h-4 w-4 text-white/70" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3 bg-slate-800 border-white/10">
                <p className="text-xs text-white/50 mb-2">Highlight</p>
                <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c.value || "none"}
                      onClick={() =>
                        c.value
                          ? editor.chain().focus().setHighlight({ color: c.value }).run()
                          : editor.chain().focus().unsetHighlight().run()
                      }
                      className={cn(
                        "h-7 w-7 rounded-lg border-2 transition-all hover:scale-110",
                        c.value === "" ? "border-dashed" : "",
                        "border-white/20 hover:border-white/40",
                      )}
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
              <List className="h-4 w-4 text-white/70" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive("orderedList")}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4 text-white/70" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              active={editor.isActive("taskList")}
              title="Checklist"
            >
              <CheckSquare className="h-4 w-4 text-white/70" />
            </ToolBtn>

            <Divider />

            {/* Alignment */}
            <ToolBtn
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              active={editor.isActive({ textAlign: "left" })}
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4 text-white/70" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              active={editor.isActive({ textAlign: "center" })}
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4 text-white/70" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              active={editor.isActive({ textAlign: "right" })}
              title="Align Right"
            >
              <AlignRight className="h-4 w-4 text-white/70" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
              active={editor.isActive({ textAlign: "justify" })}
              title="Justify"
            >
              <AlignJustify className="h-4 w-4 text-white/70" />
            </ToolBtn>

            <Divider />

            {/* Link & Image */}
            <ToolBtn onClick={() => setLinkDialogOpen(true)} active={editor.isActive("link")} title="Insert Link">
              <Link2 className="h-4 w-4 text-white/70" />
            </ToolBtn>
            <ToolBtn onClick={() => setImageDialogOpen(true)} title="Insert Image">
              <ImageIcon className="h-4 w-4 text-white/70" />
            </ToolBtn>

            <Divider />

            {/* AI Edit */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 gap-1.5 text-xs rounded-lg px-3",
                "bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20",
                "hover:from-violet-500/30 hover:to-fuchsia-500/30",
                "text-violet-300 border border-violet-500/30",
                "transition-all hover:scale-105",
              )}
              onClick={() => alert("AI Edit coming soon!")}
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Edit
            </Button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Save Status & Button */}
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all",
                  saveStatus === "saving" && "bg-amber-500/20 text-amber-300",
                  saveStatus === "saved" && "bg-emerald-500/20 text-emerald-300",
                  saveStatus === "unsaved" && "bg-white/10 text-white/50",
                )}
              >
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
              <Button
                size="sm"
                className={cn(
                  "h-9 px-4 rounded-lg gap-1.5",
                  "bg-gradient-to-r from-violet-600 to-fuchsia-600",
                  "hover:from-violet-500 hover:to-fuchsia-500",
                  "shadow-lg shadow-violet-500/25",
                  "transition-all hover:scale-105",
                )}
                onClick={handleManualSave}
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div ref={editorWrapperRef} className="flex-1 overflow-auto relative">
          <EditorContent editor={editor} className="max-w-4xl mx-auto" />

          {/* Image Resize Controls */}
          {selectedImage && (
            <div
              className={cn(
                "image-controls absolute z-50",
                "bg-slate-800/95 backdrop-blur-xl border border-white/10",
                "rounded-xl shadow-2xl p-4 space-y-3",
                "animate-in fade-in zoom-in-95 duration-200",
              )}
              style={{
                top: Math.max(10, imagePosition.top),
                left: Math.max(10, imagePosition.left),
                minWidth: 220,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Resize Image</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg"
                  onClick={deleteImage}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Slider
                  value={[imageWidth]}
                  onValueChange={([v]) => handleImageResize(v)}
                  min={100}
                  max={800}
                  step={10}
                  className="flex-1"
                />
                <span className="text-xs text-white/60 w-14 text-right">{imageWidth}px</span>
              </div>
            </div>
          )}
        </div>

        {/* Link Dialog */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent className="max-w-sm bg-slate-900 border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Insert Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                onKeyDown={(e) => e.key === "Enter" && handleInsertLink()}
              />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white/70"
                  onClick={() => setLinkDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-violet-600 hover:bg-violet-500"
                  onClick={handleInsertLink}
                  disabled={!linkUrl}
                >
                  Insert
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Dialog */}
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent className="max-w-sm bg-slate-900 border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Insert Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Image URL..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-white/40">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="bg-white/5 border-white/10 text-white file:bg-violet-600 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 file:cursor-pointer"
              />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white/70"
                  onClick={() => setImageDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-violet-600 hover:bg-violet-500"
                  onClick={handleInsertImage}
                  disabled={!imageUrl}
                >
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
