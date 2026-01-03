import { format, parseISO } from "date-fns";
import { CheckCircle2, XCircle, Image as ImageIcon } from "lucide-react";

export function HistoryDayCard({
  data,
  onImageClick,
}: {
  data: {
    date: string;
    practiced: boolean;
    alignment: number;
    visualizations: Array<{ id: string; duration: number; created_at: string }>;
    acts: Array<{ id: string; text: string; created_at: string }>;
    proofs: Array<{ id: string; text?: string; image_url?: string; created_at: string }>;
    growth_note?: string;
    gratitude?: string;
  };
  onImageClick: (imageUrl: string) => void;
}) {
  const day = parseISO(data.date);
  const images = data.proofs.filter((p) => p.image_url).slice(0, 3);

  return (
    <div className="rounded-3xl border border-black/5 bg-white/60 backdrop-blur p-5 shadow-[0_18px_55px_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {data.practiced ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2f2f33] text-white px-3 py-1 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Practiced
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 border border-black/5 text-[#2d2d31] px-3 py-1 text-xs">
                <XCircle className="h-3.5 w-3.5 opacity-70" />
                Pause
              </span>
            )}

            <span className="text-sm font-medium text-[#1f1f23]">{format(day, "EEE, MMM d")}</span>
          </div>

          <div className="mt-2 text-sm text-muted-foreground">
            Alignment: <span className="font-medium text-[#1f1f23]">{data.alignment}/10</span> · Acts:{" "}
            <span className="font-medium text-[#1f1f23]">{data.acts.length}</span> · Proofs:{" "}
            <span className="font-medium text-[#1f1f23]">{data.proofs.length}</span> · Visualize:{" "}
            <span className="font-medium text-[#1f1f23]">{data.visualizations.length}</span>
          </div>
        </div>
      </div>

      {/* Proof text snippets */}
      {data.proofs.some((p) => p.text) && (
        <div className="mt-4 space-y-2">
          {data.proofs
            .filter((p) => p.text)
            .slice(0, 2)
            .map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-black/5 bg-white/55 px-4 py-3 text-sm text-[#2d2d31]"
              >
                {p.text}
              </div>
            ))}
        </div>
      )}

      {/* Image thumbs */}
      {images.length > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
            Images
          </div>

          <div className="flex gap-2">
            {images.map((p) => (
              <button
                key={p.id}
                onClick={() => p.image_url && onImageClick(p.image_url)}
                className="h-12 w-12 overflow-hidden rounded-xl border border-black/5 bg-white/40"
                title="Open image"
              >
                {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                <img src={p.image_url!} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
