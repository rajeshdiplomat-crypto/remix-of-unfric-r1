import { useState, useRef } from "react";
import { Camera, X, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const STORAGE_KEY = "diary-hero-src";
const TYPE_KEY = "diary-hero-type";

type MediaType = "image" | "video" | null;

function loadHeroMedia(): { src: string | null; type: MediaType } {
  const src = localStorage.getItem(STORAGE_KEY);
  const type = localStorage.getItem(TYPE_KEY) as MediaType;
  return { src, type };
}

function saveHeroMedia(src: string | null, type: MediaType) {
  if (src && type) {
    localStorage.setItem(STORAGE_KEY, src);
    localStorage.setItem(TYPE_KEY, type);
  } else {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TYPE_KEY);
  }
}

export function DiaryHero() {
  const [mediaSrc, setMediaSrc] = useState<string | null>(() => loadHeroMedia().src);
  const [mediaType, setMediaType] = useState<MediaType>(() => loadHeroMedia().type);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert("File too large. Max 50MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setMediaSrc(result);
      setMediaType(type);
      saveHeroMedia(result, type);
      setDialogOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setMediaSrc(null);
    setMediaType(null);
    saveHeroMedia(null, null);
    setDialogOpen(false);
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

  // Default placeholder with Zara-style editorial aesthetic
  const defaultHero = (
    <div className="relative w-full h-[50vh] bg-foreground/5 flex items-end justify-start overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      <div className="relative z-10 p-8 lg:p-12">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
          YOUR PERSONAL SPACE
        </p>
        <h1 className="text-4xl lg:text-6xl font-light uppercase tracking-[0.15em] text-foreground mb-2">
          DIARY
        </h1>
        <p className="text-sm font-light tracking-wider text-muted-foreground max-w-md">
          A curated timeline of your thoughts, tasks, and moments
        </p>
      </div>
      
      {/* Edit button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-20 bg-background/20 hover:bg-background/40 backdrop-blur-sm"
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
    </div>
  );

  if (!mediaSrc) return defaultHero;

  return (
    <div
      className="relative w-full h-[50vh] overflow-hidden"
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
            className="w-full h-full object-cover grayscale"
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
        <img
          src={mediaSrc}
          alt="Diary hero"
          className="w-full h-full object-cover grayscale"
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

      {/* Text overlay */}
      <div className="absolute bottom-0 left-0 z-10 p-8 lg:p-12">
        <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/70 mb-3">
          YOUR PERSONAL SPACE
        </p>
        <h1 className="text-4xl lg:text-6xl font-light uppercase tracking-[0.15em] text-foreground mb-2">
          DIARY
        </h1>
        <p className="text-sm font-light tracking-wider text-foreground/70 max-w-md">
          A curated timeline of your thoughts, tasks, and moments
        </p>
      </div>

      {/* Edit button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-4 right-4 z-20 bg-background/20 hover:bg-background/40 backdrop-blur-sm transition-opacity duration-300 ${
              isHovering ? "opacity-100" : "opacity-0"
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
    </div>
  );
}
