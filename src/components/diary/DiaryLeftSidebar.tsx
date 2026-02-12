import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen, CheckSquare, FileText, Activity, Sparkles, Heart, Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SourceModule } from "./types";
import { DAILY_QUOTES } from "./types";

interface DiaryLeftSidebarProps {
  userName: string;
  filter: SourceModule | 'all' | 'saved';
  onFilterChange: (filter: SourceModule | 'all' | 'saved') => void;
}

const NAV_ITEMS: { value: SourceModule | 'all'; label: string; icon: typeof BookOpen }[] = [
  { value: 'all', label: 'All Activity', icon: Activity },
  { value: 'journal', label: 'Journal', icon: BookOpen },
  { value: 'tasks', label: 'Tasks', icon: CheckSquare },
  { value: 'notes', label: 'Notes', icon: FileText },
  { value: 'trackers', label: 'Trackers', icon: Activity },
  { value: 'manifest', label: 'Manifest', icon: Sparkles },
  { value: 'emotions', label: 'Emotions', icon: Heart },
];

export function DiaryLeftSidebar({
  userName,
  filter,
  onFilterChange,
}: DiaryLeftSidebarProps) {
  const dailyQuote = DAILY_QUOTES[new Date().getDate() % DAILY_QUOTES.length];
  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="flex flex-col gap-4 h-full p-4">
      {/* User profile */}
      <div className="flex items-center gap-3 px-2">
        <Avatar className="h-10 w-10">
          <AvatarImage src="" alt={userName} />
          <AvatarFallback className="text-sm font-medium">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">{userName || 'User'}</p>
          <p className="text-xs text-muted-foreground">Your Diary</p>
        </div>
      </div>

      {/* Navigation shortcuts */}
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(item => {
          const isActive = filter === item.value;
          const Icon = item.icon;
          return (
            <Button
              key={item.value}
              variant="ghost"
              size="sm"
              className={cn(
                "justify-start gap-3 h-10 text-sm font-medium rounded-lg px-3",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              onClick={() => onFilterChange(item.value)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      {/* Daily quote */}
      <Card className="bg-card/50 border-border/30 mt-auto">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Quote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-foreground leading-relaxed italic">
                "{dailyQuote.text}"
              </p>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                — {dailyQuote.author}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
