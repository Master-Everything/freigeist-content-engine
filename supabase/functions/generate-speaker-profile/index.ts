// Edge Function: generate-speaker-profile
// Erzeugt einen strukturierten Profil-Entwurf für einen Interviewgast auf Basis
// von Speaker-Stammdaten, Interview-Details, letztem Vorab-/Interview-Scan
// und Wissensbasis (Compliance-Regeln, Banned Words, Prompt 'profil_generator').
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
  if (!isAdmin) return json({ error: "Nur Admins können Profile generieren." });

  let body: { post_id?: string; speaker_id?: string };
  try { body = await req.json(); } catch { return json({ error: "Ungültiger Body" }); }
  const postId = body?.post_id;
  const speakerId = body?.speaker_id;
  if (!postId || !speakerId) return json({ error: "post_id und speaker_id erforderlich" });

  try {
    const [
      { data: post },
      { data: speaker },
      { data: prompts },
      { data: rules },
      { data: banned },
      { data: postScan },
      { data: speakerScan },
    ] = await Promise.all([
      admin.from("posts").select("*").eq("id", postId).maybeSingle(),
      admin.from("speakers").select("*").eq("id", speakerId).maybeSingle(),
      admin.from("knowledge_prompts").select("system_prompt, version, model")
        .eq("key", "profil_generator").eq("active", true)
        .order("version", { ascending: false }).limit(1),
      admin.from("knowledge_compliance_rules")
        .select("code, industry, question_text, risk_response_text, severity, legal_basis")
        .eq("active", true),
      admin.from("knowledge_banned_words")
        .select("term, severity, category, replacement_suggestion").eq("active", true),
      admin.from("post_scans").select("verdict, score, summary, findings")
        .eq("post_id", postId).order("created_at", { ascending: false }).limit(1),
      admin.from("speaker_scans").select("verdict, score, summary, findings")
        .eq("speaker_id", speakerId).order("created_at", { ascending: false }).limit(1),
    ]);

    if (!post) return json({ error: "Interview nicht gefunden" });
    if (!speaker) return json({ error: "Speaker nicht gefunden" });

    const promptRow = (prompts ?? [])[0];
    if (!promptRow) return json({ error: "Kein aktiver Prompt 'profil_generator' gefunden." });
    const model = promptRow.model || "google/gemini-2.5-flash";

    const payload = {
      speaker: {
        name: `${speaker.first_name ?? ""} ${speaker.last_name ?? ""}`.trim(),
        title_role: speaker.title_role,
        industry: speaker.industry,
        slogan: speaker.slogan,
        bio_third_person: speaker.bio_third_person,
        short_vita: speaker.short_vita,
        topic_suggestions: speaker.topic_suggestions,
        hot_topics: speaker.hot_topics,
        website: speaker.website,
        top_affiliate_products: speaker.top_affiliate_products,
      },
      interview: {
        title: post.interview_title,
        topic: post.interview_topic,
        product: post.product,
        product_market_since: post.product_market_since,
        previous_interviews: post.previous_interviews,
        critical_voices: post.critical_voices,
        newsletter_text: post.newsletter_text,
        telegram_text: post.telegram_text,
        transcript_excerpt: (post.video_transcript ?? "").slice(0, 8000),
      },
      last_post_scan: (postScan ?? [])[0] ?? null,
      last_speaker_scan: (speakerScan ?? [])[0] ?? null,
      compliance_rules: (rules ?? []).map((r) => ({
        code: r.code, industry: r.industry, question: r.question_text,
        risk_response: r.risk_response_text, severity: r.severity, legal_basis: r.legal_basis,
      })),
      banned_words: (banned ?? []).map((b) => ({
        term: b.term, severity: b.severity, category: b.category,
        suggestion: b.replacement_suggestion,
      })),
      instruction:
        "Rufe das Tool 'emit_speaker_profile' EINMAL mit dem strukturierten Profil-Entwurf auf. Beziehe kritische_punkte aus last_post_scan/last_speaker_scan und den Compliance-Regeln.",
    };

    const tool = {
      type: "function",
      function: {
        name: "emit_speaker_profile",
        description: "Strukturierter Profil-Entwurf für den Interviewgast.",
        parameters: {
          type: "object",
          properties: {
            kurzbio: { type: "string" },
            langbio: { type: "string" },
            positionierung: { type: "string" },
            zielgruppe: { type: "string" },
            themen: { type: "array", items: { type: "string" } },
            kernaussagen: { type: "array", items: { type: "string" } },
            mediale_hooks: { type: "array", items: { type: "string" } },
            kritische_punkte: { type: "array", items: { type: "string" } },
            expertise_score: { type: "integer" },
          },
          required: [
            "kurzbio", "langbio", "positionierung", "zielgruppe",
            "themen", "kernaussagen", "mediale_hooks", "kritische_punkte",
            "expertise_score",
          ],
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
        tool_choice: { type: "function", function: { name: "emit_speaker_profile" } },
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

    // Clamp / normalize
    const clampInt = (n: any, lo: number, hi: number) => {
      const v = typeof n === "number" ? Math.round(n) : parseInt(String(n), 10);
      if (Number.isNaN(v)) return null;
      return Math.max(lo, Math.min(hi, v));
    };
    const arr = (v: any) => Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()) : [];

    const record = {
      post_id: postId,
      speaker_id: speakerId,
      generated_at: new Date().toISOString(),
      generated_by: userId,
      model,
      prompt_version: promptRow.version,
      status: "entwurf" as const,
      kurzbio: (parsed.kurzbio ?? "").toString().slice(0, 2000),
      langbio: (parsed.langbio ?? "").toString(),
      positionierung: (parsed.positionierung ?? "").toString(),
      zielgruppe: (parsed.zielgruppe ?? "").toString(),
      themen: arr(parsed.themen),
      kernaussagen: arr(parsed.kernaussagen),
      mediale_hooks: arr(parsed.mediale_hooks),
      kritische_punkte: arr(parsed.kritische_punkte),
      expertise_score: clampInt(parsed.expertise_score, 1, 10),
      raw_json: parsed,
    };

    const { data: upserted, error: upErr } = await admin
      .from("speaker_profiles")
      .upsert(record, { onConflict: "post_id" })
      .select("*")
      .single();
    if (upErr) return json({ error: "Speichern fehlgeschlagen: " + upErr.message });

    await admin.from("posts").update({ status: "profil" }).eq("id", postId);

    return json({ profile: upserted });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg });
  }
});
