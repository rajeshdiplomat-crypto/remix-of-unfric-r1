import { authenticateUser } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'

console.log("manage-feed edge function loaded");

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

    const { action } = body;
    if (!action) {
      return new Response(JSON.stringify({ error: 'Missing action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let resultData = null;

    switch (action) {
      case 'fetch_events': {
        const { filter } = body;
        
        let query = supabaseAdmin
          .from("feed_events")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (filter && filter !== 'all' && filter !== 'saved') {
          query = query.eq("source_module", filter);
        }

        const { data: eventsData, error: eventsError } = await query;
        if (eventsError) throw eventsError;

        let filteredEvents = eventsData || [];

        // If 'saved', filter down to only those in feed_saves
        if (filter === 'saved') {
          const { data: savesData } = await supabaseAdmin
            .from("feed_saves")
            .select("feed_event_id")
            .eq("user_id", user.id);
          
          const savedIds = new Set((savesData || []).map(s => s.feed_event_id));
          filteredEvents = filteredEvents.filter(e => savedIds.has(e.id));
        }

        const eventIds = filteredEvents.map(e => e.id);
        let reactionsData = [];
        let commentsData = [];
        let savesData = [];

        if (eventIds.length > 0) {
          const [reactionsRes, commentsRes, savesRes] = await Promise.all([
            supabaseAdmin.from("feed_reactions").select("*").in("feed_event_id", eventIds),
            supabaseAdmin.from("feed_comments").select("*").in("feed_event_id", eventIds).order("created_at", { ascending: true }),
            supabaseAdmin.from("feed_saves").select("feed_event_id").eq("user_id", user.id)
          ]);
          
          reactionsData = reactionsRes.data || [];
          commentsData = commentsRes.data || [];
          savesData = savesRes.data || [];
        }

        resultData = {
          events: filteredEvents,
          reactions: reactionsData,
          comments: commentsData,
          saves: savesData
        };
        break;
      }

      case 'toggle_reaction': {
        const { eventId, emoji } = body;
        if (!eventId || !emoji) throw new Error("Missing eventId or emoji");

        const { data: existingReaction } = await supabaseAdmin
          .from("feed_reactions")
          .select("id, emoji")
          .eq("user_id", user.id)
          .eq("feed_event_id", eventId)
          .maybeSingle();

        if (existingReaction) {
          if (existingReaction.emoji === emoji) {
            await supabaseAdmin.from("feed_reactions").delete().eq("id", existingReaction.id);
            resultData = { action: 'removed', id: existingReaction.id };
          } else {
            const { data } = await supabaseAdmin
              .from("feed_reactions")
              .update({ emoji })
              .eq("id", existingReaction.id)
              .select()
              .single();
            resultData = { action: 'updated', data };
          }
        } else {
          const { data } = await supabaseAdmin
            .from("feed_reactions")
            .insert({ user_id: user.id, feed_event_id: eventId, emoji })
            .select()
            .single();
          resultData = { action: 'added', data };
        }
        break;
      }

      case 'add_comment': {
        const { eventId, text, parentId } = body;
        if (!eventId || !text) throw new Error("Missing eventId or text");

        const { data, error } = await supabaseAdmin
          .from("feed_comments")
          .insert({
            user_id: user.id,
            feed_event_id: eventId,
            parent_comment_id: parentId || null,
            text: text.trim(),
          })
          .select()
          .single();

        if (error) throw error;
        resultData = data;
        break;
      }

      case 'edit_comment': {
        const { commentId, text } = body;
        if (!commentId || !text) throw new Error("Missing commentId or text");

        const { error } = await supabaseAdmin
          .from("feed_comments")
          .update({ text: text.trim(), is_edited: true })
          .eq("id", commentId)
          .eq("user_id", user.id);

        if (error) throw error;
        resultData = { success: true };
        break;
      }

      case 'delete_comment': {
        const { commentId } = body;
        if (!commentId) throw new Error("Missing commentId");

        const { error } = await supabaseAdmin
          .from("feed_comments")
          .delete()
          .eq("id", commentId)
          .eq("user_id", user.id);

        if (error) throw error;
        resultData = { success: true };
        break;
      }

      case 'toggle_save': {
        const { eventId } = body;
        if (!eventId) throw new Error("Missing eventId");

        const { data: existing } = await supabaseAdmin
          .from("feed_saves")
          .select("id")
          .eq("user_id", user.id)
          .eq("feed_event_id", eventId)
          .maybeSingle();

        if (existing) {
          await supabaseAdmin.from("feed_saves").delete().eq("id", existing.id);
          resultData = { action: 'removed' };
        } else {
          await supabaseAdmin.from("feed_saves").insert({ user_id: user.id, feed_event_id: eventId });
          resultData = { action: 'added' };
        }
        break;
      }

      case 'create_event': {
        const { event } = body;
        if (!event) throw new Error("Missing event data");

        const { data, error } = await supabaseAdmin
          .from("feed_events")
          .insert({ ...event, user_id: user.id })
          .select()
          .single();

        if (error) throw error;
        resultData = data;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(
      JSON.stringify({ success: true, data: resultData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error(`manage-feed error:`, error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
