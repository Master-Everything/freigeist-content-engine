// Edge Function: prioritize-interview-guide
// KI schlägt Toggle/Reihenfolge/Ergänzungen für einen bestehenden Interview-Leitfaden vor.
// Admin-only. Merge findet serverseitig statt, damit die Regeln zentral erzwungen werden.
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

type Q = { id: string; text: string; active: boolean };
const BLOCKS = ["hauptfragen", "vertiefungsfragen", "kritische_fragen"] as const;
type BlockKey = typeof BLOCKS[number];

function normalize(v: any): Q[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x) => x && typeof x === "object" && typeof x.text === "string" && x.text.trim())
    .map((x) => ({
      id: typeof x.id === "string" && x.id ? x.id : crypto.randomUUID(),
      text: x.text.trim(),
      active: typeof x.active === "boolean" ? x.active : true,
    }));
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
  if (!isAdmin) return json({ error: "Nur Admins dürfen die KI-Priorisierung ausführen." });

  let body: { guide_id?: string; ki_instruktionen?: string };
  try { body = await req.json(); } catch { return json({ error: "Ungültiger Body" }); }
  const guideId = body?.guide_id;
  const instructions = (body?.ki_instruktionen ?? "").toString().trim();
  if (!guideId) return json({ error: "guide_id erforderlich" });
  if (!instructions) return json({ error: "Bitte KI-Instruktionen angeben." });

  try {
    const { data: guide } = await admin
      .from("interview_guides").select("*").eq("id", guideId).maybeSingle();
    if (!guide) return json({ error: "Leitfaden nicht gefunden" });
    if (guide.status === "final") return json({ error: "Finalisierter Leitfaden kann nicht priorisiert werden. Zuerst zurück zu Entwurf." });

    const { data: post } = await admin
      .from("posts").select("*").eq("id", guide.post_id).maybeSingle();
    const speakerId = guide.speaker_id ?? post?.speaker_id ?? null;
    const [{ data: speaker }, { data: profile }, { data: prompts }] = await Promise.all([
      speakerId
        ? admin.from("speakers").select("*").eq("id", speakerId).maybeSingle()
        : Promise.resolve({ data: null }),
      admin.from("speaker_profiles").select("*").eq("post_id", guide.post_id).maybeSingle(),
      admin.from("knowledge_prompts").select("system_prompt, version, model")
        .eq("key", "leitfaden_priorisierer").eq("active", true)
        .order("version", { ascending: false }).limit(1),
    ]);

    const promptRow = (prompts ?? [])[0];
    if (!promptRow) return json({ error: "Kein aktiver Prompt 'leitfaden_priorisierer' gefunden." });
    const model = promptRow.model || "google/gemini-2.5-flash";

    const currentBlocks: Record<BlockKey, Q[]> = {
      hauptfragen: normalize(guide.hauptfragen),
      vertiefungsfragen: normalize(guide.vertiefungsfragen),
      kritische_fragen: normalize(guide.kritische_fragen),
    };

    // IDs pro Block dem Modell mitgeben.
    const currentForPrompt = Object.fromEntries(
      BLOCKS.map((b) => [b, currentBlocks[b].map((q) => ({ id: q.id, text: q.text }))])
    );

    const payload = {
      ki_instruktionen: instructions,
      current_questions: currentForPrompt,
      interview: post ? {
        title: post.interview_title,
        topic: post.interview_topic,
        product: post.product,
        critical_voices: post.critical_voices,
      } : null,
      speaker: speaker ? {
        name: `${speaker.first_name ?? ""} ${speaker.last_name ?? ""}`.trim(),
        title_role: speaker.title_role,
        industry: speaker.industry,
      } : null,
      profile: profile ? {
        kurzbio: profile.kurzbio,
        themen: profile.themen,
        kernaussagen: profile.kernaussagen,
        kritische_punkte: profile.kritische_punkte,
      } : null,
      instruction:
        "Rufe das Tool 'emit_prioritization' EINMAL auf. Verwende im keep-Array ausschließlich IDs aus current_questions. Erfinde keine IDs.",
    };

    const blockSchema = {
      type: "object",
      properties: {
        keep: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              active: { type: "boolean" },
              order: { type: "number" },
            },
            required: ["id", "active", "order"],
            additionalProperties: false,
          },
        },
        add: {
          type: "array",
          items: {
            type: "object",
            properties: {
              text: { type: "string" },
              active: { type: "boolean" },
            },
            required: ["text", "active"],
            additionalProperties: false,
          },
        },
      },
      required: ["keep", "add"],
      additionalProperties: false,
    };

    const tool = {
      type: "function",
      function: {
        name: "emit_prioritization",
        description: "Priorisierungs-Vorschlag pro Fragen-Block.",
        parameters: {
          type: "object",
          properties: {
            hauptfragen: blockSchema,
            vertiefungsfragen: blockSchema,
            kritische_fragen: blockSchema,
          },
          required: ["hauptfragen", "vertiefungsfragen", "kritische_fragen"],
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
        tool_choice: { type: "function", function: { name: "emit_prioritization" } },
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

    // --- Merge serverseitig ---
    const invalidIds: string[] = [];
    const merged: Record<BlockKey, Q[]> = {
      hauptfragen: [],
      vertiefungsfragen: [],
      kritische_fragen: [],
    };

    for (const block of BLOCKS) {
      const current = currentBlocks[block];
      const byId = new Map(current.map((q) => [q.id, q]));
      const blockResult = parsed?.[block] ?? { keep: [], add: [] };
      const keep: Array<{ id: string; active: boolean; order: number }> = Array.isArray(blockResult.keep) ? blockResult.keep : [];
      const add: Array<{ text: string; active: boolean }> = Array.isArray(blockResult.add) ? blockResult.add : [];

      // 1. keep-Einträge in gewünschter order
      const validKeep = keep
        .filter((k) => {
          if (typeof k?.id !== "string") return false;
          if (!byId.has(k.id)) {
            invalidIds.push(k.id);
            return false;
          }
          return true;
        })
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

      const usedIds = new Set<string>();
      for (const k of validKeep) {
        if (usedIds.has(k.id)) continue;
        usedIds.add(k.id);
        const orig = byId.get(k.id)!;
        merged[block].push({ id: orig.id, text: orig.text, active: !!k.active });
      }

      // 2. Nicht erwähnte Fragen: active=false, ans Ende (vor add)
      for (const q of current) {
        if (usedIds.has(q.id)) continue;
        merged[block].push({ id: q.id, text: q.text, active: false });
      }

      // 3. add am Ende
      for (const a of add) {
        if (!a || typeof a.text !== "string" || !a.text.trim()) continue;
        merged[block].push({
          id: crypto.randomUUID(),
          text: a.text.trim(),
          active: typeof a.active === "boolean" ? a.active : true,
        });
      }
    }

    // notes anhängen NUR wenn ungültige IDs auftraten
    let nextNotes = guide.notes ?? "";
    if (invalidIds.length > 0) {
      const stamp = new Date().toISOString();
      const line = `[KI-Priorisierung · ${stamp}] Ungültige IDs ignoriert: ${invalidIds.join(", ")}`;
      nextNotes = nextNotes && nextNotes.trim().length > 0 ? `${nextNotes}\n\n${line}` : line;
    }

    const { data: updated, error: upErr } = await admin
      .from("interview_guides")
      .update({
        hauptfragen: merged.hauptfragen,
        vertiefungsfragen: merged.vertiefungsfragen,
        kritische_fragen: merged.kritische_fragen,
        ki_instruktionen: instructions,
        notes: nextNotes,
      })
      .eq("id", guide.id)
      .select("*")
      .single();
    if (upErr) return json({ error: "Speichern fehlgeschlagen: " + upErr.message });

    return json({ guide: updated, invalid_ids: invalidIds });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg });
  }
});
