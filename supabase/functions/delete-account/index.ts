import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user with their JWT
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Use service role client for deletion
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Delete order matters due to foreign keys
    const tables = [
      "feed_comments",
      "feed_reactions",
      "feed_saves",
      "feed_events",
      "journal_answers",
      "journal_entries",
      "journal_prompts",
      "journal_settings",
      "habit_completions",
      "habits",
      "manifest_practices",
      "manifest_journal",
      "manifest_goals",
      "emotions",
      "notes",
      "note_folders",
      "note_groups",
      "focus_sessions",
      "tasks",
      "hero_media",
      "user_settings",
      "user_inquiries",
      "consent_logs",
      "profiles",
    ];

    for (const table of tables) {
      const { error } = await adminClient.from(table).delete().eq("user_id", userId);
      if (error) {
        console.error(`Failed to delete from ${table}:`, error.message);
      }
    }

    // Delete the auth user
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      console.error("Failed to delete auth user:", deleteUserError.message);
      return new Response(
        JSON.stringify({ error: "Failed to delete account. Please try again." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Account deleted for user ${userId} at ${new Date().toISOString()}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
