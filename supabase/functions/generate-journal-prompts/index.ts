import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mood, recentEntryPreview, streak } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const moodContext = mood 
      ? `The user's current mood is: ${mood}. ` 
      : "";
    
    const entryContext = recentEntryPreview 
      ? `Their recent journal entry touched on: "${recentEntryPreview.slice(0, 200)}". ` 
      : "";
    
    const streakContext = streak > 0 
      ? `They have a ${streak}-day journaling streak. ` 
      : "";

    const systemPrompt = `You are a thoughtful journaling companion. Generate 4 unique, personalized journal prompts that encourage self-reflection and emotional exploration. 

Guidelines:
- Make prompts feel personal and relevant to the user's context
- Mix introspective questions with gratitude and future-focused prompts
- Keep prompts concise but meaningful (1-2 sentences each)
- Avoid generic prompts - make them feel tailored
- If mood is "low" or "okay", include supportive, gentle prompts
- If mood is "great" or "good", include celebratory and growth prompts
- Consider their streak milestone if relevant

Return ONLY a valid JSON object with this exact structure:
{
  "prompts": [
    {"text": "prompt 1", "category": "reflection"},
    {"text": "prompt 2", "category": "gratitude"},
    {"text": "prompt 3", "category": "growth"},
    {"text": "prompt 4", "category": "mindfulness"}
  ]
}`;

    const userMessage = `Generate personalized journal prompts for today. ${moodContext}${entryContext}${streakContext}`;

    console.log("Generating prompts with context:", { mood, hasEntry: !!recentEntryPreview, streak });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let prompts;
    try {
      // Handle potential markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      const jsonStr = jsonMatch[1] || content;
      prompts = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Fallback prompts
      prompts = {
        prompts: [
          { text: "What moment made you feel most alive today?", category: "reflection" },
          { text: "What are three things you're grateful for right now?", category: "gratitude" },
          { text: "What's one small step you can take toward a goal tomorrow?", category: "growth" },
          { text: "How is your body feeling right now? Take a moment to check in.", category: "mindfulness" },
        ],
      };
    }

    console.log("Generated prompts successfully");

    return new Response(JSON.stringify(prompts), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating prompts:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to generate prompts",
        prompts: [
          { text: "What's on your mind today?", category: "reflection" },
          { text: "What made you smile recently?", category: "gratitude" },
          { text: "What would make today great?", category: "growth" },
          { text: "How are you really feeling right now?", category: "mindfulness" },
        ],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
