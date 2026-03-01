import { authenticateUser } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { format } from "npm:date-fns" // Deno uses npm specifiers

console.log("manage-emotions edge function loaded");

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
      case 'fetch_entries': {
        const { data, error } = await supabaseAdmin
          .from("emotions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) throw error;
        resultData = data;
        break;
      }

      case 'insert_emotion': {
        const { emotionData, notes, tags, entry_date, sendToJournal, feedSummary } = body;
        
        const safeEmotion = {
          user_id: user.id,
          emotion: emotionData,
          notes: notes || null,
          tags: tags || null,
          entry_date: entry_date,
        };

        const { data: insertedEmotion, error } = await supabaseAdmin
          .from("emotions")
          .insert(safeEmotion)
          .select("*")
          .single();

        if (error) throw error;

        // Parse emotion for feed events
        let parsedData = {};
        try {
          parsedData = typeof emotionData === 'string' ? JSON.parse(emotionData) : emotionData;
        } catch(e) {}

        const emotionStr = parsedData.emotion || "Unknown";
        const quadrant = parsedData.quadrant || "unknown";

        // Insert into feed_events
        await supabaseAdmin.from("feed_events").insert({
          user_id: user.id,
          type: "checkin",
          source_module: "emotions",
          source_id: insertedEmotion.id,
          title: `Feeling ${emotionStr}`,
          summary: feedSummary || null,
          content_preview: notes || null,
          media: [],
          metadata: { quadrant, emotion: emotionStr, context: parsedData.context, entry_date: entry_date },
        });

        // Insert into journal if needed
        if (sendToJournal) {
          const { data: existingEntry } = await supabaseAdmin
            .from("journal_entries")
            .select("id")
            .eq("user_id", user.id)
            .eq("entry_date", entry_date)
            .maybeSingle();

          let journalEntryId;

          if (existingEntry) {
            journalEntryId = existingEntry.id;
          } else {
            const { data: newEntry } = await supabaseAdmin
              .from("journal_entries")
              .insert({ user_id: user.id, entry_date: entry_date })
              .select("id")
              .single();
            if (newEntry) journalEntryId = newEntry.id;
          }

          if (journalEntryId) {
            const { data: existingAnswer } = await supabaseAdmin
              .from("journal_answers")
              .select("id, answer_text")
              .eq("journal_entry_id", journalEntryId)
              .eq("question_id", "feeling")
              .maybeSingle();

            const emotionNote = notes ? `[${emotionStr}] ${notes}` : `[${emotionStr}]`;

            if (existingAnswer) {
              const updatedText = existingAnswer.answer_text
                ? `${existingAnswer.answer_text}\n\n${emotionNote}`
                : emotionNote;

              await supabaseAdmin.from("journal_answers").update({ answer_text: updatedText }).eq("id", existingAnswer.id);
            } else {
              await supabaseAdmin.from("journal_answers").insert({
                journal_entry_id: journalEntryId,
                question_id: "feeling",
                answer_text: emotionNote,
              });
            }
          }
        }

        resultData = insertedEmotion;
        break;
      }

      case 'update_emotion': {
        const { entryId, updates } = body;
        if (!entryId) throw new Error("Missing entryId");

        const { data, error } = await supabaseAdmin
          .from("emotions")
          .update(updates)
          .eq("id", entryId)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        resultData = data;
        break;
      }

      case 'delete_emotion': {
        const { entryId } = body;
        if (!entryId) throw new Error("Missing entryId");

        const { error } = await supabaseAdmin
          .from("emotions")
          .delete()
          .eq("id", entryId)
          .eq("user_id", user.id);

        if (error) throw error;
        resultData = { success: true };
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
    console.error(`manage-emotions error:`, error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
