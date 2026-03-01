// Use ALLOWED_ORIGIN env var in production; falls back to '*' for local dev
const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || '*';

export const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PATCH, DELETE',
}
