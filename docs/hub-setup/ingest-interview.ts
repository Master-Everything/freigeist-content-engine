// supabase/functions/ingest-interview/index.ts  (im HUB-Projekt)
//
// Empfängt Interview-Push aus der Content-Engine, transferiert alle Bilder
// in den Hub-Bucket `post-images` und legt einen Draft-Post in public.posts
// an (oder aktualisiert einen bestehenden per hub_post_id).
//
// Auth: ausschließlich per Shared Secret im Header X-Ingest-Secret.
// Rückgabe: immer HTTP 200 mit JSON (Fehler stehen im `error`-Key).

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const BodySchema = z.object({
  hub_post_id: z.string().uuid().nullable().optional(),
  engine_post_id: z.string().uuid(),
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(300),
  subtitle: z.string().nullable().optional(),
  video_url: z.string().url().nullable().optional(),
  content_html: z.string(),
  reading_time: z.number().int().positive().nullable().optional(),
  image_urls: z
    .array(
      z.object({
        url: z.string().url(),
        role: z.enum(["featured", "inline"]).default("inline"),
      }),
    )
    .default([]),
});


const BUCKET = "post-images";
const CATEGORY_SLUG = "interview";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extFromUrl(url: string, contentType: string | null): string {
  const clean = url.split("?")[0].split("#")[0];
  const m = clean.match(/\.([a-zA-Z0-9]{2,5})$/);
  if (m) return m[1].toLowerCase();
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("jpeg")) return "jpg";
  return "bin";
}

async function shortHash(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-1", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ---- Shared Secret prüfen -------------------------------------------
    const provided = req.headers.get("X-Ingest-Secret");
    const expected = Deno.env.get("INGEST_SHARED_SECRET");
    if (!expected) return json({ error: "Server misconfigured: INGEST_SHARED_SECRET missing" });
    if (!provided || provided !== expected) {
      return json({ error: "Unauthorized" });
    }

    // ---- Body parsen ----------------------------------------------------
    const raw = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return json({ error: "Invalid payload", details: parsed.error.flatten() });
    }
    const body = parsed.data;

    // ---- Service-Role Client -------------------------------------------
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ---- Kategorie „Interview" prüfen ----------------------------------
    const { data: cat, error: catErr } = await supabase
      .from("categories")
      .select("slug")
      .eq("slug", CATEGORY_SLUG)
      .maybeSingle();
    if (catErr) return json({ error: `Category lookup failed: ${catErr.message}` });
    if (!cat) return json({ error: `Category '${CATEGORY_SLUG}' not found in hub` });

    // ---- Bilder in den Hub-Storage transferieren -----------------------
    let contentHtml = body.content_html;
    let transferred = 0;

    for (const img of body.image_urls) {
      try {
        const res = await fetch(img.url);
        if (!res.ok) continue;
        const contentType = res.headers.get("content-type");
        const bytes = new Uint8Array(await res.arrayBuffer());
        const hash = await shortHash(img.url);
        const ext = extFromUrl(img.url, contentType);
        const path = `ingest/${body.slug}/${hash}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, bytes, {
            upsert: true,
            contentType: contentType ?? "application/octet-stream",
          });
        if (upErr) {
          console.error("upload failed", img.url, upErr.message);
          continue;
        }

        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const hubUrl = pub.publicUrl;

        contentHtml = contentHtml.split(img.url).join(hubUrl);
        transferred += 1;
      } catch (e) {
        console.error("image transfer error", img.url, e);
      }
    }

    // ---- Insert oder Update --------------------------------------------
    // Kein Featured-Image: image_url bleibt null. Featured Video wird als
    // video_url an den Hub übergeben und dort unter dem Subtitle gerendert.
    const payload: Record<string, unknown> = {
      title: body.title,
      slug: body.slug,
      subtitle: body.subtitle ?? null,
      content: contentHtml,
      category_slug: CATEGORY_SLUG,
      status: "draft",
      image_url: null,
      video_url: body.video_url ?? null,
      reading_time: body.reading_time ?? null,
      source_engine_post_id: body.engine_post_id,
      source_engine_pushed_at: new Date().toISOString(),
    };


    let hubPostId: string;
    let hubSlug: string;

    if (body.hub_post_id) {
      const { data, error } = await supabase
        .from("posts")
        .update(payload)
        .eq("id", body.hub_post_id)
        .select("id, slug")
        .single();
      if (error) return json({ error: `Update failed: ${error.message}` });
      hubPostId = data.id;
      hubSlug = data.slug;
    } else {
      const { data, error } = await supabase
        .from("posts")
        .insert(payload)
        .select("id, slug")
        .single();
      if (error) return json({ error: `Insert failed: ${error.message}` });
      hubPostId = data.id;
      hubSlug = data.slug;
    }

    return json({
      hub_post_id: hubPostId,
      hub_slug: hubSlug,
      images_transferred: transferred,
    });
  } catch (e) {
    console.error("ingest-interview fatal", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
});
