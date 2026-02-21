import { cn } from "@/lib/utils";

interface UnfricLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'text-base md:text-lg',
  md: 'text-lg md:text-xl',
  lg: 'text-xl md:text-2xl',
  xl: 'text-3xl md:text-4xl lg:text-5xl',
};

export function UnfricLogo({ className, size = 'md' }: UnfricLogoProps) {
  return (
    <span
      className={cn(
        "font-light tracking-[0.2em] lowercase text-foreground select-none",
        sizeClasses[size],
        className
      )}
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      unfric
    </span>
  );
}
