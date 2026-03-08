
## Implementing Preview and Export Enhancements

We will implement the Preview and Export screens exactly as specified, following the approved plan:

### 1. Database and Types
- Create a Supabase migration to add `guest_image_url` (text, nullable) to the `posts` table.
- Update `src/types/post.ts` to include `guest_image_url` in `SourceFormData`, `Post`, and `PostBlocks`.

### 2. Form and Editor Updates
- **`src/pages/NewPost.tsx`**: Add an optional "Guest Image URL" input field to the source data form.
- **`src/pages/EditPost.tsx`**: Add an editable input field for `guest_image_url` in the Guest Profile section.

### 3. Preview Screen (`src/pages/PreviewPost.tsx`)
- Enforce the exact rendering order: Headline, Excerpt, Main video, Summary accordion, Guest profile (with image + text), Content 1-3, Additional video, PrettyLink, Resources.
- **Summary Accordion**: Implement using native HTML `<details>` and `<summary>` tags styled appropriately.
- **Guest Profile**: Display the `guest_image_url` alongside the biography.

### 4. Export functionality (`src/lib/export-html.ts` & `src/pages/PreviewPost.tsx`)
- Change the button text to "Generate WordPress HTML".
- Update the export function to output:
  - `<details>` and `<summary>` tags for the summary box.
  - `<img>` tag for the guest profile.
  - Clean HTML matching the new structure exactly.
- Implement a modal dialog displaying the generated raw HTML in a `<textarea>` for easy copying to WordPress.
