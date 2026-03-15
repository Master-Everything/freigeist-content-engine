

## Hover-Scale-Effekt für CTA-Buttons

Der Hover-Button im Screenshot ist sichtbar größer — es fehlt ein `scale`-Effekt beim Hover.

### Änderungen

**`src/components/PostPreview.tsx`** — Allen 3 CTA-Buttons `hover:scale-105` hinzufügen:
- Zeile 123: `transition-all` bleibt, ergänze `hover:scale-105`
- Zeile 167 (Affiliate CTA nach Section 3): gleich
- Zeile 199 (CTA unter End-Bild): gleich

**`src/lib/export-html.ts`** — Im `<style>`-Block die `.cta-button:hover`-Regel um `transform: scale(1.05)` ergänzen.

