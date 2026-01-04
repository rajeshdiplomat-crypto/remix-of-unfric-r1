import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Image,
  Link,
  Palette,
  Highlighter,
  RemoveFormatting,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Editor } from "@tiptap/react";
import { useCallback } from "react";

interface JournalToolbarProps {
  editor: Editor | null;
  fontFamily: string;
  fontSize: number;
  onFontFamilyChange: (font: string) => void;
  onFontSizeChange: (size: number) => void;
}

const FONT_FAMILIES = [
  { label: "Inter", value: "Inter" },
  { label: "Georgia", value: "Georgia" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Arial", value: "Arial" },
  { label: "DM Sans", value: "DM Sans" },
  { label: "Crimson Pro", value: "Crimson Pro" },
  { label: "Lora", value: "Lora" },
];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];

const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Red", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Yellow", value: "#eab308" },
  { label: "Green", value: "#22c55e" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Purple", value: "#a855f7" },
  { label: "Pink", value: "#ec4899" },
  { label: "Gray", value: "#6b7280" },
];

const HIGHLIGHT_COLORS = [
  { label: "None", value: "" },
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Pink", value: "#fbcfe8" },
  { label: "Purple", value: "#e9d5ff" },
  { label: "Orange", value: "#fed7aa" },
];

export function JournalToolbar({
  editor,
  fontFamily,
  fontSize,
  onFontFamilyChange,
  onFontSizeChange,
}: JournalToolbarProps) {
  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;

    const url = window.prompt("Image URL");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const handleFontFamilyChange = useCallback((font: string) => {
    onFontFamilyChange(font);
    editor?.chain().focus().setFontFamily(font).run();
  }, [editor, onFontFamilyChange]);

  const clearFormatting = useCallback(() => {
    editor?.chain().focus().unsetAllMarks().clearNodes().run();
  }, [editor]);

  const isDisabled = !editor;

  const ToolButton = ({
    icon: Icon,
    onClick,
    active,
    disabled,
    title,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled || isDisabled}
      title={title}
    className={cn(
      "h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-transparent rounded-none",
      active && "text-foreground border-b-2 border-foreground"
    )}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  const Divider = () => <div className="w-px h-6 bg-border/50 mx-1" />;


  return (
    <div className="flex items-center gap-1 bg-card border border-border/50 rounded-xl px-3 py-2 shadow-sm sticky top-0 z-20 flex-wrap">
      {/* Undo / Redo */}
      <ToolButton
        icon={Undo2}
        onClick={() => editor?.chain().focus().undo().run()}
        disabled={!editor?.can().undo()}
        title="Undo"
      />
      <ToolButton
        icon={Redo2}
        onClick={() => editor?.chain().focus().redo().run()}
        disabled={!editor?.can().redo()}
        title="Redo"
      />

      <Divider />

      {/* Font Family */}
      <Select value={editor?.getAttributes('textStyle').fontFamily || fontFamily} onValueChange={handleFontFamilyChange}>
        <SelectTrigger className="h-8 w-[120px] text-xs border-0 bg-muted/30">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_FAMILIES.map((font) => (
            <SelectItem
              key={font.value}
              value={font.value}
              style={{ fontFamily: font.value }}
            >
              {font.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Font Size */}
      <Select
        value={fontSize.toString()}
        onValueChange={(v) => onFontSizeChange(parseInt(v))}
      >
        <SelectTrigger className="h-8 w-[70px] text-xs border-0 bg-muted/30">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_SIZES.map((size) => (
            <SelectItem key={size} value={size.toString()}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Divider />

      {/* Text Formatting */}
      <ToolButton
        icon={Bold}
        onClick={() => editor?.chain().focus().toggleBold().run()}
        active={editor?.isActive("bold")}
        title="Bold"
      />
      <ToolButton
        icon={Italic}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        active={editor?.isActive("italic")}
        title="Italic"
      />
      <ToolButton
        icon={UnderlineIcon}
        onClick={() => editor?.chain().focus().toggleUnderline().run()}
        active={editor?.isActive("underline")}
        title="Underline"
      />

      <Divider />

      {/* Text Color */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isDisabled}
            title="Text Color"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-transparent rounded-none"
          >
            <Palette className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex flex-wrap gap-1 max-w-[180px]">
            {TEXT_COLORS.map((color) => (
              <button
                key={color.value || 'default'}
                onClick={() => {
                  if (color.value) {
                    editor?.chain().focus().setColor(color.value).run();
                  } else {
                    editor?.chain().focus().unsetColor().run();
                  }
                }}
                className={cn(
                  "h-6 w-6 rounded border border-border/50 hover:scale-110 transition-transform",
                  !color.value && "bg-foreground"
                )}
                style={{ backgroundColor: color.value || undefined }}
                title={color.label}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Highlight Color */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isDisabled}
            title="Highlight"
            className={cn(
              "h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-transparent rounded-none",
              editor?.isActive("highlight") && "text-foreground border-b-2 border-foreground"
            )}
          >
            <Highlighter className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex flex-wrap gap-1 max-w-[180px]">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.value || 'none'}
                onClick={() => {
                  if (color.value) {
                    editor?.chain().focus().toggleHighlight({ color: color.value }).run();
                  } else {
                    editor?.chain().focus().unsetHighlight().run();
                  }
                }}
                className={cn(
                  "h-6 w-6 rounded border border-border/50 hover:scale-110 transition-transform",
                  !color.value && "bg-background relative after:absolute after:inset-0 after:bg-[linear-gradient(45deg,transparent_45%,hsl(var(--destructive))_45%,hsl(var(--destructive))_55%,transparent_55%)]"
                )}
                style={{ backgroundColor: color.value || undefined }}
                title={color.label}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear Formatting */}
      <ToolButton
        icon={RemoveFormatting}
        onClick={clearFormatting}
        title="Clear Formatting"
      />

      <Divider />

      {/* Alignment */}
      <ToolButton
        icon={AlignLeft}
        onClick={() => editor?.chain().focus().setTextAlign("left").run()}
        active={editor?.isActive({ textAlign: "left" })}
        title="Align Left"
      />
      <ToolButton
        icon={AlignCenter}
        onClick={() => editor?.chain().focus().setTextAlign("center").run()}
        active={editor?.isActive({ textAlign: "center" })}
        title="Align Center"
      />
      <ToolButton
        icon={AlignRight}
        onClick={() => editor?.chain().focus().setTextAlign("right").run()}
        active={editor?.isActive({ textAlign: "right" })}
        title="Align Right"
      />

      <Divider />

      {/* Lists */}
      <ToolButton
        icon={List}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        active={editor?.isActive("bulletList")}
        title="Bullet List"
      />
      <ToolButton
        icon={ListOrdered}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        active={editor?.isActive("orderedList")}
        title="Numbered List"
      />
      <ToolButton
        icon={CheckSquare}
        onClick={() => editor?.chain().focus().toggleTaskList().run()}
        active={editor?.isActive("taskList")}
        title="Checklist"
      />

      <Divider />

      {/* Media */}
      <ToolButton icon={Image} onClick={addImage} title="Insert Image" />
      <ToolButton
        icon={Link}
        onClick={setLink}
        active={editor?.isActive("link")}
        title="Insert Link"
      />
    </div>
  );
}
