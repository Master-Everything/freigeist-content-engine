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

    const systemPrompt = `Du bist ein erfahrener Content-Redakteur für die Website "Freigeist Kongress". Du erstellst umfangreiche, tiefgehende Interview-Beiträge auf Deutsch.

Gegeben werden dir Quelldaten zu einem Interview-Gast. Erstelle daraus folgende Inhaltsblöcke im JSON-Format.

WICHTIGE REGELN:
- Schreibe AUSFÜHRLICH und DETAILLIERT. Jeder Abschnitt soll 4-6 Absätze enthalten.
- Verwende Markdown in den section_body Feldern: ## für Unterüberschriften (H3), ### für Sub-Unterüberschriften (H4), **fett** für Hervorhebungen, - für Aufzählungen.
- Die summary_paragraphs sollen 3-4 AUSFÜHRLICHE Absätze sein (keine Stichpunkte!). Jeder Absatz beginnt mit einer **fettgedruckten Einleitung** gefolgt von einem erklärenden Satz.
- Erstelle 6 inhaltliche Sektionen mit unterschiedlichen Aspekten des Interviews.
- Verwende einen journalistischen, informativen und ansprechenden Stil.
- Nutze Unterüberschriften (##, ###) INNERHALB der Sektions-Bodies um den Text zu strukturieren.
- Integriere wo sinnvoll Aufzählungen mit - für bessere Lesbarkeit.

STRUKTUR:
{
  "excerpt": "Kurzbeschreibung für die Vorschau (max 200 Zeichen)",
  "summary_box_title": "Titel für die Zusammenfassungsbox (z.B. 'Die wichtigsten Erkenntnisse aus dem Interview')",
  "summary_lead": "Einleitender Satz für die Zusammenfassung",
  "summary_paragraphs": [
    "**Fettgedruckte Einleitung:** Gefolgt von einem ausführlichen Absatz der diesen Aspekt des Interviews zusammenfasst...",
    "**Weitere Erkenntnis:** Noch ein ausführlicher Absatz...",
    "**Dritter Punkt:** Detaillierte Zusammenfassung...",
    "**Fazit:** Abschließender Zusammenfassungs-Absatz..."
  ],
  "guest_short_bio": "Ausführliche Biografie des Gastes (3-4 Sätze, inkl. Werdegang und Expertise)",
  "section_1_title": "Titel Abschnitt 1",
  "section_1_body": "## Unterüberschrift\\n\\nAusführlicher Text mit mehreren Absätzen...\\n\\n## Weitere Unterüberschrift\\n\\nMehr Text...",
  "section_2_title": "Titel Abschnitt 2",
  "section_2_body": "Umfangreicher Inhalt mit ## Unterüberschriften und **Hervorhebungen**...",
  "section_3_title": "Titel Abschnitt 3",
  "section_3_body": "...",
  "section_4_title": "Titel Abschnitt 4",
  "section_4_body": "...",
  "section_5_title": "Titel Abschnitt 5",
  "section_5_body": "...",
  "section_6_title": "Titel Abschnitt 6 (Fazit / Ausblick)",
  "section_6_body": "..."
}`;

    const userPrompt = `Erstelle einen umfangreichen Interview-Beitrag für folgende Quelldaten:

Gastname: ${guest_name}
Interview-Titel: ${interview_title}
${youtube_url ? `YouTube URL: ${youtube_url}` : ""}
${newsletter_text ? `Newsletter-Text: ${newsletter_text}` : ""}
${telegram_text ? `Telegram-Post: ${telegram_text}` : ""}
${guest_website_url ? `Gast-Website: ${guest_website_url}` : ""}
${guest_short_bio ? `Gast-Profil: ${guest_short_bio}` : ""}
${prettylink_shortcodes ? `PrettyLink Shortcodes: ${prettylink_shortcodes}` : ""}
${video_transcript ? `Video-Transkript: ${video_transcript}` : ""}

WICHTIG: Schreibe SEHR ausführlich. Jede Sektion soll 4-6 Absätze mit Unterüberschriften enthalten. Die Zusammenfassung soll aus 3-4 detaillierten Absätzen bestehen, NICHT aus Stichpunkten.

Antworte NUR mit dem JSON-Objekt.`;

    const sectionProps: Record<string, { type: string }> = {};
    for (let i = 1; i <= 6; i++) {
      sectionProps[`section_${i}_title`] = { type: "string" };
      sectionProps[`section_${i}_body`] = { type: "string" };
    }

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
                  summary_paragraphs: { type: "array", items: { type: "string" } },
                  guest_short_bio: { type: "string" },
                  ...sectionProps,
                },
                required: [
                  "excerpt", "summary_box_title", "summary_lead",
                  "summary_paragraphs", "guest_short_bio",
                  "section_1_title", "section_1_body",
                  "section_2_title", "section_2_body",
                  "section_3_title", "section_3_body",
                  "section_4_title", "section_4_body",
                  "section_5_title", "section_5_body",
                  "section_6_title", "section_6_body",
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
