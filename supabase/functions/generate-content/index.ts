import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const {
      post_id,
      speaker_id,
      guest_name,
      interview_title,
      youtube_url,
      newsletter_text,
      telegram_text,
      guest_website_url,
      guest_short_bio,
      prettylink_shortcodes,
      video_transcript,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // ---- Zusätzliche Kontexte aus DB ziehen -------------------------------
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    let speakerProfileBlock = "";
    let guideBlock = "";
    let complianceBlock = "";
    let bannedBlock = "";

    if (speaker_id && post_id) {
      const { data: prof } = await sb
        .from("speaker_profiles")
        .select("kurzbio, langbio, positionierung, zielgruppe, themen, kernaussagen, mediale_hooks")
        .eq("post_id", post_id)
        .eq("status", "freigegeben")
        .maybeSingle();
      if (prof) {
        const parts: string[] = [];
        if (prof.kurzbio) parts.push(`Kurzbio: ${prof.kurzbio}`);
        if (prof.langbio) parts.push(`Langbio: ${prof.langbio}`);
        if (prof.positionierung) parts.push(`Positionierung: ${prof.positionierung}`);
        if (prof.zielgruppe) parts.push(`Zielgruppe: ${prof.zielgruppe}`);
        if (prof.themen?.length) parts.push(`Themen: ${(prof.themen as string[]).join(", ")}`);
        if (prof.kernaussagen?.length) parts.push(`Kernaussagen:\n- ${(prof.kernaussagen as string[]).join("\n- ")}`);
        if (prof.mediale_hooks?.length) parts.push(`Mediale Hooks:\n- ${(prof.mediale_hooks as string[]).join("\n- ")}`);
        speakerProfileBlock = parts.join("\n");
      }
    }

    if (post_id) {
      const { data: guide } = await sb
        .from("interview_guides")
        .select("intro, hauptfragen, vertiefungsfragen, kritische_fragen, abschluss")
        .eq("post_id", post_id)
        .eq("status", "final")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (guide) {
        const fmt = (arr: any[] | null | undefined) =>
          (arr ?? []).filter((q: any) => q?.active).map((q: any, i: number) => `${i + 1}. ${q.text}`).join("\n");
        const parts: string[] = [];
        if (guide.intro) parts.push(`Intro: ${guide.intro}`);
        const h = fmt(guide.hauptfragen as any[]);
        if (h) parts.push(`Hauptfragen:\n${h}`);
        const v = fmt(guide.vertiefungsfragen as any[]);
        if (v) parts.push(`Vertiefungsfragen:\n${v}`);
        const k = fmt(guide.kritische_fragen as any[]);
        if (k) parts.push(`Kritische Fragen:\n${k}`);
        if (guide.abschluss) parts.push(`Abschluss: ${guide.abschluss}`);
        guideBlock = parts.join("\n\n");
      }
    }

    const [{ data: rules }, { data: banned }] = await Promise.all([
      sb.from("knowledge_compliance_rules")
        .select("code, question_text, risk_response_text, severity")
        .eq("active", true),
      sb.from("knowledge_banned_words")
        .select("term, replacement_suggestion, severity")
        .eq("active", true),
    ]);
    if (rules?.length) {
      complianceBlock = rules
        .map((r: any) => `- [${r.severity ?? "info"}] ${r.code ? r.code + ": " : ""}${r.question_text ?? ""}${r.risk_response_text ? ` → ${r.risk_response_text}` : ""}`)
        .join("\n");
    }
    if (banned?.length) {
      bannedBlock = banned
        .map((b: any) => `- "${b.term}"${b.replacement_suggestion ? ` → besser: "${b.replacement_suggestion}"` : ""}`)
        .join("\n");
    }

    // ---- Prompt -----------------------------------------------------------
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

${complianceBlock ? `COMPLIANCE-REGELN (unbedingt einhalten):\n${complianceBlock}\n` : ""}
${bannedBlock ? `VERBOTENE FORMULIERUNGEN (nicht verwenden):\n${bannedBlock}\n` : ""}
STRUKTUR:
{
  "excerpt": "Kurzbeschreibung für die Vorschau (max 200 Zeichen)",
  "summary_box_title": "Titel für die Zusammenfassungsbox",
  "summary_lead": "Einleitender Satz für die Zusammenfassung",
  "summary_paragraphs": ["**Einleitung:** ...", "..."],
  "guest_short_bio": "Ausführliche Biografie des Gastes (3-4 Sätze)",
  "section_1_title": "...", "section_1_body": "...",
  "section_2_title": "...", "section_2_body": "...",
  "section_3_title": "...", "section_3_body": "...",
  "section_4_title": "...", "section_4_body": "...",
  "section_5_title": "...", "section_5_body": "...",
  "section_6_title": "...", "section_6_body": "..."
}`;

    const userPrompt = `Erstelle einen umfangreichen Interview-Beitrag für folgende Quelldaten:

Gastname: ${guest_name}
Interview-Titel: ${interview_title}
${youtube_url ? `YouTube URL: ${youtube_url}` : ""}
${newsletter_text ? `Newsletter-Text: ${newsletter_text}` : ""}
${telegram_text ? `Telegram-Post: ${telegram_text}` : ""}
${guest_website_url ? `Gast-Website: ${guest_website_url}` : ""}
${guest_short_bio ? `Gast-Profil (Hinweis): ${guest_short_bio}` : ""}
${prettylink_shortcodes ? `PrettyLink Shortcodes: ${prettylink_shortcodes}` : ""}
${speakerProfileBlock ? `\n--- SPRECHER-PROFIL (aus Modul 3, freigegeben) ---\n${speakerProfileBlock}\n` : ""}
${guideBlock ? `\n--- FINALER INTERVIEW-LEITFADEN (aus Modul 4) ---\n${guideBlock}\n` : ""}
${video_transcript ? `\n--- VIDEO-TRANSKRIPT ---\n${video_transcript}` : ""}

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
