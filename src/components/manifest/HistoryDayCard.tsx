import { useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { Check, Circle, ChevronDown, ChevronUp, Eye, Image as ImageIcon, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface HistoryDayData {
  date: string;
  practiced: boolean;
  alignment: number;
  acted: boolean;
  visualization_completed: boolean;
  proofs: Array<{
    id: string;
    text?: string;
    image_url?: string;
    created_at: string;
  }>;
  growth_note?: string;
  gratitude?: string;
  custom_act_as_if?: string;
}

interface HistoryDayCardProps {
  data: HistoryDayData;
  onImageClick: (imageUrl: string) => void;
  onUseAsMicroAction?: (text: string) => void;
}

export function HistoryDayCard({ data, onImageClick, onUseAsMicroAction }: HistoryDayCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const date = new Date(data.date);
  
  const getDateLabel = () => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEE, MMM d");
  };

  const hasProofText = data.proofs.some(p => p.text);
  const hasProofImage = data.proofs.some(p => p.image_url);
  const proofExcerpt = data.proofs.find(p => p.text)?.text?.slice(0, 50);

  const handleCelebrate = () => {
    if (confirm("Share this proof as a celebration? (This will be visible to others)")) {
      toast.success("Proof shared! Celebrate your progress!");
      // Analytics: proof_shared
    }
  };

  const handleUseAsMicroAction = (text: string) => {
    if (onUseAsMicroAction) {
      onUseAsMicroAction(text);
      toast.success("Copied to Act-as-If input");
    }
  };

  return (
    <Card className={cn(
      "border-border/50 transition-colors",
      data.practiced ? "bg-primary/5" : "bg-muted/30"
    )}>
      <CardContent className="p-3">
        {/* Collapsed Row */}
        <button
          className="w-full flex items-center gap-3 text-left"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          {/* Status Icon */}
          <div className={cn(
            "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
            data.practiced ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {data.practiced ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Circle className="h-3.5 w-3.5" />
            )}
          </div>

          {/* Date & Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{getDateLabel()}</span>
              
              {data.practiced && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {data.alignment}/10
                </Badge>
              )}
              
              {/* Micro icons */}
              <div className="flex items-center gap-1 text-muted-foreground">
                {data.visualization_completed && (
                  <span className="text-[10px]" title="Visualization completed">Viz ✓</span>
                )}
                {data.acted && (
                  <span className="text-[10px]" title="Action completed">Act ✓</span>
                )}
              </div>
            </div>
            
            {/* Proof excerpt */}
            {(hasProofText || hasProofImage) && (
              <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                {hasProofImage && <ImageIcon className="h-3 w-3" />}
                {proofExcerpt && (
                  <span className="truncate">{proofExcerpt}{proofExcerpt.length >= 50 && "..."}</span>
                )}
              </div>
            )}
          </div>

          {/* Expand Chevron */}
          <div className="flex-shrink-0 text-muted-foreground">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
            {/* Proofs */}
            {data.proofs.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Proof(s)</span>
                {data.proofs.map((proof) => (
                  <div key={proof.id} className="space-y-1">
                    {proof.text && (
                      <p className="text-sm text-foreground bg-background/50 p-2 rounded-md">
                        {proof.text}
                      </p>
                    )}
                    {proof.image_url && (
                      <button
                        onClick={() => onImageClick(proof.image_url!)}
                        className="block w-full"
                        aria-label="View proof image"
                      >
                        <img
                          src={proof.image_url}
                          alt="Proof"
                          className="w-full h-24 object-cover rounded-md border border-border/50 hover:opacity-80 transition-opacity"
                          loading="lazy"
                        />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Growth Note */}
            {data.growth_note && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Growth Note</span>
                <p className="text-sm text-foreground mt-1">{data.growth_note}</p>
              </div>
            )}

            {/* Gratitude (collapsed by default - just show if present) */}
            {data.gratitude && (
              <details className="text-sm">
                <summary className="text-xs font-medium text-muted-foreground cursor-pointer">
                  Gratitude
                </summary>
                <p className="text-foreground mt-1 pl-2">{data.gratitude}</p>
              </details>
            )}

            {/* Custom Act-as-If */}
            {data.custom_act_as_if && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Custom Action</span>
                <p className="text-sm text-foreground mt-1">{data.custom_act_as_if}</p>
              </div>
            )}

            {/* Timestamp */}
            <p className="text-[10px] text-muted-foreground">
              Saved at {format(date, "HH:mm")} — Check-in
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleCelebrate}
              >
                <Share2 className="h-3 w-3 mr-1" />
                Celebrate
              </Button>
              {hasProofText && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleUseAsMicroAction(data.proofs.find(p => p.text)?.text || "")}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Use as micro-action
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
