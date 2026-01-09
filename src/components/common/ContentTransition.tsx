import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ContentTransitionProps {
  children: ReactNode;
  show: boolean;
  className?: string;
  delay?: number;
}

/**
 * Wrapper that applies a subtle entrance animation when content becomes visible.
 * Use this to wrap main content after loading screens.
 */
export function ContentTransition({ children, show, className, delay = 0 }: ContentTransitionProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      // Small delay for the DOM to update before animating
      const timer = setTimeout(() => setIsVisible(true), delay + 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [show, delay]);

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        "transition-all duration-500 ease-out",
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-4",
        className
      )}
    >
      {children}
    </div>
  );
}

interface StaggeredListProps {
  children: ReactNode[];
  show: boolean;
  staggerDelay?: number;
  className?: string;
}

/**
 * Wrapper that staggers the entrance of child elements.
 * Each child appears with a slight delay after the previous one.
 */
export function StaggeredList({ children, show, staggerDelay = 50, className }: StaggeredListProps) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (show) {
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setVisibleCount(count);
        if (count >= children.length) {
          clearInterval(interval);
        }
      }, staggerDelay);
      return () => clearInterval(interval);
    } else {
      setVisibleCount(0);
    }
  }, [show, children.length, staggerDelay]);

  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={cn(
            "transition-all duration-300 ease-out",
            index < visibleCount
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-3"
          )}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
