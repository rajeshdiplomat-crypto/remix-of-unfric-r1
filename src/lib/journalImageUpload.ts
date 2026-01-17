import { supabase } from "@/integrations/supabase/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 1920; // Max width/height
const COMPRESSION_QUALITY = 0.8; // JPEG quality

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Compresses an image file by resizing and converting to JPEG.
 */
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to compress image"));
          }
        },
        "image/jpeg",
        COMPRESSION_QUALITY
      );
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Uploads an image file to Supabase storage and returns the public URL.
 * Images are compressed before upload to reduce storage and improve loading.
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

  try {
    // Compress the image
    const compressedBlob = await compressImage(file);
    const compressedFile = new File([compressedBlob], file.name, { type: "image/jpeg" });

    console.log(`Compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`);

    // Generate unique filename
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;

    // Upload to storage
    const { data, error: uploadError } = await supabase.storage
      .from("journal-images")
      .upload(fileName, compressedFile, {
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
