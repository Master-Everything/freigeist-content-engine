

## Future Readiness Assessment

### Current Architecture Review

After reviewing the full codebase, here is how each planned future feature maps to the current structure, and what small structural improvements would make later integration seamless.

---

### 1. ChatGPT API Integration
**Status: Ready.** The edge function `generate-content/index.ts` already isolates all AI logic server-side. Swapping to OpenAI's API later means changing the URL, headers, and model name in that one file. No client code changes needed.

**No action needed now.**

---

### 2. WordPress API Publishing
**Status: Mostly ready.** `export-html.ts` produces clean, class-annotated HTML. Publishing via WordPress REST API would be a new edge function that takes a post ID, calls `generateHTML`, and POSTs to `wp-json/wp/v2/posts`.

**No action needed now.** The export function is already cleanly separated.

---

### 3. Guest Profile Database
**Status: Needs a small structural change.** Guest data (`guest_name`, `guest_short_bio`, `guest_image_url`, `guest_website_url`) is currently stored directly on the `posts` table. When a guest appears in multiple interviews, this data is duplicated.

**Recommended prep:** Add a `guest_id` field to the `Post` type interface now (optional, nullable) so the type system is ready. The actual `guests` table and foreign key can be added later without breaking existing posts.

---

### 4. Automatic Transcript Analysis
**Status: Ready.** This would be a new edge function (e.g. `analyze-transcript`) that takes a YouTube URL, fetches/generates a transcript, and feeds it to the AI. The existing pattern of edge function → AI gateway → structured output via tool calling is directly reusable.

**No action needed now.**

---

### 5. Newsletter Parsing
**Status: Ready.** `newsletter_text` is already a source field. A future edge function could parse raw newsletter HTML into structured data and pre-fill blocks. The `SourceFormData` type already has the field.

**No action needed now.**

---

### 6. Telegram Parsing
**Status: Ready.** Same as newsletter — `telegram_text` is already a source field. A parsing function would extract structured content from Telegram message format.

**No action needed now.**

---

### 7. Agents for Source Collection
**Status: Partially ready.** The NewPost page currently requires manual input. An agent system would need:
- A way to trigger collection (e.g. a "Collect Sources" button or scheduled job)
- A pipeline concept where multiple edge functions run in sequence

The current single-function architecture would need to be extended to support chaining, but the edge function pattern is solid.

**No action needed now** — the modular edge function pattern supports adding more functions.

---

### Summary

| Feature | Ready? | Action Needed Now? |
|---|---|---|
| ChatGPT API | Yes | None |
| WordPress publishing | Yes | None |
| Guest profile DB | Partially | Add optional `guest_id` to types |
| Transcript analysis | Yes | None |
| Newsletter parsing | Yes | None |
| Telegram parsing | Yes | None |
| Source agents | Yes | None |

### Recommended Change

**One small type-level prep** — add an optional `guest_id` field to `Post` interface and `SourceFormData` in `src/types/post.ts`. This is purely forward-looking and has zero runtime impact. It signals the intent for a future `guests` table without building it yet.

This is a very minor change. If you'd rather keep the types untouched until the guest DB is actually built, that's also fine — the architecture supports it either way.

