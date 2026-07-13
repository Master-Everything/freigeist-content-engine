## Modul 4 — Auto-Grow für alle Textareas im Leitfaden-Editor

Zentraler `useAutoGrow`-Hook + Anwendung auf alle sieben Textareas in `LeitfadenEditor.tsx`.

### 1. Neuer Hook `src/hooks/use-auto-grow.ts`

```ts
import { useEffect, useRef } from "react";

export function useAutoGrow(value: string, resetKey?: unknown) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, resetKey]);
  return ref;
}
```

`resetKey` triggert Neuberechnung auch bei leeren Feldern (Density-Toggle).

### 2. QuestionList — Extraktion in `<QuestionRow>` (Pflicht)

Direkt im `.map()`-Callback lässt sich kein Hook aufrufen (Rules of Hooks). Deshalb echter Umbau:

- Neue interne Komponente `QuestionRow` (in derselben Datei).
- `QuestionList.map` rendert `<QuestionRow key={q.id} … />`, der Row-Body zieht dorthin um.
- In `QuestionRow`:
  - `const textRef = useAutoGrow(q.text, cls.textareaRows)`
  - `const notizRef = useAutoGrow(q.interviewer_notiz ?? "", cls.textareaRows)`
- `ref={textRef}` / `ref={notizRef}` an die beiden Textareas, `className` um `resize-none` ergänzt (bestehende `flex-1 / min-h-0` bleiben).

**Props für `QuestionRow`**: `q`, `index`, `total`, `cls`, `noteOpen`, `onToggleNote`, `onUpdate(patch)`, `onMove(dir)`, `onRemove()`. `hasNote` wird intern aus `q.interviewer_notiz` abgeleitet.

`items.length`, `openNoteIds`, `update`, `move`, `remove`, `toggleNote` bleiben in `QuestionList` und werden pro Row als Callback/Prop reingegeben.

### 3. Anwendung in `LeitfadenEditor` (äußere Komponente)

Fünf freie Textareas — Hooks **vor** dem `if (!guide)` Early-Return aufrufen, damit die Hook-Regeln stabil bleiben:

```ts
const introRef      = useAutoGrow(guide?.intro ?? "");
const kiRef         = useAutoGrow(guide?.ki_instruktionen ?? "");
const abschlussRef  = useAutoGrow(guide?.abschluss ?? "");
const hinweiseRef   = useAutoGrow(guide?.redaktionelle_hinweise ?? "");
const notesRef      = useAutoGrow(guide?.notes ?? "");
```

Jede der fünf Textareas: `ref={xRef}` + `className="resize-none"` an bestehende Klassen angehängt. `rows`-Werte bleiben als Starthöhe.

### 4. Betroffene Textareas

| Feld | Zeile | Startgröße (rows) |
|---|---|---|
| Frage-Text (QuestionList) | 174 | 1 kompakt / 2 standard |
| Interviewer-Notiz (QuestionList) | 211 | 1 |
| Einstieg / Begrüßung (`intro`) | 459 | 3 |
| KI-Instruktionen (`ki_instruktionen`) | 472 | 3 |
| Abschluss (`abschluss`) | 529 | 3 |
| Redaktionelle Hinweise (`redaktionelle_hinweise`) | 537 | 4 |
| Notizen (`notes`) | 542 | 2 |

### 5. Nicht enthalten

- Keine Änderung an `ProfilEditor.tsx` oder anderen Editoren (kann als eigener Folgeschritt nachgezogen werden).
- Keine Änderung an Datenmodell, Save-Logik, Edge Functions, Density-Toggle-Verhalten.
- Keine Persistierung von Höhen — rein visuell pro Session.
