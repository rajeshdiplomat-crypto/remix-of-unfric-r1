import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Sparkles } from "lucide-react";
import { STARTER_TEMPLATES, ACT_AS_IF_OPTIONS, type StarterTemplate } from "./types";

interface ManifestCreateFormProps {
  onSave: (goal: {
    title: string;
    conviction: number;
    live_from_end?: string;
    act_as_if: string;
    visualization_minutes: 3 | 5 | 10;
    daily_affirmation: string;
    check_in_time: string;
    committed_7_days: boolean;
  }) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function ManifestCreateForm({ onSave, onCancel, saving }: ManifestCreateFormProps) {
  const [title, setTitle] = useState("");
  const [conviction, setConviction] = useState(5);
  const [liveFromEnd, setLiveFromEnd] = useState("");
  const [actAsIf, setActAsIf] = useState("");
  const [customActAsIf, setCustomActAsIf] = useState("");
  const [visualizationMinutes, setVisualizationMinutes] = useState<3 | 5 | 10>(3);
  const [dailyAffirmation, setDailyAffirmation] = useState("");
  const [checkInTime, setCheckInTime] = useState("08:00");
  const [committed7Days, setCommitted7Days] = useState(false);

  const applyTemplate = (template: StarterTemplate) => {
    setTitle(template.assumption);
    setActAsIf(template.act_as_if);
    setDailyAffirmation(template.affirmation);
  };

  const handleSubmit = () => {
    const finalActAsIf = actAsIf === "custom" ? customActAsIf : actAsIf;
    onSave({
      title,
      conviction,
      live_from_end: liveFromEnd || undefined,
      act_as_if: finalActAsIf,
      visualization_minutes: visualizationMinutes,
      daily_affirmation: dailyAffirmation,
      check_in_time: checkInTime,
      committed_7_days: committed7Days,
    });
  };

  const canSubmit = title.trim() && (actAsIf || customActAsIf.trim()) && dailyAffirmation.trim();

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <Button variant="ghost" size="sm" onClick={onCancel} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Create a Manifestation</CardTitle>
          <CardDescription>
            Write it present-tense. Practice it daily. Celebrate progress.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Starter Templates */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Quick Start Templates</Label>
            <div className="flex flex-wrap gap-2">
              {STARTER_TEMPLATES.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(template)}
                  className="text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Your Assumption */}
          <div className="space-y-2">
            <Label htmlFor="assumption">Your Assumption *</Label>
            <Input
              id="assumption"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="I am confidently working in my ideal role and growing every month."
            />
            <p className="text-xs text-muted-foreground">State it as your current reality.</p>
          </div>

          {/* Conviction Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Conviction</Label>
              <span className="text-sm font-medium text-primary">{conviction}/10</span>
            </div>
            <Slider
              value={[conviction]}
              onValueChange={(v) => setConviction(v[0])}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 — Warming up</span>
              <span>10 — Fully embodied</span>
            </div>
            <p className="text-xs text-muted-foreground">Honest rating = fast feedback.</p>
          </div>

          {/* Live from the End */}
          <div className="space-y-2">
            <Label htmlFor="live-from-end">If it's already true, what do you do today?</Label>
            <Textarea
              id="live-from-end"
              value={liveFromEnd}
              onChange={(e) => setLiveFromEnd(e.target.value)}
              placeholder="I speak confidently in meetings and lead with clarity."
              rows={2}
            />
            <p className="text-xs text-muted-foreground">Short, vivid scene helps the mind align.</p>
          </div>

          {/* Today's Act-as-If */}
          <div className="space-y-3">
            <Label>Today's Act-as-If *</Label>
            <div className="flex flex-wrap gap-2">
              {ACT_AS_IF_OPTIONS.map((option) => (
                <Button
                  key={option}
                  variant={actAsIf === option ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setActAsIf(option);
                    setCustomActAsIf("");
                  }}
                  className="text-xs"
                >
                  {option}
                </Button>
              ))}
            </div>
            <Input
              value={customActAsIf}
              onChange={(e) => {
                setCustomActAsIf(e.target.value);
                setActAsIf("custom");
              }}
              placeholder="e.g., Update LinkedIn headline to 'Supply Chain Lead'"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground">One small, high-impact action.</p>
          </div>

          {/* Visualization Minutes */}
          <div className="space-y-3">
            <Label>Visualization</Label>
            <RadioGroup
              value={String(visualizationMinutes)}
              onValueChange={(v) => setVisualizationMinutes(Number(v) as 3 | 5 | 10)}
              className="flex gap-4"
            >
              {[3, 5, 10].map((min) => (
                <div key={min} className="flex items-center space-x-2">
                  <RadioGroupItem value={String(min)} id={`viz-${min}`} />
                  <Label htmlFor={`viz-${min}`} className="text-sm cursor-pointer">
                    {min} min
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">Focused, concrete scenes beat length.</p>
          </div>

          {/* Daily Affirmation */}
          <div className="space-y-2">
            <Label htmlFor="affirmation">Daily Affirmation *</Label>
            <Input
              id="affirmation"
              value={dailyAffirmation}
              onChange={(e) => setDailyAffirmation(e.target.value)}
              placeholder="This success is already unfolding for me."
            />
            <p className="text-xs text-muted-foreground">Read aloud at check-in.</p>
          </div>

          {/* Check-in Time */}
          <div className="space-y-2">
            <Label htmlFor="check-in-time">Daily Check-in Time *</Label>
            <Input
              id="check-in-time"
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">Pick a reliable moment for 1–3 minutes.</p>
          </div>

          {/* Commitment Pledge */}
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 border border-border/50">
            <Checkbox
              id="commitment"
              checked={committed7Days}
              onCheckedChange={(checked) => setCommitted7Days(checked === true)}
              className="mt-0.5"
            />
            <div>
              <Label htmlFor="commitment" className="cursor-pointer font-medium">
                I commit to a 7-day practice.
              </Label>
              <p className="text-xs text-muted-foreground mt-1">Pledges increase follow-through.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} disabled={!canSubmit || saving} className="flex-1">
              {saving ? "Creating..." : "Create & Start"}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
