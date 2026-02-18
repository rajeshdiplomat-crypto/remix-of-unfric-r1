import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "@/lib/utils";

export function OfflineBadge() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1 rounded-full",
        "bg-background/20 backdrop-blur-xl",
        "border border-foreground/[0.08]",
        "shadow-[inset_0_0.5px_0_0_hsl(var(--foreground)/0.06),_0_2px_8px_-2px_hsl(var(--foreground)/0.1)]",
        "text-muted-foreground text-[10px] tracking-widest uppercase font-light",
        "animate-in fade-in slide-in-from-top-2 duration-300"
      )}
    >
      <WifiOff className="h-3 w-3" />
      <span>Offline</span>
    </div>
  );
}
