import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sparkles, CheckCircle2, ChevronDown, Lightbulb, Zap, ArrowRight,
  TrendingUp, Calendar, Eye, Award
} from "lucide-react";
import { format, subDays, isSameDay, parseISO } from "date-fns";
import type { ManifestGoal, ManifestCheckIn } from "./types";

interface ManifestRightPanelProps {
  selectedGoal: ManifestGoal | null;
  checkIns: ManifestCheckIn[];
  onCheckIn: () => void;
  onQuickAction: (action: string) => void;
  onUpdateWoop: (woop: ManifestGoal['woop']) => void;
  onAddIfThen: (trigger: { if_part: string; then_part: string }) => void;
  onUpdateMicroStep: (step: string) => void;
}

export function ManifestRightPanel({
  selectedGoal,
  checkIns,
  onCheckIn,
  onQuickAction,
  onUpdateWoop,
  onAddIfThen,
  onUpdateMicroStep
}: ManifestRightPanelProps) {
  const [woopOpen, setWoopOpen] = useState(false);
  const [ifThenOpen, setIfThenOpen] = useState(false);
  const [microStepOpen, setMicroStepOpen] = useState(false);
  const [newIfPart, setNewIfPart] = useState("");
  const [newThenPart, setNewThenPart] = useState("");
  const [localMicroStep, setLocalMicroStep] = useState("");
  
  const goalCheckIns = selectedGoal 
    ? checkIns.filter(c => c.goal_id === selectedGoal.id)
    : [];
  
  // Calculate metrics
  const last7DaysCheckIns = goalCheckIns.filter(c => {
    const date = parseISO(c.entry_date);
    const daysDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff < 7;
  });
  
  const avgAlignment = last7DaysCheckIns.length > 0
    ? Math.round(last7DaysCheckIns.reduce((acc, c) => acc + c.alignment, 0) / last7DaysCheckIns.length * 10) / 10
    : 0;
  
  const actAsIfDays = last7DaysCheckIns.filter(c => c.acted_today === 'yes' || c.acted_today === 'mostly').length;
  const proofsLogged = last7DaysCheckIns.reduce((acc, c) => acc + (c.proofs?.length || 0), 0);
  
  // Momentum calculation
  const momentum = Math.round((avgAlignment * 4 + (actAsIfDays / 7) * 30 + Math.min(proofsLogged * 5, 30)));
  
  // Sparkline data
  const sparklineData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const checkIn = goalCheckIns.find(c => isSameDay(parseISO(c.entry_date), date));
    return checkIn?.alignment || 0;
  });
  
  // Recent activity
  const recentActivity = [...goalCheckIns]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="w-[380px] flex-shrink-0 border-l border-border bg-muted/20">
      <ScrollArea className="h-[calc(100vh-100px)]">
        <div className="p-4 space-y-4">
          {/* Goal Dashboard Header */}
          <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Goal Dashboard</p>
                <p className="text-[11px] text-muted-foreground">Evidence-based manifestation tools</p>
              </div>
            </div>
          </Card>
          
          {!selectedGoal ? (
            <Card className="p-4">
              <p className="text-sm text-muted-foreground text-center py-8">
                Select a manifestation to view its dashboard
              </p>
            </Card>
          ) : (
            <>
              {/* Progress Widget */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Momentum</span>
                  <Badge variant="secondary">{momentum}/100</Badge>
                </div>
                <Progress value={momentum} className="h-2 mb-4" />
                
                <Button className="w-full mb-3" onClick={onCheckIn}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Check in today
                </Button>
                
                {/* Quick micro-actions */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">How did you act today?</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["Visualized", "Spoke it", "Dressed for it", "Made a decision"].map(action => (
                      <Button
                        key={action}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => onQuickAction(action)}
                      >
                        {action}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
              
              {/* WOOP Plan */}
              <Collapsible open={woopOpen} onOpenChange={setWoopOpen}>
                <Card className="overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">WOOP Plan</span>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${woopOpen ? "rotate-180" : ""}`} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-3 pb-3 space-y-2">
                      {selectedGoal.woop ? (
                        <>
                          <div className="text-xs"><span className="font-medium">Wish:</span> {selectedGoal.woop.wish || "—"}</div>
                          <div className="text-xs"><span className="font-medium">Outcome:</span> {selectedGoal.woop.outcome || "—"}</div>
                          <div className="text-xs"><span className="font-medium">Obstacle:</span> {selectedGoal.woop.obstacle || "—"}</div>
                          <div className="text-xs"><span className="font-medium">Plan:</span> {selectedGoal.woop.plan || "—"}</div>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">No WOOP plan set</p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
              
              {/* If-Then Triggers */}
              <Collapsible open={ifThenOpen} onOpenChange={setIfThenOpen}>
                <Card className="overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">If→Then Triggers</span>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${ifThenOpen ? "rotate-180" : ""}`} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-3 pb-3 space-y-2">
                      {selectedGoal.if_then_triggers?.map((trigger, i) => (
                        <div key={i} className="text-xs bg-muted/50 p-2 rounded">
                          <span className="font-medium">If</span> {trigger.if_part} <span className="font-medium">→</span> {trigger.then_part}
                        </div>
                      ))}
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={newIfPart}
                          onChange={(e) => setNewIfPart(e.target.value)}
                          placeholder="If..."
                          className="text-xs h-8"
                        />
                        <Input
                          value={newThenPart}
                          onChange={(e) => setNewThenPart(e.target.value)}
                          placeholder="Then..."
                          className="text-xs h-8"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => {
                            if (newIfPart && newThenPart) {
                              onAddIfThen({ if_part: newIfPart, then_part: newThenPart });
                              setNewIfPart("");
                              setNewThenPart("");
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
              
              {/* Next Micro-step */}
              <Collapsible open={microStepOpen} onOpenChange={setMicroStepOpen}>
                <Card className="overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Next Micro-step</span>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${microStepOpen ? "rotate-180" : ""}`} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-3 pb-3 space-y-2">
                      {selectedGoal.micro_step ? (
                        <p className="text-xs bg-primary/10 text-primary p-2 rounded">{selectedGoal.micro_step}</p>
                      ) : null}
                      <div className="flex gap-2">
                        <Input
                          value={localMicroStep}
                          onChange={(e) => setLocalMicroStep(e.target.value)}
                          placeholder="One tiny action..."
                          className="text-xs h-8"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => {
                            if (localMicroStep) {
                              onUpdateMicroStep(localMicroStep);
                              setLocalMicroStep("");
                            }
                          }}
                        >
                          Set
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
              
              {/* Weekly Momentum */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Weekly Momentum</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    <p className="text-lg font-semibold">{avgAlignment}</p>
                    <p className="text-[10px] text-muted-foreground">Avg Alignment</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold">{actAsIfDays}/7</p>
                    <p className="text-[10px] text-muted-foreground">Act-as-If Days</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold">{proofsLogged}</p>
                    <p className="text-[10px] text-muted-foreground">Proofs Logged</p>
                  </div>
                </div>
                
                {/* Sparkline */}
                <div className="flex items-end gap-1 h-8 mb-2">
                  {sparklineData.map((value, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/20 rounded-t transition-all"
                      style={{ height: `${Math.max(value * 10, 8)}%` }}
                    />
                  ))}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {avgAlignment >= 7 ? "Excellent alignment this week!" : avgAlignment >= 5 ? "Good progress, keep going!" : "Focus on feeling more aligned each day"}
                </p>
              </Card>
              
              {/* Activity Log */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Activity Log</span>
                </div>
                
                {recentActivity.length > 0 ? (
                  <div className="space-y-2">
                    {recentActivity.map((activity, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className="text-muted-foreground w-16 flex-shrink-0">
                          {format(parseISO(activity.entry_date), "MMM d")}
                        </span>
                        <div className="flex-1">
                          <span className="text-foreground">Check-in: {activity.alignment}/10</span>
                          {activity.proofs?.length > 0 && (
                            <p className="text-muted-foreground truncate">{activity.proofs[0]}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px]">
                          <Award className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No check-ins yet. Start today!
                  </p>
                )}
              </Card>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
