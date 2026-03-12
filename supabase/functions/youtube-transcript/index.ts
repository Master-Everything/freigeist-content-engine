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
  const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
  const segments: string[] = [];
  let match;
  while ((match = textRegex.exec(xml)) !== null) {
    const decoded = decodeHtmlEntities(match[1].replace(/\n/g, " ").trim());
    if (decoded) segments.push(decoded);
  }
  return segments.join(" ");
}

function pickTrack(captionTracks: any[]): any {
  let track = captionTracks.find((t: any) => t.languageCode === "de");
  if (!track) track = captionTracks.find((t: any) => t.languageCode === "en");
  if (!track) track = captionTracks[0];
  return track;
}

async function fetchTranscriptFromTrack(track: any): Promise<{ transcript: string; language: string } | null> {
  const captionRes = await fetch(track.baseUrl);
  if (!captionRes.ok) {
    console.log("Caption fetch failed:", captionRes.status);
    return null;
  }
  const captionXml = await captionRes.text();
  const transcript = xmlToPlainText(captionXml);
  if (!transcript) return null;
  return { transcript, language: track.languageCode };
}

// Strategy 1: ANDROID client (least restrictive)
async function tryAndroidClient(videoId: string): Promise<{ transcript: string; language: string } | null> {
  console.log("Trying ANDROID client...");
  try {
    const res = await fetch("https://www.youtube.com/youtubei/v1/player", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip",
      },
      body: JSON.stringify({
        context: {
          client: {
            hl: "de",
            gl: "DE",
            clientName: "ANDROID",
            clientVersion: "19.09.37",
            androidSdkVersion: 30,
          },
        },
        videoId,
      }),
    });

    if (!res.ok) {
      console.log("ANDROID client returned", res.status);
      return null;
    }

    const data = await res.json();
    const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!tracks || tracks.length === 0) {
      console.log("ANDROID: No caption tracks. playabilityStatus:", data?.playabilityStatus?.status);
      return null;
    }

    console.log(`ANDROID: Found ${tracks.length} caption track(s)`);
    return await fetchTranscriptFromTrack(pickTrack(tracks));
  } catch (e) {
    console.error("ANDROID client error:", e);
    return null;
  }
}

// Strategy 2: WEB client with public API key
async function tryWebClientWithKey(videoId: string): Promise<{ transcript: string; language: string } | null> {
  console.log("Trying WEB client with API key...");
  try {
    const res = await fetch(
      "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        body: JSON.stringify({
          context: {
            client: {
              hl: "de",
              gl: "DE",
              clientName: "WEB",
              clientVersion: "2.20240101.00.00",
            },
          },
          videoId,
        }),
      }
    );

    if (!res.ok) {
      console.log("WEB+key client returned", res.status);
      return null;
    }

    const data = await res.json();
    const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!tracks || tracks.length === 0) {
      console.log("WEB+key: No caption tracks. playabilityStatus:", data?.playabilityStatus?.status);
      return null;
    }

    console.log(`WEB+key: Found ${tracks.length} caption track(s)`);
    return await fetchTranscriptFromTrack(pickTrack(tracks));
  } catch (e) {
    console.error("WEB+key client error:", e);
    return null;
  }
}

// Strategy 3: Page scraping fallback
async function tryPageScraping(videoId: string): Promise<{ transcript: string; language: string } | null> {
  console.log("Trying page scraping...");
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cookie": "CONSENT=YES+cb.20210328-17-p0.en+FX+1",
      },
    });

    if (!pageRes.ok) {
      console.log("Page fetch returned", pageRes.status);
      return null;
    }

    const html = await pageRes.text();

    const patterns = [
      /ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;\s*(?:var|const|let|<\/script>)/s,
      /ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;/s,
    ];

    let playerData: any = null;
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        try {
          playerData = JSON.parse(match[1]);
          break;
        } catch {
          continue;
        }
      }
    }

    if (!playerData) {
      console.log("Page scraping: Could not extract playerData");
      return null;
    }

    const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!tracks || tracks.length === 0) {
      console.log("Page scraping: No caption tracks. playabilityStatus:", playerData?.playabilityStatus?.status);
      return null;
    }

    console.log(`Page scraping: Found ${tracks.length} caption track(s)`);
    return await fetchTranscriptFromTrack(pickTrack(tracks));
  } catch (e) {
    console.error("Page scraping error:", e);
    return null;
  }
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

    console.log(`Fetching transcript for video: ${videoId}`);

    // Try three strategies in order
    let result = await tryAndroidClient(videoId);
    if (!result) result = await tryWebClientWithKey(videoId);
    if (!result) result = await tryPageScraping(videoId);

    if (!result) {
      return new Response(
        JSON.stringify({ error: "Für dieses Video sind keine Untertitel verfügbar. Du kannst das Transkript manuell einfügen." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Transcript fetched successfully. Language: ${result.language}, Length: ${result.transcript.length}`);

    return new Response(JSON.stringify({ transcript: result.transcript, language: result.language }), {
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
