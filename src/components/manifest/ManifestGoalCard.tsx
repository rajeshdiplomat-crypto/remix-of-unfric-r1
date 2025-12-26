import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Target, Heart, Home, DollarSign, ChevronRight, MoreHorizontal, Edit, ExternalLink, Archive, CheckCircle2, Calendar } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";

const CATEGORY_ICONS: Record<string, typeof Target> = {
  wealth: DollarSign,
  health: Heart,
  love: Home,
  default: Target,
};

interface ManifestGoalCardProps {
  goal: {
    id: string;
    title: string;
    description: string | null;
    affirmations: string[];
    is_completed: boolean;
    created_at: string;
    category?: string;
    cover_image?: string;
    target_date?: string;
  };
  progress: number;
  isSelected: boolean;
  journalEntries: Array<{ goal_id: string; entry_date: string }>;
  onClick: () => void;
  onEdit: () => void;
  onOpenDashboard: () => void;
  onArchive: () => void;
  onCheckIn: (date: Date) => void;
}

export function ManifestGoalCard({
  goal,
  progress,
  isSelected,
  journalEntries,
  onClick,
  onEdit,
  onOpenDashboard,
  onArchive,
  onCheckIn,
}: ManifestGoalCardProps) {
  const CategoryIcon = CATEGORY_ICONS[goal.category || "default"] || Target;
  
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i)
  );

  const hasEntryOnDate = (date: Date): boolean => {
    return journalEntries.some(
      (e) => e.goal_id === goal.id && isSameDay(parseISO(e.entry_date), date)
    );
  };

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
        isSelected ? "ring-2 ring-primary shadow-lg" : ""
      }`}
    >
      {/* Cover Image */}
      {goal.cover_image && (
        <div className="h-24 w-full overflow-hidden">
          <img
            src={goal.cover_image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 h-24 bg-gradient-to-b from-transparent to-background/80" />
        </div>
      )}

      <div className="p-4 cursor-pointer" onClick={onClick}>
        <div className="flex items-start gap-4">
          <div 
            className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${
              goal.is_completed 
                ? "bg-green-500/10" 
                : "bg-primary/10"
            }`}
          >
            {goal.is_completed ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <CategoryIcon className="h-6 w-6 text-primary" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">{goal.title}</h3>
              {goal.is_completed && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-500 shrink-0">
                  Manifested ✨
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground italic mb-3 line-clamp-1">
              {goal.affirmations?.[0] || "I am manifesting this goal into reality"}
            </p>
            
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{progress}% complete</span>
                {goal.target_date && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(goal.target_date), "MMM d")}
                  </span>
                )}
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>

            {/* Weekly Check-in */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">This Week</span>
              <div className="flex items-center gap-1">
                {weekDays.map((day, i) => {
                  const hasEntry = hasEntryOnDate(day);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCheckIn(day);
                      }}
                      className={`h-5 w-5 rounded-md transition-all duration-200 text-[9px] font-medium flex items-center justify-center ${
                        hasEntry
                          ? "bg-primary text-primary-foreground"
                          : isToday
                          ? "bg-primary/20 text-primary ring-1 ring-primary"
                          : "bg-muted hover:bg-muted-foreground/20 text-muted-foreground"
                      }`}
                      title={format(day, "EEEE, MMM d")}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpenDashboard(); }}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Goal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(); }}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDashboard();
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
