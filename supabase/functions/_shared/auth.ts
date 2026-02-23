import { createClient, SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { corsHeaders } from "./cors.ts";

export async function authenticateUser(req: Request): Promise<{ user?: User; supabaseAdmin?: SupabaseClient; errorResponse?: Response }> {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return {
                errorResponse: new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            };
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            return {
                errorResponse: new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            };
        }

        return { user, supabaseAdmin };
    } catch (error) {
        return {
            errorResponse: new Response(JSON.stringify({ error: error.message || 'Authentication error' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        };
    }
}
