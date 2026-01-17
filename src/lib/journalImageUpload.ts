import { supabase } from "@/integrations/supabase/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Uploads an image file to Supabase storage and returns the public URL.
 * This prevents storing large base64 strings in the database.
 */
export async function uploadJournalImage(file: File, userId: string): Promise<UploadResult> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return {
      success: false,
      error: "Only image files are allowed",
    };
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

  try {
    // Upload to storage
    const { data, error: uploadError } = await supabase.storage
      .from("journal-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return {
        success: false,
        error: uploadError.message,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("journal-images")
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error("Unexpected upload error:", error);
    return {
      success: false,
      error: "Failed to upload image. Please try again.",
    };
  }
}
