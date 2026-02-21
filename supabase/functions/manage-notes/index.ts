import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { corsHeaders } from '../_shared/cors.ts'

console.log("manage-notes edge function loaded");

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Initialize Supabase Admin Client (Service Role Key)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 3. Validate the User's JWT against Supabase Auth
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // We now have the securely validated user ID
    const userId = user.id;

    // 4. Parse the request body
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: 'Missing action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let resultData = null;

    // 5. Handle different actions
    switch (action) {
      case 'fetch_all': {
        const [notesRes, groupsRes, foldersRes] = await Promise.all([
          supabaseAdmin.from("notes").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
          supabaseAdmin.from("note_groups").select("*").eq("user_id", userId).order("sort_order"),
          supabaseAdmin.from("note_folders").select("*").eq("user_id", userId).order("sort_order"),
        ]);

        if (notesRes.error) throw notesRes.error;
        if (groupsRes.error) throw groupsRes.error;
        if (foldersRes.error) throw foldersRes.error;

        resultData = {
          notes: notesRes.data,
          groups: groupsRes.data,
          folders: foldersRes.data
        };
        break;
      }

      case 'upsert_note': {
        const { note } = body;
        if (!note) throw new Error("Missing note data for upsert");

        // Ensure the user_id is correct and cannot be spoofed
        const safeNote = { ...note, user_id: userId };

        const { data, error } = await supabaseAdmin
          .from("notes")
          .upsert(safeNote)
          .select()
          .single();

        if (error) throw error;
        resultData = data;
        break;
      }

      case 'delete_note': {
        const { noteId } = body;
        if (!noteId) throw new Error("Missing noteId for delete");

        const { error } = await supabaseAdmin
          .from("notes")
          .delete()
          .eq("id", noteId)
          .eq("user_id", userId); // Security: ensure user owns the note

        if (error) throw error;
        resultData = { success: true };
        break;
      }

      case 'upsert_group': {
        const { group } = body;
        if (!group) throw new Error("Missing group data for upsert");

        const safeGroup = { ...group, user_id: userId };

        const { data, error } = await supabaseAdmin
          .from("note_groups")
          .upsert(safeGroup)
          .select()
          .single();

        if (error) throw error;
        resultData = data;
        break;
      }

      case 'upsert_folder': {
        const { folder } = body;
        if (!folder) throw new Error("Missing folder data for upsert");

        const safeFolder = { ...folder, user_id: userId };

        const { data, error } = await supabaseAdmin
          .from("note_folders")
          .upsert(safeFolder)
          .select()
          .single();

        if (error) throw error;
        resultData = data;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: resultData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error(`Function error (${req.url}):`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
