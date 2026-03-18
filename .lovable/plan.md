

## Unified Workflow Restructuring

### Overview
Restructure the NewPost page as a pure data-entry form (savable as "In Erfassung"), move image uploads to the Block Editor next to their respective fields, add guest profile picture and transcript upload, and reorder the editor to match the preview.

---

### 1. Database: Create `images` table

```sql
CREATE TABLE public.images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  slot text NOT NULL, -- 'top', 'mid', 'end', 'guest_profile'
  filename text NOT NULL,
  original_name text,
  file_size integer,
  wp_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all select" ON public.images FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert" ON public.images FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.images FOR UPDATE TO public USING (true);
CREATE POLICY "Allow all delete" ON public.images FOR DELETE TO public USING (true);
```

Add new status value to dashboard:
- `erfassung` → "In Erfassung" (displayed in Index.tsx)

### 2. NewPost.tsx — Simplify to data-entry only

**Remove:** ScreenshotUploader, ScreenshotSettings, image upload logic, AI generation button
**Add:**
- Guest profile picture field: radio toggle (Link / Upload), with URL input or file picker + upload button
- Below YouTube URL + transcript fetch button: editable Textarea for manual transcript entry + file upload button (`.txt`) that reads file content into the field
- **"Speichern" button** at bottom: saves post to DB with `status: "erfassung"`, then navigates to `/edit/{id}`
- No AI generation here — that stays in EditPost via SourceDataEditor

### 3. EditPost.tsx — Add image uploads inline & reorder

**Add image upload** next to each image block (top, mid, end, guest_profile):
- Small upload button next to the Bild-URL input
- On file select: WebP conversion (reuse `convertToWebP` from ScreenshotUploader), auto-name, upload to WP via edge function
- Save record to `images` table
- Auto-fill the URL input

**Reorder editor sections to match PostPreview order:**

```text
1. Excerpt
2. Main Video
3. Summary Box (title, lead, paragraphs)
4. Guest Profile (image + upload, bio, website CTA, affiliate CTA)
5. Top Image (URL + upload, link, alt)
6. CTA Button 1 (guest website — already in Guest Profile)
7. Section 1
8. Section 2
9. Section 3
10. Mid Image (URL + upload, link, alt)
11. Affiliate CTA (already in Guest Profile)
12. Section 4
13. Section 5
14. Section 6
15. End Image (URL + upload, link, alt)
16. Optional blocks (Additional Video, PrettyLink, Resources)
```

### 4. Index.tsx (Dashboard)

Add `erfassung` status to `statusConfig`:
```ts
erfassung: { label: "In Erfassung", className: "bg-blue-100 text-blue-800" }
```

### 5. Files changed

| File | Action |
|------|--------|
| `src/pages/NewPost.tsx` | Rewrite: remove screenshots/AI gen, add profile pic, transcript upload, save as "erfassung" |
| `src/pages/EditPost.tsx` | Add inline image uploads, reorder blocks to match preview |
| `src/pages/Index.tsx` | Add "erfassung" status |
| `src/components/ScreenshotUploader.tsx` | Keep `convertToWebP` + `sanitizeName` utilities, refactor for reuse in EditPost |
| DB migration | Create `images` table |

### 6. Key details

- `convertToWebP` and `sanitizeName` will be extracted to a shared utility (`src/lib/image-utils.ts`)
- Image upload in EditPost: small Upload icon button inline with URL input, triggers file picker → convert → upload → save to `images` table → fill URL field
- Transcript upload: hidden file input accepting `.txt`, reads via `FileReader.readAsText()` into the transcript textarea
- Guest profile picture: tabs/radio for "Link" vs "Upload", same upload flow as screenshots but with slot `guest_profile`

