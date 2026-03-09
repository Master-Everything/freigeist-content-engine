import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { guest_name, interview_title, youtube_url, newsletter_text, telegram_text, guest_website_url, guest_short_bio, prettylink_shortcodes, video_transcript } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Du bist ein Content-Redakteur für die Website "Freigeist Kongress". Du erstellst strukturierte Interview-Beiträge auf Deutsch.

Gegeben werden dir Quelldaten zu einem Interview-Gast. Erstelle daraus folgende Inhaltsblöcke im JSON-Format:

{
  "excerpt": "Kurzbeschreibung für die Vorschau (max 160 Zeichen)",
  "summary_box_title": "Titel für die Zusammenfassungsbox",
  "summary_lead": "Einleitender Satz für die Zusammenfassung",
  "summary_points": ["Punkt 1", "Punkt 2", "Punkt 3", "Punkt 4", "Punkt 5"],
  "guest_short_bio": "Kurze Biografie des Gastes (2-3 Sätze)",
  "section_1_title": "Titel Abschnitt 1",
  "section_1_body": "Inhalt Abschnitt 1 (2-3 Absätze)",
  "section_2_title": "Titel Abschnitt 2",
  "section_2_body": "Inhalt Abschnitt 2 (2-3 Absätze)",
  "section_3_title": "Titel Abschnitt 3",
  "section_3_body": "Inhalt Abschnitt 3 (2-3 Absätze)"
}

Schreibe professionell, informativ und ansprechend. Verwende einen journalistischen Stil.`;

    const userPrompt = `Erstelle Interview-Beitragsblöcke für folgende Quelldaten:

Gastname: ${guest_name}
Interview-Titel: ${interview_title}
${youtube_url ? `YouTube URL: ${youtube_url}` : ""}
${newsletter_text ? `Newsletter-Text: ${newsletter_text}` : ""}
${telegram_text ? `Telegram-Post: ${telegram_text}` : ""}
${guest_website_url ? `Gast-Website: ${guest_website_url}` : ""}
${guest_short_bio ? `Gast-Profil: ${guest_short_bio}` : ""}
${prettylink_shortcodes ? `PrettyLink Shortcodes: ${prettylink_shortcodes}` : ""}
${video_transcript ? `Video-Transkript: ${video_transcript}` : ""}

Antworte NUR mit dem JSON-Objekt.`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_post_blocks",
              description: "Generate structured content blocks for an interview post",
              parameters: {
                type: "object",
                properties: {
                  excerpt: { type: "string" },
                  summary_box_title: { type: "string" },
                  summary_lead: { type: "string" },
                  summary_points: { type: "array", items: { type: "string" } },
                  guest_short_bio: { type: "string" },
                  section_1_title: { type: "string" },
                  section_1_body: { type: "string" },
                  section_2_title: { type: "string" },
                  section_2_body: { type: "string" },
                  section_3_title: { type: "string" },
                  section_3_body: { type: "string" },
                },
                required: [
                  "excerpt", "summary_box_title", "summary_lead",
                  "summary_points", "guest_short_bio", "section_1_title", "section_1_body",
                  "section_2_title", "section_2_body", "section_3_title", "section_3_body",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_post_blocks" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        try {
          const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
          return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch {
          console.error("Failed to parse AI response as JSON");
        }
      }
      return new Response(JSON.stringify({ error: "No valid response from AI" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const blocks = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(blocks), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
