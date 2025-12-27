import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface JournalBlock {
  id: string;
  type: "heading" | "paragraph" | "bullet" | "number" | "checklist";
  content: string;
  checked?: boolean;
  level?: number; // For nested lists
}

export interface PresetQuestion {
  id: string;
  text: string;
}

interface JournalBlockEditorProps {
  blocks: JournalBlock[];
  onChange: (blocks: JournalBlock[]) => void;
  presetQuestions: PresetQuestion[];
  fontFamily?: string;
  fontSize?: number;
  skin?: {
    id: string;
    bg: string;
    borderColor?: string;
  };
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export function JournalBlockEditor({
  blocks,
  onChange,
  presetQuestions,
  fontFamily = "Inter",
  fontSize = 16,
  skin,
}: JournalBlockEditorProps) {
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const blockRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Initialize with preset questions if blocks are empty
  useEffect(() => {
    if (blocks.length === 0 && presetQuestions.length > 0) {
      const initialBlocks: JournalBlock[] = [];
      presetQuestions.forEach((q) => {
        initialBlocks.push({
          id: generateId(),
          type: "heading",
          content: q.text,
        });
        initialBlocks.push({
          id: generateId(),
          type: "paragraph",
          content: "",
        });
      });
      // Add "Additional thoughts" section
      initialBlocks.push({
        id: generateId(),
        type: "heading",
        content: "Additional thoughts…",
      });
      initialBlocks.push({
        id: generateId(),
        type: "paragraph",
        content: "",
      });
      onChange(initialBlocks);
    }
  }, [presetQuestions]);

  const updateBlock = useCallback((id: string, updates: Partial<JournalBlock>) => {
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }, [blocks, onChange]);

  const insertBlockAfter = useCallback((afterId: string, type: JournalBlock["type"] = "paragraph") => {
    const index = blocks.findIndex((b) => b.id === afterId);
    if (index === -1) return null;
    
    const newBlock: JournalBlock = {
      id: generateId(),
      type,
      content: "",
      checked: type === "checklist" ? false : undefined,
    };
    
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    onChange(newBlocks);
    
    return newBlock.id;
  }, [blocks, onChange]);

  const deleteBlock = useCallback((id: string) => {
    const index = blocks.findIndex((b) => b.id === id);
    if (index <= 0) return; // Don't delete first block
    
    const prevBlock = blocks[index - 1];
    const newBlocks = blocks.filter((b) => b.id !== id);
    onChange(newBlocks);
    
    // Focus previous block
    setTimeout(() => {
      const el = blockRefs.current.get(prevBlock.id);
      if (el) {
        el.focus();
        // Move cursor to end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 0);
  }, [blocks, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, block: JournalBlock) => {
    const el = e.currentTarget as HTMLElement;
    
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      
      // For lists, continue the list type
      const newType = ["bullet", "number", "checklist"].includes(block.type)
        ? block.type
        : "paragraph";
      
      const newId = insertBlockAfter(block.id, newType);
      if (newId) {
        setTimeout(() => {
          blockRefs.current.get(newId)?.focus();
        }, 0);
      }
    } else if (e.key === "Backspace" && el.textContent === "") {
      e.preventDefault();
      // If it's a list item, convert to paragraph first
      if (["bullet", "number", "checklist"].includes(block.type)) {
        updateBlock(block.id, { type: "paragraph" });
      } else if (block.type === "paragraph") {
        deleteBlock(block.id);
      }
    }
  }, [insertBlockAfter, deleteBlock, updateBlock]);

  const handleInput = useCallback((e: React.FormEvent<HTMLElement>, block: JournalBlock) => {
    const content = (e.currentTarget as HTMLElement).textContent || "";
    updateBlock(block.id, { content });
  }, [updateBlock]);

  const focusBlock = (id: string) => {
    setFocusedBlockId(id);
  };

  const getPlaceholder = (block: JournalBlock, index: number) => {
    if (block.type === "heading") return "";
    if (block.type === "paragraph") {
      // Check if previous block is a heading (this is an answer block)
      const prevBlock = blocks[index - 1];
      if (prevBlock?.type === "heading") {
        return "Write your thoughts here...";
      }
      return "Start typing...";
    }
    if (block.type === "bullet" || block.type === "number") return "List item...";
    if (block.type === "checklist") return "To-do item...";
    return "";
  };

  const renderBlock = (block: JournalBlock, index: number) => {
    const placeholder = getPlaceholder(block, index);
    const isEmpty = !block.content;
    
    const commonProps = {
      ref: (el: HTMLElement | null) => {
        if (el) blockRefs.current.set(block.id, el);
        else blockRefs.current.delete(block.id);
      },
      contentEditable: block.type !== "heading" || block.content !== presetQuestions.find(q => q.text === block.content)?.text,
      suppressContentEditableWarning: true,
      onFocus: () => focusBlock(block.id),
      onBlur: () => setFocusedBlockId(null),
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, block),
      onInput: (e: React.FormEvent<HTMLElement>) => handleInput(e, block),
      "data-placeholder": placeholder,
      style: { fontFamily, fontSize: block.type === "heading" ? fontSize + 2 : fontSize },
    };

    switch (block.type) {
      case "heading":
        const isPresetHeading = presetQuestions.some(q => q.text === block.content);
        return (
          <h3
            key={block.id}
            className={cn(
              "text-lg font-semibold text-foreground py-2 outline-none",
              isPresetHeading && "select-none pointer-events-none"
            )}
            style={{ fontFamily: "Inter", fontWeight: 600, fontSize: fontSize + 2 }}
          >
            {block.content}
          </h3>
        );

      case "paragraph":
        return (
          <div
            key={block.id}
            {...commonProps}
            className={cn(
              "min-h-[1.5em] py-1 outline-none text-foreground leading-relaxed",
              "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50 empty:before:pointer-events-none"
            )}
          >
            {block.content}
          </div>
        );

      case "bullet":
        return (
          <div key={block.id} className="flex items-start gap-2 py-0.5">
            <span className="text-muted-foreground mt-1.5 select-none">•</span>
            <div
              {...commonProps}
              className={cn(
                "flex-1 min-h-[1.5em] outline-none text-foreground leading-relaxed",
                "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
              )}
            >
              {block.content}
            </div>
          </div>
        );

      case "number":
        const numberIndex = blocks.slice(0, index).filter(b => b.type === "number").length + 1;
        return (
          <div key={block.id} className="flex items-start gap-2 py-0.5">
            <span className="text-muted-foreground mt-0.5 select-none min-w-[1.5em]">{numberIndex}.</span>
            <div
              {...commonProps}
              className={cn(
                "flex-1 min-h-[1.5em] outline-none text-foreground leading-relaxed",
                "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
              )}
            >
              {block.content}
            </div>
          </div>
        );

      case "checklist":
        return (
          <div key={block.id} className="flex items-start gap-2 py-0.5">
            <button
              type="button"
              onClick={() => updateBlock(block.id, { checked: !block.checked })}
              className={cn(
                "mt-1 h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                block.checked
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground/50 hover:border-primary"
              )}
            >
              {block.checked && (
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <div
              {...commonProps}
              className={cn(
                "flex-1 min-h-[1.5em] outline-none leading-relaxed",
                block.checked ? "text-muted-foreground line-through" : "text-foreground",
                "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
              )}
            >
              {block.content}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className="min-h-[400px] p-6 rounded-xl transition-colors"
      style={{ 
        backgroundColor: skin?.bg || "hsl(var(--card))",
        borderColor: skin?.borderColor || "hsl(var(--border) / 0.3)",
      }}
    >
      <div className="space-y-1">
        {blocks.map((block, index) => (
          <div key={block.id}>
            {renderBlock(block, index)}
            {/* Add spacing after answer paragraphs (before next heading) */}
            {block.type === "paragraph" && blocks[index + 1]?.type === "heading" && (
              <div className="h-4" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Utility to convert blocks to plain text for storage
export function blocksToText(blocks: JournalBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
          return `## ${block.content}`;
        case "bullet":
          return `• ${block.content}`;
        case "number":
          return `1. ${block.content}`;
        case "checklist":
          return `[${block.checked ? "x" : " "}] ${block.content}`;
        default:
          return block.content;
      }
    })
    .join("\n");
}

// Utility to parse text back to blocks
export function textToBlocks(text: string, presetQuestions: PresetQuestion[]): JournalBlock[] {
  if (!text) return [];
  
  const lines = text.split("\n");
  const blocks: JournalBlock[] = [];
  
  lines.forEach((line) => {
    if (line.startsWith("## ")) {
      blocks.push({
        id: generateId(),
        type: "heading",
        content: line.slice(3),
      });
    } else if (line.startsWith("• ")) {
      blocks.push({
        id: generateId(),
        type: "bullet",
        content: line.slice(2),
      });
    } else if (line.match(/^\d+\. /)) {
      blocks.push({
        id: generateId(),
        type: "number",
        content: line.replace(/^\d+\. /, ""),
      });
    } else if (line.match(/^\[[ x]\] /)) {
      blocks.push({
        id: generateId(),
        type: "checklist",
        content: line.slice(4),
        checked: line.startsWith("[x]"),
      });
    } else {
      blocks.push({
        id: generateId(),
        type: "paragraph",
        content: line,
      });
    }
  });
  
  return blocks;
}
