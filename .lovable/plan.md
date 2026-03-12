

## Fix: YouTube Transcript Fetching

### Problem
Both InnerTube API and page scraping fail to find caption tracks for video `M3k-XvQ-Tl0`, even though the video has captions visible on YouTube. This is a common issue: YouTube restricts caption data for server-side (non-browser) requests, especially from cloud IPs.

### Solution
Rewrite the edge function with three more robust strategies:

**`supabase/functions/youtube-transcript/index.ts`**

1. **Try InnerTube with `ANDROID` client** — YouTube is less restrictive with Android client requests and more reliably returns caption tracks (including auto-generated ones). Use `clientName: "ANDROID"` and `clientVersion: "19.09.37"` with an Android user-agent.

2. **Try InnerTube with `WEB` client + API key** — Use the public `INNERTUBE_API_KEY` that YouTube embeds in its pages (`AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`). This often unblocks caption data that the keyless endpoint hides.

3. **Keep page scraping as final fallback** — with additional debug logging to see what YouTube actually returns.

4. **Add detailed logging** — Log the full response structure when captions are missing, so we can diagnose future issues without guessing.

### Key Change
Replace the `getCaptionsViaInnerTube` function body to try the ANDROID client first (which reliably returns auto-generated captions), then fall back to WEB client with API key, then page scraping.

