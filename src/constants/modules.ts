import {
    CheckSquare,
    PenLine,
    FileText,
    Target,
    BarChart3,
    Sparkles,
    Heart
} from "lucide-react";
import type { SourceModule, ModuleConfig } from "@/components/diary/types";

import { IMAGE_IDS, buildUnsplashUrl } from "./images";

export const MODULE_IMAGES: Record<string, string> = {
    tasks: buildUnsplashUrl(IMAGE_IDS.modules.tasks, 100, 100),
    journal: buildUnsplashUrl(IMAGE_IDS.modules.journal, 100, 100),
    notes: buildUnsplashUrl(IMAGE_IDS.modules.notes, 100, 100),
    trackers: buildUnsplashUrl(IMAGE_IDS.modules.trackers, 100, 100),
    manifest: buildUnsplashUrl(IMAGE_IDS.modules.manifest, 100, 100),
    emotions: buildUnsplashUrl(IMAGE_IDS.modules.emotions, 100, 100),
    mindmap: buildUnsplashUrl(IMAGE_IDS.modules.mindmap, 100, 100),
};

export const MODULE_CONFIG: Record<SourceModule | "emotions", ModuleConfig> = {
    tasks: { icon: CheckSquare, label: "Tasks", color: "text-emerald-600", bgColor: "bg-emerald-50" },
    journal: { icon: PenLine, label: "Journal", color: "text-amber-600", bgColor: "bg-amber-50" },
    notes: { icon: FileText, label: "Notes", color: "text-sky-600", bgColor: "bg-sky-50" },
    mindmap: { icon: Target, label: "Mind Map", color: "text-violet-600", bgColor: "bg-violet-50" },
    trackers: { icon: BarChart3, label: "Habits", color: "text-teal-600", bgColor: "bg-teal-50" },
    manifest: { icon: Sparkles, label: "Manifest", color: "text-purple-600", bgColor: "bg-purple-50" },
    emotions: { icon: Heart, label: "Emotions", color: "text-pink-500", bgColor: "bg-pink-50" },
};
