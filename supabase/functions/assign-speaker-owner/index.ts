// Edge Function: assign-speaker-owner
// Admin-only. Sucht in auth.users nach exakter E-Mail (case-insensitive)
// und setzt speakers.user_id auf den gefundenen Account.
// Antwortet immer mit 200 + JSON — Fehler als { error: "..." }.
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Nicht angemeldet" });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData?.user) return json({ error: "Ungültige Session" });
  const callerId = userData.user.id;

  // Autorisierung: nur Admin
  const { data: roleRows } = await admin
    .from("user_roles").select("role").eq("user_id", callerId);
  const isAdmin = (roleRows ?? []).some((r) => r.role === "admin");
  if (!isAdmin) return json({ error: "Nur Admins dürfen Owner zuweisen." });

  let body: { speaker_id?: string; email?: string };
  try { body = await req.json(); } catch { return json({ error: "Ungültiger Body" }); }
  const speakerId = body?.speaker_id?.trim();
  const emailNorm = body?.email?.trim().toLowerCase();
  if (!speakerId || !emailNorm) return json({ error: "speaker_id und email erforderlich" });

  // Speaker holen
  const { data: speaker, error: sErr } = await admin
    .from("speakers")
    .select("id, user_id, email")
    .eq("id", speakerId)
    .maybeSingle();
  if (sErr) return json({ error: sErr.message });
  if (!speaker) return json({ error: "Speaker nicht gefunden" });

  // In auth.users nach E-Mail suchen (paginiert)
  let foundUserId: string | null = null;
  const perPage = 200;
  for (let page = 1; page <= 25; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) return json({ error: "auth.listUsers fehlgeschlagen: " + error.message });
    const users = data?.users ?? [];
    const hit = users.find((u) => (u.email ?? "").toLowerCase() === emailNorm);
    if (hit) { foundUserId = hit.id; break; }
    if (users.length < perPage) break;
  }

  if (!foundUserId) return json({ error: "no_account" });

  // Prüfen, ob dieser Account bereits einem anderen Speaker gehört (UNIQUE user_id)
  const { data: conflict } = await admin
    .from("speakers")
    .select("id")
    .eq("user_id", foundUserId)
    .neq("id", speakerId)
    .maybeSingle();
  if (conflict) return json({ error: "Dieser Account ist bereits einem anderen Speaker-Profil zugeordnet." });

  const { data: updated, error: uErr } = await admin
    .from("speakers")
    .update({ user_id: foundUserId })
    .eq("id", speakerId)
    .select("id, user_id, email")
    .single();
  if (uErr) return json({ error: "Update fehlgeschlagen: " + uErr.message });

  return json({ ok: true, speaker: updated });
});
