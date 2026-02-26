import { authenticateUser } from '../_shared/auth.ts'

console.log("manage-notes edge function loaded");

const isUUID = (uuid: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user, supabaseAdmin, errorResponse } = await authenticateUser(req);
    if (errorResponse) return errorResponse;

    // We now have the securely validated user ID
    const userId = user.id;

    // 4. Parse the request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("Error parsing request JSON:", e);
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const { action } = body;
    console.log("Action:", action);
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
        // Sanitize IDs to prevent UUID syntax errors (e.g. from legacy "inbox" ID)
        const safeNote = {
          ...note,
          user_id: userId,
          group_id: note.group_id && isUUID(note.group_id) ? note.group_id : null,
          folder_id: note.folder_id && isUUID(note.folder_id) ? note.folder_id : null,
        };

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

        if (!isUUID(group.id)) {
          return new Response(JSON.stringify({ success: true, message: 'Skipped non-UUID default group' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          });
        }

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

        if (!isUUID(folder.id)) {
          return new Response(JSON.stringify({ success: true, message: 'Skipped non-UUID default folder' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          });
        }

        const safeFolder = { ...folder, user_id: userId, group_id: isUUID(folder.group_id) ? folder.group_id : null };

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
