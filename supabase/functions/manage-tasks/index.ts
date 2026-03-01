import { authenticateUser } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'

console.log("manage-tasks edge function loaded");
export const config = {
  verifyJwt: false,
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
      case 'fetch': {
        const { data, error } = await supabaseAdmin
          .from("tasks")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        resultData = data;
        break;
      }
      case 'fetchSingle': {
        const { taskId } = body;
        if (!taskId) throw new Error("Missing taskId for fetchSingle");

        const { data, error } = await supabaseAdmin
          .from("tasks")
          .select("*")
          .eq("id", taskId)
          .eq("user_id", userId)
          .single();

        if (error) throw error;
        resultData = data;
        break;
      }
      case 'upsert': {
        const { task } = body;
        if (!task) throw new Error("Missing task data for upsert");

        // Ensure the user_id is correct and cannot be spoofed
        const safeTask = { ...task, user_id: userId };

        const { data, error } = await supabaseAdmin
          .from("tasks")
          .upsert(safeTask)
          .select()
          .single();

        if (error) throw error;
        resultData = data;
        break;
      }
      case 'insert': {
        const { task } = body;
        if (!task) throw new Error("Missing task data for insert");

        // Ensure the user_id is correct and cannot be spoofed
        const safeTask = { ...task, user_id: userId };

        const { data, error } = await supabaseAdmin
          .from("tasks")
          .insert(safeTask)
          .select()
          .single();

        if (error) throw error;
        resultData = data;
        break;
      }
      case 'update': {
        const { taskId, updates } = body;
        if (!taskId || !updates) throw new Error("Missing taskId or updates data");

        // Don't allow updating user_id to someone else
        delete updates.user_id;

        const { data, error } = await supabaseAdmin
          .from("tasks")
          .update(updates)
          .eq("id", taskId)
          .eq("user_id", userId) // Security: ensure user owns the task
          .select()
          .single();

        if (error) throw error;
        resultData = data;
        break;
      }
      case 'delete': {
        const { taskId } = body;
        if (!taskId) throw new Error("Missing taskId for delete");

        const { error } = await supabaseAdmin
          .from("tasks")
          .delete()
          .eq("id", taskId)
          .eq("user_id", userId); // Security: ensure user owns the task

        if (error) throw error;
        resultData = { success: true };
        break;
      }
      case 'insert_focus_session': {
        const { session } = body;
        if (!session) throw new Error("Missing session data");
        
        const safeSession = { ...session, user_id: userId };
        const { data, error } = await supabaseAdmin
          .from("focus_sessions")
          .insert(safeSession)
          .select()
          .single();
          
        if (error) throw error;
        resultData = data;
        break;
      }
      case 'fetch_focus_sessions': {
        const { limit } = body;
        const { data, error } = await supabaseAdmin
          .from("focus_sessions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit || 500);

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
