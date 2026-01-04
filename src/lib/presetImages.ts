// Preset images by category for entries that don't have custom cover images

export const PRESET_IMAGES = {
  manifest: {
    career: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=300&fit=crop",
    wealth: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=300&fit=crop",
    health: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
    habits: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=300&fit=crop",
    relationships: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop",
    learning: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=300&fit=crop",
    other: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop",
    default: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop",
  },
  trackers: {
    health: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
    growth: "https://images.unsplash.com/photo-1493612276216-ee3925520721?w=400&h=300&fit=crop",
    career: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=300&fit=crop",
    education: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=300&fit=crop",
    wellbeing: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop",
    default: "https://images.unsplash.com/photo-1493612276216-ee3925520721?w=400&h=300&fit=crop",
  },
  notes: {
    inbox: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=300&fit=crop",
    work: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=400&h=300&fit=crop",
    personal: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=300&fit=crop",
    ideas: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop",
    wellness: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop",
    hobby: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop",
    archive: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
    default: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=400&h=300&fit=crop",
  },
} as const;

export type PresetImageType = keyof typeof PRESET_IMAGES;

export function getPresetImage(
  type: PresetImageType,
  category: string
): string {
  const categoryImages = PRESET_IMAGES[type];
  return (
    categoryImages[category as keyof typeof categoryImages] ||
    categoryImages.default
  );
}

export function getAllPresetImages(type: PresetImageType): { category: string; url: string }[] {
  const categoryImages = PRESET_IMAGES[type];
  return Object.entries(categoryImages)
    .filter(([key]) => key !== "default")
    .map(([category, url]) => ({ category, url }));
}
