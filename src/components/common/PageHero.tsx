import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Play, Pause, Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type MediaType = "image" | "video" | null;

interface PageHeroProps {
  storageKey: string;
  typeKey: string;
  badge?: string;
  title: string;
  subtitle?: string;
}

// Derive page type from storage key
function getPageTypeFromStorageKey(storageKey: string): string {
  if (storageKey.includes("diary")) return "diary";
  if (storageKey.includes("emotion")) return "emotions";
  if (storageKey.includes("journal")) return "journal";
  if (storageKey.includes("manifest")) return "manifest";
  if (storageKey.includes("notes")) return "notes";
  if (storageKey.includes("tasks")) return "tasks";
  if (storageKey.includes("tracker") || storageKey.includes("habit")) return "trackers";
  return "diary";
}

export const PAGE_HERO_TEXT = {
  diary: {
    badge: "YOUR PERSONAL SPACE",
    title: "DIARY",
    subtitle: "A curated timeline of your thoughts, tasks, and moments",
  },
  emotions: { badge: "CHECK-IN", title: "EMOTIONS", subtitle: "Understand your patterns and nurture your well-being" },
  trackers: {
    badge: "BUILD CONSISTENCY",
    title: "HABITS",
    subtitle: "Track your progress, celebrate streaks, and stay consistent",
  },
  manifest: {
    badge: "DAILY PRACTICE",
    title: "MANIFEST",
    subtitle: "Create a vision, practice daily, and build evidence",
  },
  journal: { badge: "REFLECT", title: "JOURNAL", subtitle: "Capture your thoughts, one entry at a time" },
  notes: { badge: "LIFE ATLAS", title: "NOTES", subtitle: "Your ideas, organized in one calm, premium view" },
  tasks: { badge: "FOCUS", title: "TASKS", subtitle: "Prioritize what matters and get things done" },
};

export function PageHero({ storageKey, typeKey, badge, title, subtitle }: PageHeroProps) {
  const { user } = useAuth();
  const pageKey = getPageTypeFromStorageKey(storageKey);

  const [mediaSrc, setMediaSrc] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load from database
  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("hero_media")
        .select("media_url, media_type")
        .eq("user_id", user.id)
        .eq("page_key", pageKey)
        .maybeSingle();
      if (data) {
        setMediaSrc(data.media_url);
        setMediaType(data.media_type as MediaType);
      }
      setIsLoading(false);
    })();
  }, [user, pageKey]);

  // Save to database
  const saveToDb = useCallback(async (url: string | null, type: MediaType) => {
    if (!user) return;
    if (url && type) {
      await supabase.from("hero_media").upsert(
        { user_id: user.id, page_key: pageKey, media_url: url, media_type: type },
        { onConflict: "user_id,page_key" }
      );
    } else {
      await supabase.from("hero_media").delete().eq("user_id", user.id).eq("page_key", pageKey);
    }
  }, [user, pageKey]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 50 * 1024 * 1024) { toast.error("File too large. Max 50MB."); return; }

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/hero-${pageKey}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("entry-covers").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("entry-covers").getPublicUrl(fileName);
      const url = data.publicUrl;

      setMediaSrc(url);
      setMediaType(type);
      await saveToDb(url, type);
      setDialogOpen(false);
      toast.success(`${type === "image" ? "Image" : "Video"} uploaded!`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
  };

  const handleRemove = async () => {
    setMediaSrc(null);
    setMediaType(null);
    await saveToDb(null, null);
    setDialogOpen(false);
    toast.success("Hero media removed");
  };


  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause(); else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const textOverlay = (
    <div className="absolute bottom-0 left-0 z-10 p-4 sm:p-8 lg:p-12">
      {badge && <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-foreground/70 mb-2 sm:mb-3">{badge}</p>}
      <h1 className="text-2xl sm:text-4xl lg:text-6xl font-light uppercase tracking-[0.15em] text-foreground mb-1 sm:mb-2">{title}</h1>
      {subtitle && <p className="text-xs sm:text-sm font-light tracking-wider text-foreground/70 max-w-xs sm:max-w-md">{subtitle}</p>}
    </div>
  );

  const editDialog = (hovering: boolean = false) => (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-[4.5rem] right-4 z-20 bg-background/20 hover:bg-background/40 backdrop-blur-sm transition-opacity duration-300 ${
            hovering ? (isHovering ? "opacity-100" : "opacity-0") : ""
          }`}
        >
          <Camera className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-wider font-light">HERO MEDIA</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "image")} />
          <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, "video")} />
          <Button variant="outline" className="w-full justify-start uppercase tracking-wider text-xs" onClick={() => imageInputRef.current?.click()}>UPLOAD IMAGE</Button>
          <Button variant="outline" className="w-full justify-start uppercase tracking-wider text-xs" onClick={() => videoInputRef.current?.click()}>UPLOAD VIDEO</Button>
          {mediaSrc && (
            <Button variant="ghost" className="w-full justify-start text-destructive uppercase tracking-wider text-xs" onClick={handleRemove}>REMOVE MEDIA</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  if (isLoading) {
    return (
      <div className="relative w-full h-[calc(30vh+2.8rem)] sm:h-[calc(40vh+2.8rem)] bg-foreground/5 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!mediaSrc) {
    return (
      <div className="relative w-full h-[calc(30vh+2.8rem)] sm:h-[calc(40vh+2.8rem)] bg-foreground/5 flex items-end justify-start overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        {textOverlay}
        {editDialog(false)}
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-[calc(30vh+2.8rem)] sm:h-[calc(40vh+2.8rem)] overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {mediaType === "video" ? (
        <>
          <video ref={videoRef} src={mediaSrc} autoPlay loop muted={isMuted} playsInline className="w-full h-full object-cover object-center" />
          <div className={`absolute bottom-4 right-4 z-20 flex gap-2 transition-opacity duration-300 ${isHovering ? "opacity-100" : "opacity-0"}`}>
            <Button variant="ghost" size="icon" className="bg-background/20 hover:bg-background/40 backdrop-blur-sm" onClick={togglePlay}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="bg-background/20 hover:bg-background/40 backdrop-blur-sm" onClick={toggleMute}>
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        </>
      ) : (
        <img src={mediaSrc} alt={`${title} hero`} className="w-full h-full object-cover object-center" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      {textOverlay}
      {editDialog(true)}
    </div>
  );
}
