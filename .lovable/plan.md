
## Feature Implementation: Preview Enhancements & Export HTML

We will enhance the existing Preview and Export features to perfectly match the requested Freigeist post structure, including the new accordion summary and guest profile image.

### 1. Database & Type Updates
- Add `guest_image_url` to the `posts` table (via a new Supabase migration).
- Update `SourceFormData`, `Post`, and `PostBlocks` interfaces in `src/types/post.ts` to include the `guest_image_url`.

### 2. Source Input & Editor Updates
- **Source Input (`NewPost.tsx`)**: Add an optional "Guest Image URL" field to the initial data collection form.
- **Block Editor (`EditPost.tsx`)**: Add an editable text field for the Guest Image URL within the Guest Profile block so it can be updated after generation.

### 3. Preview Screen (`PreviewPost.tsx`)
- Ensure the strict order of elements: Headline → Excerpt → Main Video → Summary Accordion → Guest Profile (with image) → Content Sections 1-3 → Additional Video → PrettyLink → Resources.
- **Summary Accordion**: Replace the static summary box with a native `<details>` and `<summary>` element, styled with Tailwind to look like a clean accordion.
- **Guest Profile**: Render the guest image (if provided) alongside the guest bio text.

### 4. HTML Export Update (`export-html.ts` & `PreviewPost.tsx`)
- Rename the export button to **"Generate WordPress HTML"**.
- Improve the export action to open a **Modal/Dialog** displaying the raw HTML in a `<textarea>` for easy copying, rather than just copying it silently.
- Update the HTML generation logic in `export-html.ts` to output:
  - A `<details>` and `<summary>` block for the Summary Box.
  - An `<img>` tag within the Guest Profile HTML.
  - Clean semantic tags (`<h1>`, `<h2>`, `<p>`, `<ul>`, `<li>`) preserving PrettyLink shortcodes exactly as typed.
