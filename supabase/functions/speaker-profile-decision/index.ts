// Edge Function: speaker-profile-decision
// Atomarer Statuswechsel für speaker_profiles + posts:
// - kuratieren (Admin):   profile.status='kuratiert',   posts.status='profil_review'
// - freigeben (Speaker):  profile.status='freigegeben', posts.status='leitfaden'
// - aenderung (Speaker):  profile.status='entwurf',     posts.status='in_bearbeitung',
//                         Feedback wird an profile.notes angehängt
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

type Action = "kuratieren" | "freigeben" | "aenderung";

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

  let body: { profile_id?: string; action?: Action; feedback?: string };
  try { body = await req.json(); } catch { return json({ error: "Ungültiger Body" }); }
  const { profile_id, action, feedback } = body ?? {};
  if (!profile_id || !action) return json({ error: "profile_id und action erforderlich" });
  if (!["kuratieren", "freigeben", "aenderung"].includes(action)) {
    return json({ error: "Unbekannte action" });
  }

  // Profil + verknüpften Speaker laden
  const { data: profile, error: pErr } = await admin
    .from("speaker_profiles")
    .select("id, post_id, speaker_id, status, notes")
    .eq("id", profile_id)
    .maybeSingle();
  if (pErr) return json({ error: pErr.message });
  if (!profile) return json({ error: "Profil nicht gefunden" });

  // Rollen bestimmen
  const { data: roleRows } = await admin
    .from("user_roles").select("role").eq("user_id", userId);
  const isAdmin = (roleRows ?? []).some((r) => r.role === "admin");

  const { data: speaker } = await admin
    .from("speakers").select("user_id").eq("id", profile.speaker_id).maybeSingle();
  const isOwner = !!speaker && speaker.user_id === userId;

  // Autorisierung
  if (action === "kuratieren" && !isAdmin) {
    return json({ error: "Nur Admins dürfen kuratieren." });
  }
  if (action === "freigeben" && !isOwner && !isAdmin) {
    return json({ error: "Nur der zugeordnete Speaker oder ein Admin darf freigeben." });
  }
  if (action === "aenderung" && !isOwner && !isAdmin) {
    return json({ error: "Nur der zugeordnete Speaker oder ein Admin darf Änderungen erbitten." });
  }

  let profileUpdate: Record<string, unknown> = {};
  let postStatus = "";

  if (action === "kuratieren") {
    profileUpdate = { status: "kuratiert" };
    postStatus = "profil_review";
  } else if (action === "freigeben") {
    profileUpdate = { status: "freigegeben" };
    postStatus = "leitfaden";
    // Audit-Notiz nur bei echter Admin-im-Auftrag-Freigabe
    if (isAdmin && !isOwner) {
      const stamp = new Date().toLocaleString("de-DE");
      const email = userData.user.email ?? userId;
      const audit = `\n\n[Admin-Freigabe · ${stamp} · ${email}] Profil im Auftrag freigegeben.`;
      profileUpdate.notes = (profile.notes ?? "") + audit;
    }
  } else {
    const stamp = new Date().toLocaleString("de-DE");
    const fb = (feedback ?? "").trim();
    if (!fb) return json({ error: "Bitte Feedback angeben." });
    const prefixed = `\n\n[Speaker-Feedback ${stamp}]\n${fb}`;
    const nextNotes = (profile.notes ?? "") + prefixed;
    profileUpdate = { status: "entwurf", notes: nextNotes };
    postStatus = "in_bearbeitung";
  }

  const { data: updatedProfile, error: upErr } = await admin
    .from("speaker_profiles")
    .update(profileUpdate)
    .eq("id", profile.id)
    .select("*")
    .single();
  if (upErr) return json({ error: "Profil-Update fehlgeschlagen: " + upErr.message });

  const { error: postErr } = await admin
    .from("posts")
    .update({ status: postStatus })
    .eq("id", profile.post_id);
  if (postErr) return json({ error: "Post-Update fehlgeschlagen: " + postErr.message });

  return json({ ok: true, profile: updatedProfile, post_status: postStatus });
});
