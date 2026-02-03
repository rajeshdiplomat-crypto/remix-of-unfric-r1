import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  CheckSquare, PenLine, FileText, BarChart3, Sparkles, Heart, 
  Bookmark, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SourceModule } from "./types";

interface DiaryLeftSidebarProps {
  userName: string;
  filter: SourceModule | 'all' | 'saved';
  onFilterChange: (filter: SourceModule | 'all' | 'saved') => void;
}

const NAV_ITEMS = [
  { icon: CheckSquare, label: "Tasks", route: "/tasks", color: "text-emerald-600" },
  { icon: PenLine, label: "Journal", route: "/journal", color: "text-amber-600" },
  { icon: FileText, label: "Notes", route: "/notes", color: "text-sky-600" },
  { icon: BarChart3, label: "Trackers", route: "/trackers", color: "text-teal-600" },
  { icon: Sparkles, label: "Manifest", route: "/manifest", color: "text-purple-600" },
  { icon: Heart, label: "Emotions", route: "/emotions", color: "text-pink-500" },
];

export function DiaryLeftSidebar({
  userName,
  filter,
  onFilterChange,
}: DiaryLeftSidebarProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full p-4">
      {/* Profile Section */}
      <div className="flex items-center gap-3 mb-6 px-2">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-semibold text-foreground truncate">
          {userName}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <Button
            key={item.route}
            variant="ghost"
            className="justify-start gap-3 h-11 px-3 text-foreground/80 hover:text-foreground hover:bg-muted/60"
            onClick={() => navigate(item.route)}
          >
            <item.icon className={cn("h-5 w-5", item.color)} />
            <span className="text-sm font-medium">{item.label}</span>
          </Button>
        ))}
      </nav>

      <Separator className="my-4" />

      {/* Saved Filter */}
      <Button
        variant="ghost"
        className={cn(
          "justify-start gap-3 h-11 px-3",
          filter === 'saved' 
            ? "bg-primary/10 text-primary" 
            : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
        )}
        onClick={() => onFilterChange(filter === 'saved' ? 'all' : 'saved')}
      >
        <Bookmark className={cn("h-5 w-5", filter === 'saved' ? "text-primary" : "text-orange-500")} />
        <span className="text-sm font-medium">Saved</span>
      </Button>

      {/* Daily Quote - Optional decoration */}
      <div className="mt-auto pt-6">
        <div className="bg-muted/30 rounded-lg p-4">
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            "The only way to do great work is to love what you do."
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">— Steve Jobs</p>
        </div>
      </div>
    </div>
  );
}
