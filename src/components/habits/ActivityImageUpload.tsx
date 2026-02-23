import { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ActivityImageUploadProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
  compact?: boolean;
}

// Storage key kept for backward compat migration only

async function uploadToStorage(file: File, userId: string): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucketName", "entry-covers");

  const { data, error } = await supabase.functions.invoke("upload-image", {
    body: formData,
  });

  if (error || !data?.success) {
    console.error("Upload error:", error || data?.error);
    return null;
  }

  return data.url;
}

export function ActivityImageUpload({ imageUrl, onImageChange, compact = false }: ActivityImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    setIsUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        // Fallback to base64 for unauthenticated users
        const reader = new FileReader();
        reader.onload = (e) => onImageChange(e.target?.result as string);
        reader.readAsDataURL(file);
        return;
      }

      const publicUrl = await uploadToStorage(file, userId);
      if (publicUrl) {
        onImageChange(publicUrl);
      } else {
        toast({ title: "Upload failed", description: "Could not upload image. Please try again.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
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
            disabled={isUploading}
          >
            <RefreshCcw className="h-3 w-3 mr-1" />
            {isUploading ? "Uploading…" : "Change"}
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
            disabled={isUploading}
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
        isUploading && "opacity-60 pointer-events-none",
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
          <p className="text-sm font-medium text-foreground leading-tight">
            {isUploading ? "Uploading…" : "Add cover image"}
          </p>
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

// Save activity image URL to DB (source of truth)
export async function saveActivityImageToDb(habitId: string, imageUrl: string | null) {
  await supabase.functions.invoke("manage-habits", {
    body: {
      action: "upsert_habit",
      habit: { id: habitId, cover_image_url: imageUrl }
    }
  });
}

// Legacy helpers removed — habits.cover_image_url in DB is the source of truth
// These no-ops kept for backward compatibility with any remaining callers
export function saveActivityImage(_activityId: string, _imageUrl: string | null) {
  // No-op: use saveActivityImageToDb instead
}

export function loadActivityImage(_activityId: string): string | null {
  return null;
}

export function loadAllActivityImages(): Record<string, string> {
  return {};
}
