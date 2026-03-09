

## Preview Screen — Gap Analysis

The preview is already built and renders all 11 blocks in the correct order. Two items from the spec are missing:

### 1. Summary Accordion Box
Currently a static `div`. The spec calls for an accordion. We'll wrap it in a Radix Accordion (already installed) so users can expand/collapse the summary.

### 2. Guest Profile Image
The spec says "with image and text." Currently there's no `guest_image_url` field. We need to:
- **Add a `guest_image_url` column** to the `posts` table via migration (nullable text).
- **Update `PostBlocks` type** to include `guest_image_url?: string`.
- **Add an image URL input** in `NewPost.tsx` (source form) and `EditPost.tsx` (block editor).
- **Render the image** in `PreviewPost.tsx` inside the guest profile block using an Avatar component.
- **Include the image** in `export-html.ts` HTML output.

### Files Changed
| File | Change |
|---|---|
| `supabase/migrations/...` | Add `guest_image_url` column |
| `src/types/post.ts` | Add `guest_image_url?` to `PostBlocks` |
| `src/pages/PreviewPost.tsx` | Accordion for summary; avatar for guest |
| `src/pages/EditPost.tsx` | Add guest image URL input |
| `src/pages/NewPost.tsx` | Add guest image URL input to source form |
| `src/lib/export-html.ts` | Add `<img>` to guest profile HTML |

