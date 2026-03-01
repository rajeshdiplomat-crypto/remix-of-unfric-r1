import { supabase } from "@/integrations/supabase/client";

export interface UploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

export interface UploadOptions {
    bucket?: string;
    maxSizeMB?: number;
    allowedTypes?: string[];
}

/**
 * Universal Image Upload Service
 * Handles validation, unique naming, and calling the Supabase Edge Function
 */
export async function uploadImage(
    file: File,
    userId: string,
    options: UploadOptions = {}
): Promise<UploadResult> {
    const {
        bucket = "journal-images",
        maxSizeMB = 5,
        allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    } = options;

    try {
        // 1. Validation
        if (!allowedTypes.includes(file.type)) {
            return { success: false, error: "Invalid file type. Please upload an image." };
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
            return { success: false, error: `Image must be less than ${maxSizeMB}MB.` };
        }

        // 2. Filename Generation
        const fileExt = file.name.split(".").pop() || "jpg";
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

        // 3. Prepare Form Data
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucketName", bucket); // Compatibility for journalImageUpload
        formData.append("bucket", bucket);     // Compatibility for EntryImageUpload
        formData.append("fileName", fileName);

        // 4. Invoke Edge Function
        const { data, error } = await supabase.functions.invoke("upload-image", {
            body: formData,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        if (data?.error) {
            return { success: false, error: data.error };
        }

        // Standardize URL return (Edge function might return publicUrl or url)
        const publicUrl = data?.publicUrl || data?.url;

        if (!publicUrl) {
            return { success: false, error: "Failed to retrieve public URL after upload." };
        }

        return { success: true, url: publicUrl };
    } catch (err: any) {
        console.error("[MediaUtils] Unexpected error:", err);
        return { success: false, error: err.message || "An unexpected upload error occurred" };
    }
}
