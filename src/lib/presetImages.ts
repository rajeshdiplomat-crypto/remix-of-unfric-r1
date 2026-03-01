import { IMAGE_IDS, buildUnsplashUrl } from "@/constants/images";

export type PresetImageType = Exclude<keyof typeof IMAGE_IDS, "modules">;

/**
 * Get a preset image for a specific type and category
 * @param type 'manifest' | 'trackers' | 'notes'
 * @param category The category ID
 * @param width Custom width
 * @param height Custom height
 */
export function getPresetImage(
  type: PresetImageType,
  category: string,
  width?: number,
  height?: number
): string {
  const categoryIds = IMAGE_IDS[type];
  const id = categoryIds[category as keyof typeof categoryIds] || (categoryIds as any).default;
  return buildUnsplashUrl(id, width, height);
}

/**
 * Get all available preset images for a specific type
 * @param type 'manifest' | 'trackers' | 'notes'
 */
export function getAllPresetImages(type: PresetImageType): { category: string; url: string }[] {
  const categoryIds = IMAGE_IDS[type];
  return Object.entries(categoryIds)
    .filter(([key]) => key !== "default")
    .map(([category, id]) => ({
      category,
      url: buildUnsplashUrl(id as string)
    }));
}
