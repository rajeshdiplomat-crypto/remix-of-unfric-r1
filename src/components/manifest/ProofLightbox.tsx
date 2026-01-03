import { X } from "lucide-react";

export function ProofLightbox({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-w-4xl w-full overflow-hidden rounded-3xl border border-white/10 bg-black/30 backdrop-blur shadow-[0_30px_100px_rgba(0,0,0,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <img src={imageUrl} alt="" className="w-full h-auto object-contain bg-black/20" />
      </div>
    </div>
  );
}
