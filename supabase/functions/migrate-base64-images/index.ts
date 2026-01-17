import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  // Check if this is an imageResize node with base64 src
  if (node.type === "imageResize" && node.attrs?.src && isBase64Image(node.attrs.src)) {
    console.log("Found base64 imageResize, converting...");
    
    try {
      const { blob, mimeType } = base64ToBlob(node.attrs.src);
      console.log(`Blob: ${blob.size} bytes`);
      
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
        console.error("Upload error:", error);
        return { updated: false, node };
      }
      
      const { data: urlData } = supabase.storage
        .from("journal-images")
        .getPublicUrl(data.path);
      
      console.log("Uploaded to:", urlData.publicUrl);
      
      return {
        updated: true,
        node: {
          ...node,
          attrs: {
            ...node.attrs,
            src: urlData.publicUrl,
          },
        },
      };
    } catch (err) {
      console.error("Conversion error:", err);
      return { updated: false, node };
    }
  }
  
  // Recursively process content array
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const entryId = body.entryId;
    
    if (entryId) {
      // Process single entry
      console.log(`Processing single entry: ${entryId}`);
      
      const { data: entry, error: fetchError } = await supabase
        .from("journal_entries")
        .select("id, user_id, text_formatting")
        .eq("id", entryId)
        .single();

      if (fetchError || !entry) {
        return new Response(
          JSON.stringify({ success: false, error: "Entry not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Parse text_formatting if it's a string
      let doc = entry.text_formatting;
      if (typeof doc === 'string') {
        try {
          doc = JSON.parse(doc);
        } catch (e) {
          console.error("Failed to parse text_formatting as JSON");
          return new Response(
            JSON.stringify({ success: false, error: "Invalid text_formatting format" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      console.log("Document type:", doc?.type);
      const result = await processNode(doc, supabase, entry.user_id);
      
      if (result.updated) {
        const { error: updateError } = await supabase
          .from("journal_entries")
          .update({ text_formatting: result.node })
          .eq("id", entry.id);
        
        if (updateError) {
          return new Response(
            JSON.stringify({ success: false, error: updateError.message }),
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
    
    // List entries with base64 images
    const { data: entries, error: fetchError } = await supabase
      .from("journal_entries")
      .select("id, entry_date")
      .not("text_formatting", "is", null);

    if (fetchError) {
      throw new Error(`Fetch error: ${fetchError.message}`);
    }

    // Filter to find which ones have base64
    const entriesWithBase64: string[] = [];
    
    for (const entry of entries || []) {
      const { data: fullEntry } = await supabase
        .from("journal_entries")
        .select("text_formatting")
        .eq("id", entry.id)
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
        message: `Found ${entriesWithBase64.length} entries with base64 images. Call with {"entryId": "xxx"} to migrate each one.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
