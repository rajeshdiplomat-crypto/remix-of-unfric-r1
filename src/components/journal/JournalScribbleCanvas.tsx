import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Eraser, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface JournalScribbleCanvasProps {
  onSave?: (dataUrl: string) => void;
  initialData?: string;
  height?: number;
  bgColor?: string;
  lineColor?: string;
  lineHeight?: number;
}

const COLORS = [
  { name: "Black", value: "hsl(222, 47%, 11%)" },
  { name: "Blue", value: "hsl(200, 98%, 39%)" },
  { name: "Red", value: "hsl(0, 72%, 50%)" },
  { name: "Green", value: "hsl(142, 76%, 36%)" },
  { name: "Purple", value: "hsl(270, 50%, 50%)" },
];

const STROKE_WIDTHS = [1, 2, 3, 4];

export function JournalScribbleCanvas({
  onSave,
  initialData,
  height = 400,
  bgColor = "transparent",
  lineColor,
  lineHeight = 24,
}: JournalScribbleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pencil" | "eraser">("pencil");
  const [color, setColor] = useState(COLORS[0].value);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[1]);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear and set transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Load initial data if provided
    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = initialData;
    }
  }, [initialData]);

  const getPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getPosition(e);
    lastPosRef.current = pos;
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing || !lastPosRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPosition(e);

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = strokeWidth * 4;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    lastPosRef.current = pos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPosRef.current = null;

    if (onSave && canvasRef.current) {
      onSave(canvasRef.current.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (onSave) {
      onSave("");
    }
  };

  return (
    <div className="relative">
      {/* Single Common Toolbar - Fixed at top of scribble area */}
      <div
        className="sticky top-0 z-10 flex flex-wrap items-center gap-2 p-2 mb-2 rounded-lg"
        style={{ backgroundColor: "hsl(var(--muted) / 0.9)" }}
      >
        {/* Tools */}
        <div className="flex gap-1">
          <Button
            variant={tool === "pencil" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTool("pencil")}
            className="h-7 w-7 p-0"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={tool === "eraser" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTool("eraser")}
            className="h-7 w-7 p-0"
          >
            <Eraser className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-border" />

        {/* Colors */}
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => {
                setColor(c.value);
                setTool("pencil");
              }}
              className={cn(
                "h-5 w-5 rounded-full border transition-transform hover:scale-110",
                color === c.value && tool === "pencil" ? "border-foreground scale-110 ring-1 ring-foreground" : "border-muted-foreground/30"
              )}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-border" />

        {/* Stroke Width */}
        <div className="flex gap-1 items-center">
          {STROKE_WIDTHS.map((sw) => (
            <button
              key={sw}
              onClick={() => setStrokeWidth(sw)}
              className={cn(
                "flex items-center justify-center h-5 w-5 rounded transition-colors",
                strokeWidth === sw ? "bg-primary/20 ring-1 ring-primary" : "hover:bg-muted"
              )}
              title={`${sw}px`}
            >
              <div
                className="rounded-full bg-foreground"
                style={{ width: sw + 1, height: sw + 1 }}
              />
            </button>
          ))}
        </div>

        {/* Clear */}
        <Button variant="ghost" size="sm" onClick={clearCanvas} className="h-7 px-2 ml-auto text-xs">
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Clear
        </Button>
      </div>

      {/* Canvas with lined background */}
      <div
        className="relative overflow-hidden rounded"
        style={{
          backgroundImage: lineColor
            ? `linear-gradient(${lineColor} 1px, transparent 1px)`
            : undefined,
          backgroundSize: lineColor ? `100% ${lineHeight}px` : undefined,
        }}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full cursor-crosshair touch-none"
          style={{
            height: `${height}px`,
            backgroundColor: "transparent",
          }}
        />
      </div>
    </div>
  );
}
