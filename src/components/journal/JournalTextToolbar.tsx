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
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TextFormatting {
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
  alignment: "left" | "center" | "right" | "justify";
}

interface JournalTextToolbarProps {
  formatting: TextFormatting;
  onChange: (formatting: TextFormatting) => void;
  skinBgColor?: string;
  compact?: boolean;
}

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24];
const FONT_FAMILIES = [
  { name: "Serif", value: "serif" },
  { name: "Sans-serif", value: "sans-serif" },
  { name: "Cursive", value: "cursive" },
  { name: "Monospace", value: "monospace" },
  // Handwriting fonts
  { name: "Caveat", value: "'Caveat', cursive" },
  { name: "Dancing Script", value: "'Dancing Script', cursive" },
  { name: "Indie Flower", value: "'Indie Flower', cursive" },
  { name: "Shadows Into Light", value: "'Shadows Into Light', cursive" },
  { name: "Patrick Hand", value: "'Patrick Hand', cursive" },
  { name: "Architects Daughter", value: "'Architects Daughter', cursive" },
];

const TEXT_COLORS = [
  { name: "Black", value: "hsl(222, 47%, 11%)" },
  { name: "Dark Gray", value: "hsl(215, 25%, 35%)" },
  { name: "Blue", value: "hsl(200, 98%, 39%)" },
  { name: "Navy", value: "hsl(222, 47%, 30%)" },
  { name: "Red", value: "hsl(0, 72%, 50%)" },
  { name: "Green", value: "hsl(142, 76%, 36%)" },
  { name: "Purple", value: "hsl(270, 50%, 50%)" },
  { name: "Brown", value: "hsl(30, 50%, 35%)" },
  { name: "White", value: "hsl(0, 0%, 100%)" },
];

export function JournalTextToolbar({
  formatting,
  onChange,
  skinBgColor,
  compact = false,
}: JournalTextToolbarProps) {
  const update = (updates: Partial<TextFormatting>) => {
    onChange({ ...formatting, ...updates });
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-lg",
        compact ? "p-1" : "p-1.5"
      )}
      style={{
        backgroundColor: skinBgColor
          ? `color-mix(in srgb, ${skinBgColor} 70%, hsl(var(--muted)))`
          : "hsl(var(--muted) / 0.9)",
      }}
    >
      {/* Font Size */}
      <Select
        value={formatting.fontSize.toString()}
        onValueChange={(v) => update({ fontSize: parseInt(v) })}
      >
        <SelectTrigger className={cn("h-7 text-xs", compact ? "w-12" : "w-14")}>
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

      {/* Font Family */}
      <Select
        value={formatting.fontFamily}
        onValueChange={(v) => update({ fontFamily: v })}
      >
        <SelectTrigger className={cn("h-7 text-xs", compact ? "w-20" : "w-28")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_FAMILIES.map((font) => (
            <SelectItem key={font.value} value={font.value}>
              <span style={{ fontFamily: font.value }}>{font.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="w-px h-5 bg-border mx-0.5" />

      {/* Bold, Italic, Underline */}
      <div className="flex">
        <Button
          variant={formatting.bold ? "default" : "ghost"}
          size="sm"
          onClick={() => update({ bold: !formatting.bold })}
          className="h-7 w-7 p-0"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant={formatting.italic ? "default" : "ghost"}
          size="sm"
          onClick={() => update({ italic: !formatting.italic })}
          className="h-7 w-7 p-0"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant={formatting.underline ? "default" : "ghost"}
          size="sm"
          onClick={() => update({ underline: !formatting.underline })}
          className="h-7 w-7 p-0"
        >
          <Underline className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="w-px h-5 bg-border mx-0.5" />

      {/* Text Color */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 relative">
            <Palette className="h-3.5 w-3.5" />
            <div
              className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded"
              style={{ backgroundColor: formatting.color }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="grid grid-cols-5 gap-1">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.name}
                onClick={() => update({ color: c.value })}
                className={cn(
                  "h-6 w-6 rounded-full border transition-transform hover:scale-110",
                  formatting.color === c.value
                    ? "ring-2 ring-primary ring-offset-1"
                    : "border-muted-foreground/30"
                )}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {!compact && (
        <>
          <div className="w-px h-5 bg-border mx-0.5" />

          {/* Alignment */}
          <div className="flex">
            <Button
              variant={formatting.alignment === "left" ? "default" : "ghost"}
              size="sm"
              onClick={() => update({ alignment: "left" })}
              className="h-7 w-7 p-0"
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={formatting.alignment === "center" ? "default" : "ghost"}
              size="sm"
              onClick={() => update({ alignment: "center" })}
              className="h-7 w-7 p-0"
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={formatting.alignment === "right" ? "default" : "ghost"}
              size="sm"
              onClick={() => update({ alignment: "right" })}
              className="h-7 w-7 p-0"
            >
              <AlignRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={formatting.alignment === "justify" ? "default" : "ghost"}
              size="sm"
              onClick={() => update({ alignment: "justify" })}
              className="h-7 w-7 p-0"
            >
              <AlignJustify className="h-3.5 w-3.5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
