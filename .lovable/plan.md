

## Transkript-Feld immer sichtbar machen

Aktuell wird das Video-Transkript-Feld nur angezeigt, wenn bereits ein Transkript vorhanden ist (`{(post as any).video_transcript && ...}`). Das Feld soll stattdessen **immer** unterhalb der YouTube URL sichtbar sein — als editierbares Textarea, in das man auch manuell ein Transkript einfügen kann.

### Änderung

**`src/components/SourceDataEditor.tsx`** (Zeilen 157-163)
- Die Bedingung `{(post as any).video_transcript && (...)}` entfernen
- Das Transkript-Textarea immer rendern (mit leerem Fallback-Wert)
- Zeichenzähler nur anzeigen, wenn Text vorhanden ist

