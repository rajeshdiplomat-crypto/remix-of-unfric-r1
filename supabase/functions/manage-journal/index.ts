import { authenticateUser } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'

console.log("manage-journal edge function loaded");

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
          .from("journal_entries")
          .select("*")
          .eq("user_id", user.id)
          .order("entry_date", { ascending: false });

        if (error) throw error;
        resultData = data;
        break;
      }

      case 'fetch_entry': {
        const { dateStr } = body;
        if (!dateStr) throw new Error("Missing dateStr");

        const { data: entryData, error: entryError } = await supabaseAdmin
          .from("journal_entries")
          .select("*")
          .eq("user_id", user.id)
          .eq("entry_date", dateStr)
          .maybeSingle();

        if (entryError) throw entryError;

        let answersData = [];
        if (entryData) {
          const { data, error: answersError } = await supabaseAdmin
            .from("journal_answers")
            .select("*")
            .eq("journal_entry_id", entryData.id);
          
          if (answersError) throw answersError;
          answersData = data || [];
        }

        resultData = { entry: entryData, answers: answersData };
        break;
      }

      case 'upsert_entry': {
        const { entryId, entry, answers } = body;
        if (!entry) throw new Error("Missing entry data");

        // Force correct user_id
        const safeEntry = { ...entry, user_id: user.id };
        let insertedEntryId = entryId;

        if (entryId) {
          const { error } = await supabaseAdmin
            .from("journal_entries")
            .update({
              ...safeEntry,
              updated_at: new Date().toISOString()
            })
            .eq("id", entryId)
            .eq("user_id", user.id);
          if (error) throw error;
        } else {
          const { data, error } = await supabaseAdmin
            .from("journal_entries")
            .insert(safeEntry)
            .select()
            .single();
          if (error) throw error;
          insertedEntryId = data.id;
        }

        if (answers && Array.isArray(answers)) {
          // Simplest is to delete existing answers and re-insert, or upsert by question_id.
          // Since answers have their own IDs, we can update existing and insert new
          for (const answer of answers) {
            if (answer.id) {
              await supabaseAdmin
                .from("journal_answers")
                .update({ answer_text: answer.answer_text, updated_at: new Date().toISOString() })
                .eq("id", answer.id);
            } else {
              await supabaseAdmin.from("journal_answers").insert({
                journal_entry_id: insertedEntryId,
                question_id: answer.question_id,
                answer_text: answer.answer_text,
              });
            }
          }
        }

        const { data: updatedAnswers } = await supabaseAdmin
          .from("journal_answers")
          .select("*")
          .eq("journal_entry_id", insertedEntryId);

        const { data: updatedEntry } = await supabaseAdmin
          .from("journal_entries")
          .select("*")
          .eq("id", insertedEntryId)
          .single();

        resultData = { entry: updatedEntry, answers: updatedAnswers || [] };
        break;
      }

      case 'delete_entry': {
        const { entryId } = body;
        if (!entryId) throw new Error("Missing entryId");

        // Delete answers first (foreign key might cascade, but just in case)
        await supabaseAdmin.from("journal_answers").delete().eq("journal_entry_id", entryId);
        
        const { error } = await supabaseAdmin
          .from("journal_entries")
          .delete()
          .eq("id", entryId)
          .eq("user_id", user.id);

        if (error) throw error;
        resultData = { success: true };
        break;
      }

      case 'insert_answer': {
        const { entryId, questionId, answerText } = body;
        if (!entryId || !questionId) throw new Error("Missing answer data");

        const { data, error } = await supabaseAdmin
          .from("journal_answers")
          .insert({
            journal_entry_id: entryId,
            question_id: questionId,
            answer_text: answerText,
            user_id: user.id
          })
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
    console.error(`manage-journal error:`, error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
