

## Data Model Refactoring Plan

### Current vs Requested — Gap Analysis

The data model is mostly there but uses different field names and is missing a few fields. Here's what needs to change:

### 1. Database Migration

Add/rename columns on the `posts` table:

| Change | Detail |
|---|---|
| Add `post_slug` | New nullable text column for URL slug |
| Rename `guest_website` → `guest_website_url` | Align with spec |
| Rename `guest_profile_text` → `guest_short_bio` | Align with spec |

### 2. PostBlocks Interface Renames

| Current | New |
|---|---|
| `headline` | Remove — use DB-level `interview_title` as post title |
| `excerpt` | Keep (maps to `post_excerpt`, stored in blocks) |
| `youtube_url` | `main_video_url` |
| `summary_title` | `summary_box_title` |
| `summary_bullets` | `summary_points` |
| `guest_bio` | `guest_short_bio` |
| `section1_title` | `section_1_title` |
| `section1_content` | `section_1_body` |
| (same for 2, 3) | |
| `additional_video_url` | `additional_video_embed` |
| `prettylink_shortcodes` | `pretty_link_shortcode` |
| `resources` | Split into `resource_links` and `resource_notes` |

Add new field: `main_video_embed` (computed/stored embed HTML from URL).

### 3. Files to Update

| File | Changes |
|---|---|
| `supabase/migrations/...` | Add `post_slug`, rename `guest_website` → `guest_website_url`, rename `guest_profile_text` → `guest_short_bio` |
| `src/types/post.ts` | Rename all fields in `PostBlocks`, update `Post` and `SourceFormData` interfaces |
| `src/pages/EditPost.tsx` | Update all field references to new names |
| `src/pages/PreviewPost.tsx` | Update all field references |
| `src/pages/NewPost.tsx` | Update form fields and DB insert |
| `src/pages/Index.tsx` | Update any column references |
| `src/lib/export-html.ts` | Update all block field references |
| `supabase/functions/generate-content/index.ts` | Update AI tool schema to use new field names |

### 4. Approach

- Single DB migration for column additions/renames
- Update TypeScript types first, then fix all consuming files
- The `blocks` JSONB will store: excerpt, main_video_url, main_video_embed, summary_box_title, summary_lead, summary_points, guest_short_bio, guest_image_url, section_1_title, section_1_body, section_2_title, section_2_body, section_3_title, section_3_body, additional_video_embed, pretty_link_shortcode, resource_links, resource_notes
- DB-level columns remain for: id, status, post_slug, guest_name, guest_image_url, interview_title, youtube_url (source), newsletter_text, telegram_text, guest_website_url, guest_short_bio, prettylink_shortcodes (source), blocks, created_at, updated_at

