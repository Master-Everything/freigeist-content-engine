import { createClient } from "npm:@supabase/supabase-js@2";
import { renderPostHtml, PostBlocks } from "./render-post.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonError(message: string, extra?: Record<string, unknown>) {
  // 200 OK with error key (Projekt-Konvention)
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function collectImages(blocks: PostBlocks): Array<{ url: string; role: "featured" | "inline" }> {
  // Kein Featured-Image mehr — alle Bilder als "inline" transferieren.
  const items: Array<{ url: string; role: "featured" | "inline" }> = [];
  const seen = new Set<string>();
  const push = (url: string | undefined) => {
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) return;
    if (seen.has(url)) return;
    seen.add(url);
    items.push({ url, role: "inline" });
  };
  push(blocks.guest_image_url);
  push(blocks.top_image_url);
  push(blocks.mid_image_url);
  push(blocks.end_image_url);
  return items;
}


function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 200) || "interview";
}

function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.round(words / 200));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const HUB_INGEST_URL = Deno.env.get("HUB_INGEST_URL");
    const HUB_INGEST_SECRET = Deno.env.get("HUB_INGEST_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!HUB_INGEST_URL || !HUB_INGEST_SECRET) {
      return jsonError("HUB_INGEST_URL oder HUB_INGEST_SECRET nicht konfiguriert.");
    }
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return jsonError("Supabase-Env nicht verfügbar.");
    }

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return jsonError("Nicht eingeloggt.");

    const supaAuth = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: userData, error: userErr } = await supaAuth.auth.getUser(jwt);
    if (userErr || !userData?.user) return jsonError("Ungültiges Login.");

    const body = await req.json().catch(() => ({}));
    const post_id = body?.post_id as string | undefined;
    if (!post_id) return jsonError("post_id fehlt.");

    const supa = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: post, error: postErr } = await supa
      .from("posts")
      .select("*")
      .eq("id", post_id)
      .single();
    if (postErr || !post) return jsonError("Beitrag nicht gefunden.");

    const blocks = (post.blocks ?? {}) as PostBlocks;
    const content_html = renderPostHtml(blocks, post.guest_name, post.interview_title, {
      omitMainVideo: true,
      omitExcerpt: true,
    });
    const image_urls = collectImages(blocks);

    const payload = {
      hub_post_id: (post as any).hub_post_id ?? null,
      engine_post_id: post.id,
      title: post.interview_title,
      slug: (post as any).hub_slug || slugify(post.interview_title),
      subtitle: blocks.excerpt ?? null,
      video_url: blocks.main_video_url ?? null,
      content_html,
      reading_time: estimateReadingTime(content_html),
      image_urls,
    };


    const hubRes = await fetch(HUB_INGEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Ingest-Secret": HUB_INGEST_SECRET,
      },
      body: JSON.stringify(payload),
    });

    const hubText = await hubRes.text();
    let hubJson: any = {};
    try { hubJson = JSON.parse(hubText); } catch { /* ignore */ }

    if (!hubRes.ok || hubJson?.error) {
      const msg = hubJson?.error || `Hub antwortete mit ${hubRes.status}: ${hubText.slice(0, 300)}`;
      await supa.from("posts").update({ hub_last_error: msg }).eq("id", post_id);
      return jsonError(msg);
    }

    await supa
      .from("posts")
      .update({
        hub_post_id: hubJson.hub_post_id ?? null,
        hub_slug: hubJson.hub_slug ?? null,
        hub_pushed_at: new Date().toISOString(),
        hub_last_error: null,
        status: "hub_pushed",
      })
      .eq("id", post_id);

    return new Response(
      JSON.stringify({
        ok: true,
        hub_post_id: hubJson.hub_post_id ?? null,
        hub_slug: hubJson.hub_slug ?? null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return jsonError((e as Error).message ?? "Unbekannter Fehler");
  }
});
