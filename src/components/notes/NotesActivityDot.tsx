import { useMemo } from "react";

interface NotesActivityDotProps {
  updatedAt: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function NotesActivityDot({ updatedAt, size = "md", className = "" }: NotesActivityDotProps) {
  const dotInfo = useMemo(() => {
    const now = new Date();
    const updated = new Date(updatedAt);
    const diffMs = now.getTime() - updated.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    
    // Only show green dot for activity within 2 minutes
    if (diffMinutes < 2) {
      return { show: true, color: "bg-emerald-500" };
    }
    
    // No dot for older activity
    return { show: false, color: "" };
  }, [updatedAt]);

  if (!dotInfo.show) return null;

  const sizeClasses = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
  };

  return (
    <div 
      className={`rounded-full ${sizeClasses[size]} ${dotInfo.color} ${className}`}
      title={`Updated ${new Date(updatedAt).toLocaleString()}`}
    />
  );
}

// Helper to get most recent update time for a collection
export function getMostRecentUpdate(items: Array<{ updatedAt: string }>): string | null {
  if (items.length === 0) return null;
  return items.reduce((latest, item) => 
    new Date(item.updatedAt) > new Date(latest.updatedAt) ? item : latest
  ).updatedAt;
}
