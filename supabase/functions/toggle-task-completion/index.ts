import { authenticateUser } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'

console.log("toggle-task-completion edge function loaded");

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
        const { taskId, isCompleted, taskTitle, dueDate, tags } = await req.json()

        if (!taskId) {
            return new Response(JSON.stringify({ error: 'Missing taskId' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Determine completion timestamp
        const completedAt = isCompleted ? new Date().toISOString() : null;

        // 5. Update the Task (Using Admin client, but forcing user_id match for security)
        const { error: taskError } = await supabaseAdmin
            .from("tasks")
            .update({
                is_completed: isCompleted,
                completed_at: completedAt
            })
            .eq("id", taskId)
            .eq("user_id", userId); // Critical security check

        if (taskError) {
            throw taskError;
        }

        // 6. Handle Habit Logic (Hidden from the frontend)
        let habitUpdated = false;

        // Only check habits if the task has the 'Habit' tag, has a due date, and we are completing it
        if (isCompleted && tags?.includes("Habit") && dueDate) {
            // Find matching habit
            const { data: habits } = await supabaseAdmin
                .from("habits")
                .select("id, name")
                .eq("user_id", userId)
                .eq("name", taskTitle);

            if (habits && habits.length > 0) {
                const habitId = habits[0].id;
                const completedDate = dueDate.split("T")[0];

                // Ensure we don't insert a duplicate completion for this date
                const { data: existing } = await supabaseAdmin
                    .from("habit_completions")
                    .select("id")
                    .eq("habit_id", habitId)
                    .eq("completed_date", completedDate);

                if (!existing || existing.length === 0) {
                    const { error: habitError } = await supabaseAdmin
                        .from("habit_completions")
                        .insert({
                            habit_id: habitId,
                            user_id: userId,
                            completed_date: completedDate,
                        });

                    if (habitError) {
                        console.error("Habit completion error:", habitError);
                    } else {
                        habitUpdated = true;
                    }
                }
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Task updated successfully',
                habitUpdated
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )
    } catch (error) {
        console.error("Function error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
