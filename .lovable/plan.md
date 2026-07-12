## Modul 4 — Fragen-Übernahme & KI-gestützte Priorisierung

### Ziel
Interviewer wählt aus vorhandenen (und KI-ergänzten) Fragen gezielt aus und ordnet sie. Die drei Blöcke (Hauptfragen / Vertiefungsfragen / Kritische Fragen) bleiben als Interviewphasen erhalten.

---

### 1. Datenmodell & Migration

Fragen-Arrays wechseln von `string[]` auf Objekt-Array:

```ts
type GuideQuestion = { id: string; text: string; active: boolean };
```

- Migration konvertiert Bestandsdaten in `interview_guides.hauptfragen / vertiefungsfragen / kritische_fragen` (Spaltentyp bleibt `jsonb`) via SQL: `["…"]` → `[{id: gen_random_uuid()::text, text: "…", active: true}, …]`.
- Neue Spalte `interview_guides.ki_instruktionen text`.
- Neuer Row in `knowledge_prompts` mit Key `leitfaden_priorisierer` **per Migration** (nicht per Insert-Tool — konsistent zum `leitfaden_generator`-Seed).

### 2. Edge Function: `generate-interview-guide` (bestehend, umbauen)

- Tool-Schema (`items: { type: "string" }`) → `items: { type: "object", properties: { text: { type: "string" } }, required: ["text"] }`.
- **Kritisch** — `arr()`-Sanitizer (Zeile 168) muss mit umgebaut werden, sonst filtert er alle Objekte raus und der Leitfaden käme leer zurück:

```ts
const arr = (v: any) => Array.isArray(v)
  ? v
      .filter((x) => x && typeof x === "object" && typeof x.text === "string" && x.text.trim())
      .map((x) => ({ id: crypto.randomUUID(), text: x.text.trim(), active: true }))
  : [];
```

### 3. Edge Function: `prioritize-interview-guide` (neu)

- Input: `guide_id`, `ki_instruktionen`.
- Lädt Guide + Speaker/Post-Kontext (analog zum Generator), Admin-only (JWT + `has_role`).
- Nutzt Prompt-Key `leitfaden_priorisierer` aus `knowledge_prompts`.

**Prompt-Aufbau (für funktionierende Merge-Logik zwingend):**
- Aktuelle Fragen werden **inklusive ihrer `id`** als strukturierte JSON-Liste pro Block in den User-Prompt eingebettet:
  ```json
  { "hauptfragen": [{"id": "…", "text": "…"}, …],
    "vertiefungsfragen": [...],
    "kritische_fragen": [...] }
  ```
- System-Prompt weist die KI explizit an: *„Verwende im `keep`-Array ausschließlich `id`-Werte aus der übergebenen Liste. Erfinde keine IDs."*

**Tool-Call-Ergebnis pro Block:**
- `keep`: `{id: string, active: boolean, order: number}[]` — nur Toggle/Reihenfolge, kein Textumschreiben bestehender Fragen.
- `add`: `{text: string, active: boolean}[]` — neue Fragen im passenden Block.

**Merge-Regeln (serverseitig, explizit):**
1. Bestehende Frage mit `id` im `keep`: `active` und Position gemäß `order` übernehmen; `text` bleibt.
2. **Bestehende Frage NICHT im `keep`: `active: false` setzen** und ans Ende des Blocks (nach `keep`-Einträgen, vor `add`) einsortieren. Nie löschen.
3. `add`-Einträge bekommen neue `id` (`crypto.randomUUID()`), werden ans Blockende angehängt.
4. Ungültige IDs im `keep` (nicht in Bestand): ignorieren, Merge läuft weiter.

**Warnungs-Logging in `notes` — anhängen, nicht überschreiben** (analog `[Speaker-Feedback · …]`-Muster in `speaker_profiles.notes`):
- Format: `[KI-Priorisierung · <ISO-Zeitstempel>] Ungültige IDs ignoriert: <id1>, <id2>`
- Wird mit Trenn-Leerzeile an bestehenden `notes`-Text angehängt, niemals ersetzt.
- **Kein Log-Eintrag, wenn keine ungültigen IDs auftraten** (kein Rauschen bei sauberen Läufen).

### 4. Admin-UI (`LeitfadenEditor.tsx`)

**Pro Frage-Zeile** in allen drei Blöcken:
- `Textarea` bleibt (editierbar).
- Neu: `Switch` „Übernehmen" gebunden an `active`.
- Sortier-Controls: `ArrowUp` / `ArrowDown` (kein Drag & Drop, keine neue Dependency). Erste/letzte Position deaktivieren den passenden Pfeil.
- Lösch-Icon (`X`) bleibt.

**Oberhalb der Blöcke:**
- Toggle „Nur übernommene Fragen anzeigen" (reiner UI-State). Zähler „sichtbar / gesamt".

**Neuer Abschnitt „KI-gestützte Priorisierung":**
- `Textarea` „KI-Instruktionen" gebunden an `guide.ki_instruktionen` — mit `save()` mitspeichern.
- Button „KI-Vorschlag anwenden" → ruft `prioritize-interview-guide`, aktualisiert Guide im State.
- Hinweistext: *„Der Vorschlag ist ein Startpunkt. Toggle und Reihenfolge kannst du danach frei nachjustieren. Nicht ausgewählte Fragen werden auf inaktiv gesetzt, aber nicht gelöscht."*

**`QuestionList`-Komponente:** Umbau auf Objekt-Array. Neuer Eintrag über Input/Enter erzeugt `{ id: crypto.randomUUID(), text, active: true }`. Reihenfolge = Array-Reihenfolge.

**Save-Payload:** drei Fragen-Arrays als `GuideQuestion[]` + `ki_instruktionen`. „Neu generieren" überschreibt vollständig (Bestandsverhalten).

### 5. Speaker-UI (`LeitfadenReadonly.tsx`)
- Nur `active: true` Fragen rendern, in Array-Reihenfolge.
- Kein Toggle, keine Sortierung, keine KI-Instruktionen sichtbar.
- Speaker-Select-Whitelist in `Module4Leitfaden.tsx` (Zeile 77) bleibt unverändert — `ki_instruktionen` und `redaktionelle_hinweise` bleiben serverseitig raus.

### 6. Typ-Updates
- `InterviewGuide.hauptfragen / vertiefungsfragen / kritische_fragen: GuideQuestion[] | null`
- `ki_instruktionen: string | null`

---

### Umsetzungsreihenfolge
1. Migration: Spaltenkonvertierung + `ki_instruktionen` + `leitfaden_priorisierer`-Prompt.
2. `generate-interview-guide` umstellen (Schema **und** `arr()`).
3. `prioritize-interview-guide` deployen (ID-Einbettung, Merge-Regeln, notes-Anhang mit Skip-bei-leer).
4. Frontend: `LeitfadenEditor` (Objektmodell, Switch, Sortierung, Filter, KI-Abschnitt).
5. Frontend: `LeitfadenReadonly` (Filter auf `active`).

### Nicht Teil
- Kein separater „Interviewer Fragen"-Block.
- Keine blockübergreifende Reihenfolge.
- Keine KI-Sperren — manuelle Nachbearbeitung bleibt immer möglich.
