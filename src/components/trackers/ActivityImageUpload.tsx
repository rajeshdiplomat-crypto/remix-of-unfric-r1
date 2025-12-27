import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

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

  const handleRemove = () => {
    onImageChange(null);
  };

  if (imageUrl) {
    return (
      <div className={cn("relative group rounded-lg overflow-hidden", compact ? "h-20" : "h-32")}>
        <img 
          src={imageUrl} 
          alt="Activity cover" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button 
            type="button"
            size="sm" 
            variant="secondary"
            onClick={() => inputRef.current?.click()}
          >
            Replace
          </Button>
          <Button 
            type="button"
            size="sm" 
            variant="destructive"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
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
        "border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer",
        isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
        compact ? "p-3" : "p-4"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <Upload className={cn("text-muted-foreground", compact ? "h-5 w-5" : "h-6 w-6")} />
      <p className="text-xs text-muted-foreground text-center">
        Drag & drop or <span className="text-primary font-medium">Browse</span>
      </p>
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

// Helper to save/load images from localStorage by activity ID
export function saveActivityImage(activityId: string, imageUrl: string | null) {
  const stored = localStorage.getItem(STORAGE_KEY);
  const images: Record<string, string> = stored ? JSON.parse(stored) : {};
  
  if (imageUrl) {
    images[activityId] = imageUrl;
  } else {
    delete images[activityId];
  }
  
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
