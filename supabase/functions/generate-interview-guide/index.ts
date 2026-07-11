// Edge Function: generate-interview-guide
// Erzeugt einen strukturierten Interview-Leitfaden aus freigegebenem Speaker-Profil,
// Interview-Kontext (posts) und Wissensbasis (Compliance-Regeln, Banned Words, Prompt).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Nicht angemeldet" });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData?.user) return json({ error: "Ungültige Session" });
  const userId = userData.user.id;

  const { data: roleRows } = await admin
    .from("user_roles").select("role").eq("user_id", userId);
  const isAdmin = (roleRows ?? []).some((r) => r.role === "admin");
  if (!isAdmin) return json({ error: "Nur Admins können Leitfäden generieren." });

  let body: { post_id?: string };
  try { body = await req.json(); } catch { return json({ error: "Ungültiger Body" }); }
  const postId = body?.post_id;
  if (!postId) return json({ error: "post_id erforderlich" });

  try {
    const { data: post } = await admin.from("posts").select("*").eq("id", postId).maybeSingle();
    if (!post) return json({ error: "Interview nicht gefunden" });
    const speakerId = post.speaker_id;
    if (!speakerId) return json({ error: "Kein Speaker verknüpft" });

    const [
      { data: speaker },
      { data: profile },
      { data: prompts },
      { data: rules },
      { data: banned },
      { data: postScan },
    ] = await Promise.all([
      admin.from("speakers").select("*").eq("id", speakerId).maybeSingle(),
      admin.from("speaker_profiles").select("*").eq("post_id", postId).maybeSingle(),
      admin.from("knowledge_prompts").select("system_prompt, version, model")
        .eq("key", "leitfaden_generator").eq("active", true)
        .order("version", { ascending: false }).limit(1),
      admin.from("knowledge_compliance_rules")
        .select("code, industry, question_text, risk_response_text, severity, legal_basis")
        .eq("active", true),
      admin.from("knowledge_banned_words")
        .select("term, severity, category, replacement_suggestion").eq("active", true),
      admin.from("post_scans").select("verdict, score, summary, findings")
        .eq("post_id", postId).order("created_at", { ascending: false }).limit(1),
    ]);

    const promptRow = (prompts ?? [])[0];
    if (!promptRow) return json({ error: "Kein aktiver Prompt 'leitfaden_generator' gefunden." });
    const model = promptRow.model || "google/gemini-2.5-flash";

    const payload = {
      interview: {
        title: post.interview_title,
        topic: post.interview_topic,
        product: post.product,
        product_market_since: post.product_market_since,
        previous_interviews: post.previous_interviews,
        critical_voices: post.critical_voices,
        newsletter_text: post.newsletter_text,
        transcript_excerpt: (post.video_transcript ?? "").slice(0, 6000),
      },
      speaker: speaker ? {
        name: `${speaker.first_name ?? ""} ${speaker.last_name ?? ""}`.trim(),
        title_role: speaker.title_role,
        industry: speaker.industry,
      } : null,
      profile: profile ? {
        kurzbio: profile.kurzbio,
        positionierung: profile.positionierung,
        zielgruppe: profile.zielgruppe,
        themen: profile.themen,
        kernaussagen: profile.kernaussagen,
        mediale_hooks: profile.mediale_hooks,
        kritische_punkte: profile.kritische_punkte,
      } : null,
      last_post_scan: (postScan ?? [])[0] ?? null,
      compliance_rules: (rules ?? []).map((r) => ({
        code: r.code, industry: r.industry, question: r.question_text,
        risk_response: r.risk_response_text, severity: r.severity, legal_basis: r.legal_basis,
      })),
      banned_words: (banned ?? []).map((b) => ({
        term: b.term, severity: b.severity, category: b.category, suggestion: b.replacement_suggestion,
      })),
      instruction: "Rufe das Tool 'emit_interview_guide' EINMAL mit dem strukturierten Leitfaden auf.",
    };

    const tool = {
      type: "function",
      function: {
        name: "emit_interview_guide",
        description: "Strukturierter Interview-Leitfaden für den Moderator.",
        parameters: {
          type: "object",
          properties: {
            intro: { type: "string" },
            hauptfragen: { type: "array", items: { type: "string" } },
            vertiefungsfragen: { type: "array", items: { type: "string" } },
            kritische_fragen: { type: "array", items: { type: "string" } },
            abschluss: { type: "string" },
            redaktionelle_hinweise: { type: "string" },
          },
          required: ["intro", "hauptfragen", "vertiefungsfragen", "kritische_fragen", "abschluss", "redaktionelle_hinweise"],
          additionalProperties: false,
        },
      },
    };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: promptRow.system_prompt },
          { role: "user", content: JSON.stringify(payload) },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "emit_interview_guide" } },
      }),
    });

    if (aiRes.status === 429) return json({ error: "AI-Rate-Limit erreicht. Bitte später erneut versuchen." });
    if (aiRes.status === 402) return json({ error: "AI-Guthaben aufgebraucht. Bitte Credits aufladen." });
    if (!aiRes.ok) {
      const t = await aiRes.text();
      return json({ error: `AI-Gateway Fehler ${aiRes.status}: ${t.slice(0, 300)}` });
    }

    const aiData = await aiRes.json();
    const call = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) return json({ error: "LLM lieferte keinen tool_call" });

    let parsed: any;
    try { parsed = JSON.parse(call.function.arguments); }
    catch { return json({ error: "LLM-Antwort war kein gültiges JSON" }); }

    const arr = (v: any) => Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()) : [];

    const record = {
      post_id: postId,
      speaker_id: speakerId,
      speaker_profile_id: profile?.id ?? null,
      generated_at: new Date().toISOString(),
      generated_by: userId,
      model_used: model,
      prompt_version: promptRow.version,
      status: "entwurf" as const,
      intro: (parsed.intro ?? "").toString(),
      hauptfragen: arr(parsed.hauptfragen),
      vertiefungsfragen: arr(parsed.vertiefungsfragen),
      kritische_fragen: arr(parsed.kritische_fragen),
      abschluss: (parsed.abschluss ?? "").toString(),
      redaktionelle_hinweise: (parsed.redaktionelle_hinweise ?? "").toString(),
      raw_json: parsed,
    };

    const { data: upserted, error: upErr } = await admin
      .from("interview_guides")
      .upsert(record, { onConflict: "post_id" })
      .select("*")
      .single();
    if (upErr) return json({ error: "Speichern fehlgeschlagen: " + upErr.message });

    // Post-Status bleibt 'leitfaden' während der Ausarbeitung.
    return json({ guide: upserted });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg });
  }
});
