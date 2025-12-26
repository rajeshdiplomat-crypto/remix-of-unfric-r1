import { useState } from "react";
import { format, addDays, subDays } from "date-fns";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Smile, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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

const JOURNAL_QUESTIONS = [
  { id: "feeling", label: "How are you feeling today?", placeholder: "Describe your current emotional state..." },
  { id: "gratitude", label: "What are you grateful for?", placeholder: "List 3 things you're thankful for..." },
  { id: "kindness", label: "What act of kindness did you do or receive?", placeholder: "Reflect on moments of kindness..." },
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
  const [moodOpen, setMoodOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    // Parse content to extract answers if they exist
    const parsed: Record<string, string> = {};
    if (content) {
      const sections = content.split(/\n\n(?=\*\*)/);
      sections.forEach(section => {
        JOURNAL_QUESTIONS.forEach(q => {
          if (section.includes(q.label)) {
            const answer = section.replace(`**${q.label}**`, '').trim();
            parsed[q.id] = answer;
          }
        });
      });
      // If no structured content, treat as additional thoughts
      if (Object.keys(parsed).length === 0) {
        parsed.additional = content;
      }
    }
    return parsed;
  });

  const dateDisplay = format(selectedDate, "MMMM d, yyyy");
  const timeDisplay = format(new Date(), "h:mm a");
  const selectedMood = MOODS.find(m => m.id === mood);

  const handlePrevDay = () => {
    onDateChange?.(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    onDateChange?.(addDays(selectedDate, 1));
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    
    // Sync to content
    const structured = JOURNAL_QUESTIONS
      .filter(q => newAnswers[q.id]?.trim())
      .map(q => `**${q.label}**\n${newAnswers[q.id]}`)
      .join('\n\n');
    
    const additional = newAnswers.additional?.trim() 
      ? `\n\n---\n\n${newAnswers.additional}` 
      : '';
    
    onContentChange(structured + additional);
  };

  return (
    <div className="flex-1 max-w-3xl">
      <div className="bg-card rounded-2xl border border-border/30 shadow-lg overflow-hidden">
        {/* Single Flowing Journal Page */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Give your entry a title..."
            className="w-full text-2xl md:text-3xl font-bold text-foreground bg-transparent border-0 outline-none placeholder:text-muted-foreground/50"
            style={{ fontFamily: "var(--font-heading, var(--font-serif))" }}
          />

          {/* Metadata row */}
          <div className="flex items-center gap-3 flex-wrap text-sm">
            {/* Date Navigation */}
            <div className="flex items-center gap-1 bg-muted/30 rounded-lg px-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={handlePrevDay}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground px-2 py-1 transition-colors">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{dateDisplay}</span>
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
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={handleNextDay}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Time */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{timeDisplay}</span>
            </div>

            {/* Mood selector */}
            <Popover open={moodOpen} onOpenChange={setMoodOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 hover:bg-muted/50 rounded-full px-2 py-1 transition-colors">
                  {selectedMood ? (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-0 gap-1">
                      <span>{selectedMood.emoji}</span>
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

          {/* Single Flowing Document - 3 Questions */}
          <div className="space-y-8 pt-4">
            {JOURNAL_QUESTIONS.map((question, index) => (
              <div key={question.id} className="group">
                <h3 
                  className="text-base font-semibold text-foreground mb-3 flex items-center gap-2"
                  style={{ fontFamily: "var(--font-heading, var(--font-serif))" }}
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {index + 1}
                  </span>
                  {question.label}
                </h3>
                <textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder={question.placeholder}
                  className="w-full bg-muted/20 hover:bg-muted/30 focus:bg-muted/30 rounded-xl p-4 text-foreground border-0 outline-none resize-none transition-colors placeholder:text-muted-foreground/40 leading-relaxed"
                  style={{ 
                    fontFamily: "var(--font-body, var(--font-sans))", 
                    fontSize: "1rem",
                    minHeight: "100px",
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.max(100, target.scrollHeight)}px`;
                  }}
                />
              </div>
            ))}

            {/* Additional Thoughts */}
            <div className="pt-4 border-t border-border/30">
              <h3 
                className="text-sm font-medium text-muted-foreground mb-3"
                style={{ fontFamily: "var(--font-heading, var(--font-serif))" }}
              >
                Additional thoughts...
              </h3>
              <textarea
                value={answers.additional || ''}
                onChange={(e) => handleAnswerChange('additional', e.target.value)}
                placeholder="Write freely about anything else on your mind..."
                className="w-full bg-transparent border-0 outline-none resize-none text-foreground leading-relaxed placeholder:text-muted-foreground/40"
                style={{ 
                  fontFamily: "var(--font-body, var(--font-sans))", 
                  fontSize: "1rem",
                  lineHeight: "1.8",
                  minHeight: "150px",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.max(150, target.scrollHeight)}px`;
                }}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="pt-4 border-t border-border/30">
            <JournalTagInput
              tags={tags}
              onChange={onTagsChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
