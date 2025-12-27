import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  CheckSquare,
  Image,
  Link,
  Pen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JournalRichToolbarProps {
  fontFamily: string;
  fontSize: number;
  onFontFamilyChange: (font: string) => void;
  onFontSizeChange: (size: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onBold?: () => void;
  onItalic?: () => void;
  onUnderline?: () => void;
  onAlignLeft?: () => void;
  onAlignCenter?: () => void;
  onAlignRight?: () => void;
  onBulletList?: () => void;
  onNumberList?: () => void;
  onChecklist?: () => void;
  onInsertImage?: () => void;
  onInsertLink?: () => void;
  onDraw?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  activeFormats?: string[];
}

const FONT_FAMILIES = [
  { label: "Inter", value: "Inter" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "Times New Roman, serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Helvetica", value: "Helvetica, sans-serif" },
  { label: "Courier New", value: "Courier New, monospace" },
  { label: "Caveat", value: "Caveat, cursive" },
  { label: "Patrick Hand", value: "Patrick Hand, cursive" },
];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];

export function JournalRichToolbar({
  fontFamily,
  fontSize,
  onFontFamilyChange,
  onFontSizeChange,
  onUndo,
  onRedo,
  onBold,
  onItalic,
  onUnderline,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onBulletList,
  onNumberList,
  onChecklist,
  onInsertImage,
  onInsertLink,
  onDraw,
  canUndo = true,
  canRedo = true,
  activeFormats = [],
}: JournalRichToolbarProps) {
  const ToolButton = ({
    icon: Icon,
    onClick,
    active,
    disabled,
    title,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    onClick?: () => void;
    active?: boolean;
    disabled?: boolean;
    title?: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted",
        active && "bg-primary/10 text-primary"
      )}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  const Divider = () => <div className="w-px h-6 bg-border mx-1" />;

  return (
    <div className="flex items-center gap-1 bg-card border border-border/50 rounded-xl px-3 py-2 shadow-sm sticky top-0 z-20">
      {/* Undo / Redo */}
      <ToolButton icon={Undo2} onClick={onUndo} disabled={!canUndo} title="Undo" />
      <ToolButton icon={Redo2} onClick={onRedo} disabled={!canRedo} title="Redo" />

      <Divider />

      {/* Font Family */}
      <Select value={fontFamily} onValueChange={onFontFamilyChange}>
        <SelectTrigger className="h-8 w-[120px] text-xs border-0 bg-muted/50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_FAMILIES.map((font) => (
            <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
              {font.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Font Size */}
      <Select value={fontSize.toString()} onValueChange={(v) => onFontSizeChange(parseInt(v))}>
        <SelectTrigger className="h-8 w-[70px] text-xs border-0 bg-muted/50">
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
        onClick={onBold}
        active={activeFormats.includes("bold")}
        title="Bold"
      />
      <ToolButton
        icon={Italic}
        onClick={onItalic}
        active={activeFormats.includes("italic")}
        title="Italic"
      />
      <ToolButton
        icon={Underline}
        onClick={onUnderline}
        active={activeFormats.includes("underline")}
        title="Underline"
      />

      <Divider />

      {/* Alignment */}
      <ToolButton
        icon={AlignLeft}
        onClick={onAlignLeft}
        active={activeFormats.includes("alignLeft")}
        title="Align Left"
      />
      <ToolButton
        icon={AlignCenter}
        onClick={onAlignCenter}
        active={activeFormats.includes("alignCenter")}
        title="Align Center"
      />
      <ToolButton
        icon={AlignRight}
        onClick={onAlignRight}
        active={activeFormats.includes("alignRight")}
        title="Align Right"
      />

      <Divider />

      {/* Lists */}
      <ToolButton
        icon={List}
        onClick={onBulletList}
        active={activeFormats.includes("bullet")}
        title="Bullet List"
      />
      <ToolButton
        icon={ListOrdered}
        onClick={onNumberList}
        active={activeFormats.includes("number")}
        title="Numbered List"
      />
      <ToolButton
        icon={CheckSquare}
        onClick={onChecklist}
        active={activeFormats.includes("checklist")}
        title="Checklist"
      />

      <Divider />

      {/* Media */}
      <ToolButton icon={Image} onClick={onInsertImage} title="Insert Image" />
      <ToolButton icon={Link} onClick={onInsertLink} title="Insert Link" />
      <ToolButton icon={Pen} onClick={onDraw} title="Draw" />
    </div>
  );
}
