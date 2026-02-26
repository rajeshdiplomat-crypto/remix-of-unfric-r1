import { authenticateUser } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'

console.log("sync-offline edge function loaded");

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user, supabaseAdmin, errorResponse } = await authenticateUser(req);
    if (errorResponse) return errorResponse;

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { operations } = body;
    if (!operations || !Array.isArray(operations)) {
      return new Response(JSON.stringify({ error: 'Missing operations array' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let synced = 0;
    let failed = 0;
    const remaining = [];

    // Allowed tables for offline sync (security check)
    const allowedTables = [
      "journal_entries", "journal_answers", "emotions", "tasks", 
      "habits", "habit_completions", "notes", "manifest_goals", 
      "manifest_practices", "feed_events", "feed_reactions", 
      "feed_comments", "feed_saves", "user_settings"
    ];

    for (const op of operations) {
      try {
        if (!allowedTables.includes(op.table)) {
          throw new Error(`Table ${op.table} not allowed for sync`);
        }

        const tableName = op.table;
        let result: any;
        
        // Ensure user_id is injected into operations to prevent cross-user mutations
        if (op.operation !== "delete" && op.data) {
           op.data.user_id = user.id;
        }

        switch (op.operation) {
          case "insert":
            result = await supabaseAdmin.from(tableName).insert(op.data);
            break;
          case "update": {
            const { id, ...rest } = op.data;
            result = await supabaseAdmin.from(tableName).update(rest).eq("id", id).eq("user_id", user.id);
            break;
          }
          case "upsert":
            result = await supabaseAdmin.from(tableName).upsert(op.data);
            break;
          case "delete":
            result = await supabaseAdmin.from(tableName).delete().eq("id", op.data.id).eq("user_id", user.id);
            break;
        }

        if (result?.error) {
          console.warn("[sync-offline] Sync error for op:", op.id, result.error);
          remaining.push(op);
          failed++;
        } else {
          synced++;
        }
      } catch (err) {
        console.warn("[sync-offline] Execution error for op:", op.id, err);
        remaining.push(op);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: { synced, failed, remaining } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error(`sync-offline error:`, error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
