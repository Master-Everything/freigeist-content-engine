# Plan: Textfelder vergrößern und Zeichenzähler hinzufügen

## Ziel
In `src/pages/Auth.tsx` und im Erfassungsformular `src/pages/modules/erfassung/SpeakerForm.tsx`:
1. Alle Eingabefelder (Input + Textarea) so hoch dimensionieren, dass der gesamte erlaubte Text bequem sichtbar ist.
2. Unter jedem Feld einen Hinweis anzeigen: `aktuelle Zeichen / maximale Zeichen` (z. B. `123 / 2000`).

## Vorgehen

### 1. Wiederverwendbare Helfer
Neue kleine Komponente `src/components/ui/char-counter.tsx`:
- Props: `current: number`, `max: number`
- Rendert rechtsbündig unter dem Feld: `{current} / {max}` in `text-xs text-muted-foreground`, wird bei `current > max` rot (`text-destructive`).

### 2. Höhe der Felder dynamisch aus `maxLength` ableiten
Faustregel zur Höhenwahl (passt zum bestehenden Tailwind-Stil):
- `Input` (einzeilig, max ≤ 255): bleibt Input, keine Höhenänderung sinnvoll → nur Zeichenzähler darunter.
- `Textarea`:
  - max ≤ 300 → `min-h-[6rem]` (~3 Zeilen)
  - max ≤ 800 → `min-h-[10rem]`
  - max ≤ 1500 → `min-h-[16rem]`
  - max ≤ 2000 → `min-h-[20rem]` (passt ca. 2000 Zeichen ohne Scrollen bei ~80 Zeichen/Zeile)

Werte werden pro Feld einzeln gesetzt; keine globale Änderung an `textarea.tsx`.

### 3. `SpeakerForm.tsx` anpassen
Für jedes Feld aus `speakerSchema` (siehe `src/lib/validation/speaker-schema.ts`):
- `maxLength={<schema-max>}` am Input/Textarea setzen.
- Bei Textareas die obige Höhe via `className` setzen.
- Unter dem Feld (innerhalb von `FormItem`, nach `FormMessage`) `<CharCounter current={field.value?.length ?? 0} max={<schema-max>} />` einfügen.
- Numerische und Enum-/Checkbox-Felder (`salutation`, `has_newsletter`, `affiliate_available`, `email_list_size`, `agb_accepted`, `privacy_accepted`) erhalten keinen Zähler.

### 4. `Auth.tsx` anpassen
- E-Mail-Feld: `maxLength={255}` + Counter `x / 255`.
- Passwort-Feld: `maxLength={72}` (bcrypt-Grenze, passt zum bestehenden Auth-Flow) + Counter `x / 72`.
- Ggf. weitere Felder (Name etc.) analog, falls vorhanden — wird beim Lesen der Datei bestätigt.

### 5. Keine Logikänderungen
- Keine Schema-Änderungen, keine Submit-Logik, keine DB-Änderungen.
- Nur Präsentationsschicht (Höhe, `maxLength`, Counter).

## Technische Details
- Counter liest live aus `field.value` (react-hook-form `Controller`/`FormField`), kein zusätzlicher State.
- `maxLength` am DOM-Element verhindert auch das Überschreiten beim Tippen — konsistent mit den Zod-Limits.
- Bestehende Validierung/Fehlertexte bleiben unverändert.

## Betroffene Dateien
- neu: `src/components/ui/char-counter.tsx`
- geändert: `src/pages/modules/erfassung/SpeakerForm.tsx`
- geändert: `src/pages/Auth.tsx`
