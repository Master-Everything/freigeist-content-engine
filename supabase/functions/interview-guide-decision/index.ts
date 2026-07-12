// Edge Function: interview-guide-decision
// Atomarer Statuswechsel für interview_guides + posts (Admin-only):
// - finalisieren:    guide.status='final',   posts.status='leitfaden_final'
// - zurueck_entwurf: guide.status='entwurf', posts.status='leitfaden'
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

type Action = "finalisieren" | "zurueck_entwurf";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Nicht angemeldet" });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData?.user) {
    console.error("getUser failed", { msg: userErr?.message, jwtLen: jwt.length, jwtPrefix: jwt.slice(0, 12) });
    return json({ error: "Ungültige Session: " + (userErr?.message ?? "kein User") });
  }
  const userId = userData.user.id;

  const { data: roleRows } = await admin
    .from("user_roles").select("role").eq("user_id", userId);
  const isAdmin = (roleRows ?? []).some((r) => r.role === "admin");
  if (!isAdmin) return json({ error: "Nur Admins dürfen diese Aktion ausführen." });

  let body: { guide_id?: string; action?: Action };
  try { body = await req.json(); } catch { return json({ error: "Ungültiger Body" }); }
  const { guide_id, action } = body ?? {};
  if (!guide_id || !action) return json({ error: "guide_id und action erforderlich" });
  if (!["finalisieren", "zurueck_entwurf"].includes(action)) {
    return json({ error: "Unbekannte action" });
  }

  const { data: guide, error: gErr } = await admin
    .from("interview_guides")
    .select("id, post_id, status")
    .eq("id", guide_id)
    .maybeSingle();
  if (gErr) return json({ error: gErr.message });
  if (!guide) return json({ error: "Leitfaden nicht gefunden" });

  const guideStatus = action === "finalisieren" ? "final" : "entwurf";
  const postStatus = action === "finalisieren" ? "leitfaden_final" : "leitfaden";

  const { data: updatedGuide, error: upErr } = await admin
    .from("interview_guides")
    .update({ status: guideStatus })
    .eq("id", guide.id)
    .select("*")
    .single();
  if (upErr) return json({ error: "Leitfaden-Update fehlgeschlagen: " + upErr.message });

  const { error: postErr } = await admin
    .from("posts")
    .update({ status: postStatus })
    .eq("id", guide.post_id);
  if (postErr) return json({ error: "Post-Update fehlgeschlagen: " + postErr.message });

  return json({ ok: true, guide: updatedGuide, post_status: postStatus });
});
