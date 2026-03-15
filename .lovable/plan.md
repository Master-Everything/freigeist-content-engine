

## "Entdecke mehr über ..." Überschrift anpassen

Referenz-Styles von freigeistkongress.com:
- `font-family: "Roboto Condensed", Sans-serif`
- `font-size: 44px`
- `font-weight: 900`
- `color: var(--e-global-color-6f897f0)` → das ist der Teal/Primary-Farbton

### Änderungen

**`src/components/PostPreview.tsx`** (Zeile 76):
- Aktuell: `text-2xl font-bold italic text-primary` mit `fontFamily: 'Georgia, serif'`
- Neu: `text-4xl font-black text-primary` mit `fontFamily: '"Roboto Condensed", sans-serif'`
- `italic` beibehalten (wie bisher) oder entfernen – die Referenz zeigt kein italic, daher entfernen
- `text-4xl` = 36px (nächste Tailwind-Stufe zu 44px), alternativ inline `fontSize: '44px'`

**`src/lib/export-html.ts`** (Zeile 60):
- Aktuell: `font-size:1.5em;font-weight:700;font-style:italic;font-family:Georgia,serif;color:#14b8a6`
- Neu: `font-size:44px;font-weight:900;font-family:"Roboto Condensed",sans-serif;color:#14b8a6`
- `font-style:italic` entfernen

