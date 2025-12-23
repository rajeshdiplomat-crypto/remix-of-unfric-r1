import { Button } from "@/components/ui/button";
import { 
  Heading1, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  Quote, 
  Image, 
  Link, 
  Mic 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JournalEditorToolbarProps {
  activeFormats?: string[];
  onFormat?: (format: string) => void;
  onImageInsert?: () => void;
  onVoiceRecord?: () => void;
  isRecording?: boolean;
}

export function JournalEditorToolbar({
  activeFormats = [],
  onFormat,
  onImageInsert,
  onVoiceRecord,
  isRecording = false,
}: JournalEditorToolbarProps) {
  const tools = [
    { id: "heading", icon: Heading1, label: "Heading" },
    { id: "bold", icon: Bold, label: "Bold" },
    { id: "italic", icon: Italic, label: "Italic" },
    { id: "underline", icon: Underline, label: "Underline" },
  ];

  const listTools = [
    { id: "list", icon: List, label: "Bullet List" },
    { id: "quote", icon: Quote, label: "Quote" },
  ];

  const mediaTools = [
    { id: "image", icon: Image, label: "Insert Image", action: onImageInsert },
    { id: "link", icon: Link, label: "Insert Link" },
  ];

  return (
    <div className="flex items-center justify-between bg-card rounded-xl border border-border/50 shadow-sm px-4 py-2 max-w-2xl mx-auto">
      <div className="flex items-center gap-1">
        {/* Text formatting */}
        {tools.map((tool, index) => (
          <Button
            key={tool.id}
            variant="ghost"
            size="sm"
            onClick={() => onFormat?.(tool.id)}
            className={cn(
              "h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-primary/10",
              activeFormats.includes(tool.id) && "bg-primary/10 text-primary"
            )}
            title={tool.label}
          >
            <tool.icon className="h-4 w-4" />
          </Button>
        ))}

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-2" />

        {/* List tools */}
        {listTools.map((tool) => (
          <Button
            key={tool.id}
            variant="ghost"
            size="sm"
            onClick={() => onFormat?.(tool.id)}
            className={cn(
              "h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-primary/10",
              activeFormats.includes(tool.id) && "bg-primary/10 text-primary"
            )}
            title={tool.label}
          >
            <tool.icon className="h-4 w-4" />
          </Button>
        ))}

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-2" />

        {/* Media tools */}
        {mediaTools.map((tool) => (
          <Button
            key={tool.id}
            variant="ghost"
            size="sm"
            onClick={() => {
              if (tool.action) {
                tool.action();
              } else {
                onFormat?.(tool.id);
              }
            }}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-primary/10"
            title={tool.label}
          >
            <tool.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      {/* Voice recording */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onVoiceRecord}
        className={cn(
          "h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-primary/10",
          isRecording && "text-destructive bg-destructive/10"
        )}
        title="Voice recording"
      >
        <Mic className="h-4 w-4" />
      </Button>
    </div>
  );
}
