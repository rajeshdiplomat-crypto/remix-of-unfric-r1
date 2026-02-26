import { supabase } from "@/integrations/supabase/client";

export async function uploadJournalImage(
  file: File,
  userId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucketName", "journal-images");
    formData.append("fileName", fileName);

    const { data: uploadData, error: uploadError } = await supabase.functions.invoke("upload-image", {
      body: formData,
    });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    if (uploadData?.error) {
       return { success: false, error: uploadData.error };
    }

    return { success: true, url: uploadData.publicUrl };
  } catch (err: any) {
    return { success: false, error: err.message || "Upload failed" };
  }
}
