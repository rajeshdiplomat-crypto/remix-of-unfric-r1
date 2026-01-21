import { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActivityImageUploadProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
  compact?: boolean;
}

const STORAGE_KEY = "activity-images";

export function ActivityImageUpload({ imageUrl, onImageChange, compact = false }: ActivityImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onImageChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  if (imageUrl) {
    // In compact mode, don't show the landscape preview - just show controls
    if (compact) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-600 dark:text-green-400">✓ Image added</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => inputRef.current?.click()}
          >
            <RefreshCcw className="h-3 w-3 mr-1" />
            Change
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs text-red-500 hover:text-red-600"
            onClick={() => onImageChange(null)}
          >
            <X className="h-3 w-3 mr-1" />
            Remove
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      );
    }

    return (
      <div
        className={cn("relative overflow-hidden rounded-xl border border-border/60 bg-card", compact ? "h-20" : "h-32")}
      >
        <img src={imageUrl} alt="Activity cover" className="h-full w-full object-cover" />

        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-7 w-7 rounded-lg bg-black/35 text-white hover:bg-black/50"
            onClick={() => inputRef.current?.click()}
          >
            <RefreshCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-7 w-7 rounded-lg bg-black/35 text-white hover:bg-black/50"
            onClick={() => onImageChange(null)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative cursor-pointer rounded-xl border border-border/60 bg-card/60 p-4 transition-colors",
        "hover:bg-card",
        isDragging && "ring-2 ring-primary/30",
        compact ? "p-3" : "p-4",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-muted/40",
            "group-hover:bg-muted/60",
          )}
        >
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground leading-tight">Add cover image</p>
          <p className="text-xs text-muted-foreground">
            Drag & drop or <span className="text-foreground">browse</span>
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Upload className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}

// Helpers: save/load images from localStorage by activity ID
export function saveActivityImage(activityId: string, imageUrl: string | null) {
  const stored = localStorage.getItem(STORAGE_KEY);
  const images: Record<string, string> = stored ? JSON.parse(stored) : {};

  if (imageUrl) images[activityId] = imageUrl;
  else delete images[activityId];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
}

export function loadActivityImage(activityId: string): string | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  const images: Record<string, string> = JSON.parse(stored);
  return images[activityId] || null;
}

export function loadAllActivityImages(): Record<string, string> {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
}
