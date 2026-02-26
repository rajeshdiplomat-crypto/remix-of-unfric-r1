import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { corsHeaders } from "./cors.ts";

export async function authenticateUser(req: Request): Promise<{ user?: User; supabaseAdmin?: SupabaseClient; errorResponse?: Response }> {
    try {

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ""
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ""

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return {
                errorResponse: new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            };
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } },
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const { data, error: userError } = await supabaseAdmin.auth.getUser();
        const user = data?.user;

        if (userError || !user) {

            console.error("Auth helper error:", userError?.message);
            return {
                errorResponse: new Response(JSON.stringify({ error: `Unauthorized: ${userError?.message || 'Invalid token'}` }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            };
        }
        console.log('User Authenticated:', user.id)

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
