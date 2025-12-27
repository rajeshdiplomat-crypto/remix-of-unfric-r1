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
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Very recent (< 30 minutes) = green
    if (diffHours < 0.5) {
      return { show: true, color: "bg-emerald-500" };
    }
    
    // Recent (< 2 hours) = yellow/amber
    if (diffHours < 2) {
      return { show: true, color: "bg-amber-400" };
    }
    
    // Older = no dot
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
