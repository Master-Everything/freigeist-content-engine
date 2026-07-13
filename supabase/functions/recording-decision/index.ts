// Edge Function: recording-decision
// Atomarer Statuswechsel (Admin-only) für recording_sessions + posts.
// Aktionen:
//   - beenden:       session.status='beendet',       posts.status='aufzeichnung_done'
//                    (Timer finalisiert: accumulated += elapsed, resumed_at=null)
//   - zurueck_offen: session.status='nicht_gestartet' oder 'pausiert' bleibt,
//                    posts.status='vorgespraech_done'
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type Action = "beenden" | "zurueck_offen";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Nicht angemeldet" });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData?.user) {
    console.error("getUser failed", { msg: userErr?.message, jwtLen: jwt.length });
    return json({ error: "Ungültige Session: " + (userErr?.message ?? "kein User") });
  }
  const userId = userData.user.id;

  const { data: roleRows } = await admin
    .from("user_roles").select("role").eq("user_id", userId);
  const isAdmin = (roleRows ?? []).some((r) => r.role === "admin");
  if (!isAdmin) return json({ error: "Nur Admins dürfen diese Aktion ausführen." });

  let body: { session_id?: string; action?: Action };
  try { body = await req.json(); } catch { return json({ error: "Ungültiger Body" }); }
  const { session_id, action } = body ?? {};
  if (!session_id || !action) return json({ error: "session_id und action erforderlich" });
  if (!["beenden", "zurueck_offen"].includes(action)) {
    return json({ error: "Unbekannte action" });
  }

  const { data: session, error: sErr } = await admin
    .from("recording_sessions")
    .select("id, post_id, status, accumulated_seconds, resumed_at")
    .eq("id", session_id)
    .maybeSingle();
  if (sErr) return json({ error: sErr.message });
  if (!session) return json({ error: "Session nicht gefunden" });

  let sessionUpdate: Record<string, unknown> = {};
  let postStatus = "";

  if (action === "beenden") {
    // Timer finalisieren
    let acc = Number(session.accumulated_seconds ?? 0);
    if (session.status === "laeuft" && session.resumed_at) {
      const elapsed = Math.max(0, Math.floor(
        (Date.now() - new Date(session.resumed_at as string).getTime()) / 1000
      ));
      acc += elapsed;
    }
    sessionUpdate = { status: "beendet", accumulated_seconds: acc, resumed_at: null };
    postStatus = "aufzeichnung_done";
  } else {
    // zurueck_offen: Session-Status bleibt (Timer-Stand bleibt), Post wird zurückgesetzt
    postStatus = "vorgespraech_done";
  }

  if (Object.keys(sessionUpdate).length > 0) {
    const { error: upErr } = await admin
      .from("recording_sessions")
      .update(sessionUpdate)
      .eq("id", session.id);
    if (upErr) return json({ error: "Session-Update fehlgeschlagen: " + upErr.message });
  }

  const { error: postErr } = await admin
    .from("posts")
    .update({ status: postStatus })
    .eq("id", session.post_id);
  if (postErr) return json({ error: "Post-Update fehlgeschlagen: " + postErr.message });

  return json({ ok: true, post_status: postStatus });
});
