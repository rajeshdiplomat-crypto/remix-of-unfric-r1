import { cn } from "@/lib/utils";
import unfricLogo from "@/assets/unfric-logo.png";

interface UnfricLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'compact' | 'icon' | 'text';
}

const sizeClasses = {
  // For icon-only variant
  icon: {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-14 w-14',
  },
  // For compact and full variants (full logo image height)
  image: {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
    xl: 'h-14',
  },
  // For text-only variant (legacy)
  text: {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl lg:text-5xl',
  },
};

export function UnfricLogo({ className, size = 'md', variant = 'compact' }: UnfricLogoProps) {
  // Text-only variant (legacy support)
  if (variant === 'text') {
    return (
      <span
        className={cn(
          "font-light tracking-[0.2em] lowercase text-foreground select-none",
          sizeClasses.text[size],
          className
        )}
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        unfric
      </span>
    );
  }

  // Image-based variants (icon, compact, full)
  return (
    <img
      src={unfricLogo}
      alt="unfric - Life unfrictioned"
      className={cn(
        "object-contain select-none",
        sizeClasses.image[size],
        className
      )}
    />
  );
}
