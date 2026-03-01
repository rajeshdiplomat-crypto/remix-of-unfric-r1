import { authenticateUser } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { getSafeError } from '../_shared/errors.ts'

console.log("upload-image edge function loaded");

const ALLOWED_BUCKETS = ['entry-covers', 'journal-images', 'avatars'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user, supabaseAdmin, errorResponse } = await authenticateUser(req);
    if (errorResponse) return errorResponse;

    // Since we are uploading, we expect multipart/form-data
    const formData = await req.formData();
    const file = formData.get('file');
    const bucketName = (formData.get('bucketName') || formData.get('bucket'))?.toString() || "entry-covers";

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'Missing or invalid file' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate bucket name against whitelist
    if (!ALLOWED_BUCKETS.includes(bucketName)) {
      return new Response(JSON.stringify({ error: 'Invalid storage bucket' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({ error: `File type '${file.type}' is not allowed. Accepted: JPEG, PNG, WebP, GIF` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Use signed URLs (24h expiry) since buckets are private
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUrl(fileName, 86400); // 24 hours

    if (signedError) throw signedError;

    return new Response(
      JSON.stringify({ success: true, url: signedData.signedUrl, path: fileName }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: getSafeError(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
