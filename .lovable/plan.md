

## Dritter CTA-Button unter dem End-Bild

Der dritte CTA-Button wird direkt nach dem End-Bild eingefügt und verwendet die gleichen Daten wie der Affiliate-CTA (URL + Label aus `cta_affiliate_url` / `cta_affiliate_label`).

### Änderungen

**`src/components/PostPreview.tsx`**: Nach dem End-Bild-Block (vor dem Additional Video) einen weiteren CTA-Block einfügen — identisch zum Affiliate-CTA mit `bg-[#2A809B]`, bounce-in Animation und Empfehlungslink-Hinweis. Nur rendern wenn `cta_affiliate_url` gesetzt ist.

**`src/lib/export-html.ts`**: Nach dem End-Image-Block (vor Additional Video) den gleichen CTA-HTML-Block wie beim Affiliate-CTA einfügen — gleicher Style, gleiche Klasse `cta-button`, gleicher Disclaimer-Text.

Keine Änderungen an Types oder Datenbank nötig, da die bestehenden Affiliate-Felder wiederverwendet werden.

