import { authenticateUser } from '../_shared/auth.ts'

console.log("manage-manifest edge function loaded");

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user, supabaseAdmin, errorResponse } = await authenticateUser(req);
    if (errorResponse) return errorResponse;

    const userId = user.id;
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: 'Missing action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let resultData = null;

    switch (action) {
      case 'fetch_all_goals': {
        const { data, error } = await supabaseAdmin
          .from("manifest_goals")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        resultData = data;
        break;
      }

      case 'fetch_all_data': {
        const [goalsRes, practicesRes] = await Promise.all([
          supabaseAdmin.from("manifest_goals").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
          supabaseAdmin.from("manifest_practices").select("*").eq("user_id", userId),
        ]);

        if (goalsRes.error) throw goalsRes.error;
        if (practicesRes.error) throw practicesRes.error;

        resultData = { goals: goalsRes.data, practices: practicesRes.data };
        break;
      }

      case 'fetch_goal_and_practices': {
        const { goalId } = body;
        if (!goalId) throw new Error("Missing goalId");

        const [goalRes, practicesRes] = await Promise.all([
          supabaseAdmin.from("manifest_goals").select("*").eq("id", goalId).eq("user_id", userId).single(),
          supabaseAdmin.from("manifest_practices").select("*").eq("goal_id", goalId).eq("user_id", userId),
        ]);

        if (goalRes.error) throw goalRes.error;
        if (practicesRes.error) throw practicesRes.error;

        resultData = { goal: goalRes.data, practices: practicesRes.data };
        break;
      }

      case 'fetch_practice': {
        const { goalId, dateStr } = body;
        if (!goalId || !dateStr) throw new Error("Missing goalId or dateStr");

        const { data, error } = await supabaseAdmin
          .from("manifest_practices")
          .select("*")
          .eq("goal_id", goalId)
          .eq("entry_date", dateStr)
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;
        resultData = data || {};
        break;
      }

      case 'upsert_goal': {
        const { goal } = body;
        if (!goal) throw new Error("Missing goal data");

        const safeGoal = { ...goal, user_id: userId };
        const { data, error } = await supabaseAdmin
          .from("manifest_goals")
          .upsert(safeGoal)
          .select()
          .single();

        if (error) throw error;
        resultData = data;
        break;
      }

      case 'update_goal': {
        const { goalId, updates } = body;
        if (!goalId || !updates) throw new Error("Missing goalId or updates");

        delete updates.user_id;

        const { data, error } = await supabaseAdmin
          .from("manifest_goals")
          .update(updates)
          .eq("id", goalId)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) throw error;
        resultData = data;
        break;
      }

      case 'delete_goal': {
        const { goalId } = body;
        if (!goalId) throw new Error("Missing goalId");

        const { error } = await supabaseAdmin
          .from("manifest_goals")
          .delete()
          .eq("id", goalId)
          .eq("user_id", userId);

        if (error) throw error;
        resultData = { success: true };
        break;
      }

      case 'upsert_practice': {
        const { practice } = body;
        if (!practice) throw new Error("Missing practice data");

        const safePractice = { ...practice, user_id: userId };
        const { data, error } = await supabaseAdmin
          .from("manifest_practices")
          .upsert(safePractice, { onConflict: "goal_id,entry_date" })
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
      JSON.stringify({ success: true, data: resultData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error(`Function error (${req.url}):`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
