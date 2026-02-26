import { authenticateUser } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'

console.log("manage-diary edge function loaded");

// Simple regex to extract src from img tags
function extractImagesFromHTML(html: string): string[] {
  if (!html) return [];
  const regex = /<img[^>]+src="([^">]+)"/g;
  const images = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    if (match[1].startsWith('http')) {
      images.push(match[1]);
    }
  }
  return images;
}

// Simple walker for Tiptap JSON
function extractImagesFromTiptapJSON(jsonStr: string): string[] {
  if (!jsonStr) return [];
  try {
    const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
    const images: string[] = [];
    const walk = (node: any) => {
      if (!node) return;
      if ((node.type === 'image' || node.type === 'imageResize') && node.attrs?.src) {
        if (typeof node.attrs.src === 'string' && node.attrs.src.startsWith('http')) {
          images.push(node.attrs.src);
        }
      }
      if (Array.isArray(node.content)) {
        node.content.forEach(walk);
      }
    };
    walk(parsed);
    return images;
  } catch {
    return [];
  }
}

const DEFAULT_QUESTIONS = [
  { id: "feeling", text: "How are you feeling today?" },
  { id: "gratitude", text: "What are you grateful for?" },
  { id: "kindness", text: "What act of kindness did you do or receive?" },
  { id: "additional", text: "Additional thoughts…" }
];

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
      case 'fetch_metrics': {
        const [tasksRes, journalRes, goalsRes, manifestJournalRes, notesRes, emotionsRes] = await Promise.all([
          supabaseAdmin.from("tasks").select("*").eq("user_id", user.id),
          supabaseAdmin.from("journal_entries").select("*").eq("user_id", user.id).order("entry_date", { ascending: false }),
          supabaseAdmin.from("manifest_goals").select("*").eq("user_id", user.id),
          supabaseAdmin.from("manifest_journal").select("*").eq("user_id", user.id),
          supabaseAdmin.from("notes").select("*").eq("user_id", user.id),
          supabaseAdmin.from("emotions").select("*").eq("user_id", user.id),
        ]);

        resultData = {
          tasks: tasksRes.data || [],
          journalEntries: journalRes.data || [],
          manifestGoals: goalsRes.data || [],
          manifestJournal: manifestJournalRes.data || [],
          notes: notesRes.data || [],
          emotions: emotionsRes.data || [],
        };
        break;
      }

      case 'seed_feed_events': {
        const [tasksRes, journalRes, journalAnswersRes, notesRes, habitsRes, habitCompletionsRes, goalsRes, emotionsRes, practicesRes] = await Promise.all([
          supabaseAdmin.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
          supabaseAdmin.from("journal_entries").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
          supabaseAdmin.from("journal_answers").select("*, journal_entries!inner(user_id, entry_date, created_at)").order("created_at", { ascending: false }).limit(100),
          supabaseAdmin.from("notes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
          supabaseAdmin.from("habits").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
          supabaseAdmin.from("habit_completions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
          supabaseAdmin.from("manifest_goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
          supabaseAdmin.from("emotions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
          supabaseAdmin.from("manifest_practices").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
        ]);

        const feedEvents: any[] = [];

        // Tasks
        (tasksRes.data || []).forEach((task) => {
          feedEvents.push({
            user_id: user.id, type: "create", source_module: "tasks", source_id: task.id,
            title: task.title, summary: "Created a new task", content_preview: task.description,
            metadata: { priority: task.priority, due_date: task.due_date }, created_at: task.created_at,
          });
          if (task.is_completed && task.completed_at) {
            feedEvents.push({
              user_id: user.id, type: "complete", source_module: "tasks", source_id: task.id,
              title: task.title, summary: "Completed a task ✓", content_preview: task.description,
              metadata: { priority: task.priority, due_date: task.due_date }, created_at: task.completed_at,
            });
          }
          if (task.started_at && task.started_at !== task.created_at) {
            feedEvents.push({
              user_id: user.id, type: "update", source_module: "tasks", source_id: task.id,
              title: task.title, summary: "Started working on task", content_preview: task.description,
              metadata: { priority: task.priority, due_date: task.due_date }, created_at: task.started_at,
            });
          }
        });

        // Journal
        const answersData = (journalAnswersRes.data || []).filter((a: any) => a.journal_entries?.user_id === user.id);
        const journalQuestionImageMap = new Map<string, Map<string, string[]>>();
        (journalRes.data || []).forEach((entry) => {
          const questionImages = new Map<string, string[]>();
          if (entry.text_formatting) {
            try {
              const parsed = typeof entry.text_formatting === 'string' ? JSON.parse(entry.text_formatting) : entry.text_formatting;
              let currentQuestion: string | null = null;
              if (parsed?.content && Array.isArray(parsed.content)) {
                for (const node of parsed.content) {
                  if (node.type === 'heading' && node.attrs?.level === 2 && node.content?.[0]?.text) {
                    const headingText = node.content[0].text;
                    const matchedQ = DEFAULT_QUESTIONS.find(q => q.text === headingText);
                    currentQuestion = matchedQ?.id || headingText;
                    if (!questionImages.has(currentQuestion)) questionImages.set(currentQuestion, []);
                  } else if (currentQuestion && (node.type === 'image' || node.type === 'imageResize') && node.attrs?.src) {
                    if (typeof node.attrs.src === 'string' && node.attrs.src.startsWith('http')) {
                      questionImages.get(currentQuestion)!.push(node.attrs.src);
                    }
                  }
                }
              }
            } catch {}
          }
          journalQuestionImageMap.set(entry.id, questionImages);
        });

        answersData.forEach((answer: any) => {
          const question = DEFAULT_QUESTIONS.find((q) => q.id === answer.question_id);
          const questionLabel = question?.text || answer.question_id;
          const journalEntry = answer.journal_entries;
          const answerImages = extractImagesFromHTML(answer.answer_text || "");
          const tiptapImages = journalQuestionImageMap.get(answer.journal_entry_id)?.get(answer.question_id) || [];
          const media = [...new Set([...answerImages, ...tiptapImages])];

          feedEvents.push({
            user_id: user.id, type: "journal_question", source_module: "journal", source_id: answer.id,
            title: questionLabel, summary: answer.answer_text || "", content_preview: answer.answer_text || "",
            media, metadata: { journal_date: journalEntry?.entry_date, entry_id: answer.journal_entry_id, question_id: answer.question_id, question_label: questionLabel, answer_content: answer.answer_text || "" },
            created_at: journalEntry?.created_at || answer.created_at,
          });
        });

        // Notes
        (notesRes.data || []).forEach((note) => {
          const noteMedia: string[] = [];
          if (note.cover_image_url) noteMedia.push(note.cover_image_url);
          if (noteMedia.length === 0 && note.content) {
            const htmlImages = extractImagesFromHTML(note.content);
            htmlImages.forEach(url => { if (!noteMedia.includes(url)) noteMedia.push(url); });
            if (noteMedia.length === 0) {
              const jsonImages = extractImagesFromTiptapJSON(note.content);
              jsonImages.forEach(url => { if (!noteMedia.includes(url)) noteMedia.push(url); });
            }
          }
          feedEvents.push({
            user_id: user.id, type: "create", source_module: "notes", source_id: note.id,
            title: note.title, summary: "Created a note", content_preview: note.content ? String(note.content).replace(/<[^>]*>/g, '').substring(0, 200) : undefined,
            media: noteMedia, metadata: { category: note.category, tags: note.tags }, created_at: note.created_at,
          });
        });

        // Habits
        (habitsRes.data || []).forEach((habit) => {
          feedEvents.push({
            user_id: user.id, type: "create", source_module: "trackers", source_id: habit.id,
            title: habit.name, summary: "Created a habit tracker", content_preview: habit.description,
            media: habit.cover_image_url ? [habit.cover_image_url] : [], metadata: { frequency: habit.frequency }, created_at: habit.created_at,
          });
        });

        // Habit Completions
        const habitsMap = new Map((habitsRes.data || []).map(h => [h.id, h]));
        (habitCompletionsRes.data || []).forEach((completion) => {
          const habit = habitsMap.get(completion.habit_id);
          const habitName = habit?.name || "Habit";
          feedEvents.push({
            user_id: user.id, type: "complete", source_module: "trackers", source_id: completion.id,
            title: habitName, summary: `Completed daily check-in ✓`, content_preview: `Marked "${habitName}" as done for ${completion.completed_date}`,
            media: habit?.cover_image_url ? [habit.cover_image_url] : [], metadata: { habit_id: completion.habit_id, completed_date: completion.completed_date }, created_at: completion.created_at,
          });
        });

        // Manifest Goals
        (goalsRes.data || []).forEach((goal) => {
          const media: string[] = [];
          if (goal.cover_image_url && typeof goal.cover_image_url === "string" && goal.cover_image_url.startsWith("http")) media.push(goal.cover_image_url);
          const visionImages = Array.isArray(goal.vision_images) ? goal.vision_images : [];
          visionImages.forEach((img: any) => { if (typeof img === "string" && img.startsWith("http") && !media.includes(img)) media.push(img); });
          feedEvents.push({
            user_id: user.id, type: goal.is_completed ? "complete" : "create", source_module: "manifest", source_id: goal.id,
            title: goal.title, summary: goal.is_completed ? "Achieved a goal!" : "Set a new manifestation goal", content_preview: goal.description,
            media, metadata: { affirmations: goal.affirmations, feeling: goal.feeling_when_achieved }, created_at: goal.created_at,
          });
        });

        // Manifest Practices
        const goalsMap2 = new Map((goalsRes.data || []).map(g => [g.id, g]));
        (practicesRes.data || []).forEach((practice: any) => {
          if (!practice.locked) return;
          const goal = goalsMap2.get(practice.goal_id);
          const media: string[] = [];
          if (goal?.cover_image_url && typeof goal.cover_image_url === "string" && goal.cover_image_url.startsWith("http")) media.push(goal.cover_image_url);
          const proofs = Array.isArray(practice.proofs) ? practice.proofs : [];
          proofs.forEach((p: any) => { if (p.image_url && typeof p.image_url === "string" && !media.includes(p.image_url)) media.push(p.image_url); });

          const contentLines: string[] = [];
          const visualizations = Array.isArray(practice.visualizations) ? practice.visualizations : [];
          if (visualizations.length > 0) contentLines.push(`🧘 Visualized ${visualizations.length}x`);
          const acts = Array.isArray(practice.acts) ? practice.acts : [];
          if (acts.length > 0) { contentLines.push(`⚡ Actions taken:`); acts.forEach((a: any) => { if (a.text) contentLines.push(`  • ${a.text}`); }); }
          if (proofs.length > 0) { contentLines.push(`📸 Proof logged:`); proofs.forEach((p: any) => { if (p.text) contentLines.push(`  • ${p.text}`); }); }
          const gratitudes = Array.isArray(practice.gratitudes) ? practice.gratitudes : [];
          if (gratitudes.length > 0) { contentLines.push(`🙏 Gratitude:`); gratitudes.forEach((g: any) => { if (g.text) contentLines.push(`  • ${g.text}`); }); }
          if (practice.growth_note) contentLines.push(`💡 ${practice.growth_note}`);

          feedEvents.push({
            user_id: user.id, type: "checkin", source_module: "manifest", source_id: practice.id,
            title: goal?.title || "Reality", summary: `Daily practice completed ✓`, content_preview: contentLines.length > 0 ? contentLines.join("\n") : "Completed daily practice",
            media, metadata: { goal_id: practice.goal_id, entry_date: practice.entry_date, visualization_count: visualizations.length, act_count: acts.length, proofs_count: proofs.length, gratitudes_count: gratitudes.length, growth_note: practice.growth_note },
            created_at: practice.created_at,
          });
        });

        // Emotions
        (emotionsRes.data || []).forEach((emotion) => {
          let parsedEmotion = { quadrant: "", emotion: "", context: {} as any };
          try {
            const parsed = JSON.parse(emotion.emotion);
            parsedEmotion = parsed;
          } catch {
            const emotionParts = emotion.emotion.split(":");
            parsedEmotion.emotion = emotionParts[0];
            parsedEmotion.quadrant = emotionParts[1] || "";
          }
          const contextParts: string[] = [];
          if (parsedEmotion.context?.who) contextParts.push(`with ${parsedEmotion.context.who}`);
          if (parsedEmotion.context?.what) contextParts.push(`while ${parsedEmotion.context.what}`);
          const emotionLabel = parsedEmotion.emotion || "Unknown";

          feedEvents.push({
            user_id: user.id, type: "checkin", source_module: "emotions", source_id: emotion.id,
            title: `Feeling ${emotionLabel.charAt(0).toUpperCase() + emotionLabel.slice(1)}`, summary: contextParts.length > 0 ? contextParts.join(" ") : null, content_preview: emotion.notes,
            metadata: { quadrant: parsedEmotion.quadrant, emotion: parsedEmotion.emotion, context: parsedEmotion.context, tags: emotion.tags, entry_date: emotion.entry_date },
            created_at: emotion.created_at,
          });
        });

        if (feedEvents.length > 0) {
          await supabaseAdmin.from("feed_events").delete().eq("user_id", user.id);
          await supabaseAdmin.from("feed_events").insert(feedEvents);
        }

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
    console.error(`manage-diary error:`, error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
