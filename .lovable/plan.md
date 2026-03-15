

## CTA-Buttons an Freigeist-Stil anpassen (HTML-Export + Vorschau)

### Änderungen

**`src/lib/export-html.ts`** — Beide CTA-Buttons umstellen:

1. **Guest Website CTA** (Zeile 86-88): Neuer Elementor-Style mit `background:#6EC1E4`, `border-radius:3px`, `font-size:15px;font-weight:700`, plus `bounce-in` Hover-Animation via inline `onmouseover`/`onmouseout` oder CSS-Klasse.

2. **Affiliate CTA** (Zeile 117-118): Gleicher Button-Style.

3. **CSS-Block am Anfang des Exports einfügen** (oder als `<style>`-Tag im generierten HTML): Die `bounce-in` Keyframes und `.cta-button:hover` Animation, damit die Buttons im exportierten HTML auch die Hover-Animation haben.

Konkreter Button-Style:
```
display:inline-block;padding:12px 24px;background:#6EC1E4;color:#fff;border-radius:3px;font-size:15px;font-weight:700;text-decoration:none
```

**`src/components/PostPreview.tsx`** — Vorschau-Buttons anpassen:
- Beide CTA-Buttons: `bg-primary` → `bg-[#6EC1E4]`, `rounded-lg` → `rounded-[3px]`, `text-base font-semibold` → `text-[15px] font-bold`
- Hover-Animation: `hover:animate-[bounce-in_0.4s_ease]` via Tailwind arbitrary + Keyframes in `tailwind.config.ts`

**`tailwind.config.ts`** — `bounce-in` Keyframe hinzufügen für die Vorschau.

