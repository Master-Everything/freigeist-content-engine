## Modul 4 — Umschaltbare Dichte (Kompakt/Standard) für die Fragenliste

Neuer Session-Toggle im `LeitfadenEditor`, der die Fragenliste zwischen der aktuellen Kompakt-Variante und einem luftigeren Standard-Layout umschaltet. Analog zum bestehenden `showOnlyActive`-Muster.

### 1. Editor-State
- Neben `showOnlyActive` neuer State: `const [compact, setCompact] = useState(true)` — Default = aktueller Kompakt-Stand, damit sich für bestehende Nutzer nichts ändert.

### 2. UI-Toggle
- Direkt neben dem „Nur übernommene Fragen anzeigen"-Switch ein zweiter Switch + Label „Kompakte Ansicht", gleicher visueller Stil (gleiche Zeile, gleiches Border-Wrapper-Layout).
- Kein Speaker-Pendant, kein localStorage.

### 3. Prop-Durchreichung an `QuestionList`
- `QuestionList`-Props um `compact: boolean` erweitern (analog `showOnlyActive`).
- Bei allen drei Aufrufen (Hauptfragen, Vertiefungsfragen, Kritische Fragen) durchreichen.

### 4. Klassen-Sets in `QuestionList`
Statt Ternaries pro Stelle zwei kleine Sets am Komponentenanfang definieren und konsequent verwenden:

| Element | compact (aktuell) | standard |
|---|---|---|
| Wrapper Fragen-Liste | `space-y-1.5` | `space-y-2` |
| Fragen-Karte | `px-2 py-1.5` | `p-3` |
| Frage-Textarea rows | `rows={1}` | `rows={2}` |
| Frage-Textarea className | `flex-1 min-h-0` | `flex-1` (kein `min-h-0`) |
| Sortier-/Entfernen-Buttons | `h-7 w-7` | Standard (`size="icon"` ohne Override) |
| Notiz-Icon-Button | `h-7 w-7` | Standard |
| Notiz-Wrapper (aufgeklappt) | `mt-1.5` | `mt-2` |

**Umsetzungs-Detail Frage-Textarea:** zwei vollständige, sich gegenseitig ausschließende Klassenstrings bauen (`"flex-1 min-h-0"` vs. `"flex-1"`) — kein bedingtes Anhängen von `min-h-0`, damit tailwind-merge sauber greift.

Notiz-Textarea bleibt in beiden Modi `rows={1}` + `min-h-0` (bewusst). Ausrichtung `pl-12 pr-2` bleibt unverändert.

### 5. Nicht enthalten
- Keine Persistierung.
- Keine Änderungen an Speaker-Ansicht, Datenmodell, Save-Logik, KI-Priorisierung, Edge Functions.
- Nur `src/components/leitfaden/LeitfadenEditor.tsx` wird angefasst.
