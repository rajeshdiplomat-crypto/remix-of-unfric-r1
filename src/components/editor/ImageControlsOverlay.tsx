import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface ImageControlsOverlayProps {
  image: HTMLImageElement;
  onDelete: () => void;
  onResize: (newWidth: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function ImageControlsOverlay({ 
  image, 
  onDelete, 
  onResize, 
  containerRef 
}: ImageControlsOverlayProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(image.offsetWidth);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  // Update position when image changes
  useEffect(() => {
    const updatePosition = () => {
      if (!containerRef.current) return;
      const imageRect = image.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      setPosition({
        top: imageRect.top - containerRect.top + containerRef.current.scrollTop,
        left: imageRect.left - containerRect.left,
        width: imageRect.width,
        height: imageRect.height,
      });
      setCurrentWidth(image.offsetWidth);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [image, containerRef]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = image.offsetWidth;
    const maxWidth = containerRef.current?.offsetWidth || 800;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.min(Math.max(100, startWidth + delta), maxWidth - 48);
      setCurrentWidth(newWidth);
      image.style.width = `${newWidth}px`;
      image.style.height = 'auto';
      
      // Update position to reflect new size
      const imageRect = image.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        setPosition(prev => ({
          ...prev,
          width: imageRect.width,
          height: imageRect.height,
        }));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      onResize(currentWidth);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [image, containerRef, currentWidth, onResize]);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        height: position.height,
      }}
    >
      {/* Selection border */}
      <div className="absolute inset-0 border-2 border-primary rounded-lg ring-4 ring-primary/20" />

      {/* Delete button */}
      <Button
        variant="destructive"
        size="icon"
        className="absolute -top-3 -right-3 h-8 w-8 rounded-full shadow-lg pointer-events-auto hover:scale-110 transition-transform"
        onClick={handleDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Resize handle - bottom right */}
      <div
        className="absolute -bottom-2 -right-2 w-5 h-5 bg-primary rounded-full cursor-se-resize pointer-events-auto shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
        onMouseDown={handleResizeStart}
      >
        <svg 
          className="w-3 h-3 text-primary-foreground" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M21 21L12 12M21 21H15M21 21V15" />
        </svg>
      </div>

      {/* Size indicator during resize */}
      {isResizing && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium shadow-lg border border-border pointer-events-none">
          {Math.round(currentWidth)}px
        </div>
      )}
    </div>
  );
}
