import { supabase } from "@/integrations/supabase/client";

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadJournalImage(
  file: File,
  userId: string
): Promise<UploadResult> {
  try {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { data, error } = await supabase.storage
      .from("journal-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      // If bucket doesn't exist, fall back to base64
      if (error.message?.includes("Bucket not found") || error.message?.includes("not found")) {
        console.warn("journal-images bucket not found, falling back to base64");
        return await fileToBase64(file);
      }
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from("journal-images")
      .getPublicUrl(data.path);

    return { success: true, url: urlData.publicUrl };
  } catch (err: any) {
    console.warn("Storage upload failed, falling back to base64:", err);
    return await fileToBase64(file);
  }
}

async function fileToBase64(file: File): Promise<UploadResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ success: true, url: reader.result as string });
    };
    reader.onerror = () => {
      resolve({ success: false, error: "Failed to read file" });
    };
    reader.readAsDataURL(file);
  });
}
