

## Umfangreichere KI-Inhalte nach Vorbild freigeistkongress.com

### Analyse des Beispiels

Die Beispielseite zeigt eine deutlich reichhaltigere Struktur als unser aktuelles 3-Sektionen-Modell:

```text
Aktuelle Struktur:              Ziel-Struktur (Beispiel):
─────────────────               ──────────────────────────
H1 Titel                        H1 Titel
Excerpt                          Excerpt
Video                            Video
Summary (Stichpunkte)            Summary (ausführliche Absätze mit Fettdruck)
Gast-Profil (kurz)              Gast-Profil (H2 + ausführliche Bio)
Sektion 1 (H2 + 2-3 Absätze)    Gast-Website CTA
Sektion 2                        Sektion 1 (H2 + H3 + Absätze)
Sektion 3                        Sektion 2 (H2 + H4-Listen + Absätze)
                                 Sektion 3 (H2 + Bild + Aufzählung)
                                 Sektion 4 (H1 + H3 + Aufzählung)
                                 Sektion 5 (H2 + H3 + Absätze)
                                 Sektion 6 (H2 + Absatz + Fazit)
                                 Zusätzliches Video
                                 CTA
```

### Geplante Änderungen

**1. `src/types/post.ts` — Erweiterte Datenstruktur**
- `summary_points` durch `summary_paragraphs: string[]` ersetzen (ausführliche Absätze statt Stichpunkte)
- Sektionen von 3 auf 6 erweitern (`section_4_*`, `section_5_*`, `section_6_*`)
- Neues Feld `guest_website_cta` für den CTA-Link zum Gast

**2. `supabase/functions/generate-content/index.ts` — Verbesserter AI-Prompt**
- Zusammenfassung: Anweisung für 3-4 ausführliche Absätze mit Fettdruck-Einleitungen (wie im Beispiel)
- 6 Sektionen mit Unterüberschriften (H3/H4) innerhalb der Body-Texte via Markdown
- Deutlich umfangreichere Body-Texte (4-6 Absätze pro Sektion statt 2-3)
- Tool-Schema um die neuen Felder erweitern

**3. `src/components/PostPreview.tsx` — Markdown-Rendering**
- Summary: Absätze statt Aufzählung rendern, Fettdruck via `**text**` unterstützen
- Sektionen 1-6 statt 1-3 iterieren
- Einfaches Markdown-Rendering für H3/H4/Listen/Fettdruck in Section-Bodies
- Gast-Website CTA anzeigen

**4. `src/pages/EditPost.tsx` — Editor erweitern**
- `summary_points`-Editor durch `summary_paragraphs`-Textarea ersetzen
- Sektionen 4-6 im Editor hinzufügen
- `defaultBlocks` um neue Felder erweitern
- `guest_website_cta` Eingabefeld

**5. `src/lib/export-html.ts` — HTML-Export anpassen**
- Summary: Absätze statt `<ul>/<li>` generieren
- 6 Sektionen exportieren
- Einfache Markdown-zu-HTML Konvertierung (H3, H4, Listen, Bold)
- CTA-Block für Gast-Website

### Markdown in Sektions-Bodies

Statt reinem Plaintext unterstützen die Section-Bodies nun einfaches Markdown:
- `## Überschrift` → `<h3>` (da H2 bereits der Sektionstitel ist)
- `### Unter-Überschrift` → `<h4>`
- `**fett**` → `<strong>`
- `- Listenpunkt` → `<ul><li>`
- Absätze via Doppel-Newline

Dies wird mit einer einfachen Parser-Funktion umgesetzt (kein externes Package nötig).

