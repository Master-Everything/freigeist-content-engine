

## Add Source Data Editor + Re-generate AI on Edit Page

### What
Add a collapsible "Source Data" section to the EditPost page that shows the original input fields (guest name, title, YouTube URL, transcript, newsletter text, etc.) and a "Re-generate" button to re-run AI content generation with updated source data.

### Changes

**1. `src/pages/EditPost.tsx`**
- Add a collapsible section (using `Collapsible` from Radix) at the top of the editor panel labeled "Source Data / Quelldaten"
- Show all source fields from the post record: `guest_name`, `interview_title`, `youtube_url`, `newsletter_text`, `telegram_text`, `guest_website_url`, `guest_short_bio`, `prettylink_shortcodes`, `video_transcript`
- Make these fields editable — changes update both the `post` state and are saved to the DB
- Include the "Fetch Transcript" button next to YouTube URL (same as NewPost)
- Add a "Re-generate Content" button (with Sparkles icon) that:
  - Saves the updated source data to the `posts` table first
  - Calls the `generate-content` edge function with the current source fields
  - Updates the blocks state with the AI response
  - Shows a confirmation dialog before overwriting existing blocks

**2. `src/pages/EditPost.tsx` — toolbar**
- Add a small "Quelldaten" toggle button in the toolbar to expand/collapse the source section

### Flow
1. User opens edit page → sees current block editor as before
2. Clicks "Quelldaten" to expand source data section
3. Edits any source fields (e.g. pastes new newsletter text, fetches transcript)
4. Clicks "Re-generate" → confirmation dialog → AI overwrites blocks with fresh content
5. User can then fine-tune in the block editor as usual

