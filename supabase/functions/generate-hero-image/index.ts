import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROMPTS: Record<string, string> = {
  diary: "Minimalist editorial photograph of an open leather notebook on clean marble desk, soft natural window light, luxury lifestyle aesthetic, warm neutral tones, shallow depth of field, ultra high resolution",
  emotions: "Artistic portrait of a person in peaceful contemplation, soft diffused light, minimal background, warm earth tones, editorial fashion photography style, ultra high resolution",
  journal: "Close-up of hands writing in premium leather journal, fountain pen, clean white desk, natural light, lifestyle luxury aesthetic, ultra high resolution",
  manifest: "Elegant vision board with minimal elements, soft neutral colors, clean composition, editorial style, aspirational luxury aesthetic, ultra high resolution",
  notes: "Minimalist desk setup with single quality notepad and pen, clean composition, soft shadows, warm neutral palette, premium lifestyle, ultra high resolution",
  tasks: "Organized workspace with clean lines, geometric elements, soft morning light, minimal aesthetic, productivity lifestyle, ultra high resolution",
  trackers: "Abstract visualization of progress, geometric shapes, soft gradients, minimal design, warm muted tones, ultra high resolution",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pageType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = PROMPTS[pageType] || PROMPTS.diary;
    console.log(`Generating hero image for page type: ${pageType}`);
    console.log(`Using prompt: ${prompt}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI gateway error: ${response.status} - ${errorText}`);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image URL in response:", JSON.stringify(data));
      throw new Error("No image generated");
    }

    console.log("Successfully generated hero image");

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating hero image:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
