import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImagePlus, Video, Trash2, Play, Pause, Volume2, VolumeX, Settings2 } from "lucide-react";
import { toast } from "sonner";

interface PageHeroMediaProps {
  storageKey: string;
  typeKey: string;
  title?: string;
  subtitle?: string;
  badge?: string;
}

type MediaType = "image" | "video" | null;

function loadHeroMedia(storageKey: string, typeKey: string): { src: string | null; type: MediaType } {
  const src = localStorage.getItem(storageKey);
  const type = localStorage.getItem(typeKey) as MediaType;
  return { src, type };
}

function saveHeroMedia(storageKey: string, typeKey: string, src: string | null, type: MediaType) {
  if (src && type) {
    localStorage.setItem(storageKey, src);
    localStorage.setItem(typeKey, type);
  } else {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(typeKey);
  }
}

export function PageHeroMedia({ storageKey, typeKey, title, subtitle, badge }: PageHeroMediaProps) {
  const [mediaSrc, setMediaSrc] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const { src, type } = loadHeroMedia(storageKey, typeKey);
    setMediaSrc(src);
    setMediaType(type);
  }, [storageKey, typeKey]);

  // Sync video play state
  useEffect(() => {
    if (mediaType === "video" && videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, mediaType, mediaSrc]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size check (10MB max for localStorage safety)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Please use a file under 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setMediaSrc(base64);
      setMediaType(type);
      saveHeroMedia(storageKey, typeKey, base64, type);
      setDialogOpen(false);
      toast.success(`${type === "image" ? "Image" : "Video"} uploaded!`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setMediaSrc(null);
    setMediaType(null);
    saveHeroMedia(storageKey, typeKey, null, null);
    setDialogOpen(false);
    toast.success("Media removed");
  };

  const togglePlay = () => setIsPlaying((p) => !p);
  const toggleMute = () => {
    setIsMuted((m) => !m);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm group">
      {/* Media Display */}
      <div className="relative h-[280px] sm:h-[320px]">
        {mediaSrc && mediaType === "video" ? (
          <video
            ref={videoRef}
            src={mediaSrc}
            muted={isMuted}
            playsInline
            loop
            autoPlay
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : mediaSrc && mediaType === "image" ? (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${mediaSrc})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted/40 via-muted/20 to-transparent" />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
        <div className="absolute inset-0 ring-1 ring-inset ring-border/20" />

        {/* Settings button (top-right) */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 h-9 w-9 rounded-full bg-background/40 backdrop-blur-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity border border-border/30"
              aria-label="Change hero media"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Hero Media</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "image")}
                className="hidden"
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => handleFileUpload(e, "video")}
                className="hidden"
              />

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={() => imageInputRef.current?.click()}
              >
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                Upload Image
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={() => videoInputRef.current?.click()}
              >
                <Video className="h-5 w-5 text-muted-foreground" />
                Upload Video
              </Button>

              {mediaSrc && (
                <Button
                  variant="destructive"
                  className="w-full justify-start gap-3 h-12"
                  onClick={handleRemove}
                >
                  <Trash2 className="h-5 w-5" />
                  Remove Media
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Video controls (bottom-right) */}
        {mediaType === "video" && mediaSrc && (
          <div className="absolute right-3 bottom-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/40 backdrop-blur-md border border-border/30"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/40 backdrop-blur-md border border-border/30"
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        )}

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <div className="max-w-2xl">
            {badge && (
              <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/30 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-md mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                {badge}
              </div>
            )}
            {title && (
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground leading-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-2 text-sm text-muted-foreground max-w-lg leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hero text constants for easy customization
export const HERO_TEXT = {
  manifest: {
    badge: "Manifest",
    title: "Your vision board, refined.",
    subtitle: "Create a manifestation, practice daily, and build evidence without rushing.",
  },
  tracker: {
    badge: "Trackers",
    title: "Build habits that stick.",
    subtitle: "Track your progress, celebrate streaks, and stay consistent.",
  },
  emotion: {
    badge: "Emotions",
    title: "Check in with yourself.",
    subtitle: "Understand your patterns and nurture your well-being.",
  },
};
