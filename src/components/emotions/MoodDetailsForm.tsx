import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ArrowLeft, Check, Loader2, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { QuadrantType, QUADRANTS } from "./types";
import { cn } from "@/lib/utils";

interface MoodDetailsFormProps {
  quadrant: QuadrantType;
  emotion: string;
  note: string;
  onNoteChange: (note: string) => void;
  context: {
    who?: string;
    what?: string;
    body?: string;
    sleepHours?: string;
    physicalActivity?: string;
  };
  onContextChange: (context: MoodDetailsFormProps['context']) => void;
  sendToJournal: boolean;
  onSendToJournalChange: (value: boolean) => void;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
}

const QUICK_CONTEXTS = {
  who: ['Alone', 'Family', 'Friends', 'Partner', 'Coworkers', 'Strangers'],
  what: ['Working', 'Relaxing', 'Exercising', 'Eating', 'Socializing', 'Commuting', 'Creating', 'Learning'],
};

export function MoodDetailsForm({
  quadrant,
  emotion,
  note,
  onNoteChange,
  context,
  onContextChange,
  sendToJournal,
  onSendToJournalChange,
  onBack,
  onSave,
  saving,
}: MoodDetailsFormProps) {
  const info = QUADRANTS[quadrant];
  const [showExtras, setShowExtras] = useState(false);

  const handleQuickContext = (key: 'who' | 'what', value: string) => {
    const current = context[key];
    if (current === value) {
      onContextChange({ ...context, [key]: undefined });
    } else {
      onContextChange({ ...context, [key]: value });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      {/* Selected Emotion Header */}
      <motion.div 
        className="flex items-center gap-3 p-4 rounded-2xl"
        style={{ backgroundColor: info.bgColor }}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
      >
        <motion.div
          className="text-3xl"
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
        >
          {quadrant === 'high-pleasant' && '😊'}
          {quadrant === 'high-unpleasant' && '😰'}
          {quadrant === 'low-unpleasant' && '😔'}
          {quadrant === 'low-pleasant' && '😌'}
        </motion.div>
        <div>
          <p className="font-semibold" style={{ color: info.color }}>
            {emotion}
          </p>
          <p className="text-xs text-muted-foreground">{info.description}</p>
        </div>
        <Sparkles className="h-4 w-4 ml-auto" style={{ color: info.color }} />
      </motion.div>

      {/* Quick Context - Who */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Who are you with?</Label>
        <div className="flex flex-wrap gap-2">
          {QUICK_CONTEXTS.who.map((option) => (
            <motion.button
              key={option}
              onClick={() => handleQuickContext('who', option)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition-all",
                context.who === option
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 hover:bg-muted border-transparent"
              )}
            >
              {option}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Quick Context - What */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">What are you doing?</Label>
        <div className="flex flex-wrap gap-2">
          {QUICK_CONTEXTS.what.map((option) => (
            <motion.button
              key={option}
              onClick={() => handleQuickContext('what', option)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition-all",
                context.what === option
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 hover:bg-muted border-transparent"
              )}
            >
              {option}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Add a note (optional)</Label>
        <Textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="What's on your mind?"
          className="min-h-[80px] rounded-xl resize-none"
        />
      </div>

      {/* Journal Toggle */}
      <motion.div 
        className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50"
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Add to journal</p>
            <p className="text-xs text-muted-foreground">Include this check-in in today's journal</p>
          </div>
        </div>
        <Switch
          checked={sendToJournal}
          onCheckedChange={onSendToJournalChange}
        />
      </motion.div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button 
          variant="outline" 
          onClick={onBack} 
          className="flex-1 h-11 rounded-xl"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={onSave} 
          disabled={saving} 
          className="flex-1 h-11 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Save Check-in
        </Button>
      </div>
    </motion.div>
  );
}
