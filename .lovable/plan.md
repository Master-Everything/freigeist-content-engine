## Validierung von Claudes Feedback

**Punkt 1 — „atomarer Statuswechsel" ist keine echte DB-Transaktion:** Stimmt. `speaker-profile-decision/index.ts` macht zwei sequenzielle `.update()`-Calls (erst `speaker_profiles`, dann `posts`). Bei geringem Traffic (Admin-/Speaker-Klick, kein Bulk) akzeptables Restrisiko. **Kein Handlungsbedarf jetzt** — Notiz für später: bei Bedarf in eine `SECURITY DEFINER` Postgres-Funktion + RPC verschieben.

**Punkt 2 — sieht der Admin das Speaker-Feedback im UI?** Teilweise. Aktuell:
- Function hängt Feedback mit Zeitstempel an `speaker_profiles.notes` an (append, nicht überschreiben) ✅
- `ProfilEditor.tsx` rendert `profile.notes` in einem generischen „Notizen"-Textarea am Ende des Formulars
- **Problem:** Nichts signalisiert dem Admin, dass neues Speaker-Feedback vorliegt. Kein Badge, keine Hervorhebung, kein Hinweis oben. Der Admin muss ans Ende des Formulars scrollen und die Notizen mental parsen.

Claudes Sorge ist berechtigt: die Rückmeldung kann untergehen.

## Umsetzung

Kleiner, gezielter UI-Fix in `src/components/profil/ProfilEditor.tsx`:

1. **Speaker-Feedback erkennen** — die Function präfixt jede Rückmeldung mit `[Speaker-Feedback <Zeitstempel>]`. Wir parsen `profile.notes` per Regex auf diese Blöcke und trennen sie von „echten" Redaktionsnotizen.
2. **Prominenter Feedback-Kasten oben im Editor** (direkt unter dem Header, vor der Kurzbio):
   - Nur sichtbar, wenn Post-Status `in_bearbeitung` ist UND mindestens ein `[Speaker-Feedback …]`-Block existiert
   - Amber/Warn-Farbschema (analog zu bestehenden Info-Kästen), Icon `MessageSquareWarning`
   - Zeigt die Feedback-Blöcke chronologisch (neuester oben), jeweils mit Zeitstempel-Header
3. **„Notizen"-Feld bleibt** wie bisher — enthält weiterhin den vollständigen `notes`-String (inkl. Feedback-Blöcke), damit nichts verloren geht und Admin sie beim Speichern nicht versehentlich löscht.

Der Editor braucht den Post-Status, um den Kasten nur bei `in_bearbeitung` zu zeigen. Den reicht `Module3Profil.tsx` bereits via `postStatus`-Prop an — falls nicht, ergänzen wir eine optionale Prop `postStatus?: string`.

## Technische Details

- Regex: `/\[Speaker-Feedback ([^\]]+)\]\n([\s\S]*?)(?=\n\n\[Speaker-Feedback |$)/g`
- Keine Backend-Änderungen, keine Migration, keine Function-Anpassung
- Rein Frontend, ein File: `src/components/profil/ProfilEditor.tsx`
- Optional: dieselbe Anzeige auch im `MyPosts`-Kontext für Speaker als Erinnerung, was er zuletzt geschickt hat — würde ich **weglassen**, um Scope klein zu halten
