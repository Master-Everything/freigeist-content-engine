

## Schriftstile zwischen Vorschau und HTML-Export abgleichen

Vergleich der aktuellen Styles zeigt folgende Abweichungen:

```text
Element              | Vorschau (Tailwind)         | HTML-Export (inline)           | Fix
─────────────────────┼─────────────────────────────┼────────────────────────────────┼─────
Summary Absätze      | leading-relaxed (1.625)     | line-height:1.7, kein font-sz | Export: +font-size:16px; Preview: leading-[1.7]
Section H2 Titel     | text-2xl (24px) bold        | <h2> ohne inline Style        | Export: +font-size:24px;font-weight:700;margin-bottom:1em
Section H4           | font-semibold (600)         | font-weight:700               | Export: →600
Listen-Items         | text-base (16px geerbt)     | kein font-size                | Export: +font-size:16px
UL Container         | space-y-1.5 pl-5 list-disc  | kein Stil                     | Export: +list-style:disc;padding-left:1.25em;margin-bottom:1em
```

### Änderungen

**`src/components/PostPreview.tsx`** (Zeile 64):
- Summary-Absätze: `leading-relaxed` → `leading-[1.7]` (damit identisch zum Export)

**`src/lib/export-html.ts`** (Zeile 98):
- Section `<h2>`: inline Style hinzufügen: `font-size:24px;font-weight:700;margin-bottom:1em`

**`src/lib/markdown.ts`**:
- `<li>`: `font-size:16px` ergänzen (Zeile 16)
- `<h4>`: `font-weight:700` → `font-weight:600` (Zeile 42)
- `<ul>`: `style="list-style:disc;padding-left:1.25em;margin-bottom:1em"` hinzufügen (Zeile 16)

