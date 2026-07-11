# Modul 3 — Speaker-UI Angleichung (final)

Alle Änderungen ausschließlich in `src/pages/modules/Module3Profil.tsx`. Keine Backend-/RLS-/Edge-Function-Änderungen.

## 1. Speaker-freundliche Status-Labels

`StatusBadge` bekommt eine `role`-Variante. Für Speaker:

| Interner Status        | Speaker-Label            | Farbe   |
|------------------------|--------------------------|---------|
| `redaktion_angefragt`  | „Angefragt"              | violett |
| `in_bearbeitung`       | „Redaktion arbeitet"     | orange  |
| `profil`               | „Redaktion arbeitet"     | orange  |
| `profil_review`        | „Zur Freigabe"           | blau    |

Admin behält die aktuellen internen Labels (inkl. Smaragd „Profil-Entwurf" bei `profil`). Bewusste Divergenz — gleicher Status, zwei Farben je nach Rolle.

## 2. Listen-Header (nur Wortlaut)

Klick-/Aktions-Logik bleibt unverändert. Nur Textänderungen:

- Speaker Card-Titel: „Meine Anfragen" → **„Meine Interviews in Vorbereitung"**
- Speaker Card-Description: statt „Status: …" → **„Sobald dein Profil zur Freigabe bereitsteht, kannst du es hier prüfen."**
- Speaker Muted-Fallback (Zeile 320): „Redaktion in Arbeit" → **„Redaktion arbeitet"**
- Admin-Titel/Description bleiben.

## 3. Kontext-Ansicht: vereinfachte Cards für Speaker

Zwei Karten „Interview" / „Speaker" bleiben, aber für `role === 'speaker'`:
- `post_id` / `speaker_id` (monospace-Debug-Zeilen) ausblenden
- CardDescriptions („Aus Modul 1" / „Verknüpftes Profil") ausblenden

## 4. Header-Badge (Kontext-Ansicht) — für beide Rollen dynamisch

Aktuell hart codiert auf „Redaktion in Arbeit" (Zeile 149–151), unabhängig vom Post-Status. Wird ersetzt durch eine status-abhängige, rollen-differenzierte Ableitung:

- `redaktion_angefragt` → „Redaktion angefragt" (Admin) / „Angefragt" (Speaker)
- `in_bearbeitung` → „In Bearbeitung" (Admin) / „Redaktion arbeitet" (Speaker)
- `profil` → „Profil-Entwurf" (Admin) / „Redaktion arbeitet" (Speaker)
- `profil_review` → „Zur Freigabe" (beide)
- Fallback: Rohstatus

Behebt gleichzeitig den bestehenden Anzeigefehler in der Admin-Ansicht.

## 5. Platzhalter-Text unterhalb der Cards (Speaker, kein `profil_review`)

Statt „Profil-Entwurf liegt vor. …" / „Redaktion arbeitet am Profil-Entwurf.":
- Wenn `profile` existiert: „Die Redaktion kuratiert dein Profil. Du bekommst es zur Freigabe, sobald es soweit ist."
- Wenn kein `profile`: „Die Redaktion bereitet dein Profil vor."

## 6. Zugriffs-verweigert / nicht gefunden — flicker-frei

RLS liefert bei fremdem `post_id` `null` zurück und läuft aktuell in den missverständlichen „Redaktion arbeitet…"-Fallback.

**Race-Condition-Guard:** Header rendert oberhalb des Loading-Blocks, `post` startet mit `null`. Prüfung MUSS lauten:

```
!loading && postId && post === null
```

Niemals nur `post === null`, sonst Flicker bei jedem Aufruf. Zusätzliches `postId`-Guard schützt den Fall, dass nur `speaker_id` in der URL steht (dann läuft gar keine Post-Abfrage).

Anzeige rollen-differenziert:
- Speaker: „Dieses Interview gehört nicht zu deinem Account."
- Admin: „Dieses Interview konnte nicht geladen werden. Möglicherweise wurde es gelöscht oder der Link ist ungültig."

Plus Button „Zurück zur Übersicht" → `/module/profil` (ohne Params).

## Nicht Teil dieses Plans

- Admin-Editor-Logik, Listen-Aktionen, Klick-Verhalten bleiben identisch.
- Edge Functions, RLS, Datenbank: keine Änderungen.
- `ProfilReadonly` bleibt unverändert.
