## Modul 4 — Konsistenz-Fix Notiz-Textarea

Kleine Angleichung an die Frage-Textarea, damit beide bei leerem Inhalt einzeilig starten und gemeinsam mit dem Content wachsen.

### Änderung

`src/components/leitfaden/LeitfadenEditor.tsx` — in der aufklappbaren Notiz-Textarea:
- `rows={2}` → `rows={1}`
- `className="min-h-0"` bleibt (überschreibt Default `min-h-[80px]` via tailwind-merge)

### Ergebnis

Beide Textareas (Frage + Notiz) starten bei ~36–40px und wachsen rein am Inhalt. Restliches Fein-Tuning (Icon links, Padding, Gaps, `pl-12/pr-2`) bleibt unverändert.
