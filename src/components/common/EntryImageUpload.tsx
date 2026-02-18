import { useState, useRef } from "react";
import { Camera, Upload, Loader2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getPresetImage, getAllPresetImages, type PresetImageType } from "@/lib/presetImages";
import { cn } from "@/lib/utils";

interface EntryImageUploadProps {
  currentImageUrl: string | null;
  presetType: PresetImageType;
  category: string;
  onImageChange: (url: string) => void;
  className?: string;
}

export function EntryImageUpload({
  currentImageUrl,
  presetType,
  category,
  onImageChange,
  className,
}: EntryImageUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const displayImage = currentImageUrl || getPresetImage(presetType, category);
  const presets = getAllPresetImages(presetType);

  const handlePresetSelect = (url: string) => {
    setSelectedPreset(url);
  };

  const handlePresetConfirm = () => {
    if (selectedPreset) {
      onImageChange(selectedPreset);
      setIsOpen(false);
      setSelectedPreset(null);
      toast({ title: "Image updated" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("entry-covers")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("entry-covers")
        .getPublicUrl(fileName);

      onImageChange(publicUrl);
      setIsOpen(false);
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Failed to upload image", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "relative group cursor-pointer overflow-hidden",
          className
        )}
        onClick={() => setIsOpen(true)}
      >
        <img
          src={displayImage}
          alt=""
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Camera className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Change Cover Image</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="presets" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="presets">Presets</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="presets" className="mt-4">
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-auto">
                {presets.map((preset) => (
                  <button
                    key={preset.category}
                    className={cn(
                      "relative aspect-video rounded-lg overflow-hidden border-2 transition-all",
                      selectedPreset === preset.url
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-border"
                    )}
                    onClick={() => handlePresetSelect(preset.url)}
                  >
                    <img
                      src={preset.url}
                      alt={preset.category}
                      className="w-full h-full object-cover"
                    />
                    {selectedPreset === preset.url && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1 text-[10px] text-white bg-black/50 px-1.5 py-0.5 rounded capitalize">
                      {preset.category}
                    </span>
                  </button>
                ))}
              </div>
              <Button
                onClick={handlePresetConfirm}
                disabled={!selectedPreset}
                className="w-full mt-4"
              >
                Use Selected
              </Button>
            </TabsContent>

            <TabsContent value="upload" className="mt-4">
              <div
                className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
