import { authenticateUser } from '../_shared/auth.ts'

console.log("manage-habits edge function loaded");

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
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
      case 'fetch_habits': {
        const { data: habits, error: habitsError } = await supabaseAdmin
          .from("habits")
          .select("*")
          .eq("user_id", userId);

        if (habitsError) throw habitsError;

        const { data: completions, error: completionsError } = await supabaseAdmin
          .from("habit_completions")
          .select("*")
          .eq("user_id", userId);

        if (completionsError) throw completionsError;

        resultData = { habits, completions };
        break;
      }

      case 'upsert_habit': {
        const { habit, tasksToCreate } = body;
        if (!habit) throw new Error("Missing habit data");
        habit.user_id = userId;

        const { data, error } = await supabaseAdmin
          .from("habits")
          .upsert(habit)
          .select()
          .single();

        if (error) throw error;

        // Handle optional companion tasks creation
        if (tasksToCreate && Array.isArray(tasksToCreate) && tasksToCreate.length > 0) {
          // ensure user_id is stamped securely
          const checkedTasks = tasksToCreate.map((t: any) => ({ ...t, user_id: userId }));
          const { error: tasksError } = await supabaseAdmin.from("tasks").insert(checkedTasks);
          if (tasksError) throw tasksError;
        }

        resultData = data;
        break;
      }

      case 'delete_habit': {
        const { habitId } = body;
        if (!habitId) throw new Error("Missing habitId");

        await supabaseAdmin.from("habit_completions").delete().eq("habit_id", habitId).eq("user_id", userId);
        const { error } = await supabaseAdmin.from("habits").delete().eq("id", habitId).eq("user_id", userId);

        if (error) throw error;
        resultData = { success: true };
        break;
      }

      case 'toggle_completion': {
        const { habitId, dateStr } = body;
        if (!habitId || !dateStr) throw new Error("Missing habitId or dateStr");

        // Fetch habit details
        const { data: habit, error: habitError } = await supabaseAdmin
          .from("habits")
          .select("*")
          .eq("id", habitId)
          .eq("user_id", userId)
          .single();

        if (habitError || !habit) throw habitError || new Error("Habit not found");

        // Check if completion exists
        const { data: existing } = await supabaseAdmin
          .from("habit_completions")
          .select("*")
          .eq("habit_id", habitId)
          .eq("user_id", userId)
          .eq("completed_date", dateStr);

        const wasCompleted = existing && existing.length > 0;
        let isArchivedNow = habit.is_archived;

        if (wasCompleted) {
          await supabaseAdmin
            .from("habit_completions")
            .delete()
            .eq("habit_id", habitId)
            .eq("user_id", userId)
            .eq("completed_date", dateStr);

          // Uncomplete corresponding task
          const { data: tasks } = await supabaseAdmin.from("tasks").select("id").eq("user_id", userId).eq("title", habit.name).eq("due_date", dateStr);
          if (tasks && tasks.length > 0) {
            await supabaseAdmin.from("tasks").update({ is_completed: false, completed_at: null, status: "ongoing" }).in("id", tasks.map(t => t.id));
          }
        } else {
          await supabaseAdmin
            .from("habit_completions")
            .insert({ habit_id: habitId, user_id: userId, completed_date: dateStr });

          // Complete corresponding task
          const { data: tasks } = await supabaseAdmin.from("tasks").select("id").eq("user_id", userId).eq("title", habit.name).eq("due_date", dateStr);
          if (tasks && tasks.length > 0) {
            await supabaseAdmin.from("tasks").update({ is_completed: true, completed_at: new Date().toISOString(), status: "completed" }).in("id", tasks.map(t => t.id));
          }

          // Check if habit should auto-archive (all days completed)
          const { count } = await supabaseAdmin.from("habit_completions").select('*', { count: 'exact', head: true }).eq("habit_id", habitId);
          if (count && count >= habit.habit_days && !habit.is_archived) {
            isArchivedNow = true;
            await supabaseAdmin.from("habits").update({ is_archived: true, archived_at: new Date().toISOString() }).eq("id", habitId);
          }
        }

        resultData = { success: true, wasCompleted, autoArchived: (!wasCompleted && isArchivedNow) };
        break;
      }

      case 'update_archived_status': {
        const { habitId, isArchived } = body;
        if (!habitId || typeof isArchived !== 'boolean') throw new Error("Invalid parameters");

        const { error } = await supabaseAdmin
          .from("habits")
          .update({
            is_archived: isArchived,
            archived_at: isArchived ? new Date().toISOString() : null
          })
          .eq("id", habitId)
          .eq("user_id", userId);

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
