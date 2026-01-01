import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Eye, Zap, Camera, ChevronDown, ChevronUp, Flame,
  Target, Heart, DollarSign, Briefcase, TrendingUp, Repeat
} from "lucide-react";
import { useState } from "react";
import { format, subDays, isSameDay, parseISO } from "date-fns";
import type { ManifestGoal, ManifestCheckIn } from "./types";

const CATEGORY_ICONS: Record<string, typeof Target> = {
  wealth: DollarSign,
  health: Heart,
  career: Briefcase,
  growth: TrendingUp,
  habits: Repeat,
  default: Target,
};

interface ManifestGoalCardCompactProps {
  goal: ManifestGoal;
  checkIns: ManifestCheckIn[];
  isSelected: boolean;
  onClick: () => void;
  onVisualize: () => void;
  onActAsIf: () => void;
  onLogProof: () => void;
}

export function ManifestGoalCardCompact({
  goal,
  checkIns,
  isSelected,
  onClick,
  onVisualize,
  onActAsIf,
  onLogProof
}: ManifestGoalCardCompactProps) {
  const [expanded, setExpanded] = useState(false);
  
  const CategoryIcon = CATEGORY_ICONS[goal.category || "default"] || Target;
  
  // Calculate streak
  const streak = (() => {
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const checkDate = subDays(new Date(), i);
      const hasCheckIn = checkIns.some(c => isSameDay(parseISO(c.entry_date), checkDate));
      if (hasCheckIn) count++;
      else if (i > 0) break;
    }
    return count;
  })();
  
  // Calculate momentum (0-100)
  const momentum = (() => {
    const recentCheckIns = checkIns.filter(c => {
      const date = parseISO(c.entry_date);
      const daysDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff < 7;
    });
    
    if (recentCheckIns.length === 0) return 0;
    
    const avgAlignment = recentCheckIns.reduce((acc, c) => acc + c.alignment, 0) / recentCheckIns.length;
    const actedDays = recentCheckIns.filter(c => c.acted_today === 'yes' || c.acted_today === 'mostly').length;
    const proofCount = recentCheckIns.reduce((acc, c) => acc + (c.proofs?.length || 0), 0);
    
    return Math.round((avgAlignment * 4 + (actedDays / 7) * 30 + Math.min(proofCount * 5, 30)));
  })();
  
  // Last 7 days sparkline data
  const sparklineData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const checkIn = checkIns.find(c => isSameDay(parseISO(c.entry_date), date));
    return checkIn?.alignment || 0;
  });
  
  // Last 3 proofs
  const recentProofs = checkIns
    .flatMap(c => (c.proofs || []).map(p => ({ text: p, date: c.entry_date })))
    .slice(0, 3);

  return (
    <Card 
      className={`overflow-hidden transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
    >
      <div 
        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            goal.is_completed ? 'bg-green-500/10' : 'bg-primary/10'
          }`}>
            <CategoryIcon className={`h-5 w-5 ${goal.is_completed ? 'text-green-500' : 'text-primary'}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground text-sm leading-tight">{goal.title}</h3>
            
            <div className="flex items-center gap-3 mt-2">
              {/* Conviction badge */}
              <Badge variant="secondary" className="text-xs">
                {goal.conviction || 5}/10
              </Badge>
              
              {/* Streak */}
              {streak > 0 && (
                <div className="flex items-center gap-1 text-xs text-orange-500">
                  <Flame className="h-3 w-3" />
                  {streak}d
                </div>
              )}
              
              {/* Momentum bar */}
              <div className="flex-1 max-w-[80px]">
                <Progress value={momentum} className="h-1.5" />
              </div>
            </div>
            
            {/* Recent proofs preview */}
            {recentProofs.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                {recentProofs.map((proof, i) => (
                  <span 
                    key={i} 
                    className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded truncate max-w-[80px]"
                  >
                    {proof.text}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Quick actions */}
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs gap-1"
              onClick={(e) => { e.stopPropagation(); onVisualize(); }}
            >
              <Eye className="h-3 w-3" />
              3m
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs"
              onClick={(e) => { e.stopPropagation(); onActAsIf(); }}
            >
              <Zap className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs"
              onClick={(e) => { e.stopPropagation(); onLogProof(); }}
            >
              <Camera className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border/50 bg-muted/20">
          <div className="pt-3 space-y-3">
            {/* 7-day conviction sparkline */}
            <div>
              <span className="text-xs text-muted-foreground">7-day alignment</span>
              <div className="flex items-end gap-1 h-8 mt-1">
                {sparklineData.map((value, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary/20 rounded-t"
                    style={{ height: `${Math.max(value * 10, 5)}%` }}
                  />
                ))}
              </div>
            </div>
            
            {/* Latest proofs */}
            {recentProofs.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">Recent proofs</span>
                <div className="space-y-1 mt-1">
                  {recentProofs.map((proof, i) => (
                    <p key={i} className="text-xs text-foreground">{proof.text}</p>
                  ))}
                </div>
              </div>
            )}
            
            {/* Next micro-action */}
            {goal.micro_step && (
              <div>
                <span className="text-xs text-muted-foreground">Next micro-action</span>
                <p className="text-xs text-foreground mt-1">{goal.micro_step}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
