import { BookOpen, CheckSquare, StickyNote, Activity, Sparkles, Heart, Clock, Lightbulb, Layers } from "lucide-react";
import type { SourceModule } from "./types";

interface DiaryLeftSidebarProps {
  userName: string;
  filter: SourceModule | 'all' | 'saved';
  onFilterChange: (filter: SourceModule | 'all' | 'saved') => void;
}

const MODULE_INFO = [
  { icon: BookOpen, name: "Journal", desc: "Daily reflections & gratitude" },
  { icon: CheckSquare, name: "Tasks", desc: "Track what you accomplish" },
  { icon: StickyNote, name: "Notes", desc: "Capture ideas & thoughts" },
  { icon: Activity, name: "Habits", desc: "Build consistent habits" },
  { icon: Sparkles, name: "Manifest", desc: "Visualize your goals" },
  { icon: Heart, name: "Emotions", desc: "Understand how you feel" },
];

export function DiaryLeftSidebar({
  userName,
  filter,
  onFilterChange,
}: DiaryLeftSidebarProps) {
  return (
    <div className="flex flex-col justify-center h-full px-6 lg:px-8 gap-8">
      <div className="space-y-6 max-w-sm">
        {/* Badge */}
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Layers className="h-4 w-4" />
          Your Timeline
        </span>

        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-light leading-tight">
          Your Unified <span className="font-semibold">Life Feed</span>
        </h2>

        {/* Description */}
        <p className="text-muted-foreground text-lg leading-relaxed">
          Every journal entry, completed task, note, habit, and emotion check-in flows into one timeline — the full picture of your day.
        </p>

        <div className="h-px bg-border" />

        {/* How it works */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-primary mt-1 shrink-0" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Activities from all modules appear here automatically, sorted by date.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Lightbulb className="h-4 w-4 text-primary mt-1 shrink-0" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              React, comment, and save entries to build your personal highlights.
            </p>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Modules */}
        <div className="space-y-2.5">
          {MODULE_INFO.map((mod) => (
            <div key={mod.name} className="flex items-center gap-3 py-1">
              <mod.icon className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground leading-tight">{mod.name}</p>
                <p className="text-xs text-muted-foreground">{mod.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
