import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { corsHeaders } from '../_shared/cors.ts'

console.log("toggle-task-completion edge function loaded");

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
        // We use this to bypass RLS internally, but ONLY after we manually verify the user
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

        // 3. Very Important: Validate the User's JWT against Supabase Auth
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
