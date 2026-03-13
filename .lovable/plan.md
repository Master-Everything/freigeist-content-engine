

## CTA-Buttons wie auf der Beispielseite

### Analyse der Beispielseite

Auf der Referenzseite gibt es **zwei CTA-Buttons** an unterschiedlichen Stellen:

1. **Nach dem Gast-Profil** (vor Sektion 1): "✨ 👉 Zur Webseite der ProLife GmbH ✨" — verlinkt zur Gast-Website
2. **Nach Sektion 3** (Mitte des Artikels): "Informationen & Store" — verlinkt zum Affiliate-Link, mit Hinweis "Es handelt sich um einen Empfehlungslink"

### Änderungen

**1. `src/types/post.ts` — Neues Feld**
- `cta_affiliate_url?: string` hinzufügen (Link für den zweiten Button)
- `cta_affiliate_label?: string` hinzufügen (Button-Text, z.B. "Informationen & Store")
- `guest_website_cta` existiert bereits für Button 1

**2. `src/components/PostPreview.tsx` — Zwei Buttons positionieren**
- **Button 1** bleibt wo er ist (nach Gast-Profil, vor Sektion 1) — "Zur Webseite von {Gastname}"
- **Button 2** nach Sektion 3 einfügen — zeigt `cta_affiliate_label` mit `cta_affiliate_url`, plus kleiner Hinweistext "Es handelt sich um einen Empfehlungslink"
- Styling: Beide als auffällige Buttons mit Emoji-Akzenten wie im Beispiel

**3. `src/pages/EditPost.tsx` — Editor-Felder**
- Im Gast-Profil Block: bestehenden CTA-Link beibehalten (wird automatisch mit `guest_website_url` befüllt)
- Neuer optionaler Block oder Felder im Gast-Profil: "Affiliate-Button URL" + "Affiliate-Button Text"

**4. `src/lib/export-html.ts` — HTML-Export**
- Beide Buttons in den Export aufnehmen an den korrekten Positionen

**5. `src/components/SourceDataEditor.tsx` — Auto-Fill**
- Beim Generieren: `guest_website_cta` automatisch mit `guest_website_url` befüllen (bereits implementiert)

