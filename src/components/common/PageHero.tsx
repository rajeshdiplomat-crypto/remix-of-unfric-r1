import { useState, useRef, useEffect } from "react";
import { Camera, Play, Pause, Volume2, VolumeX, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

type MediaType = "image" | "video" | null;

interface PageHeroProps {
  storageKey: string;
  typeKey: string;
  badge?: string;
  title: string;
  subtitle?: string;
}

function loadHeroMedia(storageKey: string, typeKey: string): { src: string | null; type: MediaType } {
  const src = localStorage.getItem(storageKey);
  const type = localStorage.getItem(typeKey) as MediaType;
  return { src, type };
}

function saveHeroMedia(storageKey: string, typeKey: string, src: string | null, type: MediaType) {
  try {
    if (src && type) {
      // Only store URLs (not base64 data) to prevent quota issues
      if (src.startsWith("http")) {
        localStorage.setItem(storageKey, src);
        localStorage.setItem(typeKey, type);
      } else {
        // For base64 data, don't store - it exceeds localStorage quota
        console.warn("Skipping localStorage save for large base64 media - use URL instead");
      }
    } else {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(typeKey);
    }
  } catch (e) {
    console.warn("Could not save hero media to localStorage - quota exceeded");
  }
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
  const [mediaSrc, setMediaSrc] = useState<string | null>(() => loadHeroMedia(storageKey, typeKey).src);
  const [mediaType, setMediaType] = useState<MediaType>(() => loadHeroMedia(storageKey, typeKey).type);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reload media when storage keys change
  useEffect(() => {
    const loaded = loadHeroMedia(storageKey, typeKey);
    setMediaSrc(loaded.src);
    setMediaType(loaded.type);
  }, [storageKey, typeKey]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large. Max 50MB.");
      return;
    }

    // Create object URL for immediate display (memory-only, no storage issues)
    const objectUrl = URL.createObjectURL(file);
    setMediaSrc(objectUrl);
    setMediaType(type);
    setDialogOpen(false);

    // Note: Object URLs are session-only and will be lost on page refresh
    // For persistence, the AI-generated images (which return URLs) are recommended
    toast.success(
      `${type === "image" ? "Image" : "Video"} added! Note: Upload will reset on refresh. Use AI generation for persistent images.`,
    );
  };

  const handleRemove = () => {
    setMediaSrc(null);
    setMediaType(null);
    saveHeroMedia(storageKey, typeKey, null, null);
    setDialogOpen(false);
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const pageType = getPageTypeFromStorageKey(storageKey);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-hero-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ pageType }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again later.");
          return;
        }
        if (response.status === 402) {
          toast.error("AI credits exhausted. Please add credits to continue.");
          return;
        }
        throw new Error(errorData.error || "Failed to generate image");
      }

      const data = await response.json();

      if (data.imageUrl) {
        setMediaSrc(data.imageUrl);
        setMediaType("image");
        saveHeroMedia(storageKey, typeKey, data.imageUrl, "image");
        setDialogOpen(false);
        toast.success("AI hero image generated!");
      } else {
        throw new Error("No image received");
      }
    } catch (error) {
      console.error("Error generating AI image:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
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
    <div className="absolute bottom-0 left-0 z-10 p-8 lg:p-12">
      {badge && <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/70 mb-3">{badge}</p>}
      <h1 className="text-4xl lg:text-6xl font-light uppercase tracking-[0.15em] text-foreground mb-2">{title}</h1>
      {subtitle && <p className="text-sm font-light tracking-wider text-foreground/70 max-w-md">{subtitle}</p>}
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
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e, "image")}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e, "video")}
          />
          <Button
            variant="default"
            className="w-full justify-start uppercase tracking-wider text-xs gap-2"
            onClick={handleGenerateAI}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? "GENERATING..." : "GENERATE AI IMAGE"}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start uppercase tracking-wider text-xs"
            onClick={() => imageInputRef.current?.click()}
          >
            UPLOAD IMAGE
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start uppercase tracking-wider text-xs"
            onClick={() => videoInputRef.current?.click()}
          >
            UPLOAD VIDEO
          </Button>
          {mediaSrc && (
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive uppercase tracking-wider text-xs"
              onClick={handleRemove}
            >
              REMOVE MEDIA
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  // Default placeholder with Zara-style editorial aesthetic
  if (!mediaSrc) {
    return (
      <div className="relative w-full h-[calc(40vh+2.8rem)] bg-foreground/5 flex items-end justify-start overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        {textOverlay}
        {editDialog(false)}
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-[calc(40vh+2.8rem)] overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {mediaType === "video" ? (
        <>
          <video
            ref={videoRef}
            src={mediaSrc}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Video controls */}
          <div
            className={`absolute bottom-4 right-4 z-20 flex gap-2 transition-opacity duration-300 ${
              isHovering ? "opacity-100" : "opacity-0"
            }`}
          >
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/20 hover:bg-background/40 backdrop-blur-sm"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/20 hover:bg-background/40 backdrop-blur-sm"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        </>
      ) : (
        <img src={mediaSrc} alt={`${title} hero`} className="w-full h-full object-cover" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

      {/* Text overlay */}
      {textOverlay}

      {/* Edit button */}
      {editDialog(true)}
    </div>
  );
}
