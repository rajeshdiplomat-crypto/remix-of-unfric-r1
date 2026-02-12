import { supabase } from "@/integrations/supabase/client";

export async function uploadJournalImage(
  file: File,
  userId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("journal-images")
      .upload(fileName, file);

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data } = supabase.storage
      .from("journal-images")
      .getPublicUrl(fileName);

    return { success: true, url: data.publicUrl };
  } catch (err: any) {
    return { success: false, error: err.message || "Upload failed" };
  }
}
