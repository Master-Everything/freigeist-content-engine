// Edge Function: vorgespraech-decision
// Atomarer Statuswechsel (Admin-only) für pre_interview_calls + posts.
// Aktionen:
//   - durchgefuehrt:  call.status='durchgefuehrt', posts.status='vorgespraech_done'
//   - abgesagt:       call.status='abgesagt',      posts.status bleibt
//   - zurueck_geplant: call.status='geplant',      posts.status='vorgespraech'
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

type Action = "durchgefuehrt" | "abgesagt" | "zurueck_geplant";

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

  let body: { call_id?: string; action?: Action };
  try { body = await req.json(); } catch { return json({ error: "Ungültiger Body" }); }
  const { call_id, action } = body ?? {};
  if (!call_id || !action) return json({ error: "call_id und action erforderlich" });
  if (!["durchgefuehrt", "abgesagt", "zurueck_geplant"].includes(action)) {
    return json({ error: "Unbekannte action" });
  }

  const { data: call, error: cErr } = await admin
    .from("pre_interview_calls")
    .select("id, post_id, status")
    .eq("id", call_id)
    .maybeSingle();
  if (cErr) return json({ error: cErr.message });
  if (!call) return json({ error: "Vorgespräch nicht gefunden" });

  const callStatus =
    action === "durchgefuehrt" ? "durchgefuehrt" :
    action === "abgesagt" ? "abgesagt" : "geplant";

  const { error: upErr } = await admin
    .from("pre_interview_calls")
    .update({ status: callStatus })
    .eq("id", call.id);
  if (upErr) return json({ error: "Vorgespräch-Update fehlgeschlagen: " + upErr.message });

  if (action === "durchgefuehrt" || action === "zurueck_geplant") {
    const postStatus = action === "durchgefuehrt" ? "vorgespraech_done" : "vorgespraech";
    const { error: postErr } = await admin
      .from("posts")
      .update({ status: postStatus })
      .eq("id", call.post_id);
    if (postErr) return json({ error: "Post-Update fehlgeschlagen: " + postErr.message });
    return json({ ok: true, call_status: callStatus, post_status: postStatus });
  }

  return json({ ok: true, call_status: callStatus });
});
