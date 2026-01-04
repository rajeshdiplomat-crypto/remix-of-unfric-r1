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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Editor } from "@tiptap/react";
import { useCallback, useState } from "react";
import { NotesScribbleCanvas } from "@/components/notes/NotesScribbleCanvas";

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
  // Dialog states
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [scribbleOpen, setScribbleOpen] = useState(false);

  const openLinkDialog = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href || "";
    setLinkUrl(previousUrl);
    setLinkDialogOpen(true);
  }, [editor]);

  const handleInsertLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
    }

    setLinkUrl("");
    setLinkDialogOpen(false);
  }, [editor, linkUrl]);

  const openImageDialog = useCallback(() => {
    setImageUrl("");
    setImageDialogOpen(true);
  }, []);

  const handleInsertImage = useCallback(() => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
      setImageDialogOpen(false);
    }
  }, [editor, imageUrl]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      editor.chain().focus().setImage({ src: dataUrl }).run();
    };
    reader.readAsDataURL(file);
    setImageDialogOpen(false);
  }, [editor]);

  const handleSaveScribble = useCallback((dataUrl: string) => {
    editor?.chain().focus().setImage({ src: dataUrl }).run();
    setScribbleOpen(false);
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
      onMouseDown={(e) => e.preventDefault()}
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
        <SelectTrigger 
          className="h-8 w-[120px] text-xs border-0 bg-muted/30"
          onMouseDown={(e) => e.preventDefault()}
        >
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
        <SelectTrigger 
          className="h-8 w-[70px] text-xs border-0 bg-muted/30"
          onMouseDown={(e) => e.preventDefault()}
        >
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
            onMouseDown={(e) => e.preventDefault()}
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
                onMouseDown={(e) => e.preventDefault()}
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
            onMouseDown={(e) => e.preventDefault()}
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
                onMouseDown={(e) => e.preventDefault()}
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
      <ToolButton icon={Image} onClick={openImageDialog} title="Insert Image" />
      <ToolButton
        icon={Link}
        onClick={openLinkDialog}
        active={editor?.isActive("link")}
        title="Insert Link"
      />
      <ToolButton icon={Pencil} onClick={() => setScribbleOpen(true)} title="Draw" />

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Image URL</label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                onKeyDown={(e) => e.key === 'Enter' && handleInsertImage()}
              />
            </div>
            <div className="text-center text-sm text-muted-foreground">or</div>
            <div>
              <label className="text-sm font-medium mb-2 block">Upload Image</label>
              <Input type="file" accept="image/*" onChange={handleImageUpload} />
            </div>
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

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">URL</label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                onKeyDown={(e) => e.key === 'Enter' && handleInsertLink()}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleInsertLink}>
                {linkUrl ? "Insert" : "Remove Link"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scribble Canvas */}
      <NotesScribbleCanvas
        open={scribbleOpen}
        onOpenChange={setScribbleOpen}
        onSave={handleSaveScribble}
        initialData={null}
      />
    </div>
  );
}
