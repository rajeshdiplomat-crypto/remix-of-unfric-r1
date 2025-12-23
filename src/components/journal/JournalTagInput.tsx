import { useState, useRef, KeyboardEvent } from "react";
import { X, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface JournalTagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
}

const SUGGESTED_TAGS = [
  "gratitude",
  "reflection",
  "goals",
  "memories",
  "emotions",
  "growth",
  "wellness",
  "creativity",
  "relationships",
  "work",
];

export function JournalTagInput({
  tags,
  onChange,
  placeholder = "Add tags...",
  maxTags = 10,
  className,
}: JournalTagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onChange([...tags, trimmedTag]);
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const filteredSuggestions = SUGGESTED_TAGS.filter(
    tag => !tags.includes(tag) && tag.includes(inputValue.toLowerCase())
  ).slice(0, 5);

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-300",
          "bg-background/50 border border-border/50",
          isFocused && "border-primary/30 bg-background/70"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <Hash className="h-3 w-3 text-muted-foreground" />
        
        {/* Existing tags */}
        {tags.map((tag) => (
          <span
            key={tag}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
              "bg-primary/10 text-primary border border-primary/20",
              "transition-all duration-200 hover:bg-primary/20"
            )}
          >
            {tag}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {/* Input */}
        {tags.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              if (inputValue) addTag(inputValue);
            }}
            placeholder={tags.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[80px] bg-transparent border-0 focus:outline-none focus:ring-0 text-xs py-0.5"
          />
        )}
      </div>

      {/* Suggestions dropdown */}
      {isFocused && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg p-1 animate-fade-in">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(suggestion);
              }}
              className="w-full text-left px-2 py-1 text-xs hover:bg-muted rounded transition-colors flex items-center gap-1"
            >
              <Hash className="h-3 w-3 text-muted-foreground" />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
