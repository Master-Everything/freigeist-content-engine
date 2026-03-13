

## Formatierungsfehler in der Live-Vorschau beheben

### Problem
1. **Markdown-Artefakte im Editor**: Wenn die KI `\n` als literale Zeichen (escaped newlines) statt echte Zeilenumbrüche generiert, zeigt der Markdown-Parser diese als Text statt als Absatztrenner. Ebenso können `##`-Headings am Zeilenanfang nicht erkannt werden, wenn sie mitten in einer Zeile stehen.
2. **Body-Text zu fett und zu groß**: Die `prose`-Klasse von Tailwind macht Text standardmäßig fett-wirkend und die Schriftgröße ist zu groß.

### Änderungen

**1. `src/lib/markdown.ts` — Escaped Newlines normalisieren**
- Am Anfang von `markdownToHtml` literale `\n`-Strings (die die KI manchmal als `\\n` im JSON generiert) in echte Newlines umwandeln
- Doppelte Leerzeilen normalisieren

**2. `src/components/PostPreview.tsx` — Styling anpassen**
- `prose prose-sm` durch spezifischere, leichtere Styles ersetzen
- Body-Text: `font-normal` (nicht fett), kleinere Schriftgröße (`text-sm`)
- `[&_strong]:font-semibold` beibehalten, aber Standard-Paragraphen nicht fett
- `[&_p]` mit `font-normal text-sm` stylen
- Zusammenfassungs-Absätze ebenfalls `text-sm font-normal` statt default

### Technische Details

In `markdown.ts` Zeile 6, nach dem leeren Check:
```typescript
// Normalize escaped newlines from AI JSON output
md = md.replace(/\\n/g, "\n");
```

In `PostPreview.tsx` Zeile 105, die prose-Klassen anpassen:
```
prose prose-sm → text-sm font-normal
```
Spezifisch die Klasse ändern zu:
```
"max-w-none text-sm text-foreground/80 font-normal [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-3 [&_h4]:font-display [&_h4]:text-base [&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-2 [&_p]:mb-3 [&_p]:leading-relaxed [&_p]:font-normal [&_ul]:space-y-1.5 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:leading-relaxed [&_strong]:font-semibold"
```

Zusammenfassungs-Absätze (Zeile 57): `text-sm` statt default hinzufügen.

