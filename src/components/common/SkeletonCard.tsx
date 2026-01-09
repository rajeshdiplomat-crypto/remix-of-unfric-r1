import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  variant?: "note" | "task" | "feed" | "stat" | "default";
  className?: string;
}

export function SkeletonCard({ variant = "default", className }: SkeletonCardProps) {
  if (variant === "note") {
    return (
      <div className={cn("rounded-xl border border-border/40 bg-card p-4 space-y-3", className)}>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    );
  }

  if (variant === "task") {
    return (
      <div className={cn("rounded-xl border border-border/40 bg-card p-4 space-y-3", className)}>
        <div className="flex items-start gap-3">
          <Skeleton className="h-5 w-5 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-18 rounded-full" />
        </div>
      </div>
    );
  }

  if (variant === "feed") {
    return (
      <div className={cn("rounded-xl border border-border/40 bg-card p-4 space-y-4", className)}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full ml-auto" />
        </div>
      </div>
    );
  }

  if (variant === "stat") {
    return (
      <div className={cn("rounded-xl border border-border/40 bg-card p-4", className)}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-10" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>
    );
  }

  // Default card skeleton
  return (
    <div className={cn("rounded-xl border border-border/40 bg-card p-4 space-y-3", className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

interface SkeletonGridProps {
  count?: number;
  variant?: SkeletonCardProps["variant"];
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

export function SkeletonGrid({ count = 6, variant = "default", className, columns = 3 }: SkeletonGridProps) {
  const colClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }[columns];

  return (
    <div className={cn("grid gap-4", colClass, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </div>
  );
}
