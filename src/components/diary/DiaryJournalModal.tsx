import { useState, useRef } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ImagePlus, X, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiaryJournalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DiaryJournalModal({ open, onOpenChange, onSuccess }: DiaryJournalModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [content, setContent] = useState("");
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({ title: "Invalid file type", description: "Please upload an image file.", variant: "destructive" });
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Image must be under 5MB.", variant: "destructive" });
        continue;
      }

      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("entry-covers")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("entry-covers")
          .getPublicUrl(fileName);

        newImages.push(urlData.publicUrl);
      } catch (error) {
        console.error("Upload error:", error);
        toast({ title: "Upload failed", description: "Could not upload image.", variant: "destructive" });
      }
    }

    setAttachedImages((prev) => [...prev, ...newImages]);
    setIsUploading(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user || !content.trim()) {
      toast({ title: "Please write something", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const dateStr = format(new Date(), "yyyy-MM-dd");

    try {
      // Create journal entry with the content
      const { data: newEntry, error: entryError } = await supabase
        .from("journal_entries")
        .insert({
          user_id: user.id,
          entry_date: dateStr,
          daily_feeling: content.substring(0, 100), // First 100 chars as title
          text_formatting: JSON.stringify({
            type: "doc",
            content: [
              { type: "paragraph", attrs: { textAlign: "left" }, content: [{ type: "text", text: content }] },
            ],
          }),
          images_data: attachedImages.length > 0 ? attachedImages : null,
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Create a journal answer for the main content
      if (newEntry) {
        await supabase.from("journal_answers").insert({
          journal_entry_id: newEntry.id,
          question_id: "quick_entry",
          answer_text: content,
        });

        // Create feed event for the new entry
        await supabase.from("feed_events").insert({
          user_id: user.id,
          type: "journal_question",
          source_module: "journal",
          source_id: newEntry.id,
          title: "Quick Journal Entry",
          summary: content,
          content_preview: content,
          media: attachedImages.length > 0 ? attachedImages : null,
          metadata: {
            journal_date: dateStr,
            entry_id: newEntry.id,
            question_id: "quick_entry",
            question_label: "Quick Journal Entry",
            answer_content: content,
          },
        });
      }

      toast({ title: "Entry saved!", description: "Your journal entry has been posted." });
      
      // Reset form
      setContent("");
      setAttachedImages([]);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "Error", description: "Failed to save entry.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">New Journal Entry</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Text input */}
          <div>
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none border-border/50 focus:border-primary"
              autoFocus
            />
          </div>

          {/* Image preview grid */}
          {attachedImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {attachedImages.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img
                    src={url}
                    alt={`Attached ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div className="flex items-center gap-2">
              {/* Image upload button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                <span className="text-sm">Add Photo</span>
              </Button>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Post
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
