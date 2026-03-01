/**
 * Master Registry of Unsplash IDs for categories and modules
 * Use buildUnsplashUrl to generate the actual image source
 */
export const IMAGE_IDS = {
    manifest: {
        career: "photo-1507679799987-c73779587ccf",
        wealth: "photo-1553729459-efe14ef6055d",
        health: "photo-1571019613454-1cb2f99b2d8b",
        habits: "photo-1484480974693-6ca0a78fb36b",
        relationships: "photo-1529156069898-49953e39b3ac",
        learning: "photo-1456513080510-7bf3a84b82f8",
        other: "photo-1618005182384-a83a8bd57fbe",
        default: "photo-1618005182384-a83a8bd57fbe",
    },
    trackers: {
        health: "photo-1571019613454-1cb2f99b2d8b",
        growth: "photo-1493612276216-ee3925520721",
        career: "photo-1507679799987-c73779587ccf",
        education: "photo-1456513080510-7bf3a84b82f8",
        wellbeing: "photo-1506126613408-eca07ce68773",
        default: "photo-1493612276216-ee3925520721",
    },
    notes: {
        inbox: "photo-1586281380349-632531db7ed4",
        work: "photo-1497032628192-86f99bcd76bc",
        personal: "photo-1499750310107-5fef28a66643",
        ideas: "photo-1519389950473-47ba0277781c",
        wellness: "photo-1506126613408-eca07ce68773",
        hobby: "photo-1513364776144-60967b0f800f",
        archive: "photo-1481627834876-b7833e8f5570",
        default: "photo-1517842645767-c639042777db",
    },
    modules: {
        tasks: "photo-1484480974693-6ca0a78fb36b",
        journal: "photo-1517842645767-c639042777db",
        notes: "photo-1586281380349-632531db7ed4",
        trackers: "photo-1571019613454-1cb2f99b2d8b",
        manifest: "photo-1618005182384-a83a8bd57fbe",
        emotions: "photo-1506126613408-eca07ce68773",
        mindmap: "photo-1519389950473-47ba0277781c",
    }
} as const;

/**
 * Build a dynamic Unsplash URL with custom dimensions
 * @param id The Unsplash Photo ID or a full URL
 * @param width Default width
 * @param height Default height
 */
export function buildUnsplashUrl(id: string, width = 800, height = 400): string {
    // If it's already a full URL (legacy storage), return it as is
    if (id.startsWith("http")) return id;

    const baseUrl = "https://images.unsplash.com";
    // If the ID doesn't contain the photo- prefix, it might be a raw ID
    const path = id.includes("/") ? id : `/${id}`;
    return `${baseUrl}${path}?w=${width}&h=${height}&fit=crop&q=80&auto=format`;
}
