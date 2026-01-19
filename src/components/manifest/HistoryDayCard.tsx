import { useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { Check, Circle, ChevronDown, ChevronUp, Eye, Image as ImageIcon, Copy, Share2, Zap, Camera, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface HistoryDayData {
  date: string;
  practiced: boolean;
  alignment: number;
  visualizations: Array<{
    id: string;
    duration: number;
    created_at: string;
  }>;
  acts: Array<{
    id: string;
    text: string;
    created_at: string;
  }>;
  proofs: Array<{
    id: string;
    text?: string;
    image_url?: string;
    created_at: string;
  }>;
  growth_note?: string;
  gratitude?: string;
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

  const hasProofText = data.proofs.some((p) => p.text);
  const hasProofImage = data.proofs.some((p) => p.image_url);
  const totalVizMinutes = data.visualizations.reduce((sum, v) => sum + v.duration, 0);

  const handleCelebrate = () => {
    toast.success("Celebrating your progress! 🎉");
  };

  const handleUseAsMicroAction = (text: string) => {
    if (onUseAsMicroAction) {
      onUseAsMicroAction(text);
      toast.success("Copied to Act-as-If input");
    }
  };

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      data.practiced 
        ? "border-teal-200 bg-gradient-to-r from-teal-50/50 to-cyan-50/50 dark:from-teal-900/10 dark:to-cyan-900/10 dark:border-teal-800" 
        : "border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/50"
    )}>
      {/* Collapsed Row */}
      <button
        className="w-full flex items-center gap-3 p-3 text-left"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        {/* Status Icon */}
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            data.practiced ? "bg-teal-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400",
          )}
        >
          {data.practiced ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
        </div>

        {/* Date & Quick Stats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-foreground">{getDateLabel()}</span>
            {data.practiced && data.alignment > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                {data.alignment}/10
              </Badge>
            )}
          </div>

          {/* Quick stats row */}
          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
            {data.visualizations.length > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3 text-purple-500" />
                {totalVizMinutes}min
              </span>
            )}
            {data.acts.length > 0 && (
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-orange-500" />
                {data.acts.length}
              </span>
            )}
            {data.proofs.length > 0 && (
              <span className="flex items-center gap-1">
                <Camera className="h-3 w-3 text-cyan-500" />
                {data.proofs.length}
              </span>
            )}
            {data.growth_note && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3 text-green-500" />
              </span>
            )}
          </div>
        </div>

        {/* Image Thumbnails Preview */}
        {hasProofImage && !isExpanded && (
          <div className="flex -space-x-2">
            {data.proofs
              .filter(p => p.image_url)
              .slice(0, 3)
              .map((proof) => (
                <img
                  key={proof.id}
                  src={proof.image_url}
                  alt="Proof"
                  className="w-8 h-8 rounded-lg object-cover border-2 border-white dark:border-slate-800"
                />
              ))}
          </div>
        )}

        {/* Expand Chevron */}
        <div className="flex-shrink-0 text-muted-foreground">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/30">
          {/* Visualizations */}
          {data.visualizations.length > 0 && (
            <div className="pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-xs font-medium text-foreground">
                  Visualization — {data.visualizations.length} session{data.visualizations.length > 1 ? "s" : ""}, {totalVizMinutes} min total
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.visualizations.map((viz) => (
                  <Badge key={viz.id} variant="secondary" className="text-[10px] bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300">
                    {viz.duration}min @ {format(new Date(viz.created_at), "h:mm a")}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Acts */}
          {data.acts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-xs font-medium text-foreground">
                  Actions — {data.acts.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {data.acts.map((act) => (
                  <div
                    key={act.id}
                    className="text-sm text-foreground bg-orange-50/50 dark:bg-orange-900/20 p-2 rounded-lg border border-orange-100 dark:border-orange-900/30"
                  >
                    {act.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proofs */}
          {data.proofs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Camera className="h-3.5 w-3.5 text-cyan-500" />
                <span className="text-xs font-medium text-foreground">
                  Proofs — {data.proofs.length}
                </span>
              </div>
              <div className="space-y-2">
                {data.proofs.map((proof) => (
                  <div key={proof.id} className="bg-cyan-50/50 dark:bg-cyan-900/20 rounded-lg border border-cyan-100 dark:border-cyan-900/30 overflow-hidden">
                    {proof.image_url && (
                      <button
                        onClick={() => onImageClick(proof.image_url!)}
                        className="block w-full"
                        aria-label="View proof image"
                      >
                        <img
                          src={proof.image_url}
                          alt="Proof"
                          className="w-full h-32 object-cover hover:opacity-90 transition-opacity"
                          loading="lazy"
                        />
                      </button>
                    )}
                    {proof.text && (
                      <p className="text-sm text-foreground p-2">{proof.text}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Growth Note */}
          {data.growth_note && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs font-medium text-foreground">Growth Note</span>
              </div>
              <p className="text-sm text-foreground bg-green-50/50 dark:bg-green-900/20 p-2 rounded-lg border border-green-100 dark:border-green-900/30">
                {data.growth_note}
              </p>
            </div>
          )}

          {/* Gratitude */}
          {data.gratitude && (
            <details className="text-sm">
              <summary className="text-xs font-medium text-muted-foreground cursor-pointer">Gratitude</summary>
              <p className="text-foreground mt-1 pl-2">{data.gratitude}</p>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" size="sm" className="text-xs rounded-lg h-8" onClick={handleCelebrate}>
              <Share2 className="h-3 w-3 mr-1" />
              Celebrate
            </Button>
            {hasProofText && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs rounded-lg h-8"
                onClick={() => handleUseAsMicroAction(data.proofs.find((p) => p.text)?.text || "")}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy proof
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
