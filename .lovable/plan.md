

## HTML-Design der Beispielseite adaptieren + Bilder

### Analyse der Beispielseite

Die Beispielseite zeigt folgende Struktur (relevante Elemente):

```text
Hero: H1 + Excerpt (dunkler Hintergrund)
Video (YouTube embed)
Summary Accordion (details/summary)
Gast-Profil (Bild + Bio)
Bild 1 (verlinkt, klickbar → affiliate URL)
CTA Button 1 (Gast-Website)
Sektionen 1-3 (H1/H2/H3/H4 + Absätze)
PrettyLink/Affiliate-Block (Produktbild + Beschreibung + Button + Disclaimer)
Bild 2 (verlinkt)                    ← User will nur EIN Bild am Ende
Sektionen 4-6
Zusätzliches Video
```

### Geplante Änderungen

**1. `src/types/post.ts` — Neue Bild-Felder**
- `end_image_url?: string` — Bild-URL (das eine Bild am Ende des Textes)
- `end_image_link?: string` — Klick-Link für das Bild
- `end_image_alt?: string` — Alt-Text

**2. `src/components/PostPreview.tsx` — Design-Anpassung**
- Gesamtlayout näher am Beispiel: Sektionen mit mehr Abstand, H2 deutlicher, Absätze klarer getrennt
- **Bild am Ende**: Nach der letzten Sektion (vor zusätzlichem Video) ein verlinktes Bild anzeigen
- Placeholder-Bild wenn URL leer (grauer Kasten mit "Bild hier einfügen")
- Keine Separator-Linien

**3. `src/pages/EditPost.tsx` — Editor erweitern**
- Neuer Block "Bild am Textende" mit Feldern für:
  - Bild-URL
  - Link-URL (wohin das Bild verlinkt)
  - Alt-Text

**4. `src/lib/export-html.ts` — HTML-Export anpassen**
- Bild am Ende als `<a><img></a>` Block exportieren (nach letzter Sektion, vor zusätzlichem Video)

### Kein Separator
Die Beispielseite hat `<hr>` Divider zwischen Blöcken — diese werden bewusst weggelassen wie gewünscht.

