import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  Image,
  Link,
  Heading1,
  Heading2,
  Heading3,
  MoreHorizontal,
  Sparkles,
  Palette,
  Highlighter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Editor } from "@tiptap/react";

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
  { label: "Arial", value: "Arial" },
  { label: "Lora", value: "Lora" },
];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];

export function JournalToolbar({
  editor,
  fontFamily,
  fontSize,
  onFontFamilyChange,
  onFontSizeChange,
}: JournalToolbarProps) {
  if (!editor) return null;

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
      disabled={disabled}
      title={title}
      className={cn("h-8 w-8 p-0", active && "bg-primary/10 text-primary")}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  const Divider = () => <div className="w-px h-6 bg-border/50 mx-1 hidden sm:block" />;

  const setLink = () => {
    const url = window.prompt("URL", editor.getAttributes("link").href);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("Image URL");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="flex items-center gap-1 bg-card border border-border/50 rounded-lg px-2 py-1.5 shadow-sm sticky top-0 z-20">
      {/* Core formatting - always visible */}
      <div className="flex items-center gap-0.5">
        <ToolButton
          icon={Undo2}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        />
        <ToolButton
          icon={Redo2}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        />
      </div>

      <Divider />

      {/* Font selects - visible on md+ */}
      <div className="hidden md:flex items-center gap-1">
        <Select value={fontFamily} onValueChange={onFontFamilyChange}>
          <SelectTrigger className="h-8 w-[100px] text-xs border-0 bg-muted/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map((f) => (
              <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={fontSize.toString()} onValueChange={(v) => onFontSizeChange(parseInt(v))}>
          <SelectTrigger className="h-8 w-[60px] text-xs border-0 bg-muted/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map((s) => (
              <SelectItem key={s} value={s.toString()}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Divider />
      </div>

      {/* Text formatting - always visible */}
      <div className="flex items-center gap-0.5">
        <ToolButton
          icon={Bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        />
        <ToolButton
          icon={Italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        />
        <ToolButton
          icon={UnderlineIcon}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline"
        />
      </div>

      <Divider />

      {/* Lists - visible on sm+ */}
      <div className="hidden sm:flex items-center gap-0.5">
        <ToolButton
          icon={List}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
        />
        <ToolButton
          icon={ListOrdered}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numbered List"
        />
        <ToolButton
          icon={CheckSquare}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          active={editor.isActive("taskList")}
          title="Checklist"
        />
      </div>

      <Divider />

      {/* Alignment - visible on lg+ */}
      <div className="hidden lg:flex items-center gap-0.5">
        <ToolButton
          icon={AlignLeft}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="Left"
        />
        <ToolButton
          icon={AlignCenter}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="Center"
        />
        <ToolButton
          icon={AlignRight}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="Right"
        />
      </div>

      <div className="flex-1" />

      {/* AI Edit - always visible */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1 text-xs bg-violet-50 border-violet-200 text-violet-700 hidden sm:flex"
        onClick={() => alert("AI Edit coming soon!")}
      >
        <Sparkles className="h-3 w-3" />
        AI Edit
      </Button>

      {/* More menu for overflow items */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Mobile-only font options */}
          <div className="md:hidden px-2 py-1.5">
            <p className="text-xs text-muted-foreground mb-1">Font</p>
            <Select value={fontFamily} onValueChange={onFontFamilyChange}>
              <SelectTrigger className="h-8 text-xs">
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
          </div>
          <DropdownMenuSeparator className="md:hidden" />

          {/* Mobile lists */}
          <div className="sm:hidden">
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleBulletList().run()}>
              <List className="h-4 w-4 mr-2" /> Bullet List
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleOrderedList().run()}>
              <ListOrdered className="h-4 w-4 mr-2" /> Numbered List
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleTaskList().run()}>
              <CheckSquare className="h-4 w-4 mr-2" /> Checklist
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </div>

          {/* Alignment on mobile */}
          <div className="lg:hidden">
            <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign("left").run()}>
              <AlignLeft className="h-4 w-4 mr-2" /> Align Left
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign("center").run()}>
              <AlignCenter className="h-4 w-4 mr-2" /> Align Center
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign("right").run()}>
              <AlignRight className="h-4 w-4 mr-2" /> Align Right
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </div>

          {/* Headings */}
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 className="h-4 w-4 mr-2" /> Heading 1
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="h-4 w-4 mr-2" /> Heading 2
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className="h-4 w-4 mr-2" /> Heading 3
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          {/* Media */}
          <DropdownMenuItem onClick={addImage}>
            <Image className="h-4 w-4 mr-2" /> Insert Image
          </DropdownMenuItem>
          <DropdownMenuItem onClick={setLink}>
            <Link className="h-4 w-4 mr-2" /> Insert Link
          </DropdownMenuItem>

          {/* AI Edit for mobile */}
          <DropdownMenuSeparator className="sm:hidden" />
          <DropdownMenuItem className="sm:hidden text-violet-700" onClick={() => alert("AI Edit coming soon!")}>
            <Sparkles className="h-4 w-4 mr-2" /> AI Edit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
