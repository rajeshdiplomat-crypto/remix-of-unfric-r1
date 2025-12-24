import { useState, useRef, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Smile, ChevronLeft, ChevronRight, X, Plus, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { JournalTagInput } from "./JournalTagInput";

interface PresetQuestion {
  id: string;
  question: string;
  answer: string;
}

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
  onDateChange?: (date: Date) => void;
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

const DEFAULT_QUESTIONS = [
  { id: "1", question: "How are you feeling today?", answer: "" },
  { id: "2", question: "What are you grateful for?", answer: "" },
  { id: "3", question: "What act of kindness did you do/receive?", answer: "" },
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
  onDateChange,
  onPromptUse,
}: JournalEditorProps) {
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [moodOpen, setMoodOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [presetQuestions, setPresetQuestions] = useState<PresetQuestion[]>(() => {
    // Try to parse questions from content
    return DEFAULT_QUESTIONS.map(q => ({ ...q }));
  });
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const dateDisplay = format(selectedDate, "MMMM d, yyyy");
  const timeDisplay = format(new Date(), "h:mm a");
  
  const selectedMood = MOODS.find(m => m.id === mood);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = contentRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(200, textarea.scrollHeight)}px`;
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

  // Sync questions to content
  useEffect(() => {
    const questionsContent = presetQuestions
      .filter(q => q.answer.trim())
      .map(q => `**${q.question}**\n${q.answer}`)
      .join("\n\n");
    
    if (questionsContent && !content.includes("**")) {
      // Don't override existing content
    }
  }, [presetQuestions]);

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange?.(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange?.(newDate);
  };

  const handleQuestionChange = (id: string, field: "question" | "answer", value: string) => {
    setPresetQuestions(prev => 
      prev.map(q => q.id === id ? { ...q, [field]: value } : q)
    );
  };

  const handleRemoveQuestion = (id: string) => {
    setPresetQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleAddQuestion = () => {
    const newQuestion: PresetQuestion = {
      id: crypto.randomUUID(),
      question: "New question...",
      answer: "",
    };
    setPresetQuestions(prev => [...prev, newQuestion]);
    setEditingQuestionId(newQuestion.id);
  };

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
          {/* Date with Calendar Picker */}
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={handlePrevDay}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 text-muted-foreground hover:bg-muted/50 rounded-md px-2 py-1 transition-colors">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="text-sm">{dateDisplay}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      onDateChange?.(date);
                      setCalendarOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={handleNextDay}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
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

        {/* Preset Questions */}
        <div className="space-y-6 mb-6">
          {presetQuestions.map((q) => (
            <div key={q.id} className="group">
              <div className="flex items-center justify-between mb-2">
                {editingQuestionId === q.id ? (
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => handleQuestionChange(q.id, "question", e.target.value)}
                    onBlur={() => setEditingQuestionId(null)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingQuestionId(null)}
                    className="flex-1 text-sm font-medium text-foreground bg-transparent border-b border-primary outline-none"
                    autoFocus
                  />
                ) : (
                  <h4 className="text-sm font-medium text-foreground">{q.question}</h4>
                )}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setEditingQuestionId(q.id)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => handleRemoveQuestion(q.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <textarea
                value={q.answer}
                onChange={(e) => handleQuestionChange(q.id, "answer", e.target.value)}
                placeholder="Write here..."
                className="w-full bg-muted/30 rounded-lg p-3 text-foreground border-0 outline-none resize-none min-h-[80px] placeholder:text-muted-foreground/40"
                style={{ fontFamily: "var(--font-serif)" }}
              />
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddQuestion}
            className="text-muted-foreground"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add question
          </Button>
        </div>

        {/* Free-form Content */}
        <div className="border-t border-border/30 pt-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Additional thoughts...</h4>
          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Continue writing freely..."
            className="w-full bg-transparent border-0 outline-none resize-none text-foreground leading-relaxed placeholder:text-muted-foreground/40"
            style={{ 
              fontFamily: "var(--font-serif)", 
              fontSize: "1.0625rem",
              lineHeight: "1.8",
              minHeight: "200px",
            }}
          />
        </div>

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
