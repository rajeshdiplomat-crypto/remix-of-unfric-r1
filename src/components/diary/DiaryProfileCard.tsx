import { useRef, useState } from "react";
import { Award, Trophy, Star, Flame, Zap, Camera, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { TimeRange } from "./types";

interface DiaryProfileCardProps {
  userName: string;
  userEmail: string;
  avatarUrl?: string;
  metrics: any;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const BADGES = [
  { min: 80, label: "Champion", icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
  { min: 60, label: "Achiever", icon: Star, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { min: 40, label: "Rising Star", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
  { min: 20, label: "Explorer", icon: Zap, color: "text-sky-500", bg: "bg-sky-500/10" },
  { min: 0, label: "Starter", icon: Award, color: "text-muted-foreground", bg: "bg-muted" },
];

const TIME_LABELS: Record<TimeRange, string> = {
  today: "Today",
  week: "Week",
  month: "Total",
};

export function DiaryProfileCard({
  userName,
  userEmail,
  avatarUrl,
  metrics,
  timeRange,
  onTimeRangeChange,
}: DiaryProfileCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);

  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be under 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "avatars");

      const { data: uploadRes, error: uploadError } = await supabase.functions.invoke("upload-image", {
        body: formData,
      });

      if (uploadError || !uploadRes?.url) throw uploadError || new Error("Failed to upload photo");

      const urlWithCacheBust = `${uploadRes.url}?t=${Date.now()}`;

      await supabase.functions.invoke("manage-settings", {
        body: { action: "update_profile", profile: { avatar_url: urlWithCacheBust } }
      });

      setCurrentAvatarUrl(urlWithCacheBust);
      toast({ title: "Profile photo updated!" });
    } catch (err) {
      console.error("Avatar upload error:", err);
      toast({ title: "Failed to upload photo", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Calculate overall performance score
  const taskPercent = metrics.tasks.planned > 0
    ? Math.round((metrics.tasks.completed / metrics.tasks.planned) * 100)
    : 0;
  const habitPercent = metrics.trackers.completionPercent || 0;
  const journalPercent = Math.min(100, metrics.journal.entriesWritten * 14);
  const manifestPercent = Math.min(100, metrics.manifest.checkInsDone * 20);
  const notesPercent = Math.min(100, metrics.notes.created * 10);
  const emotionsPercent = Math.min(100, (metrics.emotions?.checkIns || 0) * 15);

  const overallScore = Math.round(
    (taskPercent + habitPercent + journalPercent + manifestPercent + notesPercent + emotionsPercent) / 6
  );

  const badge = BADGES.find((b) => overallScore >= b.min) || BADGES[BADGES.length - 1];
  const BadgeIcon = badge.icon;

  const modules = [
    { name: "Tasks", stat: `${metrics.tasks.completed}/${metrics.tasks.planned}`, percent: taskPercent, bar: "[&>div]:bg-emerald-500" },
    { name: "Habits", stat: `${metrics.trackers.completionPercent}%`, percent: habitPercent, bar: "[&>div]:bg-teal-500" },
    { name: "Journal", stat: `${metrics.journal.entriesWritten}`, percent: journalPercent, bar: "[&>div]:bg-amber-500" },
    { name: "Manifest", stat: `${metrics.manifest.checkInsDone}`, percent: manifestPercent, bar: "[&>div]:bg-purple-500" },
    { name: "Notes", stat: `${metrics.notes.created}`, percent: notesPercent, bar: "[&>div]:bg-sky-500" },
    { name: "Emotions", stat: `${metrics.emotions?.checkIns || 0}`, percent: emotionsPercent, bar: "[&>div]:bg-rose-400" },
  ];

  const resolvedAvatar = currentAvatarUrl || avatarUrl;

  return (
    <Card className="overflow-hidden border-0" style={{ background: "#FFFFFF", borderRadius: "18px", boxShadow: "0px 10px 35px rgba(15, 23, 42, 0.07)" }}>
      <CardContent className="pt-6 pb-6 px-5 space-y-4">
        {/* Avatar with upload + Badge row */}
        <div className="flex items-start justify-between">
          <div className="relative group">
            <Avatar className="h-16 w-16 border-2 border-border shadow-sm">
              <AvatarImage src={resolvedAvatar} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 text-background animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-background" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          {/* Performance Badge */}
          <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold", badge.bg, badge.color)} style={{ boxShadow: "0px 4px 10px rgba(0,0,0,0.06)" }}>
            <BadgeIcon className="h-3.5 w-3.5" />
            {badge.label}
          </div>
        </div>

        {/* Name & email */}
        <div className="space-y-0.5">
          <h3 className="text-base font-semibold text-foreground">{displayName}</h3>
          <p className="text-xs text-muted-foreground">{userEmail}</p>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Tracking your personal growth journey across journaling, habits, emotions, and more.
        </p>

        <div className="h-px" style={{ background: "#E5EAF2" }} />

        {/* Performance section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Performance</span>
            <div className="flex items-center gap-0.5">
              {(["today", "week", "month"] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-5 text-[10px] px-2 rounded-full",
                    timeRange === range
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                  onClick={() => onTimeRangeChange(range)}
                >
                  {TIME_LABELS[range]}
                </Button>
              ))}
            </div>
          </div>

          {modules.map((mod) => (
            <div key={mod.name} className="space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-foreground">{mod.name}</span>
                <span className="text-[10px] text-muted-foreground">{mod.stat}</span>
              </div>
              <div className="relative h-1.5 w-full rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${mod.percent}%`,
                    background: "linear-gradient(90deg, #14B8A6 0%, #0EA5E9 100%)",
                  }}
                />
              </div>
            </div>
          ))}

          {/* Overall score */}
          <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid #E5EAF2" }}>
            <span className="text-xs font-semibold text-foreground">Overall Progress</span>
            <span className="text-xs font-bold text-primary">{overallScore}%</span>
          </div>
        </div>

        {/* View My Journey CTA */}
        <Button
          className="w-full text-primary-foreground border-0 hover:brightness-110 transition-all"
          size="default"
          style={{
            borderRadius: "14px",
            background: "linear-gradient(90deg, #0EA5E9 0%, #2563EB 100%)",
            boxShadow: "0px 8px 20px rgba(37, 99, 235, 0.25)",
          }}
        >
          View My Journey
        </Button>

      </CardContent>
    </Card>
  );
}
