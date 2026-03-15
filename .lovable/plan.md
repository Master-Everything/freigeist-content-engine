

## CTA-Buttons mit Gradient-Style wie im Referenz-Screenshot

Die Buttons bekommen einen Farbverlauf (Gradient) statt einer flachen Farbe, mit einem leicht veränderten Gradient beim Hover — passend zu den hochgeladenen Screenshots.

### Analyse der Screenshots

- **Normal**: Linearer Gradient von links nach rechts, ca. `#2A809B` → `#3BB8A8` (teal zu heller teal-grün)
- **Hover**: Leicht kräftigerer/hellerer Gradient, ca. `#35A89E` → `#2A809B` (Richtung umgekehrt, lebhaftere Farben)
- **Border-Radius**: ~8px (abgerundeter als aktuell 3px)
- **Padding**: Etwas größer, ca. `py-3.5 px-8`
- **Schatten**: Leichter Box-Shadow

### Änderungen

**`src/components/PostPreview.tsx`** — Alle 3 CTA-Buttons:
- `bg-[#2A809B]` → `bg-gradient-to-r from-[#2A809B] to-[#3BB8A8]`
- `rounded-[3px]` → `rounded-lg`
- Hover: `hover:from-[#35A89E] hover:to-[#2A809B]` (Gradient umkehren)
- Leichter Shadow: `shadow-md hover:shadow-lg`
- Padding anpassen: `px-8 py-3.5`

**`src/lib/export-html.ts`** — Alle 3 CTA-Buttons im HTML-Export:
- `background:#2A809B` → `background:linear-gradient(to right,#2A809B,#3BB8A8)`
- `border-radius:3px` → `border-radius:8px`
- `padding:12px 24px` → `padding:14px 32px`
- Hover-Gradient in bestehenden `<style>`-Block: `.cta-button:hover { background:linear-gradient(to right,#35A89E,#2A809B) }`

**`tailwind.config.ts`** — Keine Änderungen nötig (Tailwind Gradient-Utilities sind built-in).

