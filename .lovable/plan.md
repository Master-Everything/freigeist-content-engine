

## YouTube Auto-Captions Integration

### Overview
Add a "Fetch Transcript" button next to the YouTube URL field. When clicked, it extracts auto-generated captions from the video and stores them as source data for AI content generation.

### Changes

**1. New edge function: `supabase/functions/youtube-transcript/index.ts`**
- Accepts a YouTube URL, extracts the video ID
- Fetches the YouTube video page HTML
- Parses the captions track URL from the embedded player config (`captionTracks` in `ytInitialPlayerResponse`)
- Fetches the XML captions and converts to plain text
- Returns `{ transcript: string }` or an error
- Falls back gracefully if no captions are available
- Add to `config.toml` with `verify_jwt = false`

**2. Update `src/types/post.ts`**
- Add `video_transcript: string` to `SourceFormData`

**3. Update `src/pages/NewPost.tsx`**
- Add a "Fetch Transcript" button next to the YouTube URL input
- On click, call `youtube-transcript` edge function
- Display the transcript in a read-only textarea below
- Store result in `form.video_transcript`
- Pass `video_transcript` to `generate-content`

**4. Update `supabase/functions/generate-content/index.ts`**
- Accept `video_transcript` in the request body
- Include the transcript text in the AI user prompt when available (e.g., "Video-Transkript: ...")
- This gives the AI much richer context for content generation

**5. Database migration**
- Add `video_transcript text` column to `posts` table (nullable)
- Store the transcript alongside other source data

### Technical Notes
- YouTube captions extraction works by parsing `ytInitialPlayerResponse` from the video page — no API key needed
- Works with both manual and auto-generated captions
- German (`de`) captions are prioritized, with English as fallback, then any available language
- The transcript is plain text (timestamps stripped) to maximize usefulness as AI context

