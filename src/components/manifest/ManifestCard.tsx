import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Pencil, Check, Minus, Clock, History } from "lucide-react";
import { type ManifestGoal, type ManifestProof, type ManifestDailyPractice, DAILY_PRACTICE_KEY } from "./types";
import { format, subDays, isSameDay, parseISO } from "date-fns";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

interface ManifestCardProps {
  goal: ManifestGoal;
  streak: number;
  momentum: number;
  lastProof?: ManifestProof;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
}

export function ManifestCard({
  goal,
  streak,
  momentum,
  lastProof,
  isSelected,
  onClick,
  onEdit,
}: ManifestCardProps) {
  const navigate = useNavigate();
  // Get last 7 days practice history
  const last7DaysHistory = useMemo(() => {
    const stored = localStorage.getItem(DAILY_PRACTICE_KEY);
    const allPractices: Record<string, ManifestDailyPractice> = stored ? JSON.parse(stored) : {};
    
    const today = new Date();
    const history: { date: Date; completed: boolean }[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const practice = allPractices[`${goal.id}_${dateStr}`];
      history.push({
        date,
        completed: practice?.locked === true,
      });
    }
    
    return history;
  }, [goal.id]);

  const startDate = goal.start_date ? format(parseISO(goal.start_date), "MMM d, yyyy") : (goal.created_at ? format(parseISO(goal.created_at), "MMM d, yyyy") : "—");

  return (
    <Card
      className={`relative cursor-pointer transition-all hover:border-primary/50 overflow-hidden ${
        isSelected ? "ring-2 ring-primary border-primary border-l-4 border-l-primary" : "border-border/50"
      }`}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      {/* Vision Image Background */}
      {goal.vision_image_url && (
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `url(${goal.vision_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      
      <CardContent className="p-4 relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Assumption Text */}
            <h3 className="font-medium text-foreground leading-tight mb-2">
              {goal.title}
            </h3>

            {/* Start Date & Check-in Time */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
              <span>Started {startDate}</span>
              {goal.check_in_time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {goal.check_in_time}
                </span>
              )}
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant={goal.is_locked ? "secondary" : "default"} className="text-xs">
                {goal.is_locked ? "Locked" : "Active"}
              </Badge>
              {streak > 0 && (
                <Badge variant="outline" className="text-xs">
                  🔥 Day {streak}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                Conviction {goal.conviction}/10
              </Badge>
            </div>

            {/* Last 7 Days History */}
            <div className="flex items-center gap-1 mb-3">
              <span className="text-xs text-muted-foreground mr-2">Last 7 days:</span>
              {last7DaysHistory.map((day, idx) => (
                <div
                  key={idx}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    day.completed 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  }`}
                  title={format(day.date, "MMM d")}
                >
                  {day.completed ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                </div>
              ))}
            </div>

            {/* Momentum Bar */}
            <div className="space-y-1 mb-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Momentum</span>
                <span>{momentum}%</span>
              </div>
              <Progress value={momentum} className="h-1.5" />
            </div>

            {/* Last Saved Proof */}
            {lastProof && (
              <div className="text-xs text-muted-foreground truncate">
                <span className="text-foreground/70">Last proof:</span>{" "}
                {lastProof.text}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-1 shrink-0">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                title="Edit goal"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/manifest/history/${goal.id}`);
              }}
              title="View history"
            >
              <History className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
