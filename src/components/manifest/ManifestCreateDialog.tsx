import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Target, Heart, Home, DollarSign, ImagePlus, X, CalendarIcon, 
  Upload, Sparkles, GripVertical 
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "wealth", label: "Wealth", icon: DollarSign, color: "hsl(45, 93%, 47%)" },
  { id: "health", label: "Health", icon: Heart, color: "hsl(142, 71%, 45%)" },
  { id: "love", label: "Love", icon: Home, color: "hsl(340, 82%, 52%)" },
  { id: "growth", label: "Growth", icon: Target, color: "hsl(262, 83%, 58%)" },
];

interface ManifestCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    title: string;
    description: string;
    category: string;
    affirmations: string[];
    feeling: string;
    targetDate: Date | null;
    coverImage: string | null;
    visualizationImages: string[];
  }) => void;
  editGoal?: {
    id: string;
    title: string;
    description: string | null;
    category?: string;
    affirmations: string[];
    feeling_when_achieved: string | null;
    target_date?: string;
    cover_image?: string;
    visualization_images?: string[];
  } | null;
  saving?: boolean;
}

export function ManifestCreateDialog({
  open,
  onOpenChange,
  onSave,
  editGoal,
  saving,
}: ManifestCreateDialogProps) {
  const [title, setTitle] = useState(editGoal?.title || "");
  const [description, setDescription] = useState(editGoal?.description || "");
  const [category, setCategory] = useState(editGoal?.category || "wealth");
  const [affirmations, setAffirmations] = useState(editGoal?.affirmations?.join("\n") || "");
  const [feeling, setFeeling] = useState(editGoal?.feeling_when_achieved || "");
  const [targetDate, setTargetDate] = useState<Date | undefined>(
    editGoal?.target_date ? new Date(editGoal.target_date) : undefined
  );
  const [coverImage, setCoverImage] = useState<string | null>(editGoal?.cover_image || null);
  const [visualizationImages, setVisualizationImages] = useState<string[]>(
    editGoal?.visualization_images || []
  );

  const coverInputRef = useRef<HTMLInputElement>(null);
  const vizInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File too large. Max 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCoverImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVizUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Max 5MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setVisualizationImages((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeVizImage = (index: number) => {
    setVisualizationImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onSave({
      title,
      description,
      category,
      affirmations: affirmations.split("\n").map((a) => a.trim()).filter(Boolean),
      feeling,
      targetDate: targetDate || null,
      coverImage,
      visualizationImages,
    });
  };

  const selectedCat = CATEGORIES.find((c) => c.id === category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {editGoal ? "Edit Goal" : "Create Manifestation Goal"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Cover Image */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Cover Image</Label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
              {coverImage ? (
                <div className="relative h-40 rounded-xl overflow-hidden group">
                  <img
                    src={coverImage}
                    alt="Cover"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => coverInputRef.current?.click()}
                    >
                      Change
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setCoverImage(null)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className="h-40 w-full border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload cover image
                  </span>
                  <span className="text-xs text-muted-foreground">Max 5MB</span>
                </button>
              )}
            </div>

            {/* Goal Name */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Goal Name *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What do you want to manifest?"
                className="text-lg"
              />
            </div>

            {/* Category */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Category</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={category === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategory(cat.id)}
                    className="gap-2"
                    style={{
                      backgroundColor: category === cat.id ? cat.color : undefined,
                      borderColor: category === cat.id ? cat.color : undefined,
                    }}
                  >
                    <cat.icon className="h-4 w-4" />
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Target Date */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Target Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !targetDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {targetDate ? format(targetDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={targetDate}
                    onSelect={setTargetDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Affirmations */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Affirmations (one per line)
              </Label>
              <Textarea
                value={affirmations}
                onChange={(e) => setAffirmations(e.target.value)}
                placeholder="I am worthy of abundance...&#10;I attract success effortlessly...&#10;I am grateful for my achievements..."
                rows={3}
              />
            </div>

            {/* Feeling */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                How will you feel when achieved?
              </Label>
              <Textarea
                value={feeling}
                onChange={(e) => setFeeling(e.target.value)}
                placeholder="Describe the emotions you'll experience..."
                rows={2}
              />
            </div>

            {/* Visualization Script */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Visualization Script (Optional)
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your goal in vivid detail. Where are you? What do you see, hear, feel?"
                rows={4}
              />
            </div>

            {/* Visualization Images */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Visualization Board Images
              </Label>
              <input
                ref={vizInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleVizUpload}
              />
              
              <div className="grid grid-cols-3 gap-3">
                {visualizationImages.map((img, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-lg overflow-hidden group"
                  >
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      onClick={() => removeVizImage(i)}
                      className="absolute top-1 right-1 h-6 w-6 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-destructive-foreground" />
                    </button>
                    <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="h-4 w-4 text-white drop-shadow" />
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={() => vizInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add</span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Add images that represent your goal. Max 5MB each.
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
          >
            {saving ? "Saving..." : editGoal ? "Update Goal" : "Create Goal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
