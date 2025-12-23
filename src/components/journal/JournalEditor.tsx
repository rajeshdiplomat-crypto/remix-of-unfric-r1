import { useState, useRef, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Calendar, Clock, Smile } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { JournalTagInput } from "./JournalTagInput";

interface JournalEditorProps {
  selectedDate: Date;
  title: string;
  content: string;
  mood: string | null;
  tags: string[];
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onMoodChange: (mood: string) => void;
  onTagsChange: (tags: string[]) => void;
  onPromptUse?: string;
}

const MOODS = [
  { id: "calm", label: "Calm", emoji: "😌" },
  { id: "happy", label: "Happy", emoji: "😊" },
  { id: "grateful", label: "Grateful", emoji: "🙏" },
  { id: "reflective", label: "Reflective", emoji: "🤔" },
  { id: "anxious", label: "Anxious", emoji: "😰" },
  { id: "sad", label: "Sad", emoji: "😢" },
  { id: "excited", label: "Excited", emoji: "🎉" },
  { id: "tired", label: "Tired", emoji: "😴" },
];

export function JournalEditor({
  selectedDate,
  title,
  content,
  mood,
  tags,
  onTitleChange,
  onContentChange,
  onMoodChange,
  onTagsChange,
  onPromptUse,
}: JournalEditorProps) {
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [moodOpen, setMoodOpen] = useState(false);

  const dateDisplay = format(selectedDate, "MMMM d, yyyy");
  const timeDisplay = format(new Date(), "h:mm a");
  
  const selectedMood = MOODS.find(m => m.id === mood);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = contentRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(300, textarea.scrollHeight)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [content, adjustTextareaHeight]);

  // Handle prompt use
  useEffect(() => {
    if (onPromptUse && !content.trim()) {
      onContentChange(onPromptUse.replace(/^"|"$/g, "") + "\n\n");
      setTimeout(() => contentRef.current?.focus(), 100);
    }
  }, [onPromptUse]);

  return (
    <div className="flex-1 max-w-3xl">
      <div className="bg-card rounded-2xl border border-border/30 shadow-lg p-8 min-h-[600px]">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Give your entry a title..."
          className="w-full text-3xl font-bold text-foreground bg-transparent border-0 outline-none placeholder:text-muted-foreground/50 mb-4"
          style={{ fontFamily: "var(--font-serif)" }}
        />

        {/* Metadata row */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          {/* Date */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">{dateDisplay}</span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{timeDisplay}</span>
          </div>

          {/* Mood selector */}
          <Popover open={moodOpen} onOpenChange={setMoodOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 hover:bg-muted/50 rounded-full px-2 py-1 transition-colors">
                {selectedMood ? (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0 gap-1">
                    <Smile className="h-3.5 w-3.5" />
                    {selectedMood.label}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    <Smile className="h-3.5 w-3.5" />
                    Add mood
                  </Badge>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="grid grid-cols-2 gap-1">
                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onMoodChange(m.id);
                      setMoodOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                      mood === m.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Content */}
        <textarea
          ref={contentRef}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Start writing your thoughts..."
          className="w-full bg-transparent border-0 outline-none resize-none text-foreground leading-relaxed placeholder:text-muted-foreground/40"
          style={{ 
            fontFamily: "var(--font-serif)", 
            fontSize: "1.0625rem",
            lineHeight: "1.8",
            minHeight: "300px",
          }}
        />

        {/* Tags at bottom */}
        <div className="mt-8 pt-4 border-t border-border/30">
          <JournalTagInput
            tags={tags}
            onChange={onTagsChange}
          />
        </div>
      </div>
    </div>
  );
}
