import { useMemo } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import { Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ManifestGoal, ManifestProof } from "@/components/manifest/types";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs text-white/90 backdrop-blur">
      {children}
    </span>
  );
}

export function ManifestCard({
  goal,
  streak,
  momentum,
  lastProof,
  isSelected,
  onClick,
  onEdit,
  onDelete,
}: {
  goal: ManifestGoal;
  streak: number;
  momentum: number;
  lastProof?: ManifestProof;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const day = useMemo(() => {
    try {
      return Math.max(0, differenceInDays(new Date(), parseISO(goal.created_at)));
    } catch {
      return 0;
    }
  }, [goal.created_at]);

  const hasImage = !!goal.vision_image_url;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-[28px] border border-black/5 bg-white/60 shadow-[0_18px_55px_rgba(0,0,0,0.08)] transition-transform",
        "hover:-translate-y-[2px] hover:shadow-[0_22px_70px_rgba(0,0,0,0.10)]",
        isSelected && "ring-2 ring-black/10",
      )}
    >
      {/* Background */}
      <div className="absolute inset-0">
        {hasImage ? (
          <img src={goal.vision_image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.45),rgba(255,255,255,0.0)),linear-gradient(120deg,#c7c1bb,#b7b0a9,#d8d2cb)]" />
        )}

        {/* Soft overlay like screenshot */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      <div className="relative flex min-h-[340px] flex-col justify-between p-6 lg:p-8">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Pill>{goal.is_completed ? "Completed" : "Active"}</Pill>
            <Pill>Day {day}</Pill>
            <Pill>Conviction {goal.conviction}/10</Pill>
          </div>

          <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-white/15 text-white hover:bg-white/25"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-white/15 text-white hover:bg-white/25"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bottom content */}
        <div className="space-y-4">
          <h3 className="font-serif text-[40px] leading-[1.12] tracking-tight text-white">{goal.title}</h3>

          {/* Small proof preview (like right card vibe) */}
          {lastProof?.text ? (
            <div className="max-w-[520px] rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/85 backdrop-blur">
              {lastProof.text}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 text-xs text-white/70">
              <ImageIcon className="h-4 w-4" />
              Add a vision image or a proof to strengthen momentum.
            </div>
          )}

          <div className="pt-2">
            <div className="flex items-center justify-between text-[12px] tracking-wide text-white/80">
              <span>
                {goal.is_completed ? "COMPLETED" : "ACTIVE"} · {streak} STREAK · {momentum}% MOMENTUM
              </span>
              <span>{momentum}%</span>
            </div>

            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white/75"
                style={{ width: `${Math.max(0, Math.min(100, momentum))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
