

## Unified Form with Manual Screenshot Upload

### Problem
Currently the workflow is split across multiple views: NewPost (source data) → EditPost with 3 tabs (Editor, Screenshots, Preview). The user wants everything in one form, with AI generation triggered only after all data is entered, and screenshots uploaded manually as files.

### Proposed Changes

**`src/pages/NewPost.tsx`** — Complete rewrite into a single unified form:
- **Section 1: Source Data** — Guest name, interview title, YouTube URL + transcript fetch, newsletter text, telegram text, guest website URL, guest bio, prettylink shortcodes (same fields as today)
- **Section 2: Screenshot Upload** — 3 file upload fields (Top/Mid/End image), each with:
  - Drag & drop zone or file picker button
  - On file select: auto-name as `{GuestName}-Screen-{1|2|3}.webp`, convert to WebP client-side (max 1500px, <400KB)
  - Show thumbnail preview
  - "Upload to WordPress" button per slot (calls `wp-upload` edge function)
  - Display resulting WordPress URL after upload
  - URLs auto-populate the corresponding block fields
- **Section 3: AI Generation** — Single button "Inhalte generieren" at the bottom, disabled until guest_name + interview_title are filled
  - Creates the post in DB, calls `generate-content`, saves blocks, then navigates to EditPost

**`src/pages/EditPost.tsx`** — Simplify:
- Remove the "Screenshots" tab entirely
- Keep the 3 image URL fields in the block editor (top/mid/end) as editable text inputs (for manual override), pre-filled from the NewPost upload
- Keep SourceDataEditor collapsible for re-editing source data and re-generating
- Keep Editor + Preview as the two views (no more 3 tabs)

**`src/components/ScreenshotUploader.tsx`** — New component (~150 lines):
- Props: `guestName: string`, `onUrlsChange: (urls: { top?: string, mid?: string, end?: string }) => void`
- 3 upload slots with file input, client-side WebP conversion, WordPress upload via edge function
- Naming convention: `{sanitizedGuestName}-Screen-{1|2|3}.webp`
- Upload method toggle (REST API / FTP) from existing `ScreenshotSettings`

**Files to remove/deprecate:**
- `src/components/ScreenshotTool.tsx` — replaced by simpler `ScreenshotUploader`
- `supabase/functions/screenshot-capture/index.ts` — no longer needed (no server-side screenshot capture)

**No database changes needed** — image URLs are stored in the `blocks` JSONB column as before.

### Workflow

```text
NewPost (single form)
  ├── Enter all source data
  ├── Upload 3 screenshots → WordPress
  └── Click "Generate" → creates post + AI blocks → navigate to EditPost

EditPost (2-panel: Editor + Preview)
  ├── All block fields editable
  ├── Image URLs pre-filled from upload
  └── Re-generate via SourceDataEditor
```

### Key Details
- Client-side WebP conversion reuses existing logic from ScreenshotTool (canvas → toBlob with iterative quality)
- WordPress upload uses existing `wp-upload` edge function unchanged
- ScreenshotSettings (REST/FTP toggle) remains available in the upload component

