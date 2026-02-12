import { BookOpen, CheckSquare, StickyNote, Activity, Sparkles, Heart, Clock, Lightbulb } from "lucide-react";
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
  { icon: Activity, name: "Trackers", desc: "Build consistent habits" },
  { icon: Sparkles, name: "Manifest", desc: "Visualize your goals" },
  { icon: Heart, name: "Emotions", desc: "Understand how you feel" },
];

export function DiaryLeftSidebar({
  userName,
  filter,
  onFilterChange,
}: DiaryLeftSidebarProps) {
  return (
    <div className="flex flex-col h-full p-4 gap-6">
      {/* About Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          About Diary
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your unified timeline — every journal entry, completed task, note, habit, goal, and emotion check-in flows into one feed so you can see the full picture of your day.
        </p>
      </div>

      {/* How it works */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          How it works
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-2.5">
            <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Activities from all modules appear here automatically, sorted by date.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              React, comment, and save entries to build your personal highlights.
            </p>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Modules
        </h3>
        <div className="space-y-2">
          {MODULE_INFO.map((mod) => (
            <div key={mod.name} className="flex items-center gap-2.5 py-1.5">
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
