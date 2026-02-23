import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { authenticateUser } from '../_shared/auth.ts'

console.log("manage-settings edge function loaded");

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
      case 'fetch_settings': {
        const { data, error } = await supabaseAdmin
          .from("user_settings")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;

        // If not found, create defaults
        if (!data) {
          const defaults = {
            user_id: userId,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            date_format: "MM/DD",
            start_of_week: "monday",
            default_home_screen: "diary",
            daily_reset_time: "08:00",
            notification_diary_prompt: true,
            notification_emotion_checkin: true,
            notification_task_reminder: true,
            privacy_blur_sensitive: false,
            privacy_passcode_enabled: false,
            note_skin_preference: null,
            default_task_tab: "board",
            default_task_view: "status",
            default_notes_view: "atlas",
            default_emotions_tab: "feel",
            journal_mode: "structured",
            time_format: "24h",
            reminder_time_diary: "08:00",
            reminder_time_habits: "08:00",
            reminder_time_emotions: "08:00",
          };

          await supabaseAdmin.from("user_settings").insert(defaults);
          resultData = defaults;
        } else {
          resultData = data;
        }
        break;
      }

      case 'update_settings': {
        const { updates } = body;
        if (!updates) throw new Error("Missing updates data");

        // prevent spoofing user_id
        delete updates.user_id;

        const { data, error } = await supabaseAdmin
          .from("user_settings")
          .update(updates)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) throw error;
        resultData = data;
        break;
      }

      case 'clear_module_data': {
        const { tableKey } = body;
        if (!tableKey) throw new Error("Missing tableKey");

        // Define allowed tables to prevent SQL injection or arbitrary deletions
        const allowedTables = [
          "emotions", "journal_entries", "habits",
          "manifest_goals", "notes", "tasks"
        ];

        if (!allowedTables.includes(tableKey)) {
          throw new Error("Invalid table key provided");
        }

        // Handle cascading or related records logic that the client previously did
        if (tableKey === "habits") {
          await supabaseAdmin.from("habit_completions").delete().eq("user_id", userId);
        }
        if (tableKey === "journal_entries") {
          const { data: entries } = await supabaseAdmin.from("journal_entries").select("id").eq("user_id", userId);
          if (entries && entries.length > 0) {
            const ids = entries.map((e) => e.id);
            await supabaseAdmin.from("journal_answers").delete().in("journal_entry_id", ids);
          }
        }
        if (tableKey === "manifest_goals") {
          const { data: goals } = await supabaseAdmin.from("manifest_goals").select("id").eq("user_id", userId);
          if (goals && goals.length > 0) {
            const ids = goals.map((g) => g.id);
            await supabaseAdmin.from("manifest_journal").delete().in("goal_id", ids);
            await supabaseAdmin.from("manifest_practices").delete().in("goal_id", ids); // also clear practices
          }
        }

        // Finally delete the core records
        const { error } = await supabaseAdmin.from(tableKey).delete().eq("user_id", userId);

        if (error) throw error;
        resultData = { success: true };
        break;
      }

      case 'export_data': {
        // Gathers all user data across all tables to return in one payload
        const [emotions, journal, habits, habitCompletions, notes, tasks, goals, practices] = await Promise.all([
          supabaseAdmin.from("emotions").select("*").eq("user_id", userId),
          supabaseAdmin.from("journal_entries").select("*").eq("user_id", userId),
          supabaseAdmin.from("habits").select("*").eq("user_id", userId),
          supabaseAdmin.from("habit_completions").select("*").eq("user_id", userId),
          supabaseAdmin.from("notes").select("*").eq("user_id", userId),
          supabaseAdmin.from("tasks").select("*").eq("user_id", userId),
          supabaseAdmin.from("manifest_goals").select("*").eq("user_id", userId),
          supabaseAdmin.from("manifest_practices").select("*").eq("user_id", userId),
        ]);

        resultData = {
          exported_at: new Date().toISOString(),
          emotions: emotions.data || [],
          journal_entries: journal.data || [],
          habits: habits.data || [],
          habit_completions: habitCompletions.data || [],
          notes: notes.data || [],
          tasks: tasks.data || [],
          manifest_goals: goals.data || [],
          manifest_practices: practices.data || []
        };
        break;
      }

      case 'delete_account': {
        // This represents the final step of completely removing user data.
        // Due to auth cascades, deleting the auth user will normally wipe all their related public schema data if foreign keys are set to ON DELETE CASCADE
        // However for manual cleanup to be safe
        const tables = ["user_settings", "emotions", "journal_entries", "habits", "habit_completions", "notes", "tasks", "manifest_goals", "manifest_practices", "journal_answers", "manifest_journal"];

        for (const table of tables) {
          await supabaseAdmin.from(table).delete().eq("user_id", userId);
        }

        // Note: Full auth deletion on Supabase requires admin privileges that are available via adminClient, but usually best to just handle cascades.
        // We will delete the auth.users record:
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

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
