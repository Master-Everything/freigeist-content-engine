

## Summary-Box: Geschlossen + Plus-Icon

### Änderungen

**`src/components/PostPreview.tsx`** (Zeilen 55-58):
- `<details open>` → `<details>` (standardmäßig geschlossen)
- Summary bekommt ein `+`/`−` Icon das sich beim Öffnen/Schließen ändert
- Dafür: `<details>` durch einen gesteuerten State ersetzen (useState für open/closed), oder CSS-basiert mit `details[open]` Selektor das Icon rotieren/wechseln

**`src/lib/export-html.ts`**:
- Gleiche Änderung: `open` Attribut entfernen, `+` Zeichen in der Summary anzeigen

### Umsetzung
- CSS-only Ansatz: Im `<summary>` ein `+` Icon links anzeigen, bei `details[open]` zu `−` wechseln via `group` Klasse und Tailwind
- Lucide `Plus`/`Minus` Icons oder einfach Text-Zeichen `+` / `−`

