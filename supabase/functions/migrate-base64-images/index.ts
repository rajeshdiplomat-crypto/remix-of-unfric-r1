import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function isBase64Image(src: string): boolean {
  return src?.startsWith("data:image/");
}

function base64ToBlob(base64: string): { blob: Blob; mimeType: string } {
  const matches = base64.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid base64 string");
  
  const mimeType = matches[1];
  const base64Data = matches[2];
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return { blob: new Blob([bytes], { type: mimeType }), mimeType };
}

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  return map[mimeType] || "jpg";
}

async function processNode(
  node: any,
  supabase: any,
  userId: string
): Promise<{ updated: boolean; node: any }> {
  if (!node || typeof node !== 'object') {
    return { updated: false, node };
  }

  if (node.type === "imageResize" && node.attrs?.src && isBase64Image(node.attrs.src)) {
    try {
      const { blob, mimeType } = base64ToBlob(node.attrs.src);
      const ext = getExtension(mimeType);
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
      
      const { data, error } = await supabase.storage
        .from("journal-images")
        .upload(fileName, blob, {
          contentType: mimeType,
          cacheControl: "3600",
          upsert: false,
        });
      
      if (error) {
        console.error("Upload failed");
        return { updated: false, node };
      }
      
      const { data: urlData } = supabase.storage
        .from("journal-images")
        .getPublicUrl(data.path);
      
      return {
        updated: true,
        node: {
          ...node,
          attrs: { ...node.attrs, src: urlData.publicUrl },
        },
      };
    } catch {
      return { updated: false, node };
    }
  }
  
  if (node.content && Array.isArray(node.content)) {
    let anyUpdated = false;
    const newContent = [];
    
    for (const child of node.content) {
      const result = await processNode(child, supabase, userId);
      newContent.push(result.node);
      if (result.updated) anyUpdated = true;
    }
    
    if (anyUpdated) {
      return { updated: true, node: { ...node, content: newContent } };
    }
  }
  
  return { updated: false, node };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for storage operations but scope queries to authenticated user
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const entryId = body.entryId;
    
    if (entryId) {
      // Process single entry - verify ownership first
      const { data: entry, error: fetchError } = await adminClient
        .from("journal_entries")
        .select("id, user_id, text_formatting")
        .eq("id", entryId)
        .eq("user_id", user.id) // Only allow access to own entries
        .single();

      if (fetchError || !entry) {
        return new Response(
          JSON.stringify({ success: false, error: "Entry not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let doc = entry.text_formatting;
      if (typeof doc === 'string') {
        try {
          doc = JSON.parse(doc);
        } catch {
          return new Response(
            JSON.stringify({ success: false, error: "Invalid format" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const result = await processNode(doc, adminClient, user.id);
      
      if (result.updated) {
        const { error: updateError } = await adminClient
          .from("journal_entries")
          .update({ text_formatting: result.node })
          .eq("id", entry.id)
          .eq("user_id", user.id); // Double-check ownership on update
        
        if (updateError) {
          return new Response(
            JSON.stringify({ success: false, error: "Update failed" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ success: true, message: "Entry migrated successfully" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, message: "No base64 images found in entry" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // List entries with base64 images - only for the authenticated user
    const { data: entries, error: fetchError } = await adminClient
      .from("journal_entries")
      .select("id, entry_date")
      .eq("user_id", user.id) // Only own entries
      .not("text_formatting", "is", null);

    if (fetchError) {
      throw new Error("Failed to fetch entries");
    }

    const entriesWithBase64: string[] = [];
    
    for (const entry of entries || []) {
      const { data: fullEntry } = await adminClient
        .from("journal_entries")
        .select("text_formatting")
        .eq("id", entry.id)
        .eq("user_id", user.id)
        .single();
        
      if (fullEntry?.text_formatting) {
        const jsonStr = JSON.stringify(fullEntry.text_formatting);
        if (jsonStr.includes("data:image/")) {
          entriesWithBase64.push(entry.id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        entriesWithBase64,
        message: `Found ${entriesWithBase64.length} entries with base64 images.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Migration error:", error instanceof Error ? error.message : "Unknown");
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
