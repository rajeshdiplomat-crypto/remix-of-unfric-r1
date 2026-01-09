import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { MODULE_ICONS, MODULE_LABELS, EMPTY_STATE } from "@/lib/clarityMicrocopy";
import type { LifeProof } from "./types";
import { cn } from "@/lib/utils";

interface LifeProofPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proofs: LifeProof[];
  loading?: boolean;
  children: React.ReactNode;
}

function formatProofDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

export function LifeProofPopover({ 
  open, 
  onOpenChange, 
  proofs, 
  loading,
  children 
}: LifeProofPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="center"
        sideOffset={12}
      >
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">
            Recent moments of clarity
          </h3>
        </div>
        
        <ScrollArea className="max-h-64">
          {loading ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">
                {EMPTY_STATE.loading}
              </p>
            </div>
          ) : proofs.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground italic">
                {EMPTY_STATE.noProofs}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border" role="list">
              {proofs.map((proof) => (
                <li 
                  key={proof.id}
                  className="px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Module icon */}
                    <span 
                      className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-sm"
                      aria-hidden="true"
                    >
                      {MODULE_ICONS[proof.module]}
                    </span>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        {proof.short_text}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatProofDate(proof.created_at)}
                        </span>
                        <span className="text-xs text-muted-foreground/60">
                          •
                        </span>
                        <span className="text-xs text-muted-foreground/80">
                          {MODULE_LABELS[proof.module]}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        
        {proofs.length > 0 && (
          <div className="px-4 py-2 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              Each small choice clears the view
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
