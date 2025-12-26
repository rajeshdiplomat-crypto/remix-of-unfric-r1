import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Pencil, Highlighter, Eraser, Trash2, Download } from "lucide-react";

interface NotesScribbleCanvasProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (dataUrl: string) => void;
  initialData?: string | null;
}

const COLORS = [
  "#000000", // Black
  "#374151", // Gray
  "#EF4444", // Red
  "#F97316", // Orange
  "#EAB308", // Yellow
  "#22C55E", // Green
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
];

type Tool = "pen" | "highlighter" | "eraser";

export function NotesScribbleCanvas({ open, onOpenChange, onSave, initialData }: NotesScribbleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#000000");
  const [thickness, setThickness] = useState([3]);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (open && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size
      canvas.width = 600;
      canvas.height = 400;

      // Fill with white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Load initial data if exists
      if (initialData) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = initialData;
      }
    }
  }, [open, initialData]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    lastPoint.current = coords;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current || !lastPoint.current) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(coords.x, coords.y);

    if (tool === "eraser") {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = thickness[0] * 3;
    } else if (tool === "highlighter") {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = thickness[0] * 4;
    } else {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 1;
      ctx.lineWidth = thickness[0];
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.globalAlpha = 1;

    lastPoint.current = coords;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onSave(dataUrl);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "scribble.png";
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Scribble / Drawing</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              <Button
                variant={tool === "pen" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setTool("pen")}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant={tool === "highlighter" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setTool("highlighter")}
              >
                <Highlighter className="h-4 w-4" />
              </Button>
              <Button
                variant={tool === "eraser" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setTool("eraser")}
              >
                <Eraser className="h-4 w-4" />
              </Button>
            </div>

            <div className="w-px h-8 bg-border" />

            <div className="flex gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`h-6 w-6 rounded-full border-2 transition-transform ${
                    color === c ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>

            <div className="w-px h-8 bg-border" />

            <div className="flex items-center gap-2 min-w-[120px]">
              <span className="text-xs text-muted-foreground">Size</span>
              <Slider
                value={thickness}
                onValueChange={setThickness}
                min={1}
                max={20}
                step={1}
                className="w-20"
              />
              <span className="text-xs text-muted-foreground w-4">{thickness[0]}</span>
            </div>

            <div className="flex-1" />

            <Button variant="outline" size="icon" className="h-8 w-8" onClick={clearCanvas}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Canvas */}
          <div className="border border-border rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              className="w-full cursor-crosshair touch-none"
              style={{ aspectRatio: "3/2" }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              Insert Drawing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
