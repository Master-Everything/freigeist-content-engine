

## Platzhalter für oberes und mittleres Bild

Basierend auf der Beispielseite fehlen zwei Bilder:
- **Oberes Bild**: Nach dem Gast-Profil / vor dem Website-CTA-Button
- **Mittleres Bild**: Nach Sektion 3 / beim Affiliate-CTA-Block

### Änderungen

**1. `src/types/post.ts`** — 6 neue Felder:
- `top_image_url`, `top_image_link`, `top_image_alt`
- `mid_image_url`, `mid_image_link`, `mid_image_alt`

**2. `src/components/PostPreview.tsx`**:
- Oberes Bild (oder Platzhalter) nach Gast-Profil, vor CTA-Button 1 einfügen
- Mittleres Bild (oder Platzhalter) nach Sektion 3, vor dem Affiliate-CTA einfügen

**3. `src/pages/EditPost.tsx`** — Editor-Felder:
- Block "Oberes Bild" mit URL, Link, Alt-Text
- Block "Mittleres Bild" mit URL, Link, Alt-Text

**4. `src/lib/export-html.ts`** — Beide Bilder an den korrekten Positionen im Export

