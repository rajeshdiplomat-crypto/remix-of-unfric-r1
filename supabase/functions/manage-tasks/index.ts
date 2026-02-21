import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { corsHeaders } from '../_shared/cors.ts'

console.log("manage-tasks edge function loaded");

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
