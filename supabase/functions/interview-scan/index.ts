// Edge Function: interview-scan
// Prüft ein Interview (posts) gegen die Wissensbasis (BannedWords + Compliance-Regeln + FG-Kurator-Prompt)
// und schreibt das Ergebnis in public.post_scans.
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

type Finding = {
  kind: "banned_word" | "compliance" | "hint";
  severity: "info" | "warn" | "high" | "critical";
  field: string;
  excerpt: string;
  rule_code?: string;
  message: string;
  suggestion?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collectInterviewText(post: any, speaker: any): Record<string, string> {
  const fields: Record<string, string> = {
    interview_title: post.interview_title ?? "",
    interview_topic: post.interview_topic ?? "",
    product: post.product ?? "",
    product_market_since: post.product_market_since ?? "",
    previous_interviews: post.previous_interviews ?? "",
    critical_voices: post.critical_voices ?? "",
  };
  const affiliates = Array.isArray(speaker?.top_affiliate_products)
    ? speaker.top_affiliate_products
    : [];
  const indices: number[] = Array.isArray(post.selected_affiliate_indices)
    ? post.selected_affiliate_indices
    : [];
  indices.forEach((idx) => {
    const a = affiliates[idx];
    if (!a) return;
    const parts = [a?.name, a?.freebie, a?.ebook].filter(Boolean).join(" — ");
    if (parts) fields[`affiliate_${idx + 1}`] = String(parts);
  });
  return fields;
}

function bannedWordScan(
  fields: Record<string, string>,
  banned: { term: string; severity: string; replacement_suggestion: string | null; category: string }[],
): Finding[] {
  const out: Finding[] = [];
  for (const [field, text] of Object.entries(fields)) {
    if (!text) continue;
    for (const b of banned) {
      const re = new RegExp(`\\b${escapeRegex(b.term)}\\b`, "iu");
      const m = text.match(re);
      if (m) {
        const idx = m.index ?? 0;
        const start = Math.max(0, idx - 40);
        const end = Math.min(text.length, idx + b.term.length + 40);
        out.push({
          kind: "banned_word",
          severity: (b.severity as Finding["severity"]) || "warn",
          field,
          excerpt: text.slice(start, end),
          message: `Marketing-Floskel/verbotener Begriff: „${b.term}" (${b.category})`,
          suggestion: b.replacement_suggestion ?? undefined,
        });
      }
    }
  }
  return out;
}

function deriveVerdict(findings: Finding[], llmVerdict?: string): "green" | "yellow" | "red" {
  const hasCritical = findings.some((f) => f.severity === "critical");
  const hasHigh = findings.some((f) => f.severity === "high" || f.severity === "warn");
  if (hasCritical || llmVerdict === "red") return "red";
  if (hasHigh || llmVerdict === "yellow") return "yellow";
  return "green";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const t0 = Date.now();

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Nicht angemeldet" });

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
  if (userErr || !userData?.user) return json({ error: "Ungültige Session" });
  const userId = userData.user.id;

  let body: { post_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Ungültiger Request-Body" });
  }
  const postId = body?.post_id;
  if (!postId) return json({ error: "post_id fehlt" });

  const { data: post, error: postErr } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();
  if (postErr || !post) return json({ error: "Interview nicht gefunden" });

  const { data: speaker } = await supabaseAdmin
    .from("speakers")
    .select("*")
    .eq("id", post.speaker_id)
    .maybeSingle();

  const { data: roleRows } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const isAdmin = (roleRows ?? []).some((r) => r.role === "admin");
  if (!isAdmin && speaker?.user_id !== userId) {
    return json({ error: "Keine Berechtigung für dieses Interview" });
  }

  const { data: running } = await supabaseAdmin
    .from("post_scans")
    .select("id")
    .eq("post_id", postId)
    .in("status", ["pending", "running"])
    .limit(1);
  if (running && running.length > 0) {
    return json({ error: "Es läuft bereits ein Scan für dieses Interview." });
  }

  const { data: scanRow, error: insErr } = await supabaseAdmin
    .from("post_scans")
    .insert({
      post_id: postId,
      triggered_by: userId,
      status: "running",
    })
    .select("id")
    .single();
  if (insErr || !scanRow) return json({ error: "Konnte Scan nicht starten: " + insErr?.message });
  const scanId = scanRow.id;

  // Status vor dem Scan merken, damit wir bei Fehlern nicht willkürlich zurücksetzen
  const previousStatus: string = post.status ?? "erfassung";
  const revertStatus = previousStatus === "scan_pending" ? "erfassung" : previousStatus;

  // Status auf scan_pending während der Verarbeitung
  {
    const { error: upErr } = await supabaseAdmin
      .from("posts")
      .update({ status: "scan_pending" })
      .eq("id", postId);
    if (upErr) console.error("[interview-scan] status→scan_pending failed", upErr);
  }

  try {
    const [{ data: banned }, { data: rules }, { data: prompts }] = await Promise.all([
      supabaseAdmin.from("knowledge_banned_words").select("term, severity, replacement_suggestion, category").eq("active", true),
      supabaseAdmin.from("knowledge_compliance_rules").select("code, industry, question_text, risk_response_text, severity, legal_basis").eq("active", true),
      supabaseAdmin.from("knowledge_prompts").select("system_prompt, version, model").eq("key", "fg_kurator").eq("active", true).order("version", { ascending: false }).limit(1),
    ]);

    const promptRow = (prompts ?? [])[0];
    if (!promptRow) throw new Error("Kein aktiver Prompt 'fg_kurator' gefunden.");
    const model = promptRow.model || "google/gemini-2.5-flash";

    const interviewFields = collectInterviewText(post, speaker);
    const bannedFindings = bannedWordScan(interviewFields, banned ?? []);

    const affiliates = Array.isArray(speaker?.top_affiliate_products)
      ? speaker.top_affiliate_products
      : [];
    const selectedAffiliates = (post.selected_affiliate_indices ?? [])
      .map((i: number) => affiliates[i])
      .filter(Boolean);

    const userPayload = {
      context: "Interview-Prüfung (nicht Speaker-Profil).",
      speaker_context: speaker ? {
        name: `${speaker.first_name ?? ""} ${speaker.last_name ?? ""}`.trim(),
        industry: speaker.industry,
        title_role: speaker.title_role,
      } : null,
      interview: {
        interview_title: post.interview_title,
        interview_topic: post.interview_topic,
        product: post.product,
        product_market_since: post.product_market_since,
        previous_interviews: post.previous_interviews,
        critical_voices: post.critical_voices,
        selected_affiliates: selectedAffiliates,
      },
      compliance_rules: (rules ?? []).map((r) => ({
        code: r.code,
        industry: r.industry,
        question: r.question_text,
        risk_response: r.risk_response_text,
        severity: r.severity,
        legal_basis: r.legal_basis,
      })),
      instruction:
        "Prüfe das Interview-Briefing (Thema, Produkt, kritische Stimmen, Affiliate-Produkte) gegen die Compliance-Regeln. Gib JSON zurück mit { verdict: 'green'|'yellow'|'red', score: 0-100, summary: string (2-4 Sätze, Deutsch), findings: [{rule_code?, severity: 'info'|'warn'|'high'|'critical', field: string, excerpt: string, message: string, suggestion?: string}]}. Sei konkret, zitiere betroffene Textstellen aus dem Interview als 'excerpt'.",
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
          { role: "user", content: JSON.stringify(userPayload) },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiRes.status === 429) {
      await supabaseAdmin.from("post_scans").update({
        status: "error",
        error_text: "Rate-Limit erreicht. Bitte später erneut versuchen.",
        duration_ms: Date.now() - t0,
      }).eq("id", scanId);
      await supabaseAdmin.from("posts").update({ status: "erfassung" }).eq("id", postId);
      return json({ error: "AI-Rate-Limit erreicht. Bitte später erneut versuchen.", scan_id: scanId });
    }
    if (aiRes.status === 402) {
      await supabaseAdmin.from("post_scans").update({
        status: "error",
        error_text: "AI-Guthaben aufgebraucht.",
        duration_ms: Date.now() - t0,
      }).eq("id", scanId);
      await supabaseAdmin.from("posts").update({ status: "erfassung" }).eq("id", postId);
      return json({ error: "AI-Guthaben aufgebraucht. Bitte Credits aufladen.", scan_id: scanId });
    }
    if (!aiRes.ok) {
      const errTxt = await aiRes.text();
      throw new Error(`AI-Gateway Fehler ${aiRes.status}: ${errTxt.slice(0, 300)}`);
    }

    const aiData = await aiRes.json();
    const content = aiData?.choices?.[0]?.message?.content ?? "{}";
    let llm: { verdict?: string; score?: number; summary?: string; findings?: Finding[] } = {};
    try {
      llm = JSON.parse(content);
    } catch {
      throw new Error("LLM-Antwort war kein gültiges JSON.");
    }

    const llmFindings: Finding[] = (llm.findings ?? []).map((f) => ({
      kind: "compliance",
      severity: (f.severity as Finding["severity"]) ?? "warn",
      field: f.field ?? "—",
      excerpt: f.excerpt ?? "",
      rule_code: f.rule_code,
      message: f.message ?? "",
      suggestion: f.suggestion,
    }));

    const allFindings = [...bannedFindings, ...llmFindings];
    const verdict = deriveVerdict(allFindings, llm.verdict);
    const score = typeof llm.score === "number"
      ? Math.max(0, Math.min(100, Math.round(llm.score)))
      : (verdict === "green" ? 90 : verdict === "yellow" ? 60 : 30);

    await supabaseAdmin.from("post_scans").update({
      status: "done",
      verdict,
      score,
      summary: llm.summary ?? null,
      findings: allFindings,
      model_used: model,
      prompt_key_used: "fg_kurator",
      prompt_version_used: promptRow.version,
      tokens_in: aiData?.usage?.prompt_tokens ?? null,
      tokens_out: aiData?.usage?.completion_tokens ?? null,
      duration_ms: Date.now() - t0,
    }).eq("id", scanId);

    await supabaseAdmin.from("posts").update({ status: "scan_done" }).eq("id", postId);

    return json({ scan_id: scanId, verdict, score, findings_count: allFindings.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabaseAdmin.from("post_scans").update({
      status: "error",
      error_text: msg.slice(0, 1000),
      duration_ms: Date.now() - t0,
    }).eq("id", scanId);
    await supabaseAdmin.from("posts").update({ status: "erfassung" }).eq("id", postId);
    return json({ error: msg, scan_id: scanId });
  }
});
