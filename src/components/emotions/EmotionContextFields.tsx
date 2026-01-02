import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Users, Activity, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextData {
  who?: string;
  what?: string;
  body?: string;
}

interface EmotionContextFieldsProps {
  note: string;
  onNoteChange: (note: string) => void;
  context: ContextData;
  onContextChange: (context: ContextData) => void;
}

export function EmotionContextFields({ 
  note, 
  onNoteChange, 
  context, 
  onContextChange 
}: EmotionContextFieldsProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const updateContext = (field: keyof ContextData, value: string) => {
    onContextChange({ ...context, [field]: value });
  };
  
  return (
    <div className="space-y-4">
      {/* Quick note */}
      <div className="space-y-2">
        <Label htmlFor="note" className="text-sm text-muted-foreground">
          Add a note (optional)
        </Label>
        <Textarea
          id="note"
          placeholder="What's on your mind? What might have triggered this feeling?"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          className="min-h-[80px] resize-none"
        />
      </div>
      
      {/* Collapsible context fields */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between px-3 py-2 h-auto">
            <span className="text-sm text-muted-foreground">Add more details</span>
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-4 pt-4">
          <div className="grid gap-4">
            {/* Who */}
            <div className="space-y-2">
              <Label htmlFor="who" className="text-sm flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                Who are you with?
              </Label>
              <Input
                id="who"
                placeholder="e.g., Family, coworkers, alone"
                value={context.who || ''}
                onChange={(e) => updateContext('who', e.target.value)}
              />
            </div>
            
            {/* What */}
            <div className="space-y-2">
              <Label htmlFor="what" className="text-sm flex items-center gap-2 text-muted-foreground">
                <Activity className="h-4 w-4" />
                What are you doing?
              </Label>
              <Input
                id="what"
                placeholder="e.g., Working, exercising, relaxing"
                value={context.what || ''}
                onChange={(e) => updateContext('what', e.target.value)}
              />
            </div>
            
            {/* Body */}
            <div className="space-y-2">
              <Label htmlFor="body" className="text-sm flex items-center gap-2 text-muted-foreground">
                <Heart className="h-4 w-4" />
                Body sensations?
              </Label>
              <Input
                id="body"
                placeholder="e.g., Tense shoulders, racing heart, relaxed"
                value={context.body || ''}
                onChange={(e) => updateContext('body', e.target.value)}
              />
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground/60 italic">
            These details help you spot patterns over time
          </p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
