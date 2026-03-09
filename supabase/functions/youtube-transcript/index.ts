import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function xmlToPlainText(xml: string): string {
  // Extract text content from <text> elements
  const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
  const segments: string[] = [];
  let match;
  while ((match = textRegex.exec(xml)) !== null) {
    const decoded = decodeHtmlEntities(match[1].replace(/\n/g, " ").trim());
    if (decoded) segments.push(decoded);
  }
  return segments.join(" ");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { youtube_url } = await req.json();
    if (!youtube_url) {
      return new Response(JSON.stringify({ error: "youtube_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const videoId = extractVideoId(youtube_url);
    if (!videoId) {
      return new Response(JSON.stringify({ error: "Invalid YouTube URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the YouTube video page
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });

    if (!pageRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch YouTube page" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = await pageRes.text();

    // Extract captions data from ytInitialPlayerResponse
    const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
    if (!playerMatch) {
      return new Response(JSON.stringify({ error: "Could not parse YouTube player data. The video may be restricted." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let playerData: any;
    try {
      playerData = JSON.parse(playerMatch[1]);
    } catch {
      return new Response(JSON.stringify({ error: "Failed to parse player response JSON" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!captionTracks || captionTracks.length === 0) {
      return new Response(JSON.stringify({ error: "No captions available for this video" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prioritize: de > en > first available
    let track = captionTracks.find((t: any) => t.languageCode === "de");
    if (!track) track = captionTracks.find((t: any) => t.languageCode === "en");
    if (!track) track = captionTracks[0];

    const captionUrl = track.baseUrl;
    const captionRes = await fetch(captionUrl);
    if (!captionRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch caption track" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const captionXml = await captionRes.text();
    const transcript = xmlToPlainText(captionXml);

    if (!transcript) {
      return new Response(JSON.stringify({ error: "Captions were empty" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ transcript, language: track.languageCode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("youtube-transcript error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
