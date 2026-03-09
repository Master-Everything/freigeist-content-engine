

## Refine HTML Export Template

### What Changes

Update `src/lib/export-html.ts` to output the exact `freigeist-*` CSS class structure specified, plus accept `postTitle` as a parameter for the `<h1>`.

### Specific Changes

**`src/lib/export-html.ts`** — Update the `generateHTML` function:

| Block | Current | New |
|---|---|---|
| Title | Missing | `<h1>{post_title}</h1>` (add `postTitle` param) |
| Excerpt | `<p><em>...</em></p>` | `<p class="freigeist-excerpt">...</p>` |
| Main Video | `<div class="video-embed">` | `<div class="freigeist-video">` with iframe |
| Summary | `<details class="summary-box">`, `<summary><h2>` | `<details class="freigeist-summary-box">`, `<summary>` (no h2 inside summary) |
| Guest | `<div class="guest-profile">`, `<h3>Über...` | `<div class="freigeist-guest-profile">` with inner `<div class="freigeist-guest-bio">`, `<h2>{guest_name}</h2>` |
| Sections | bare `<h2>` + `<p>` | Wrapped in `<section class="freigeist-content-section">` |
| Additional Video | `<div class="video-embed">` | `<div class="freigeist-additional-video">` |
| PrettyLink | Raw shortcode | `<div class="freigeist-prettylink">{shortcode}</div>` |
| Resources | `<h2>` + `<p>` tags | `<div class="freigeist-resources">` wrapping the content |

No other files need changes — the export function is only called from the editor toolbar's export button.

