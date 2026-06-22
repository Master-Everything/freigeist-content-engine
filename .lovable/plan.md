## Ziel

Das Interview-Formular (`/module/interview/neu`) bekommt dasselbe UX-Pattern wie das Profil-Formular: Textarea-Höhen richten sich nach der Zeichen-Obergrenze und unter jedem Feld erscheint ein Live-Zeichenzähler.

## Anpassungen in `src/pages/modules/interview/InterviewForm.tsx`

1. **Zod-Schema einführen** (neue Datei `src/lib/validation/interview-schema.ts`) mit `maxLength`-Grenzen:
   - `interview_title` 200
   - `interview_topic` 500
   - `product` 500
   - `product_market_since` 120
   - `previous_interviews` 2000
   - `critical_voices` 2000

2. **`FIELD_MAX`-Map** und `textareaHeightFor(max)`-Helper analog zum SpeakerForm (≤300 → 6rem, ≤800 → 10rem, ≤1500 → 16rem, sonst 20rem) in die Datei übernehmen.

3. **Komponenten-Refactor**: Statt der nackten `<Input>` / `<Textarea>` werden die Wiederverwendungs-Komponenten aus dem SpeakerForm-Pattern eingesetzt:
   - `TextInput` für `interview_title`, `product_market_since`
   - `TextAreaInput` für `interview_topic`, `product`, `previous_interviews`, `critical_voices`
   - `maxLength` wird auf das Input-Element gesetzt, Höhe via `textareaHeightFor()`, `CharCounter` aus `@/components/ui/char-counter` rendert die Anzeige `aktuell / max` (rot, wenn überschritten).

4. **react-hook-form + zodResolver** wird wie im SpeakerForm verwendet, damit `useWatch` den Counter ohne Re-Render des ganzen Formulars füttert. Submit-Handler bleibt funktional identisch (Affiliate-Auswahl, Speaker-Lookup, Insert in `posts`).

5. **Affiliate-Card** bleibt visuell unverändert (Checkbox-Liste). Affiliate-Indizes werden weiterhin als separater State außerhalb von `useForm` gehalten.

## Out of Scope

- Keine Änderung an Layout, Card-Struktur oder Farben.
- Keine Änderung an Feldern, Pflichtfeldern, Submit-Logik oder Routing.
- Keine Änderung am Profil-Formular oder anderen Modulen.
