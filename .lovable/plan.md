## Tech Stack Page

Add a new route `/tech-stack` that displays the current technology stack used in this project, with a "Copy as Markdown" button.

### New file: `src/pages/TechStack.tsx`

Sections (grouped, each item with name + short purpose):

- **Frontend**: React 18, TypeScript 5, Vite 5
- **Styling & UI**: Tailwind CSS v3, shadcn/ui (Radix primitives), lucide-react icons, next-themes
- **Routing & State**: React Router, TanStack Query, React Hook Form + Zod
- **Backend (Lovable Cloud)**: Postgres database, Auth, Storage, Edge Functions (Deno)
- **Edge Functions in this project**: `generate-content`, `youtube-transcript`, `wp-upload`, `wp-upload-ftp`
- **AI**: Lovable AI Gateway (Gemini / GPT models) for content generation
- **External integrations**: YouTube transcripts, WordPress REST API + FTP upload
- **Utilities**: `src/lib/markdown.ts` (MD→HTML), `src/lib/export-html.ts` (post HTML export), `src/lib/image-utils.ts` (client-side WebP conversion)
- **Tooling**: ESLint, Vitest, Bun, lovable-tagger

### UI

- Card-based layout, one card per group, list of items inside.
- Header with title "Tech Stack" + a `Copy as Markdown` button (top-right).
- Button copies a Markdown representation of the same content to the clipboard via `navigator.clipboard.writeText`, showing a toast on success.

### Wiring

- Register route in `src/App.tsx`: `<Route path="/tech-stack" element={<TechStack />} />`
- Add a small link/button on the Dashboard (`src/pages/Index.tsx`) header so the page is reachable.

### Technical details

- Markdown string built once as a constant (single source of truth) and rendered into the cards by parsing the same structured data; the copy button serializes that data to MD.
- Use existing `useToast` for the "Copied!" feedback.
- No backend/schema changes.
