

## Consolidate Guest Data into Single Section

Currently guest-related fields are spread across 4 cards:
- **Pflichtfelder**: guest_name, interview_title
- **Gast-Profilbild**: profile picture (link/upload)
- **Optionale Quelldaten**: guest_website_url, guest_short_bio (mixed with newsletter, telegram, prettylink)

### Changes to `src/pages/NewPost.tsx`

Reorganize into 3 cards:

1. **Interview** — interview_title (required)
2. **Gast-Daten** — Consolidate all guest fields into one card:
   - Gastname (required)
   - Gast-Kurzbiografie
   - Gast-Website URL
   - Gast-Profilbild (link/upload tabs — moved here from separate card)
3. **Video & Transcript** — unchanged
4. **Weitere Quelldaten** — newsletter_text, telegram_text, prettylink_shortcodes (guest fields removed)

This groups all guest-related information logically while keeping non-guest source data separate.

