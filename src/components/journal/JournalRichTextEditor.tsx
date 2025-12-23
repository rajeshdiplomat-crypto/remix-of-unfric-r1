import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  CheckSquare,
  Sparkles,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JournalRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  formatting?: {
    fontSize: number;
    fontFamily: string;
    color: string;
    alignment: "left" | "center" | "right" | "justify";
  };
  onAIAction?: (action: "rewrite" | "expand" | "summarize", text: string) => void;
  showAI?: boolean;
}

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

// Reflection prompts for empty state
const REFLECTION_PROMPTS = [
  "What made you smile today?",
  "What's one thing you learned recently?",
  "What are you looking forward to?",
  "Describe a moment of peace from today.",
  "What would you tell your past self?",
  "What's something you're proud of?",
  "How did you take care of yourself today?",
  "What's a challenge you overcame recently?",
];

export function JournalRichTextEditor({
  value,
  onChange,
  placeholder,
  onFocus,
  formatting,
  onAIAction,
  showAI = true,
}: JournalRichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentPrompt] = useState(() => 
    REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)]
  );

  // Parse checklist items from text
  const parseChecklist = (text: string): { items: ChecklistItem[]; regularText: string } => {
    const lines = text.split("\n");
    const items: ChecklistItem[] = [];
    const regularLines: string[] = [];
    
    lines.forEach((line, index) => {
      const checkMatch = line.match(/^\[([ x])\]\s*(.*)$/);
      if (checkMatch) {
        items.push({
          id: `check-${index}`,
          text: checkMatch[2],
          checked: checkMatch[1] === "x",
        });
      } else {
        regularLines.push(line);
      }
    });
    
    return { items, regularText: regularLines.join("\n") };
  };

  // Convert checklist items back to text format
  const checklistToText = (items: ChecklistItem[], regularText: string): string => {
    const checklistText = items.map(item => `[${item.checked ? "x" : " "}] ${item.text}`).join("\n");
    return regularText + (checklistText ? "\n" + checklistText : "");
  };

  const { items: checklistItems, regularText } = parseChecklist(value);

  // Handle text selection for contextual toolbar
  const handleSelect = useCallback(() => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    if (start !== end) {
      setSelection({ start, end });
      
      // Position toolbar near selection
      const rect = textareaRef.current.getBoundingClientRect();
      setToolbarPosition({
        top: rect.top - 50,
        left: rect.left + (rect.width / 2) - 100,
      });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
      setSelection(null);
    }
  }, []);

  // Apply formatting to selected text
  const applyFormatting = (type: "bold" | "italic" | "underline" | "bullet" | "numbered" | "checkbox") => {
    if (!textareaRef.current || !selection) return;
    
    const selectedText = value.substring(selection.start, selection.end);
    let newText = "";
    
    switch (type) {
      case "bold":
        newText = `**${selectedText}**`;
        break;
      case "italic":
        newText = `*${selectedText}*`;
        break;
      case "underline":
        newText = `__${selectedText}__`;
        break;
      case "bullet":
        newText = selectedText.split("\n").map(line => `• ${line}`).join("\n");
        break;
      case "numbered":
        newText = selectedText.split("\n").map((line, i) => `${i + 1}. ${line}`).join("\n");
        break;
      case "checkbox":
        newText = selectedText.split("\n").map(line => `[ ] ${line}`).join("\n");
        break;
    }
    
    const newValue = value.substring(0, selection.start) + newText + value.substring(selection.end);
    onChange(newValue);
    setShowToolbar(false);
  };

  // Add new checklist item
  const addChecklistItem = () => {
    const newValue = value + (value.endsWith("\n") || value === "" ? "" : "\n") + "[ ] ";
    onChange(newValue);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  // Toggle checklist item
  const toggleChecklistItem = (id: string) => {
    const updatedItems = checklistItems.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    onChange(checklistToText(updatedItems, regularText));
  };

  // Update checklist item text
  const updateChecklistItemText = (id: string, text: string) => {
    const updatedItems = checklistItems.map(item =>
      item.id === id ? { ...item, text } : item
    );
    onChange(checklistToText(updatedItems, regularText));
  };

  // Handle AI action
  const handleAIAction = (action: "rewrite" | "expand" | "summarize") => {
    if (onAIAction && selection) {
      const selectedText = value.substring(selection.start, selection.end);
      onAIAction(action, selectedText);
    }
    setAiMenuOpen(false);
    setShowToolbar(false);
  };

  // Show prompt when empty
  useEffect(() => {
    setShowPrompt(value.trim() === "");
  }, [value]);

  const textareaStyle = formatting ? {
    fontSize: `${formatting.fontSize}px`,
    fontFamily: formatting.fontFamily,
    color: formatting.color,
    textAlign: formatting.alignment as React.CSSProperties["textAlign"],
  } : {};

  return (
    <div className="relative">
      {/* Empty state with reflection prompt */}
      {showPrompt && (
        <div 
          className="absolute top-0 left-0 right-0 pointer-events-none opacity-60 animate-fade-in"
          style={textareaStyle}
        >
          <p className="italic text-muted-foreground text-sm mb-1">
            {currentPrompt}
          </p>
        </div>
      )}

      {/* Regular text area */}
      <textarea
        ref={textareaRef}
        value={regularText}
        onChange={(e) => onChange(checklistToText(checklistItems, e.target.value))}
        onFocus={() => {
          onFocus?.();
          setShowPrompt(false);
        }}
        onSelect={handleSelect}
        onBlur={() => setTimeout(() => setShowToolbar(false), 200)}
        placeholder={showPrompt ? "" : placeholder}
        className="w-full resize-none bg-transparent border-0 focus:outline-none focus:ring-0 p-0 min-h-[60px] overflow-hidden transition-all duration-300"
        style={textareaStyle}
      />

      {/* Checklist items */}
      {checklistItems.length > 0 && (
        <div className="mt-2 space-y-1">
          {checklistItems.map((item) => (
            <div 
              key={item.id} 
              className={cn(
                "flex items-start gap-2 group transition-all duration-300",
                item.checked && "opacity-60"
              )}
            >
              <button
                onClick={() => toggleChecklistItem(item.id)}
                className={cn(
                  "mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                  item.checked 
                    ? "bg-primary border-primary" 
                    : "border-muted-foreground/40 hover:border-primary"
                )}
              >
                {item.checked && (
                  <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                )}
              </button>
              <input
                type="text"
                value={item.text}
                onChange={(e) => updateChecklistItemText(item.id, e.target.value)}
                className={cn(
                  "flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 p-0 transition-all duration-300",
                  item.checked && "line-through text-muted-foreground"
                )}
                style={textareaStyle}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add checklist button */}
      <button
        onClick={addChecklistItem}
        className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors opacity-0 hover:opacity-100 focus:opacity-100"
      >
        <CheckSquare className="h-3 w-3" />
        <span>Add task</span>
      </button>

      {/* Contextual formatting toolbar */}
      {showToolbar && (
        <div
          className="fixed z-50 flex items-center gap-0.5 bg-popover border border-border rounded-lg shadow-lg p-1 animate-scale-in"
          style={{ top: toolbarPosition.top, left: toolbarPosition.left }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting("bold")}
            className="h-7 w-7 p-0"
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting("italic")}
            className="h-7 w-7 p-0"
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting("underline")}
            className="h-7 w-7 p-0"
          >
            <Underline className="h-3.5 w-3.5" />
          </Button>
          
          <div className="w-px h-5 bg-border mx-0.5" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting("bullet")}
            className="h-7 w-7 p-0"
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting("numbered")}
            className="h-7 w-7 p-0"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting("checkbox")}
            className="h-7 w-7 p-0"
          >
            <CheckSquare className="h-3.5 w-3.5" />
          </Button>

          {showAI && onAIAction && (
            <>
              <div className="w-px h-5 bg-border mx-0.5" />
              
              <Popover open={aiMenuOpen} onOpenChange={setAiMenuOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 gap-1"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs">AI</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-1">
                  <button
                    onClick={() => handleAIAction("rewrite")}
                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded transition-colors"
                  >
                    ✨ Rewrite
                  </button>
                  <button
                    onClick={() => handleAIAction("expand")}
                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded transition-colors"
                  >
                    📝 Expand
                  </button>
                  <button
                    onClick={() => handleAIAction("summarize")}
                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded transition-colors"
                  >
                    📋 Summarize
                  </button>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
      )}
    </div>
  );
}
