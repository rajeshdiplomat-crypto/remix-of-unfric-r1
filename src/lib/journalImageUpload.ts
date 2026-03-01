import { uploadImage, type UploadResult } from "./mediaUtils";

/**
 * Legacy wrapper for Journal Image Upload
 * Now redirects to the universal media utility.
 */
export async function uploadJournalImage(
  file: File,
  userId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  return uploadImage(file, userId, {
    bucket: "journal-images",
    maxSizeMB: 5
  });
}
